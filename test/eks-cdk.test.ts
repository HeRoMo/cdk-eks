import { SynthUtils } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { VpcStack } from '../lib/vpc-cdk-stack';
import { EksCdkStack } from '../lib/eks-cdk-stack';

test('Snapshot Test', () => {
  const app = new App();
  const vpcStack = new VpcStack(app, 'MyTestVpcStack');
  const EksStack = new EksCdkStack(app, 'MyTestEksCdkStack', { vpc: vpcStack.vpc });
  expect(SynthUtils.toCloudFormation(vpcStack)).toMatchSnapshot();
  expect(SynthUtils.toCloudFormation(EksStack)).toMatchSnapshot();
});
