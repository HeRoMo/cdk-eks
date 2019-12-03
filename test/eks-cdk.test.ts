import { SynthUtils } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { VpcStack } from '../lib/VpcStack';
import { EksStack } from '../lib/EksStack';

test('Snapshot Test', () => {
  const app = new App();
  const vpcStack = new VpcStack(app, 'MyTestVpcStack');
  const eksStack = new EksStack(app, 'MyTestEksCdkStack', { vpc: vpcStack.vpc });
  expect(SynthUtils.toCloudFormation(vpcStack)).toMatchSnapshot();
  expect(SynthUtils.toCloudFormation(eksStack)).toMatchSnapshot();
});
