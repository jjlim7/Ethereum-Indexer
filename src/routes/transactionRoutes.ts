import { Router } from 'express';
import { getTransactionByHash, getHistoricalTxns } from '../controllers/transactionController';

const router = Router();

// Route to get transaction by hash
router.get('/transaction/:hash', getTransactionByHash);

// Route to get historical transactions
router.get('/transactions', getHistoricalTxns);

export default router;
