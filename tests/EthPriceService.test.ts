// tests/EthPriceService.test.ts
import axios from "axios";
import {
  getEthPriceAtTime,
  getEthPriceAtTimeFromDb,
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

describe("getEthPriceAtTime", () => {
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

  it("should fetch and save new ETH price if not in MongoDB", async () => {
    const startTime = new Date("2023-10-01").getTime();

    // Mock the API response
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: [
        [startTime, null, null, null, "3500", null, null, null, null, null], // Mocking price data format
      ],
    });

    (EthPrice.findOne as jest.Mock).mockResolvedValueOnce(null); // Simulate not found

    const price = await getEthPriceAtTime(startTime);

    expect(price).toBe(3500);
  });

  it("should handle error when fetching price from API", async () => {
    const startTime = new Date("2023-10-01").getTime();

    (EthPrice.findOne as jest.Mock).mockResolvedValueOnce(null); // Simulate not found

    // Mock axios to throw an error
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    await expect(getEthPriceAtTime(startTime)).rejects.toThrow("API error");
  });
});
