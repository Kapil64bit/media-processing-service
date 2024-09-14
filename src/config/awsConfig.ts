// File: awsConfig.ts

import { config, S3, DynamoDB } from 'aws-sdk';
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
config.update(awsConfig);

// Create and export an S3 client
export const s3Client = new S3();

// Create and export a DynamoDB client
export const dynamoDbClient = new DynamoDB.DocumentClient();