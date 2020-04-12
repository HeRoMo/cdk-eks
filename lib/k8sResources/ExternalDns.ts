import { Construct } from '@aws-cdk/core';
import { Cluster, Nodegroup } from '@aws-cdk/aws-eks';

import { K8sResource } from './K8sResource';
import { loadManifestYaml } from '../utils/manifest_reader';
import { createPolicy } from '../policies/PolicyUtils';

export class ExternalDns extends K8sResource {
  private readonly domain: string;

  constructor(
    scope: Construct,
    id: string,
    cluster: Cluster,
    nodeGroup: Nodegroup,
    props: { domain: string },
  ) {
    super(scope, id, cluster, props);

    const policy = createPolicy(this, 'ExternalDNS', 'external-dns.json');
    nodeGroup.role.attachInlinePolicy(policy);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, class-methods-use-this
  protected manifests(props: { domain: string }): any[] {
    const externalDnsManifests = loadManifestYaml('kubernetes-manifests/exterrnal-dns/external-dns.yaml');

    // eslint-disable-next-line arrow-body-style
    const externalDnsDeployment = externalDnsManifests.find((manifest) => {
      return manifest.kind === 'Deployment' && manifest.metadata.name === 'external-dns';
    });
    const container = externalDnsDeployment.spec.template.spec.containers[0];
    container.args = container.args.map((arg: string) => {
      if (arg.startsWith('--domain-filter=')) {
        return `--domain-filter=${props.domain}`;
      }
      return arg;
    });
    return externalDnsManifests;
  }
}
