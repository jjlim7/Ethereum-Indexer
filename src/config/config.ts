import dotenv from 'dotenv';

dotenv.config();

export default {
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/transactions',
  port: process.env.PORT || 5000,
};
