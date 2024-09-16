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
import { json } from 'body-parser';
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
  try {
    const requestId = req.params.requestId;
    let result = true;

    // Assuming getProcessingStatus fetches the DynamoDB data
    const data = await getProcessingStatus(requestId);

    // Convert data to a standard JSON format if needed
    const jsonData: any = JSON.parse(JSON.stringify(data));
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
  } catch (error) {
    console.error('Error in getStatus:', error);
    res.status(500).json({
      status: false,
      message: 'An error occurred while checking the processing status'
    });
  }
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
      Prefix: key, // File path in S3
    };
          // This will throw an error if the file does not exist
          const fileExists = await S3.listObjectsV2(paramS3).promise();
        
      console.log(fileExists)
          if (fileExists) {
            console.log('CSV already exists');
            res.status(200).json({
              success: true,
              csvUrl: csvUrl
            });
            return; // Skip further execution if the file exists
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