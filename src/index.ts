import app from "./app";
import { runBatchJob } from "./jobs/fetchHistoricalData";
import config from "./config/config";
import connectDB from "./config/database";
import { BlockIndexer } from "./services/blockIndexerService";
import { fetchAndSaveEthPriceHistory } from "./services/ethPriceService";

const startApp = async () => {
  try {
    await connectDB();

    // Fetch and save historical ETH prices
    await fetchAndSaveEthPriceHistory();

    // Start the batch job
    await runBatchJob();

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
