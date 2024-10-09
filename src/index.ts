import app from "./app";
import {
  fetchAndSaveEthPriceHistory,
  fetchHistoricalEthBlockData,
} from "./jobs/fetchHistoricalData";
import config from "./config/config";
import connectDB from "./config/database";
import { BlockIndexer } from "./services/blockIndexerService";
import { connectKafkaProducer } from "./kafka/producer";

const startApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Kafka producer
    await connectKafkaProducer();

    // Fetch and save historical ETH prices
    await fetchAndSaveEthPriceHistory();

    // Start batch processing for historical ETH data from Etherscan
    await fetchHistoricalEthBlockData();

    // Start block indexer via Web3js
    const blockIndexer = new BlockIndexer();
    await blockIndexer.start();
  } catch (error) {
    console.error("Error starting the application:", error);
    process.exit(1);
  }
};

startApp();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
