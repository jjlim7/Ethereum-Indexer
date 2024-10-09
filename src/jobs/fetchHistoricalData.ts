import axios from "axios";
import { sendToKafka } from "../kafka/producer";
import { EthPrice } from "../models/ethPriceModel";
import { getHistoricalTransactions } from "../services/etherscanApiService";
import {
  getLastProcessedBlock,
  updateLastProcessedBlock,
} from "../services/stateService";
import { formatDateForMongoDB } from "../utils/dateformatter";
import { sleep } from "../utils/sleep";

// batch processing job to fetch and process historical transactions
export const fetchHistoricalEthBlockData = async () => {
  const endBlock = 13328161; // Adjust range for how much historical data to index
  const pageSize = 1000; // Fetch 100 transactions per request

  let hasMoreData = true;

  try {
    // Get the last processed block from the state
    let lastProcessedBlock = await getLastProcessedBlock();
    if (lastProcessedBlock > 0) {
      lastProcessedBlock += 1;
    }

    let page = 1; // Initialize the page to start with

    while (hasMoreData) {
      console.log(
        `Fetching page ${page} of historical transactions from block ${lastProcessedBlock}...`
      );

      // Fetch historical transactions starting from the last processed block
      const transactions = await getHistoricalTransactions({
        startblock: lastProcessedBlock.toString(),
        endblock: endBlock.toString(),
        page: 1,
        offset: pageSize.toString(),
      });

      // Exit if there are no transactions returned
      if (transactions === null || transactions.length === 0) {
        hasMoreData = false;
        console.log("No more transactions to process.");
        break;
      }

      await sendToKafka(transactions);
      console.log(`Sent page ${page} of transactions to Kafka.`);

      // get highest block number in the current batch
      const highestBlock = Math.max(
        ...transactions.map((tx: { blockNumber: any }) =>
          Number(tx.blockNumber)
        )
      );

      // update last processed block with the highest block number from this batch
      await updateLastProcessedBlock(highestBlock);

      // update lastProcessedBlock for the next iteration
      lastProcessedBlock = highestBlock;

      // increment page for next iteration
      page += 1;

      await sleep(1000);
    }
    console.log("Batch job completed successfully.");
  } catch (error) {
    console.error("Error during batch job processing:", error);
  }
};

// Function to fetch and save historical ETH prices
export const fetchAndSaveEthPriceHistory = async () => {
  let endTime = Date.now(); // Current time in milliseconds
  const yearsAgo = 10;
  let startTime = endTime - yearsAgo * 365 * 24 * 60 * 60 * 1000; // 4 years in milliseconds

  const startDatestr = formatDateForMongoDB(startTime);

  const minDate = await EthPrice.findOne().sort({ timeStamp: 1 });
  if (minDate) {
    endTime = new Date(minDate!.timeStamp).getTime();
  }

  if (startTime > endTime) {
    console.log(
      `Eth Price History from ${startDatestr} has already been indexed`
    );
    return;
  }

  while (startTime < endTime) {
    try {
      const request_params = {
        symbol: "ETHUSDT",
        interval: "1d",
        startTime: startTime,
      };

      const response = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        {
          params: request_params,
        }
      );

      const priceData = response.data;

      // Check if there's no more data
      if (priceData.length === 0) {
        break;
      }

      // Loop through price data and save each entry to MongoDB
      for (const entry of priceData) {
        const [openTime, open, high, low, close, volume, closeTime] = entry;

        let date = new Date(openTime);
        date.setHours(0, 0, 0, 0);

        const ethPriceDocument = new EthPrice({
          ethPriceInUSDT: parseFloat(close), // Use the close price
          timeStamp: date, // Use the open time for the timestamp
        });

        await ethPriceDocument.save().catch((err) => {
          if (err.code !== 11000) {
            // Ignore duplicate key errors (unique constraint)
            console.error("Error saving ETH price:", err);
          }
        });
      }

      console.log(
        `Fetched and saved ${priceData.length} records from ${new Date(
          startTime
        ).toISOString()}.`
      );

      // Update startTime to the last fetched record's open time
      startTime = priceData[priceData.length - 1][0] + 1;
    } catch (error) {
      console.error("Error fetching ETH price history:", error);
      throw error; // Rethrow the error for further handling
    }
  }
};
