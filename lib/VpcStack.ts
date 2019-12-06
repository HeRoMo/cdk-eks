import { Construct } from '@aws-cdk/core';
import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';

import { BaseStack } from './BaseStack';

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
          cidrMask: 20,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'Private',
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });
  }
}
