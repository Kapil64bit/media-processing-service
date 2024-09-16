"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dynamo_1 = require("../models/dynamo");
const S3 = new aws_sdk_1.default.S3();
// Process and compress the image
const processImage = async (eventBody) => {
    try {
        console.log('entered processImage function');
        const bucket = process.env.S3_BUCKET;
        for (const item of eventBody.rowsJson) {
            const productId = item.productId;
            const requestId = eventBody.requestId;
            const compressedImageUrls = [];
            console.log('here-----------', item);
            const imageUrls = item['Input Image Urls'].split(',').map((el) => el.trim());
            console.log('there-----------');
            for (const val of imageUrls) {
                // Step 1: Download image from the URL
                const response = await (0, axios_1.default)({
                    url: val,
                    method: 'GET',
                    responseType: 'arraybuffer',
                });
                // Step 2: Compress the image using Sharp
                const compressedImage = await (0, sharp_1.default)(response.data)
                    .resize({ width: 800 }) // Resize width to 800px
                    .jpeg({ quality: 50 }) // Compress to 50% quality
                    .toBuffer();
                // Step 3: Upload the compressed image to S3
                const compressedImageKey = `${requestId}/${productId}/${Date.now()}.jpg`;
                const s3Object = await S3.putObject({
                    Bucket: bucket,
                    Key: compressedImageKey,
                    Body: compressedImage,
                    ContentType: 'image/jpeg'
                }).promise();
                if (!s3Object) {
                    throw new Error('unable to upload to S3 due to some error');
                }
                console.log('this is s3 object response', s3Object);
                // Step 4: Update the compressed image URL in DynamoDB
                const compressedImageUrl = `https://${bucket}.s3.amazonaws.com/${compressedImageKey}`;
                compressedImageUrls.push(compressedImageUrl);
            }
            await (0, dynamo_1.updateImageUrls)(requestId, productId, compressedImageUrls);
            console.log('----------end');
        }
        console.log('after try bllck');
    }
    catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};
exports.processImage = processImage;
