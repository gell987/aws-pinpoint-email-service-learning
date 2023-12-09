#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsPinpointEmailServiceStack } from "../lib/aws-pinpoint-email-service-stack";

const service = "aws-pinpoint-email-service";
let stage;
const app = new cdk.App();

stage = "m";
new AwsPinpointEmailServiceStack(app, `${service}-${stage}`, {
  tags: {
    service,
    stage,
  },
});

stage = "d";
new AwsPinpointEmailServiceStack(app, `${service}-${stage}`, {
  tags: {
    service,
    stage,
  },
});
