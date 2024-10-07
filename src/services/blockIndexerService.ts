import Web3 from "web3";
import { Transaction } from "../models/transactionModel";
import config from "../config/config";
import { getEthPriceAtTime } from "./ethPriceService";

export class BlockIndexer {
  private web3: Web3;
  private provider: any;

  constructor() {
    this.provider = new Web3.providers.WebsocketProvider(config.web3Provider);
    this.web3 = new Web3(this.provider);
  }

  public async start() {
    console.log("Starting block indexer...");
    this.provider.on("connect", () => {
      console.log("Websocket connected.");
    });

    this.subscribeToNewBlocks();
  }

  private async subscribeToNewBlocks() {
    const subscription = await this.web3.eth.subscribe("logs", {
      address: config.targetAddress,
    });

    subscription.on("data", async (data) => {
      this.processBlock(data.blockNumber!, data.transactionHash!);
    });
  }

  private async processBlock(blockNumber: any, txHash: string) {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      const block = await this.web3.eth.getBlock(tx.blockNumber);
      const ethToUsdtPrice = await getEthPriceAtTime();

      if (!tx.blockNumber) {
        return;
      }

      const transactionFeeInETH =
        (Number(receipt.gasUsed) * Number(tx.gasPrice)) / 1e18; // Convert Wei to ETH
      const transactionFeeInUSDT = transactionFeeInETH * ethToUsdtPrice;

      const transaction = new Transaction({
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        gasUsed: receipt.gasUsed,
        gasPrice: tx.gasPrice,
        timeStamp: new Date(Number(block.timestamp) * 1000),
        transactionFeeInUSDT: transactionFeeInUSDT,
      });

      console.log(transaction);

      await transaction.save();

      console.log(`Saved transaction ${tx.hash}`);
    } catch (error) {
      console.error(`Error processing blockNumber ${blockNumber}:`, error);
    }
  }
}
