# cdk-eks

CDK sample for EKS

## Requirements

- AWS IAM User (with AdministratorAccess Policy, not root account)
- AWS CLI
- Node.js and Yarn

## Deploy

```
$ git clone https://github.com/HeRoMo/cdk-eks.git
$ yarn
$ cdk bootstrap aws://<your account ID>/ap-northeast-1
$ export CDK_INTEG_REGION=<your region>
$ export CDK_INTEG_ACCOUNT=<your account ID>
$ yarn build
$ cdk deploy
```

## Kubectl config

```
$ aws eks --region ap-northeast-1 update-kubeconfig --name MyEKSCluster --role-arn arn:aws:iam::<your account ID>:role/MyEKSRole
$ kubectl get svc
```

## Useful commands

 * `yarn build`   compile typescript to js
 * `yarn watch`   watch for changes and compile
 * `yarn test`    perform the jest unit tests
 * `cdk deploy`   deploy this stack to your default AWS account/region
 * `cdk diff`     compare deployed stack with current state
 * `cdk synth`    emits the synthesized CloudFormation template

## License
[Apache License 2.0](LICENSE)
