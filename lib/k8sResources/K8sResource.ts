import { Construct } from '@aws-cdk/core';
import { KubernetesResource, Cluster } from '@aws-cdk/aws-eks';

import { loadManifestYamlAll } from '../utils/manifest_reader';

export class K8sResource extends Construct {
  private cluster: Cluster;
  private manifestDir: string;

  constructor(scope: Construct, id: string, cluster: Cluster, manifestDir: string) {
    super(scope, id);

    this.cluster = cluster;
    this.manifestDir = manifestDir;

    new KubernetesResource(this, 'K8sResource', {
      cluster: this.cluster,
      manifest: this.manifests,
    });
  }

  get manifests(): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    return loadManifestYamlAll(this.manifestDir);
  }
}
