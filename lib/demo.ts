import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
export class demoService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "demo-bucket");

    const getHandler = new lambda.Function(this, "getHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "getApi.handler",
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(getHandler);

    const postHandler = new lambda.Function(this, "postHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "postApi.handler",
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(postHandler);

    const authHandler = new lambda.Function(this, "authHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "auth.handler",
      environment: {
        BUCKET: bucket.bucketName,
      },
    });
    
    bucket.grantReadWrite(authHandler);

    const authVal = new apigateway.TokenAuthorizer(this,'NewRequestAuthorizer',{
      handler:authHandler,
      identitySource:'method.request.header.AuthorizeToken'
      
    })
    const api = new apigateway.RestApi(this, "demo-api", {
      deploy:false,  
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      
      restApiName: "demo Service",
      description: "This is demo service.",
    });

    const userPool = new cognito.UserPool(this, "UserPool");

    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, "authorizer", {
      cognitoUserPools: [userPool],
    });

    const client = userPool.addClient('cdk-app-client', {
      userPoolClientName: 'cdk-app-client',
      authFlows: {
        userPassword: true,
      },
      oAuth:{
        callbackUrls:['https://test.com'],
        flows:{
          implicitCodeGrant:true,
        }
      },

      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    const claimResource = api.root.addResource("claim");
    const eligibilityResource = api.root
      .addResource("resolution")
      .addResource("eligibility");

    const getIntegration = new apigateway.LambdaIntegration(getHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    claimResource.addMethod("GET", getIntegration, {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    const postIntegration = new apigateway.LambdaIntegration(postHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    eligibilityResource.addMethod("POST", postIntegration, {
      authorizer:authVal,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    const deployment = new apigateway.Deployment(this, "Deployment", {
      api,
      retainDeployments:true
    });

    const testStage = new apigateway.Stage(this, "test", {
      deployment,
      stageName: "test",
    });

     deployment.addToLogicalId(new Date().toISOString())
    const devStage = new apigateway.Stage(this, "dev", {
      deployment,
      stageName: "dev",
    });
    api.deploymentStage  = devStage
  }
}
