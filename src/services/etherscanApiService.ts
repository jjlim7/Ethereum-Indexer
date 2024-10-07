import axios from "axios";
import config from "../config/config";
import { getEthPriceAtTime, getEthPriceAtTimeFromDb } from "./ethPriceService";
import { ITransaction, Transaction } from "../models/transactionModel"; // Import the Transaction model
import { sleep } from "../utils/sleep";

const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";
const BACKOFF_DELAY = 60000; // 60 seconds in milliseconds for rate limit backoff

// Function to fetch a single transaction fee
export const getTransactionFee = async (hash: string) => {
  // Query the MongoDB database for the transaction using the hash
  const transaction = await Transaction.findOne({
    hash: hash.toLowerCase(),
  }).exec();
  if (!transaction) return null;

  return transaction;
};

// Function to fetch historical transactions
export const getHistoricalTransactions = async (query: any): Promise<any> => {
  const { startblock, endblock, page, offset } = query;
  const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640&startblock=${startblock}&endblock=${endblock}&page=${page}&offset=${offset}&sort=asc&apiKey=${config.etherscanApiKey}`;

  try {
    const { data, status } = await axios.get(url);

    // Check if the API has returned a rate-limit status code (429)
    if (status === 429) {
      console.warn("Rate limit reached. Waiting before retrying...");
      await sleep(BACKOFF_DELAY); // Wait before retrying
      return getHistoricalTransactions(query); // Retry the request after the delay
    }

    if (status !== 200 || !data.result) {
      console.error(
        `Error fetching block ${startblock} from Etherscan... HTTP ${status}`
      );
      await sleep(BACKOFF_DELAY);
      return getHistoricalTransactions(query);
    }

    // Calculate transaction fee in USDT for each transaction
    const transactionsWithFees = await Promise.all(
      data.result.map(async (transaction: any) => {
        const timeStampInMilliseconds = Number(transaction.timeStamp) * 1000;
        const transactionFeeInETH =
          (transaction.gasUsed * transaction.gasPrice) / 1e18; // Convert Wei to ETH
        const ethToUsdtPrice = await getEthPriceAtTimeFromDb(
          timeStampInMilliseconds
        );
        const transactionFeeInUSDT = transactionFeeInETH * ethToUsdtPrice;

        // Add the computed transaction fee in USDT
        return {
          gasUsed: transaction.gasUsed,
          gasPrice: transaction.gasPrice,
          timeStamp: timeStampInMilliseconds, // Use milliseconds for the timestamp
          transactionFeeInUSDT: transactionFeeInUSDT,
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          blockNumber: transaction.blockNumber,
        } as ITransaction;
      })
    );

    return transactionsWithFees;
  } catch (error: any) {
    // Handle any other errors, including network issues
    if (error.response && error.response.status === 429) {
      console.warn("Rate limit reached (429). Waiting before retrying...");
      await sleep(BACKOFF_DELAY); // Wait before retrying in case of a rate limit
      return getHistoricalTransactions(query); // Retry the request after the delay
    }

    console.error("Error fetching transactions from Etherscan:", error);
    throw error;
  }
};
