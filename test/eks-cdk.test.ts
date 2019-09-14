import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { EksCdkStack } from '../lib/eks-cdk-stack';

test('Empty Stack', () => {
  const app = new App();
  // WHEN
  const stack = new EksCdkStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(matchTemplate({
    Resources: {},
  }, MatchStyle.EXACT));
});
