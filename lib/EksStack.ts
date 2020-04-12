import * as path from 'path';

import { Construct } from '@aws-cdk/core';
import { Vpc, InstanceType, SubnetType } from '@aws-cdk/aws-ec2';
import {
  AccountRootPrincipal,
  IRole,
  ManagedPolicy,
  Role,
} from '@aws-cdk/aws-iam';
import { Cluster, Nodegroup } from '@aws-cdk/aws-eks';

import { BaseStack } from './BaseStack';
import { loadManifestYaml } from './utils/manifest_reader';

import { appDomain } from './config';
import { createPolicy } from './policies/PolicyUtils';
import { AlbIngressController } from './k8sResources/AlbIngressController';
import { MetricsServer } from './k8sResources/MetricsServer';

/**
 * Create EKS cluster with kubernetes resources related with AWS resources
 */
export class EksStack extends BaseStack {
  public readonly cluster: Cluster;

  private vpc: Vpc;

  constructor(scope: Construct, id: string, props: { vpc: Vpc }) {
    super(scope, id);

    this.vpc = props.vpc;

    // IAM Role for EKS
    const eksRole = new Role(this, 'EksRole', {
      roleName: 'MyEKSRole',
      assumedBy: new AccountRootPrincipal(),
    });
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'));

    // EKS Cluster
    this.cluster = new Cluster(this, 'cluster', {
      vpc: props.vpc,
      mastersRole: eksRole,
      clusterName: 'MyEKSCluster',
      defaultCapacity: 0,
    });

    const nodeGroup = this.cluster.addNodegroup('capacity', {
      minSize: 3,
      maxSize: 6,
      desiredSize: 3,
      instanceType: new InstanceType('t3.small'),
      nodegroupName: 'MyNodeGroup',
      subnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE }),
      labels: {
        'cluster-code': 'MyEKSCluster',
      },
    });

    // Create kubernetes resources
    this.appendAlbIngressController();
    this.appendClusterAutoscaler(nodeGroup);
    this.appendEbsCsiDriver(nodeGroup.role);
    this.appendExternalDns(nodeGroup.role);
    this.appendMetricsServer();
  }

  /**
   * configure ALB ingress controller
   * @param clusterNodeRole
   */
  private appendAlbIngressController(): void {
    new AlbIngressController(this, 'ALBIngressController', this.cluster);
  }

  /**
   * configure Cluster Autoscaler
   * @param nodeGroup
   */
  private appendClusterAutoscaler(nodeGroup: Nodegroup): void {
    const policy = createPolicy(this, 'ClusterAutoScalerPolicy', 'cluster-autoscaler.json');
    nodeGroup.role.attachInlinePolicy(policy);

    const fileName = path.join(__dirname, '..', 'kubernetes-manifests', 'cluster-autoscaler', 'cluster-autoscaler-autodiscover.yaml');
    const manifests = loadManifestYaml(fileName);
    const deployment = manifests.find((manifest) => manifest.kind === 'Deployment');
    const { command } = deployment.spec.template.spec.containers[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = command.findIndex((cmd: any) => /<YOUR CLUSTER NAME>/.test(cmd));
    command[index] = command[index].replace('<YOUR CLUSTER NAME>', this.cluster.clusterName);
    command.push('--balance-similar-node-groups');
    command.push('--skip-nodes-with-system-pods=false');

    this.cluster.addResource('cluster-autoscaler-autodiscover', ...manifests);
  }

  /**
   * configure AWS EBS CSI Driver
   * @param clusterNodeRole
   */
  private appendEbsCsiDriver(clusterNodeRole: IRole): void {
    const policy = createPolicy(this, 'AmazonEBSCSIDriver', 'ebs-csi-driver.json');
    clusterNodeRole.attachInlinePolicy(policy);

    const filename = path.join(__dirname, '..', 'kubernetes-manifests', 'ebs-csi-driver', 'ebs-csi-driver.yaml');
    const ebsCsiSriverManifests = loadManifestYaml(filename);
    this.cluster.addResource('ebs-csi-driver', ...ebsCsiSriverManifests);
  }

  /**
   * configure External DNS
   * @param clusterNodeRole
   */
  private appendExternalDns(clusterNodeRole: IRole): void {
    const policy = createPolicy(this, 'ExternalDNS', 'external-dns.json');
    clusterNodeRole.attachInlinePolicy(policy);

    const externalDnsManifests = loadManifestYaml('kubernetes-manifests/exterrnal-dns/external-dns.yaml');

    // eslint-disable-next-line arrow-body-style
    const externalDnsDeployment = externalDnsManifests.find((manifest) => {
      return manifest.kind === 'Deployment' && manifest.metadata.name === 'external-dns';
    });
    const container = externalDnsDeployment.spec.template.spec.containers[0];
    container.args = container.args.map((arg: string) => {
      if (arg.startsWith('--domain-filter=')) {
        return `--domain-filter=${appDomain}`;
      }
      return arg;
    });
    this.cluster.addResource('extrernal-dns', ...externalDnsManifests);
  }

  /**
   * configure Metrics Server
   */
  private appendMetricsServer(): void {
    new MetricsServer(this, 'metrics-server', this.cluster);
  }
}
