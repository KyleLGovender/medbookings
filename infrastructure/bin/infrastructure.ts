#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StagingStack } from '../lib/staging-stack';
import { ProductionStack } from '../lib/production-stack';

const app = new cdk.App();

// Get AWS account and region from CDK context
const account = app.node.tryGetContext('account') || '455315867736';
const region = app.node.tryGetContext('region') || 'eu-west-1';

// Staging Environment Stack
new StagingStack(app, 'MedBookingsInfraStack-Staging', {
  env: {
    account: account,
    region: region,
  },
  description: 'MedBookings Staging Infrastructure - RDS PostgreSQL, S3, Monitoring',
  tags: {
    Environment: 'Staging',
    Project: 'MedBookings',
    ManagedBy: 'CDK',
  },
});

// Production Environment Stack
new ProductionStack(app, 'MedBookingsInfraStack-Production', {
  env: {
    account: account,
    region: region,
  },
  description: 'MedBookings Production Infrastructure - RDS PostgreSQL, S3, Monitoring',
  tags: {
    Environment: 'Production',
    Project: 'MedBookings',
    ManagedBy: 'CDK',
  },
});