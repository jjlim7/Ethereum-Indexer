import axios from 'axios';
import config from '../config/config';
import { getEthPriceAtTime } from './priceService';
import { Transaction } from '../models/transactionModel'; // Import the Transaction model

const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

// Function to fetch a single transaction fee
export const getTransactionFee = async (hash: string) => {
  // Query the MongoDB database for the transaction using the hash
  const transaction = await Transaction.findOne({ hash: hash.toLowerCase() }).exec();
  if (!transaction) return null;

  return transaction;
};

// Function to fetch historical transactions
export const getHistoricalTransactions = async (query: any) => {
  const { startblock, endblock, page, offset } = query;
  const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640&startblock=${startblock}&endblock=${endblock}&page=${page}&offset=${offset}&sort=desc&apiKey=${config.etherscanApiKey}`;

  try {
    const { data, status } = await axios.get(url);
    if (status !== 200) {
      console.error('Error fetching data from Etherscan:', data.result);
      return null;
    }

    // Calculate transaction fee in USDT for each transaction
    const transactionsWithFees = await Promise.all(
      data.result.map(async (transaction: { gasUsed: number; gasPrice: number; timeStamp: string; }) => {
        const transactionFeeInETH = transaction.gasUsed * transaction.gasPrice / 1e18; // Convert Wei to ETH
        const ethToUsdtPrice = await getEthPriceAtTime(transaction.timeStamp);
        const transactionFeeInUSDT = transactionFeeInETH * ethToUsdtPrice;

        // Add the computed transaction fee in USDT
        return {
          ...transaction,
          transactionFeeInUSDT,
        };
      })
    );

    return transactionsWithFees;
  } catch (error) {
    console.error('Error fetching transactions from Etherscan:', error);
    throw error;
  }
};
