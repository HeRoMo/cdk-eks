import * as path from 'path';

import { Construct, Tag } from '@aws-cdk/core';
import { Vpc, InstanceType } from '@aws-cdk/aws-ec2';
import {
  AccountRootPrincipal,
  IRole,
  ManagedPolicy,
  Role,
} from '@aws-cdk/aws-iam';
import { Cluster } from '@aws-cdk/aws-eks';
import { AutoScalingGroup } from '@aws-cdk/aws-autoscaling';

import ExternalDNSPolicyStack from './policies/ExternalDNSPolicyStack';

import { BaseStack } from './base-stack';
import { loadManifestYaml, loadManifestYamlAll } from './utils/manifest_reader';

import { appDomain } from './config';
import PolicyStack from './policies/PolicyStack';

export class EksCdkStack extends BaseStack {
  public readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props: { vpc: Vpc }) {
    super(scope, id);

    // EKS用のIAM Role
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

    const autoScalingGroup = this.cluster.addCapacity('capacity', {
      desiredCapacity: 2,
      instanceType: new InstanceType('t3.small'),
    });

    this.appendAlbIngressController(autoScalingGroup.role);
    this.appendClusterAutoscaler(autoScalingGroup);
    this.appendEbsCsiDriver(autoScalingGroup.role);
    this.appendExternalDns(autoScalingGroup.role);
    this.appendMetricsServer();
  }

  /**
   * configure ALB ingress controller
   * @param clusterNodeRole
   */
  private appendAlbIngressController(clusterNodeRole: IRole): void {
    this.cluster.vpc.publicSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });
    this.cluster.vpc.privateSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/internal-elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });

    const stack = new PolicyStack(this, 'ALBIngressControllerIAM', 'alb-ingress-controller.json');
    clusterNodeRole.addManagedPolicy(stack.policy);

    const rbacRoleManifests = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/rbac-role.yaml');
    this.cluster.addResource('rbac-role', ...rbacRoleManifests);
    const [albIngressControllerManifests] = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/alb-ingress-controller.yaml');

    try {
      const { args } = albIngressControllerManifests.spec.template.spec.containers[0];
      args.push(`--cluster-name=${this.cluster.clusterName}`);
      args.push(`--aws-vpc-id=${this.cluster.vpc.vpcId}`);
      args.push(`--aws-region=${process.env.CDK_INTEG_REGION}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error({ error });
      process.exit(1);
    }
    this.cluster.addResource('alb-ingress-controller', albIngressControllerManifests);
  }

  /**
   * configure Cluster Autoscaler
   * @param autoScalingGroup
   */
  private appendClusterAutoscaler(autoScalingGroup: AutoScalingGroup): void {
    Tag.add(autoScalingGroup, 'k8s.io/cluster-autoscaler/enabled', 'owned');
    Tag.add(autoScalingGroup, `k8s.io/cluster-autoscaler/${this.cluster.clusterName}`, 'true');
    const stack = new PolicyStack(this, 'ClusterAutoScaler', 'cluster-autoscaler.json');
    autoScalingGroup.role.addManagedPolicy(stack.policy);

    const fileName = 'kubernetes-manifests/cluster-autoscaler/cluster-autoscaler-autodiscover.yaml';
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
    const stack = new PolicyStack(this, 'AmazonEBSCSIDriver', 'ebs-csi-driver.json');
    clusterNodeRole.addManagedPolicy(stack.policy);
    const ebsCsiSriverManifests = loadManifestYaml(path.join(
      __dirname,
      '..',
      'kubernetes-manifests',
      'ebs-csi-driver',
      'ebs-csi-driver.yaml',
    ));
    this.cluster.addResource('ebs-csi-driver', ...ebsCsiSriverManifests);
  }

  /**
   * configure External DNS
   * @param clusterNodeRole
   */
  private appendExternalDns(clusterNodeRole: IRole): void {
    const stack = new ExternalDNSPolicyStack(this, 'ExternalDNSPolicyStack');
    clusterNodeRole.addManagedPolicy(stack.policy);
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
    const dirPath = 'kubernetes-manifests/metrics-server';
    const manifects = loadManifestYamlAll(dirPath);
    this.cluster.addResource('metrics-server', ...manifects);
  }
}
