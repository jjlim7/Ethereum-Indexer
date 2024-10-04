import app from './app';
import mongoose from 'mongoose';
import { runBatchJob } from './jobs/etherscanBatchJob';
import config from './config/config';
import connectDB from './config/database';

const startApp = async () => {
  await connectDB();

  // Start the batch job
  await runBatchJob();
};

startApp();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
