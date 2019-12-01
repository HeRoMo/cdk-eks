import * as fs from 'fs';

import { Construct } from '@aws-cdk/core';
import { ManagedPolicy, PolicyStatement, Effect } from '@aws-cdk/aws-iam';

import { BaseStack } from '../base-stack';

/**
 * IAM Policy statetment.
 */
interface StatementObject {
  Effect: Effect;
  Action: string[];
  Resource: string[];
}

/**
 * Type Guard Func of StatementObject
 * @param objects Iam Policy Json Object
 */
function isStatementObjects(objects: object): objects is StatementObject {
  if (Array.isArray(objects)) {
    return objects.every((obj) => (obj.Effect && obj.Action && obj.Resource));
  }
  return false;
}

/**
 * Policy Stack for ExternalDNS
 */
export default class ExternalDNSPolicyStack extends BaseStack {
  public readonly policy: ManagedPolicy;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const statements = ExternalDNSPolicyStack.loadStatementsJson('lib/policies/statements/external-dns.json');
    this.policy = new ManagedPolicy(this, 'ExternalDNSPolicy', {
      managedPolicyName: 'ExternalDNS',
      statements,
    });
  }

  /**
   * Read IAM Policy JSON file and return PolicyStatement Array.
   * @param statementJsonFile IAM Policy JSON file path
   */
  private static loadStatementsJson(statementJsonFile: string): PolicyStatement[]|undefined {
    const jsonObject = JSON.parse(fs.readFileSync(statementJsonFile, 'utf8'));
    let statements;
    if (isStatementObjects(jsonObject.Statement)) {
      // eslint-disable-next-line arrow-body-style
      statements = jsonObject.Statement.map((statement: StatementObject) => {
        return new PolicyStatement({
          effect: statement.Effect,
          actions: statement.Action,
          resources: statement.Resource,
        });
      });
    }
    return statements;
  }
}
