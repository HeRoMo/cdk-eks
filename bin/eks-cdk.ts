#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { EksCdkStack } from '../lib/eks-cdk-stack';

const app = new App();
new EksCdkStack(app, 'EksCdkStack');
