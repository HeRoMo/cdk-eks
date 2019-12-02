import * as fs from 'fs';
import * as path from 'path';

import { PolicyStatement, Effect, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

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

export default class PolicyStack extends BaseStack {
  public readonly policy: ManagedPolicy;

  constructor(scope: Construct, id: string, policyName: string, statementJson: string) {
    super(scope, id);

    const filePath = path.join(__dirname, 'statements', statementJson);
    const statements = PolicyStack.loadStatementsJson(filePath);
    this.policy = new ManagedPolicy(this, `${policyName}Policy`, {
      managedPolicyName: policyName,
      statements,
    });
  }

  /**
   * Read IAM Policy JSON file and return PolicyStatement Array.
   * @param statementJsonFile IAM Policy JSON file path
   */
  protected static loadStatementsJson(statementJsonFile: string): PolicyStatement[]|undefined {
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
