import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi, { SwaggerUiOptions } from 'swagger-ui-express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Image Processing API',
    version: '1.0.0',
    description: 'API documentation for the image processing application.',
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
      description: 'API server',
    },
  ],
};

// Determine environment and set API docs path
const isProduction = process.env.NODE_ENV === 'production';
const apiPaths = isProduction
  ? ['./dist/routes/*.js'] // Path to compiled JS files in production
  : ['./src/routes/*.ts']; // Path to TypeScript files in development

const options: Options = {
  swaggerDefinition,
  apis: apiPaths,
};

const swaggerSpec = swaggerJsdoc(options);

// Define Swagger UI options
const swaggerUiOptions: SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Image Processing API Docs',
};

export { swaggerUi, swaggerSpec, swaggerUiOptions };
