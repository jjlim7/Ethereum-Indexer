import { Transaction } from "../models/transactionModel";
import { sleep } from "./sleep";

// Index the transaction data into MongoDB
export const indexTransactionData = async (
  transactions: any[],
  batchSize = 1000
) => {
  try {
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      const bulkOps = batch.map((txn) => ({
        updateOne: {
          filter: { hash: txn.hash }, // Use the transaction hash as the unique identifier
          update: { $set: txn }, // Update fields or insert if doesn't exist
          upsert: true, // Create new document if one doesn't exist
        },
      }));

      // Perform bulkWrite with the generated operations
      const result = await Transaction.bulkWrite(bulkOps);
      console.log(
        `${result.modifiedCount} transactions upserted in this batch.`
      );

      await sleep(500); // 500 milliseconds delay
    }
  } catch (error) {
    console.error("Error indexing transactions:", error);
    throw error;
  }
};
