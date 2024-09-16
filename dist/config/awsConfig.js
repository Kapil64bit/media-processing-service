"use strict";
// File: awsConfig.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDbClient = exports.s3Client = void 0;
const aws_sdk_1 = require("aws-sdk");
require('dotenv').config();
const awsConfig = {
    region: process.env.AWS_REGION || 'eu-north-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
// Validate the configuration
if (!awsConfig.region) {
    throw new Error('AWS Region is not set');
}
if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    throw new Error('AWS Region is not set');
}
// Apply the configuration
aws_sdk_1.config.update(awsConfig);
// Create and export an S3 client
exports.s3Client = new aws_sdk_1.S3();
// Create and export a DynamoDB client
exports.dynamoDbClient = new aws_sdk_1.DynamoDB.DocumentClient();
