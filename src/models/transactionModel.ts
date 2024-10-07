import mongoose from "mongoose";

// Define the new structure for mapped transactions
export interface ITransaction {
  gasUsed: bigint;
  gasPrice: bigint;
  timeStamp: number; // Changed from string to number to represent milliseconds
  transactionFeeInUSDT: number;
  hash: string;
  from: string;
  to: string;
  blockNumber: bigint;
}

const transactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  blockNumber: { type: BigInt, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  gasUsed: { type: BigInt, required: true },
  gasPrice: { type: BigInt, required: true },
  transactionFeeInUSDT: { type: Number },
  timeStamp: { type: Date, required: true },
});

export const Transaction = mongoose.model("Transaction", transactionSchema);
