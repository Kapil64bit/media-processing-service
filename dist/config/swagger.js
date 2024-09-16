"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUiOptions = exports.swaggerSpec = exports.swaggerUi = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
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
const options = {
    swaggerDefinition,
    apis: apiPaths,
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;
// Define Swagger UI options
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Image Processing API Docs',
};
exports.swaggerUiOptions = swaggerUiOptions;
