import { Request, Response } from 'express';
import {parseCSV} from '../services/csv'
import { Readable } from 'stream'; // Convert buffer to stream
import {sendMessageToQueue} from '../services/sqs';
import {storeProductData} from '../models/dynamo';
import { v4 as uuidv4 } from 'uuid';
import {getProcessingStatus} from '../models/dynamo';
import { processImage } from '../services/image';
require('dotenv').config();

// CSV upload controller
export const uploadData = async (req: Request, res: Response): Promise<void> => {
  const file = req.file; // Get the uploaded CSV file
  if(!file) throw new Error('csv file not found')

  if (!file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const requestId = uuidv4(); // Unique request ID for tracking

  try {
    const rowsJson = await parseCSV(file.buffer); // Parse CSV from buffer


console.log('before ---------========',rowsJson)
      // Store product and image URLs in DynamoDB
      const newRowsJson= await storeProductData(requestId, rowsJson);

     
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
  console.log('inside imageProcessor')
  const event = req.body
  const bucket = process.env.S3_BUCKET;
  console.log('event--------',JSON.parse(event.event.Records[0].body));
  const eventBody = JSON.parse(event.event.Records[0].body)
  const resp = await processImage(eventBody)
  res.status(200).json(eventBody)
  // processImage(bucket, imageUrl, requestId, productId)
};