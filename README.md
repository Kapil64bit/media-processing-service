Description:

This Node.js-based application provides an image processing service that allows users to upload images, compress them, and retrieve the processed images. It leverages AWS Lambda for serverless execution and DynamoDB for data storage.

Prerequisites:

Node.js and npm (or yarn) installed
AWS account and credentials configured (e.g., using environment variables)
DynamoDB table created with appropriate schema
Installation:

Clone the repository:

git clone https://github.com/your-username/media-processing-service.git
Use code with caution.

Install dependencies:

cd media-processing-service
npm install

Configure AWS credentials: Create a .env file in the project root with the following variables:
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_region
Create DynamoDB table: Create a DynamoDB table named image_processing with the following schema:
request_id (partition key): String
product_name: String
input_url: String
output_url: String
status: String (e.g., "pending", "processing", "completed")

Usage:
Deploy the application to AWS Lambda (refer to AWS documentation for deployment instructions).
Use the provided API endpoints to upload images and check processing status.
