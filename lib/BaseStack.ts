import { Construct, Stack } from '@aws-cdk/core';

import { region, account } from './config';

const env = { region, account };

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, { env });
  }
}
