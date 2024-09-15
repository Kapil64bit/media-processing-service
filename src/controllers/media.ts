import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import {parseCSV} from '../services/csv'
import { Readable } from 'stream'; // Convert buffer to stream
import {sendMessageToQueue} from '../services/sqs';
import {storeProductData} from '../models/dynamo';
import { v4 as uuidv4 } from 'uuid';
import {getProcessingStatus} from '../models/dynamo';
import { processImage } from '../services/image';
import AWS from 'aws-sdk';
require('dotenv').config();


export const uploadData = async (req: Request, res: Response): Promise<void> => {
  const file = req.file; // Get the uploaded CSV file
  if(!file) throw new Error('csv file not found')

  if (!file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const requestId = uuidv4(); // Unique request ID for tracking
  const fileBuffer = file.buffer

  try {
    const rowsJson = await parseCSV(fileBuffer); // Parse CSV from buffer


console.log('before ---------========',rowsJson)
      // Store product and image URLs in DynamoDB
      const newRowsJson= await storeProductData(requestId, rowsJson,fileBuffer);

     
    console.log('new Row Json----------',newRowsJson)
        
        await sendMessageToQueue(requestId,newRowsJson);
       
        
      
    

    res.status(200).json({ requestId, message: 'File uploaded and processing started.' });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    res.status(500).json({ error: 'Failed to process the CSV file' });
  }
};





// Status API to track image processing progress
export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.requestId;
  const data = await getProcessingStatus(requestId);
  res.status(200).json(data);
};

export const imageProcessor = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('inside imageProcessor');

    // Use the request body directly without parsing it again
    const event = req.body;  // Already an object
    console.log('event8888888888', event);
    
    const eventBody = JSON.parse(event.Records[0].body);  // Extract body correctly
    
    // Trigger image processing in the background without awaiting
    processImage(eventBody)
      .then(() => {
        console.log('Image processing completed successfully');
      })
      .catch((error) => {
        console.error('Error in image processing:', error);
      });

    // Immediately send response indicating that the image is being processed
    res.status(200).json({ message: 'Image is being processed', eventBody });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error occurred during image processing' });
  }
};

// Status API to track image processing progress



export const getCsvFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestId = req.params.requestId;
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    const S3 = new AWS.S3();
    const bucket = process.env.S3_BUCKET!;
    const key = `${requestId}/processed_images.csv`;
    const csvUrl = `https://${bucket}.s3.amazonaws.com/${key}`;

    const paramS3 = {
      Bucket: bucket,
      Key: key, // File path in S3
    };
          // This will throw an error if the file does not exist
    const exist= await S3.headObject(paramS3).promise();
    if(exist){
      console.log('csv already Exists')
       res.status(200).json({
        success: true,
        csvUrl: csvUrl
      });

        return;
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE!,
      KeyConditionExpression: '#requestId = :requestId',
      ExpressionAttributeNames: {
        '#requestId': 'requestId'
      },
      ExpressionAttributeValues: {
        ':requestId': requestId
      }
    };

    const result:any = await dynamoDB.query(params).promise();
    
    
    if (!result.Items || result.Items.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No data found for the given requestId'
      });
      return;
    }


    
    const csvString = Buffer.from(result.Items[0].csvFileBuffer)
    console.log(csvString)
    // Process each item
    const parsedCsv:any = parse(csvString)
    

    parsedCsv[0].push('Output Image Urls');


    for(let i = 1,j = 0;i< parsedCsv.length;i++ ){
     const urlString = result.Items[j].processedImageUrls.join(',');
     console.log('urlstrings',urlString)
      parsedCsv[i].push(urlString)
    }
    const csvStringforBuffer:string = parsedCsv
    .map((innerArray: string[]) => 
      innerArray
        .map((item: string) => `"${item.replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  
console.log(csvString);
    const csvBuffer = Buffer.from(csvStringforBuffer)
    console.log('here by chance',csvStringforBuffer,'and buffer of parcedCsv',csvBuffer,)
  

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
  } catch (error) {
    console.error('Error processing CSV data:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process CSV data'
    });
  }
};