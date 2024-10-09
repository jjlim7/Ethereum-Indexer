import dotenv from "dotenv";

dotenv.config();

export default {
  etherscanApiKey: process.env.ETHERSCAN_API_KEY!,
  mongoUri: process.env.MONGO_URI!,
  web3Provider: process.env.INFURA_MAINNET_WS!,
  targetAddress: process.env.TARGET_ADDRESS!,
  kafkaBrokers: process.env.KAFKA_BROKERS!.split(","),
  port: process.env.PORT || 3000,
};
