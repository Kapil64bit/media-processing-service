import AWS from 'aws-sdk'
import {getProcessingStatus} from '../models/dynamo';
require('dotenv').config();

// import { triggerWebhook } from './webhookService';

const SQS = new AWS.SQS();
const S3_BUCKET = process.env.S3_BUCKET!;

// Send message to SQS for processing
export const sendMessageToQueue = async (requestId: string, rowsJson:any): Promise<void> => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MessageBody: JSON.stringify({ requestId, rowsJson}),
  };
  await SQS.sendMessage(params).promise();
};