import { Request, Response } from "express";
import JSONBig from "json-bigint";
import {
  fetchTransactionByHash,
  getRecentTransactions,
} from "../services/transactionService";

export const getTransactionByHash = async (req: Request, res: Response) => {
  const { hash } = req.params;
  try {
    const transactions = await fetchTransactionByHash(hash);
    if (!transactions) {
      res.status(404).json({ message: "Transaction not found." });
      return;
    }
    const serializedTransactions = JSON.parse(
      JSON.stringify(transactions, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    res.json(serializedTransactions);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error.", error });
    return;
  }
};

// Fetch the first 100 transactions sorted by date
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await getRecentTransactions(500); // Fetch the first 500 transactions
    if (!transactions || transactions.length === 0) {
      res.status(404).json({ message: "No transactions found." });
      return;
    }
    const serializedTransactions = JSON.parse(
      JSON.stringify(transactions, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    res.json(serializedTransactions);
    return;
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
    return;
  }
};
