import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class ProductionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // VPC Configuration - Using default VPC for cost optimization
    // =========================================================================
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // =========================================================================
    // S3 Bucket for File Storage
    // =========================================================================
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: 'medbookings-uploads-production',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
      versioned: true, // Enable versioning for production
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['https://medbookings.co.za', 'https://www.medbookings.co.za'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldFiles',
          enabled: true,
          expiration: cdk.Duration.days(365), // Keep files longer in production
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90), // Move old files to cheaper storage
            },
          ],
        },
      ],
    });

    // =========================================================================
    // Database Security Group
    // =========================================================================
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS PostgreSQL production database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access from within VPC (Amplify/Lambda will use this)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // =========================================================================
    // RDS PostgreSQL Database Credentials
    // =========================================================================
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: 'medbookings-production-db-credentials',
      description: 'RDS PostgreSQL credentials for production environment',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'medbookings_admin',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // =========================================================================
    // RDS PostgreSQL Database Instance (Production)
    // =========================================================================
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // Free tier eligible
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Default VPC only has public subnets
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'medbookings',
      credentials: rds.Credentials.fromSecret(dbCredentials),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage auto-scaling
      storageEncrypted: true,
      multiAz: false, // Single-AZ for free tier eligibility
      publiclyAccessible: false,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '00:00-02:00', // 2-4 AM SAST (00:00-02:00 UTC)
      deleteAutomatedBackups: false,
      deletionProtection: true, // Enable deletion protection for production
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Take snapshot on deletion
      enablePerformanceInsights: true, // Enable performance insights for production
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT, // 7 days
    });

    // Enable Point-in-Time Recovery and CloudWatch logs
    const cfnDatabase = database.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase.enableCloudwatchLogsExports = ['postgresql', 'upgrade'];

    // =========================================================================
    // Read-Only Database User (for analytics/reporting)
    // =========================================================================
    // Note: Read-only user creation requires manual SQL execution after deployment:
    // CREATE USER medbookings_readonly WITH PASSWORD 'secure_password';
    // GRANT CONNECT ON DATABASE medbookings TO medbookings_readonly;
    // GRANT USAGE ON SCHEMA public TO medbookings_readonly;
    // GRANT SELECT ON ALL TABLES IN SCHEMA public TO medbookings_readonly;
    // ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO medbookings_readonly;

    // =========================================================================
    // IAM Role for Amplify/Lambda to Access Resources
    // =========================================================================
    const amplifyServiceRole = new iam.Role(this, 'AmplifyServiceRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('amplify.amazonaws.com'),
        new iam.ServicePrincipal('lambda.amazonaws.com')
      ),
      description: 'Service role for Amplify and Lambda functions in production',
    });

    // Grant access to S3 bucket
    uploadsBucket.grantReadWrite(amplifyServiceRole);

    // Grant access to Secrets Manager
    dbCredentials.grantRead(amplifyServiceRole);

    // Grant CloudWatch Logs permissions
    amplifyServiceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    // =========================================================================
    // CloudWatch Log Group
    // =========================================================================
    const logGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/medbookings/production/application',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain logs for production
    });

    // =========================================================================
    // SNS Topic for Critical Alerts
    // =========================================================================
    const alertTopic = new sns.Topic(this, 'CriticalAlertsTopic', {
      topicName: 'medbookings-production-critical-alerts',
      displayName: 'MedBookings Production Critical Alerts',
    });

    // Subscribe email to alerts
    alertTopic.addSubscription(new subscriptions.EmailSubscription('aws-root@medbookings.co.za'));

    // =========================================================================
    // CloudWatch Alarms - Production (More Sensitive)
    // =========================================================================

    // RDS CPU Utilization Alarm (more sensitive for production)
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: 'medbookings-production-rds-high-cpu',
      alarmDescription: 'Alert when RDS CPU utilization exceeds 80% for 5 minutes',
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // RDS CPU Critical Alarm (emergency level)
    new cloudwatch.Alarm(this, 'DatabaseCPUCriticalAlarm', {
      alarmName: 'medbookings-production-rds-critical-cpu',
      alarmDescription: 'CRITICAL: RDS CPU utilization exceeds 95%',
      metric: database.metricCPUUtilization(),
      threshold: 95,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // RDS Storage Space Alarm
    new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      alarmName: 'medbookings-production-rds-low-storage',
      alarmDescription: 'Alert when RDS free storage space is less than 5GB',
      metric: database.metricFreeStorageSpace(),
      threshold: 5 * 1024 * 1024 * 1024, // 5GB in bytes (more headroom for production)
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // RDS Connection Errors Alarm
    new cloudwatch.Alarm(this, 'DatabaseConnectionErrorsAlarm', {
      alarmName: 'medbookings-production-rds-connection-errors',
      alarmDescription: 'Alert when RDS has connection failures',
      metric: database.metricDatabaseConnections({
        statistic: 'Sum',
      }),
      threshold: 0,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // RDS Read Latency Alarm
    new cloudwatch.Alarm(this, 'DatabaseReadLatencyAlarm', {
      alarmName: 'medbookings-production-rds-high-read-latency',
      alarmDescription: 'Alert when RDS read latency is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ReadLatency',
        dimensionsMap: {
          DBInstanceIdentifier: database.instanceIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 0.1, // 100ms = 0.1 seconds
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // RDS Write Latency Alarm
    new cloudwatch.Alarm(this, 'DatabaseWriteLatencyAlarm', {
      alarmName: 'medbookings-production-rds-high-write-latency',
      alarmDescription: 'Alert when RDS write latency is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'WriteLatency',
        dimensionsMap: {
          DBInstanceIdentifier: database.instanceIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 0.1, // 100ms = 0.1 seconds
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // =========================================================================
    // Stack Outputs
    // =========================================================================
    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint hostname',
      exportName: 'medbookings-production-rds-endpoint',
    });

    new cdk.CfnOutput(this, 'RDSPort', {
      value: database.dbInstanceEndpointPort,
      description: 'RDS PostgreSQL port',
      exportName: 'medbookings-production-rds-port',
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: 'medbookings',
      description: 'Database name',
      exportName: 'medbookings-production-db-name',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
      value: dbCredentials.secretArn,
      description: 'ARN of the Secrets Manager secret containing database credentials',
      exportName: 'medbookings-production-db-credentials-arn',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 bucket name for file uploads',
      exportName: 'medbookings-production-s3-bucket',
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: uploadsBucket.bucketArn,
      description: 'S3 bucket ARN',
      exportName: 'medbookings-production-s3-bucket-arn',
    });

    new cdk.CfnOutput(this, 'AmplifyServiceRoleArn', {
      value: amplifyServiceRole.roleArn,
      description: 'IAM role ARN for Amplify/Lambda service access',
      exportName: 'medbookings-production-amplify-role-arn',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS topic ARN for critical alerts',
      exportName: 'medbookings-production-alert-topic-arn',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch log group name',
      exportName: 'medbookings-production-log-group',
    });

    new cdk.CfnOutput(this, 'DatabaseConnectionString', {
      value: `postgresql://\${SecretValue}@${database.dbInstanceEndpointAddress}:${database.dbInstanceEndpointPort}/medbookings?sslmode=require`,
      description:
        'Database connection string template (replace ${SecretValue} with credentials from Secrets Manager)',
    });
  }
}
