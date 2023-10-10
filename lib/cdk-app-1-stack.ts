import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as demo_service from './demo';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkApp1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new demo_service.demoService(this, 'demo');
    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkApp1Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
