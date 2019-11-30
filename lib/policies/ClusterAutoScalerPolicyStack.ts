import { Construct } from '@aws-cdk/core';
import { ManagedPolicy, Effect, PolicyStatement } from '@aws-cdk/aws-iam';

import { BaseStack } from '../base-stack';

export default class ClusterAutoScalerPolicyStack extends BaseStack {
  public readonly policy: ManagedPolicy;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.policy = new ManagedPolicy(this, 'ClusterAutoScalerPolicy', {
      managedPolicyName: 'ClusterAutoScaler',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'autoscaling:DescribeAutoScalingGroups',
            'autoscaling:DescribeAutoScalingInstances',
            'autoscaling:DescribeLaunchConfigurations',
            'autoscaling:DescribeTags',
            'autoscaling:SetDesiredCapacity',
            'autoscaling:TerminateInstanceInAutoScalingGroup',
            'ec2:DescribeLaunchTemplateVersions',
          ],
          resources: ['*'],
        }),
      ],
    });
  }
}
