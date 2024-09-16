"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const image_1 = __importDefault(require("./routes/image"));
require('dotenv').config();
require("./config/awsConfig");
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_1 = require("./config/swagger");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use((req, res, next) => {
    req.headers['bypass-tunnel-reminder'] = 'bypass';
    next();
});
app.use('/api-docs', swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.swaggerSpec, swagger_1.swaggerUiOptions));
app.use('/', image_1.default);
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.log('Shutting down gracefully...');
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('Shutting down gracefully...');
    process.exit(1);
});
