import { Construct, Stack } from '@aws-cdk/core';

const env = {
  region: process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
};

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, { env });
  }
}
