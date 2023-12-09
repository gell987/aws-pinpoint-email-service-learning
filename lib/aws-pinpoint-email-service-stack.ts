import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apigwv2_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import * as pinpoint from "aws-cdk-lib/aws-pinpoint";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class AwsPinpointEmailServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { service, stage } = props?.tags!;

    // ===============================================================================
    // CREATED HTTP API FOR SENDING EMAILS THROUGH PINPOINT
    // ===============================================================================

    const pinpointEmailApi = new apigwv2.HttpApi(
      this,
      `${service}-${stage}-api`,
      {
        apiName: `${service}-${stage}-api`,
        description:
          "This api is responsible for sending emails with pinpoint.",
        corsPreflight: {
          allowHeaders: ["Content-Type"],
          allowMethods: [apigwv2.CorsHttpMethod.POST],
          allowCredentials: false,
          allowOrigins: ["*"],
        },
      }
    );

    // ===============================================================================
    // IAM: CREATED IAM POLICIES FOR PINPOINT AND KINESIS FIREHOSE STREAM
    // ===============================================================================

    const pinpoint_role = new iam.Role(
      this,
      `${service}-${stage}-pinpoint-role`,
      {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("pinpoint.amazonaws.com"),
          new iam.ServicePrincipal("lambda.amazonaws.com")
        ),

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
        ],
      }
    );

    pinpoint_role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["mobiletargeting:SendMessages"],
        resources: ["*"],
      })
    );

    // ===============================================================================
    // CREATED A PINPOINT APP FOR SENDING EMAILS
    // ===============================================================================

    const pinpointEmailApp = new pinpoint.CfnApp(
      this,
      `${service}-${stage}-project`,
      {
        name: `${service}-${stage}-project`,
      }
    );

    // ===============================================================================
    // CREATED A PINPOINT EMAIL CHANNEL
    // ===============================================================================

    new pinpoint.CfnEmailChannel(
      this,
      `${service}-${stage}-pinpoint-email-channel`,
      {
        applicationId: pinpointEmailApp.ref,
        enabled: true,
        fromAddress: "raofahad046@gmail.com",
        identity:
          "arn:aws:ses:us-east-1:961322954791:identity/raofahad046@gmail.com",
        roleArn: pinpoint_role.roleArn,
      }
    );

    // ===============================================================================
    // LAMBDA: CREATED LAMBDA FUNCTION FOR PINPOINT EMAIL SERVICE
    // ===============================================================================

    const pinpointSendEmailLambda = new lambda.Function(
      this,
      `${service}-${stage}-send-email-lambda`,
      {
        functionName: `${service}-${stage}-send-email-lambda`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "SendEmail.handler",
        role: pinpoint_role,
        environment: {
          FROM_EMAIL: "raofahad046@gmail.com",
          APP_ID: pinpointEmailApp.ref,
        },
      }
    );

    // ===============================================================================
    // CREATED HTTP API INTEGRATIONS WITH API-GATEWAY
    // ===============================================================================

    const pinpointSendEmailLambdaIntegration =
      new apigwv2_integrations.HttpLambdaIntegration(
        `${service}-${stage}-send-email-lambda-integration`,
        pinpointSendEmailLambda
      );

    // ===============================================================================
    // CREATED ROUTE FOR LAMBDA FUNCTION
    // ===============================================================================

    pinpointEmailApi.addRoutes({
      path: "/send-email",
      methods: [apigwv2.HttpMethod.POST],
      integration: pinpointSendEmailLambdaIntegration,
    });

    // ===============================================================================
    // OUTPUT STATEMENTS FOR OUTPUT URLS AND ARNS
    // ===============================================================================

    new cdk.CfnOutput(this, `${service}-${stage}-feedback-api-endpoint`, {
      value: pinpointEmailApi.url!,
    });
  }
}
