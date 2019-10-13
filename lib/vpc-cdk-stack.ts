import { Construct } from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

import { BaseStack } from './base-stack';

export class VpcStack extends BaseStack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // VPC
    this.vpc = new Vpc(this, 'EksVpc', {
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
  }
}
