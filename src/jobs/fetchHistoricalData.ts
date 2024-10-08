import { sendToKafka } from "../kafka/producer";
import { getHistoricalTransactions } from "../services/etherscanApiService";
import {
  getLastProcessedBlock,
  updateLastProcessedBlock,
} from "../services/stateService";
import { indexTransactionData } from "../utils/indexer";
import { sleep } from "../utils/sleep";

// batch processing job to fetch and process historical transactions
export const runBatchJob = async () => {
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
