import { Construct, Tag } from '@aws-cdk/core';
import { Cluster } from '@aws-cdk/aws-eks';

import { K8sResource } from './K8sResource';
import { createPolicy } from '../policies/PolicyUtils';
import { loadManifestYaml } from '../utils/manifest_reader';

export class AlbIngressController extends K8sResource {
  constructor(scope: Construct, id: string, cluster: Cluster) {
    super(scope, id, cluster);

    this.cluster.vpc.publicSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });
    this.cluster.vpc.privateSubnets.forEach((subnet) => {
      subnet.node.applyAspect(new Tag('kubernetes.io/role/internal-elb', '1', { includeResourceTypes: ['AWS::EC2::Subnet'] }));
    });

    const policy = createPolicy(this, 'ALBIngressControllerIAM', 'alb-ingress-controller.json');
    this.cluster.role.attachInlinePolicy(policy);
  }

  protected manifests(): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    const rbacRoleManifests = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/rbac-role.yaml');

    const [albIngressControllerManifests] = loadManifestYaml('kubernetes-manifests/alb-ingress-controller/alb-ingress-controller.yaml');
    try {
      const { args } = albIngressControllerManifests.spec.template.spec.containers[0];
      args.push(`--cluster-name=${this.cluster.clusterName}`);
      args.push(`--aws-vpc-id=${this.cluster.vpc.vpcId}`);
      args.push(`--aws-region=${this.cluster.stack.region}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error({ error });
      process.exit(1);
    }
    return [...rbacRoleManifests, albIngressControllerManifests];
  }
}
