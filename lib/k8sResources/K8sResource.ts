import { Construct } from '@aws-cdk/core';
import { KubernetesResource, Cluster } from '@aws-cdk/aws-eks';

export abstract class K8sResource extends Construct {
  protected readonly cluster: Cluster;
  private readonly manifestDir: string | undefined;

  constructor(scope: Construct, id: string, cluster: Cluster) {
    super(scope, id);

    this.cluster = cluster;

    new KubernetesResource(this, 'K8sResource', {
      cluster: this.cluster,
      manifest: this.manifests(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, class-methods-use-this
  protected abstract manifests(): any[];
}
