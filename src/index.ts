import express from 'express';
import router from './routes/image';
require('dotenv').config();
import './config/awsConfig';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  req.headers['bypass-tunnel-reminder'] = 'bypass';
  next();
});


app.use('/',router)

app.listen(3000, () => {
  console.log('Server running on port 3000');
})

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