# cdk-eks

A CDK sample of EKS

This CDK project create EKS cluster with the following kubernetes resouces

- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws)
- [AWS ALB Ingress Controller](https://github.com//kubernetes-sigs/aws-alb-ingress-controller)
- [External DNS](https://kubernetes-sigs.github.io/aws-alb-ingress-controller/guide/external-dns/setup/)
- [Amazon EBS CSI Driver](https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/ebs-csi.html)

Ready for auto scaling pods and worker-nodes.
Ready for publish your application via AWS ALB.

## Requirements

- AWS IAM User (with AdministratorAccess Policy, not root account)
- AWS CLI
- Node.js and Yarn

## Deploy

```bash
$ git clone https://github.com/HeRoMo/cdk-eks.git
$ yarn
$ cdk bootstrap aws://<your account ID>/ap-northeast-1
$ export CDK_INTEG_REGION=<your region>
$ export CDK_INTEG_ACCOUNT=<your account ID>
$ yarn build
$ cdk deploy *Stack 
```

After deploy the stacks, copy and run the outputs command (`aws eks update-kubeconfig --name MyEKSCluster ...`) to update your kubeconfig.

## More Information about EKS and resources
- [What Is Amazon EKS? \- Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- [Resource metrics pipeline \- Kubernetes](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-metrics-pipeline/)
- [Welcome \- AWS ALB Ingress Controller](https://kubernetes-sigs.github.io/aws-alb-ingress-controller/)
- [kubernetes\-sigs/external\-dns: Configure external DNS servers \(AWS Route53, Google CloudDNS and others\) for Kubernetes Ingresses and Services](https://github.com/kubernetes-sigs/external-dns)

## License
[Apache License 2.0](LICENSE)
