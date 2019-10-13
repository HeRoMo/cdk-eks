#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { VpcStack } from '../lib/vpc-cdk-stack';
import { EksCdkStack } from '../lib/eks-cdk-stack';

const app = new App();
const vpcStack = new VpcStack(app, 'VpcCdkStack');
new EksCdkStack(app, 'EksCdkStack', { vpc: vpcStack.vpc });
