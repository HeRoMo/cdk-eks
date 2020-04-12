import { Construct } from '@aws-cdk/core';
import { Vpc, InstanceType, SubnetType } from '@aws-cdk/aws-ec2';
import {
  AccountRootPrincipal,
  ManagedPolicy,
  Role,
} from '@aws-cdk/aws-iam';
import { Cluster, Nodegroup } from '@aws-cdk/aws-eks';

import { BaseStack } from './BaseStack';

import { appDomain } from './config';
import { AlbIngressController } from './k8sResources/AlbIngressController';
import { MetricsServer } from './k8sResources/MetricsServer';
import { ClusterAutoscaler } from './k8sResources/ClusterAutoscaler';
import { EbsCsiDriver } from './k8sResources/EbsCsiDriver';
import { ExternalDns } from './k8sResources/ExternalDns';

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
    new AlbIngressController(this, 'ALBIngressController', this.cluster);
    new ClusterAutoscaler(this, 'cluster-autoscaler', this.cluster, nodeGroup);
    new EbsCsiDriver(this, 'ebs-csi-driver', this.cluster, nodeGroup);
    new MetricsServer(this, 'metrics-server', this.cluster);
    if (appDomain) {
      new ExternalDns(this, 'extrernal-dns', this.cluster, nodeGroup, { domain: appDomain });
    }
  }
}
