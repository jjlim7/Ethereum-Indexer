import { Transaction } from '../models/transactionModel';

// Index the transaction data into MongoDB
export const indexTransactionData = async (transactions: any[]) => {
  try {
    const transactionModels = transactions.map((txn) => new Transaction(txn));

    const bulkOps = transactions.map((txn) => ({
      updateOne: {
        filter: { hash: txn.hash }, // Use the transaction hash as the unique identifier
        update: { $set: txn }, // Update fields or insert if doesn't exist
        upsert: true, // Create new document if one doesn't exist
      },
    }));

    // Perform bulkWrite with the generated operations
    const result = await Transaction.bulkWrite(bulkOps);

    console.log(`${result.modifiedCount} transactions upserted.`);
  } catch (error) {
    console.error('Error indexing transactions:', error);
    throw error;
  }
};
