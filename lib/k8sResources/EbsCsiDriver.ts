import { Construct } from '@aws-cdk/core';
import { Cluster, Nodegroup } from '@aws-cdk/aws-eks';

import { K8sResource } from './K8sResource';
import { loadManifestYaml } from '../utils/manifest_reader';
import { createPolicy } from '../policies/PolicyUtils';

export class EbsCsiDriver extends K8sResource {
  constructor(scope: Construct, id: string, cluster: Cluster, nodeGroup: Nodegroup) {
    super(scope, id, cluster);

    const policy = createPolicy(this, 'AmazonEBSCSIDriver', 'ebs-csi-driver.json');
    nodeGroup.role.attachInlinePolicy(policy);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, class-methods-use-this
  protected manifests(): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    return loadManifestYaml('kubernetes-manifests/ebs-csi-driver/ebs-csi-driver.yaml');
  }
}
