import { timeStamp } from "console";
import { Transaction } from "../models/transactionModel";

// Function to fetch a single transaction fee
export const fetchTransactionByHash = async (hash: string) => {
  // Query the MongoDB database for the transaction using the hash
  const transactions = await Transaction.find({
    hash: hash.toLowerCase(),
  });

  return transactions || null;
};

// Function to fetch the first 500 transactions sorted by date
export const getRecentTransactions = async (limit: number) => {
  return await Transaction.find().sort({ timeStamp: -1 }).limit(limit);
};
