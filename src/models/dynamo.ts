import AWS from 'aws-sdk';
import { dynamoDbClient } from '../config/awsConfig';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

export const storeProductData = async (requestId: string, rowsJson: any[]) => {
  try {
    const productIds = await Promise.all(rowsJson.map(async (item: any) => {
      try {
        const productName: string = item['Product Name'];
        const productId: string = uuidv4();
        item.productId = productId;
        const imageUrls: string[] = item['Input Image Urls'].split(',').map((url: string) => url.trim());

        console.log('imageUrls before saving:', imageUrls);

        const res = await dynamoDbClient.put({
          TableName: process.env.DYNAMODB_TABLE!,
          Item: {
            requestId,
            serialNumber:item['Serial Number'],
            productId,
            productName,
            imageUrl: imageUrls,
            status: false,
            processedImageUrls: [],
          },
        }).promise();

        if (!res) {
          throw new Error('Error while uploading data to DynamoDB');
        }

        
      } catch (innerError) {
        console.error('Error processing item:', item, innerError);
        throw innerError; // Re-throw to be caught by the outer catch
      }
    }));
    return rowsJson
    
  } catch (error: any) {
    console.error('Error in storeProductData:', error);
    throw new Error(`Failed to store product data: ${error.message}`);
  }
};

// Update the processed image URL
export const updateImageUrls = async (requestId: string, productId: string, compressedImageUrls: string[]): Promise<void> => {
  try {
    await dynamoDbClient.update({
      TableName: process.env.DYNAMODB_TABLE!,
      Key: { requestId, productId },
      UpdateExpression: 'SET processedImageUrls = list_append(if_not_exists(processedImageUrls, :emptyList), :newUrls)',
      ExpressionAttributeValues: {
        ':newUrls': compressedImageUrls,
        ':emptyList': [],
      },
    }).promise();
  } catch (error: any) {
    console.error('Error updating image URLs:', error);
    throw new Error(`Failed to update image URLs: ${error.message}`);
  }
};

// Get the status of the processing request
export const getProcessingStatus = async (requestId: string): Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
  try {
    return await dynamoDbClient.query({
      TableName: process.env.DYNAMODB_TABLE!,
      KeyConditionExpression: 'requestId = :requestId',
      ExpressionAttributeValues: { ':requestId': requestId },
    }).promise();
  } catch (error:any) {
    console.error('Error fetching processing status:', error);
    throw new Error(`Failed to get processing status: ${error.message}`);
  }
};
