import Web3 from "web3";
import config from "../config/config";
import { Transaction } from "../models/transactionModel";
import { ethPriceWS } from "./ethPriceService";

interface IUniswapAbi {
  sender: string;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: bigint;
}

export class BlockIndexer {
  private web3: Web3;
  private provider: any;

  constructor() {
    this.provider = new Web3.providers.WebsocketProvider(config.web3Provider);
    this.web3 = new Web3(this.provider);
  }

  public getWeb3() {
    return this.web3;
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
      this.processBlock(data.transactionHash!);
    });
  }

  public async stop() {
    await this.web3.currentProvider?.disconnect();
    await ethPriceWS.disconnect();
  }

  public async processBlock(txHash: string) {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      const block = await this.web3.eth.getBlock(tx.blockNumber);

      const ethToUsdtPrice = await ethPriceWS.getLatestPrice();
      const transactionFeeInETH =
        (Number(receipt.gasUsed) * Number(tx.gasPrice)) / 1e18; // Convert Wei to ETH
      const transactionFeeInUSDT = transactionFeeInETH * ethToUsdtPrice!;

      const contractAddress = config.targetAddress;

      for (const txlog of receipt.logs) {
        if (txlog.address!.toLowerCase() != contractAddress.toLowerCase()) {
          continue;
        }

        // Get uniswap event object
        const swapData = this.decodeTxLog(txlog);

        const transaction = new Transaction({
          hash: txlog.transactionHash,
          blockNumber: txlog.blockNumber,
          from: swapData.sender,
          to: contractAddress,
          gasUsed: receipt.gasUsed,
          gasPrice: tx.gasPrice,
          value: swapData.amount0,
          timeStamp: new Date(Number(block.timestamp) * 1000),
          transactionFeeInUSDT: transactionFeeInUSDT,
        });

        console.log(transaction);

        await transaction.save();

        console.log(`Saved transaction ${tx.hash}`);
      }
    } catch (error) {
      console.error(`Error processing txHash ${txHash}:`, error);
    }
  }

  private decodeTxLog(txlog: any) {
    // Decode ABI-encoded log data and indexed topic data to get Uniswap event value
    const topics = txlog.topics!;
    const inputs = [
      {
        type: "address",
        name: "sender",
        indexed: true,
      },
      {
        type: "address",
        name: "recipient",
        indexed: true,
      },
      {
        type: "int256",
        name: "amount0",
      },
      {
        type: "int256",
        name: "amount1",
      },
      {
        type: "uint160",
        name: "sqrtPriceX96",
      },
      {
        type: "uint128",
        name: "liquidity",
      },
      {
        type: "int24",
        name: "tick",
      },
    ];

    const decodedAbi = this.web3.eth.abi.decodeLog(inputs, txlog.data!, topics);

    const swapData: IUniswapAbi = {
      sender: decodedAbi["sender"] as string, // Address
      amount0: decodedAbi["amount0"] as bigint, // Convert int256 to string
      amount1: decodedAbi["amount1"] as bigint, // Convert int256 to string
      sqrtPriceX96: decodedAbi["sqrtPriceX96"] as bigint, // Convert uint160 to string
      liquidity: decodedAbi["liquidity"] as bigint, // Convert uint128 to string
      tick: decodedAbi["tick"] as bigint,
    };

    return swapData;
  }
}
