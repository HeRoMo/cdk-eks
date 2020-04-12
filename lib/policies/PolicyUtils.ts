import * as fs from 'fs';
import * as path from 'path';

import { Construct } from '@aws-cdk/core';
import {
  PolicyStatement,
  Policy,
} from '@aws-cdk/aws-iam';

/**
 * JSONファイルからポリシーステートメントを生成する。
 *
 * lib/policies/statements ディレクトリから指定されたファイルを読み込む
 *
 * @param statementJsonFile JSON形式のポリシーステートメントのファイル名
 */
function json2statements(statementJsonFile: string): PolicyStatement[] {
  const filePath = path.join(__dirname, 'statements', statementJsonFile);
  const jsonObject = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jsonObject.Statement.map((statement: any) => PolicyStatement.fromJson(statement));
}

/**
 * IAM ポリシーを生成する
 * statementJsonFile には lib/policies/statements ディレクトリから指定されたファイルを読み込む
 *
 * @param scope Construct
 * @param id ID
 * @param statementJsonFile JSON形式のポリシーステートメントファイル名
 */
export function createPolicy(scope: Construct, id: string, statementJsonFile: string): Policy {
  return new Policy(scope, id, {
    policyName: id,
    statements: json2statements(statementJsonFile),
  });
}
