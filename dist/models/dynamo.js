"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcessingStatus = exports.updateImageUrls = exports.storeProductData = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const awsConfig_1 = require("../config/awsConfig");
const uuid_1 = require("uuid");
const S3 = new aws_sdk_1.default.S3();
require('dotenv').config();
const storeProductData = async (requestId, rowsJson, fileBuffer) => {
    try {
        const bucket = process.env.S3_BUCKET;
        const productIds = await Promise.all(rowsJson.map(async (item) => {
            try {
                const productName = item['Product Name'];
                const productId = (0, uuid_1.v4)();
                item.productId = productId;
                const imageUrls = item['Input Image Urls'].split(',').map((url) => url.trim());
                console.log('imageUrls before saving:', imageUrls);
                const res = await awsConfig_1.dynamoDbClient.put({
                    TableName: process.env.DYNAMODB_TABLE,
                    Item: {
                        requestId,
                        csvFileBuffer: fileBuffer,
                        serialNumber: item['Serial Number'],
                        productId,
                        productName,
                        imageUrl: imageUrls,
                        isComplete: false,
                        processedImageUrls: [],
                    },
                }).promise();
                if (!res) {
                    throw new Error('Error while uploading data to DynamoDB');
                }
            }
            catch (innerError) {
                console.error('Error processing item:', item, innerError);
                throw innerError; // Re-throw to be caught by the outer catch
            }
        }));
        return rowsJson;
    }
    catch (error) {
        console.error('Error in storeProductData:', error);
        throw new Error(`Failed to store product data: ${error.message}`);
    }
};
exports.storeProductData = storeProductData;
// Update the processed image URL
const updateImageUrls = async (requestId, productId, compressedImageUrls) => {
    try {
        console.log('inside updateImageUrls');
        // First, query to check if the item exists with both requestId and productId
        const updateParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                requestId,
                productId
            },
            // Update both 'processedImageUrls' and 'status'
            UpdateExpression: "SET processedImageUrls = :urls, isComplete = :isComplete",
            ExpressionAttributeValues: {
                ':urls': compressedImageUrls,
                ':isComplete': true // Setting 'status' to true
            },
            ReturnValues: "ALL_NEW" // Return the updated document
        };
        const queryResult = await awsConfig_1.dynamoDbClient.update(updateParams).promise();
        console.log('after update', queryResult);
    }
    catch (error) {
        console.error('Error updating image URLs:', error);
        throw new Error(`Failed to update image URLs: ${error.message}`);
    }
};
exports.updateImageUrls = updateImageUrls;
// Get the status of the processing request
const getProcessingStatus = async (requestId) => {
    try {
        return await awsConfig_1.dynamoDbClient.query({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'requestId = :requestId',
            ExpressionAttributeValues: { ':requestId': requestId },
        }).promise();
    }
    catch (error) {
        console.error('Error fetching processing status:', error);
        throw new Error(`Failed to get processing status: ${error.message}`);
    }
};
exports.getProcessingStatus = getProcessingStatus;
