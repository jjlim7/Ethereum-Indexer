import { BlockIndexer } from "../src/services/blockIndexerService";
import Web3 from "web3";
import { ethPriceWS } from "../src/services/ethPriceService"; // Import the ethPriceWS instance
import { Transaction } from "../src/models/transactionModel"; // Assuming you have a Transaction model
import config from "../src/config/config";

jest.mock("web3");
jest.mock("../src/services/ethPriceService");
jest.mock("../src/models/transactionModel");

describe("BlockIndexer", () => {
  let blockIndexer: BlockIndexer;
  let mockProvider: any;
  let mockSubscribe: jest.Mock;
  let mockTransactionSave: jest.Mock;

  beforeEach(() => {
    mockProvider = {
      on: jest.fn(),
    };
    (Web3.providers.WebsocketProvider as jest.Mock).mockImplementation(
      () => mockProvider
    );
    mockSubscribe = jest.fn().mockReturnValue({
      on: jest.fn((event: string, callback: Function) => {
        if (event === "data") {
          callback({ transactionHash: "0x123" }); // Simulate new block data
        }
      }),
    });
    (Web3 as any).mockImplementation(() => ({
      eth: {
        subscribe: mockSubscribe,
      },
    }));

    mockTransactionSave = jest.fn();
    (Transaction.prototype.save as jest.Mock) = mockTransactionSave;

    blockIndexer = new BlockIndexer();
  });

  afterEach(async () => {
    await blockIndexer.stop();

    jest.clearAllMocks();
  });

  it("should start the block indexer and connect to websocket", async () => {
    const connectCallback = jest.fn();
    mockProvider.on.mockImplementation((event: string, callback: Function) => {
      if (event === "connect") {
        connectCallback();
        callback(); // Simulate the connect event
      }
    });

    await blockIndexer.start();

    expect(connectCallback).toHaveBeenCalled();
    expect(mockProvider.on).toHaveBeenCalledWith(
      "connect",
      expect.any(Function)
    );
  });

  it("should subscribe to new blocks", async () => {
    await blockIndexer.start();

    expect(mockSubscribe).toHaveBeenCalledWith("logs", {
      address: config.targetAddress,
    });
    expect(mockSubscribe().on).toHaveBeenCalledWith(
      "data",
      expect.any(Function)
    );
  });

  it("should process a block and save the transaction", async () => {
    const mockTransaction = {
      hash: "0x123",
      gasPrice: "20000000000",
      blockNumber: 1,
    };
    const mockReceipt = {
      gasUsed: 21000,
      logs: [
        {
          address: config.targetAddress,
          transactionHash: "0x123",
          blockNumber: 1,
          topics: [],
          data: "0x",
        },
      ],
    };
    const mockBlock = { timestamp: "1633072800" }; // Example timestamp
    const mockLatestPrice = 3500; // Mock ETH to USDT price

    // Mock web3.eth methods
    (blockIndexer as any).web3.eth.getTransaction = jest
      .fn()
      .mockResolvedValue(mockTransaction);
    (blockIndexer as any).web3.eth.getTransactionReceipt = jest
      .fn()
      .mockResolvedValue(mockReceipt);
    (blockIndexer as any).web3.eth.getBlock = jest
      .fn()
      .mockResolvedValue(mockBlock);

    // Mock ethPriceWS method
    (ethPriceWS.getLatestPrice as jest.Mock).mockResolvedValue(mockLatestPrice);

    // Mock decodeTxLog method
    const mockSwapData = {
      sender: "0xSenderAddress",
      amount0: 100,
      amount1: 200,
      sqrtPriceX96: 300,
      liquidity: 400,
      tick: 500,
    };
    const decodeTxLogSpy = jest
      .spyOn(blockIndexer as any, "decodeTxLog")
      .mockReturnValue(mockSwapData);

    // Mock save method on Transaction model
    mockTransactionSave.mockResolvedValue(undefined);

    await blockIndexer.processBlock("0x123");

    expect(blockIndexer.getWeb3().eth.getTransaction).toHaveBeenCalledWith(
      "0x123"
    );
    expect(
      blockIndexer.getWeb3().eth.getTransactionReceipt
    ).toHaveBeenCalledWith("0x123");
    expect(blockIndexer.getWeb3().eth.getBlock).toHaveBeenCalledWith(1);
    expect(ethPriceWS.getLatestPrice).toHaveBeenCalled();

    // Verify that decodeTxLog was called
    expect(decodeTxLogSpy).toHaveBeenCalledWith(mockReceipt.logs[0]); // Check if decodeTxLog was called with the log
    expect(decodeTxLogSpy).toHaveBeenCalled();

    // Verify transaction.save is called
    expect(mockTransactionSave).toHaveBeenCalled();
  });
});
