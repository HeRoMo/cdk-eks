import { Construct } from '@aws-cdk/core';
import { Vpc, InstanceType } from '@aws-cdk/aws-ec2';
import {
  AccountRootPrincipal,
  Role,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Cluster } from '@aws-cdk/aws-eks';
import { BaseStack } from './base-stack';

export class EksCdkStack extends BaseStack {
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
    const cluster = new Cluster(this, 'cluster', {
      vpc: props.vpc,
      mastersRole: eksRole,
      clusterName: 'MyEKSCluster',
      defaultCapacity: 0,
    });
    cluster.addCapacity('capacity', {
      desiredCapacity: 2,
      instanceType: new InstanceType('t3.small'),
    });
  }
}
