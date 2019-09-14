#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { EksCdkStack } from '../lib/eks-cdk-stack';

const app = new cdk.App();
new EksCdkStack(app, 'EksCdkStack');
