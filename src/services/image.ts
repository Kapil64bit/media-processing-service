import axios from 'axios';
import Sharp from 'sharp';
import AWS from 'aws-sdk'
import { updateImageUrls } from '../models/dynamo';

const S3 = new AWS.S3();

// Process and compress the image
export const processImage = async (eventBody:any): Promise<void> => {
  try {
    console.log('entered processImage function')
    const bucket = process.env.S3_BUCKET!;
    eventBody.rowsJson.forEach((item:any) =>{
    const productId = item.productId
    const requestId = eventBody.requestId
      const compressedImageUrls:string[] = [];
      console.log('here-----------',item)
    const imageUrls = item['Input Image Urls'].split(',').map((el:string)=> el.trim())
    console.log('there-----------')
    imageUrls.forEach(async (val:string)=>{
        
       
    // Step 1: Download image from the URL
    const response = await axios({
      url: val,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    // Step 2: Compress the image using Sharp
    const compressedImage = await Sharp(response.data)
      .resize({ width: 800 })  // Resize width to 800px
      .jpeg({ quality: 50 })   // Compress to 50% quality
      .toBuffer();

    // Step 3: Upload the compressed image to S3
    const compressedImageKey = `${requestId}/${productId}/${Date.now()}.jpg`;
   const s3Object= await S3.putObject({
      Bucket: bucket,
      Key: compressedImageKey,
      Body: compressedImage,
      ContentType: 'image/jpeg'
    }).promise();

    if(!s3Object){
      throw new Error('unable to upload to S3 due to some error')
    }

    console.log('this is s3 object response',s3Object);

    // Step 4: Update the compressed image URL in DynamoDB
    const compressedImageUrl = `https://${bucket}.s3.amazonaws.com/${compressedImageKey}`;
    compressedImageUrls.push(compressedImageUrl)
    console.log('----------end')
    await updateImageUrls(requestId, productId, compressedImageUrls);

    })
    })
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
