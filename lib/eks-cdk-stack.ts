import { Construct, Tag } from '@aws-cdk/core';
import { Vpc, InstanceType } from '@aws-cdk/aws-ec2';
import {
  AccountRootPrincipal,
  IRole,
  ManagedPolicy,
  Role,
} from '@aws-cdk/aws-iam';
import { Cluster } from '@aws-cdk/aws-eks';

import ALBIngressControllerIAMPolicyStack from './policies/ALBIngressControllerIAMPolicyStack';
import { BaseStack } from './base-stack';
import { loadManifestYaml } from './utils/manifest_reader';

export class EksCdkStack extends BaseStack {
  public readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props: { vpc: Vpc }) {
    super(scope, id);

    // EKS用のIAM Role
    const eksRole = new Role(this, 'EksRole', {
      roleName: 'MyEKSRole',
      assumedBy: new AccountRootPrincipal(),
    });
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));
    eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'));

    // EKS Cluster
    this.cluster = new Cluster(this, 'cluster', {
      vpc: props.vpc,
      mastersRole: eksRole,
      clusterName: 'MyEKSCluster',
      defaultCapacity: 0,
    });

    const autoScalingGroup = this.cluster.addCapacity('capacity', {
      desiredCapacity: 2,
      instanceType: new InstanceType('t3.small'),
    });

    this.appendAlbIngressController(autoScalingGroup.role);
  }

  /**
   * configure ALB ingress controller
   * @param clusterNodeRole
   */
  private appendAlbIngressController(clusterNodeRole: IRole): void {
    const stack = new ALBIngressControllerIAMPolicyStack(this, 'ALBIngressControllerIAMPolicyStack');
    this.cluster.vpc.publicSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });
    this.cluster.vpc.privateSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/internal-elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });
    clusterNodeRole.addManagedPolicy(stack.policy);

    const rbacRoleManifests = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/rbac-role.yaml');
    this.cluster.addResource('rbac-role', ...rbacRoleManifests);
    const [albIngressControllerManifests] = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/alb-ingress-controller.yaml');

    try {
      const { args } = albIngressControllerManifests.spec.template.spec.containers[0];
      args.push(`--cluster-name=${this.cluster.clusterName}`);
      args.push(`--aws-vpc-id=${this.cluster.vpc.vpcId}`);
      args.push(`--aws-region=${process.env.CDK_INTEG_REGION}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error({ error });
      process.exit(1);
    }
    this.cluster.addResource('alb-ingress-controller', albIngressControllerManifests);
  }
}
