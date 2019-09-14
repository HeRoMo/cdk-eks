import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';

export class EksCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc(this, 'EksVpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });

    // EKS用のIAM Role
    const eksRole = new Role(this, 'EksRole', {
      assumedBy: new ServicePrincipal('eks.amazonaws.com'),
    });
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'));
  }
}
