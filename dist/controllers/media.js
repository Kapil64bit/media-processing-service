"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsvFile = exports.imageProcessor = exports.getStatus = exports.uploadData = void 0;
const sync_1 = require("csv-parse/sync");
const csv_1 = require("../services/csv");
const sqs_1 = require("../services/sqs");
const dynamo_1 = require("../models/dynamo");
const uuid_1 = require("uuid");
const dynamo_2 = require("../models/dynamo");
const image_1 = require("../services/image");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
require('dotenv').config();
const uploadData = async (req, res) => {
    const file = req.file; // Get the uploaded CSV file
    if (!file)
        throw new Error('csv file not found');
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }
    const requestId = (0, uuid_1.v4)(); // Unique request ID for tracking
    const fileBuffer = file.buffer;
    try {
        const rowsJson = await (0, csv_1.parseCSV)(fileBuffer); // Parse CSV from buffer
        console.log('before ---------========', rowsJson);
        // Store product and image URLs in DynamoDB
        const newRowsJson = await (0, dynamo_1.storeProductData)(requestId, rowsJson, fileBuffer);
        console.log('new Row Json----------', newRowsJson);
        await (0, sqs_1.sendMessageToQueue)(requestId, newRowsJson);
        res.status(200).json({ requestId, message: 'File uploaded and processing started.' });
    }
    catch (error) {
        console.error('Error parsing CSV:', error);
        res.status(500).json({ error: 'Failed to process the CSV file' });
    }
};
exports.uploadData = uploadData;
// Status API to track image processing progress
const getStatus = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        let result = true;
        // Assuming getProcessingStatus fetches the DynamoDB data
        const data = await (0, dynamo_2.getProcessingStatus)(requestId);
        // Convert data to a standard JSON format if needed
        const jsonData = JSON.parse(JSON.stringify(data));
        console.log(jsonData);
        // Iterate over the items in the result array
        for (const item of jsonData.Items) {
            // Check if the image processing is complete
            if (item.isComplete !== true) {
                console.log('Processing not complete for item:', item);
                result = false;
                break;
            }
        }
        console.log('Processing result:', result);
        const message = result
            ? 'Images compressed and processed successfully'
            : 'Compression of images is still running';
        // Send response
        res.status(200).json({
            status: true,
            message // Fixed typo from "massage" to "message"
        });
    }
    catch (error) {
        console.error('Error in getStatus:', error);
        res.status(500).json({
            status: false,
            message: 'An error occurred while checking the processing status'
        });
    }
};
exports.getStatus = getStatus;
const imageProcessor = async (req, res) => {
    try {
        console.log('inside imageProcessor');
        // Use the request body directly without parsing it again
        const event = req.body; // Already an object
        console.log('event8888888888', event);
        const eventBody = JSON.parse(event.Records[0].body); // Extract body correctly
        // Trigger image processing in the background without awaiting
        (0, image_1.processImage)(eventBody)
            .then(() => {
            console.log('Image processing completed successfully');
        })
            .catch((error) => {
            console.error('Error in image processing:', error);
        });
        // Immediately send response indicating that the image is being processed
        res.status(200).json({ message: 'Image is being processed', eventBody });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error occurred during image processing' });
    }
};
exports.imageProcessor = imageProcessor;
// Status API to track image processing progress
const getCsvFile = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const dynamoDB = new aws_sdk_1.default.DynamoDB.DocumentClient();
        const S3 = new aws_sdk_1.default.S3();
        const bucket = process.env.S3_BUCKET;
        const key = `${requestId}/processed_images.csv`;
        const csvUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
        const paramS3 = {
            Bucket: bucket,
            Key: key, // File path in S3
        };
        // Check if the file exists
        S3.headObject(paramS3).promise()
            .then(() => {
            console.log('CSV already exists');
            res.status(200).json({
                success: true,
                csvUrl: csvUrl
            });
            return; // Skip further execution if the file exists
        })
            .catch(async (error) => {
            if (error.code === 'NotFound') {
                const params = {
                    TableName: process.env.DYNAMODB_TABLE,
                    KeyConditionExpression: '#requestId = :requestId',
                    ExpressionAttributeNames: {
                        '#requestId': 'requestId'
                    },
                    ExpressionAttributeValues: {
                        ':requestId': requestId
                    }
                };
                const result = await dynamoDB.query(params).promise();
                if (!result.Items || result.Items.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: 'No data found for the given requestId'
                    });
                    return;
                }
                const csvString = Buffer.from(result.Items[0].csvFileBuffer);
                console.log(csvString);
                // Process each item
                const parsedCsv = (0, sync_1.parse)(csvString);
                parsedCsv[0].push('Output Image Urls');
                for (let i = 1, j = 0; i < parsedCsv.length; i++) {
                    const urlString = result.Items[j].processedImageUrls.join(',');
                    console.log('urlstrings', urlString);
                    parsedCsv[i].push(urlString);
                }
                const csvStringforBuffer = parsedCsv
                    .map((innerArray) => innerArray
                    .map((item) => `"${item.replace(/"/g, '""')}"`)
                    .join(','))
                    .join('\n');
                console.log(csvString);
                const csvBuffer = Buffer.from(csvStringforBuffer);
                console.log('here by chance', csvStringforBuffer, 'and buffer of parcedCsv', csvBuffer);
                // Upload to S3
                const s3Params = {
                    Bucket: bucket,
                    Key: key,
                    Body: csvBuffer,
                    ContentType: 'text/csv'
                };
                await S3.putObject(s3Params).promise();
                // Generate S3 URL
                res.status(200).json({
                    success: true,
                    csvUrl: csvUrl
                });
            }
        });
    }
    catch (error) {
        console.error('Error processing CSV data:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to process CSV data'
        });
    }
};
exports.getCsvFile = getCsvFile;
