"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToQueue = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
require('dotenv').config();
// import { triggerWebhook } from './webhookService';
const SQS = new aws_sdk_1.default.SQS();
const S3_BUCKET = process.env.S3_BUCKET;
// Send message to SQS for processing
const sendMessageToQueue = async (requestId, rowsJson) => {
    const params = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify({ requestId, rowsJson }),
    };
    await SQS.sendMessage(params).promise();
};
exports.sendMessageToQueue = sendMessageToQueue;
