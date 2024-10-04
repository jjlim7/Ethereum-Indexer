import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  blockNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  gasUsed: { type: String, required: true },
  gasPrice: { type: String, required: true },
  transactionFeeInUSDT: { type: Number },
  timeStamp: { type: Date, required: true },
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
