// tests/EthPriceService.test.ts
import axios from "axios";
import {
  getEthPriceAtTimeFromDb,
  ethPriceWS,
} from "../src/services/ethPriceService";
import { EthPrice } from "../src/models/ethPriceModel";
import mongoose from "mongoose";
import connectDB from "../src/config/database";

// Mock the EthPrice model
jest.mock("../src/models/EthPriceModel", () => ({
  EthPrice: {
    findOne: jest.fn(),
    save: jest.fn(),
  },
}));

// Mock axios
jest.mock("axios");

describe("getEthPriceAtTimeFromDb", () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB instance
    await connectDB();
  });

  afterAll(async () => {
    // Disconnect from the database after tests
    await mongoose.connection.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return existing ETH price from MongoDB", async () => {
    const mockPrice = {
      ethPriceInUSDT: 3000,
      timeStamp: new Date("2023-10-01").getTime(),
    };
    (EthPrice.findOne as jest.Mock).mockResolvedValueOnce(mockPrice);

    const price = await getEthPriceAtTimeFromDb(mockPrice.timeStamp);

    expect(price).toBe(mockPrice.ethPriceInUSDT);
  });
});

// New test suite for EthPriceWebSocket
describe("EthPriceWebSocket", () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB instance
    await connectDB();
  });

  afterAll(async () => {
    // Disconnect from the database after tests
    await mongoose.connection.close();
    await ethPriceWS.disconnect();
  });

  it("should connect to WebSocket and fetch latest ETH price", async () => {
    const latestPrice = await ethPriceWS.getLatestPrice();
    expect(latestPrice).toBeGreaterThan(0); // Assuming the price should be a positive number
  });

  // it("should handle WebSocket errors gracefully", async () => {
  //   // Simulate a WebSocket error
  //   const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  //   ethPriceWS.emit("error", new Error("WebSocket error"));
  //   expect(consoleErrorSpy).toHaveBeenCalledWith(
  //     "WebSocket error:",
  //     expect.any(Error)
  //   );
  //   consoleErrorSpy.mockRestore();
  // });
});
