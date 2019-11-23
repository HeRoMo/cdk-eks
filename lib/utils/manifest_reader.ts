import * as YAML from 'js-yaml';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadManifestYaml(filePath: string): any[] {
  const yamlFile = fs.readFileSync(filePath, 'utf8');
  const yamlData = YAML.safeLoadAll(yamlFile);
  return yamlData;
}
