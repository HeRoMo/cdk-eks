import { Construct } from '@aws-cdk/core';
import { Cluster, Nodegroup } from '@aws-cdk/aws-eks';

import { K8sResource } from './K8sResource';
import { loadManifestYaml } from '../utils/manifest_reader';
import { createPolicy } from '../policies/PolicyUtils';

export class ClusterAutoscaler extends K8sResource {
  constructor(scope: Construct, id: string, cluster: Cluster, nodeGroup: Nodegroup) {
    super(scope, id, cluster);

    const policy = createPolicy(this, 'ClusterAutoScalerPolicy', 'cluster-autoscaler.json');
    nodeGroup.role.attachInlinePolicy(policy);
  }

  protected manifests(): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    const manifests = loadManifestYaml('kubernetes-manifests/cluster-autoscaler/cluster-autoscaler-autodiscover.yaml');
    const deployment = manifests.find((manifest) => manifest.kind === 'Deployment');
    const { command } = deployment.spec.template.spec.containers[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = command.findIndex((cmd: any) => /<YOUR CLUSTER NAME>/.test(cmd));
    command[index] = command[index].replace('<YOUR CLUSTER NAME>', this.cluster.clusterName);
    command.push('--balance-similar-node-groups');
    command.push('--skip-nodes-with-system-pods=false');

    return manifests;
  }
}
