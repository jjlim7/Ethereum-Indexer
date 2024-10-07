import { Request, Response } from "express";
import {
  getTransactionFee,
  getHistoricalTransactions,
} from "../services/etherscanApiService";

export const getTransactionByHash = async (req: Request, res: Response) => {
  const { hash } = req.params;
  try {
    const transaction = await getTransactionFee(hash);
    if (!transaction) {
      res.status(404).json({ message: "Transaction not found." });
      return;
    }
    res.json(transaction);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error.", error });
    return;
  }
};

export const getHistoricalTxns = async (req: Request, res: Response) => {
  const { startblock, endblock, page, offset } = req.query;
  try {
    const transactions = await getHistoricalTransactions({
      startblock: startblock?.toString(),
      endblock: endblock?.toString(),
      page: page?.toString(),
      offset: offset?.toString(),
    });
    if (!transactions) {
      res.status(404).json({ message: "Historical Transactions not found." });
      return;
    }
    res.json(transactions);
    return;
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
    return;
  }
};
