const region = process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION;
const account = process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const appDomain = process.env.APP_DOMAIN;

export {
  region,
  account,
  appDomain,
};
