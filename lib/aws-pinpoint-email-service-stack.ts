import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as iam from "aws-cdk-lib/aws-iam";

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
  }
}
