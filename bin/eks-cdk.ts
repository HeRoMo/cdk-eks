#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { VpcStack } from '../lib/VpcStack';
import { EksStack } from '../lib/EksStack';

const app = new App();
const vpcStack = new VpcStack(app, 'VpcCdkStack');
new EksStack(app, 'EksCdkStack', { vpc: vpcStack.vpc });
