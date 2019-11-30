import * as YAML from 'js-yaml';
import * as fs from 'fs';

/**
 * ファイルパスを指定して読み込む
 * @param filePath マニフェストファイルのパス
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadManifestYaml(filePath: string): any[] {
  const yamlFile = fs.readFileSync(filePath, 'utf8');
  const yamlData = YAML.safeLoadAll(yamlFile);
  return yamlData;
}

/**
 * ディレクトリを指定してその下の *.yamlファイルをすべての読み込む
 * @param dirPath ディレクトリのパス
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadManifestYamlAll(dirPath: string): any[] {
  const files = fs.readdirSync(dirPath).filter((fileName: string) => fileName.endsWith('.yaml'));
  const manifests: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  files.forEach((file) => manifests.push(...loadManifestYaml(`${dirPath}/${file}`)));
  return manifests;
}
