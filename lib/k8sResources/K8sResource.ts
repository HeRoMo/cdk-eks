import { Construct } from '@aws-cdk/core';
import { KubernetesResource, Cluster } from '@aws-cdk/aws-eks';

export abstract class K8sResource extends Construct {
  protected readonly cluster: Cluster;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(scope: Construct, id: string, cluster: Cluster, props: { [key: string]: any } = {}) {
    super(scope, id);

    this.cluster = cluster;

    const manifest = this.manifests(props);
    // console.log(JSON.stringify({manifest}, null, 2));
    new KubernetesResource(this, 'K8sResource', {
      cluster: this.cluster,
      manifest,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, class-methods-use-this
  protected abstract manifests(props?: { [key: string]: any }): any[];
}
