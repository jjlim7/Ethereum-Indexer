import { Router } from "express";
import {
  getTransactionByHash,
  getTransactions,
} from "../controllers/transactionController";

const router = Router();

// Route to get transaction by hash
router.get("/transaction/:hash", getTransactionByHash);

// Route to get recent transactions
router.get("/transactions", getTransactions);

export default router;
