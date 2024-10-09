import axios from "axios";
import { EthPrice } from "../models/ethPriceModel";
import { formatDateForMongoDB } from "../utils/dateformatter";
import { EventEmitter, WebSocket } from "ws";

export const getEthPriceAtTimeFromDb = async (timeStamp: number) => {
  try {
    const datestr = formatDateForMongoDB(timeStamp);
    const ethPriceEntry = await EthPrice.findOne({ timeStamp: datestr });

    if (!ethPriceEntry) {
      console.error("ETH Price not found for ", datestr);
      return 0;
    }

    return ethPriceEntry.ethPriceInUSDT;
  } catch (error) {
    console.error("Error fetching ETH price from MongoDB:", error);
    throw error; // Rethrow the error for further handling
  }
};

class EthPriceWebSocket extends EventEmitter {
  private static instance: EthPriceWebSocket;
  private ws!: WebSocket;
  private latestPrice: number | null = null;

  private constructor() {
    super();
    this.connect();
  }

  // Method to get the singleton instance
  public static getInstance(): EthPriceWebSocket {
    if (!EthPriceWebSocket.instance) {
      EthPriceWebSocket.instance = new EthPriceWebSocket();
    }
    return EthPriceWebSocket.instance;
  }

  // Method to connect to the WebSocket
  private connect() {
    this.ws = new WebSocket("wss://ws-api.binance.com:443/ws-api/v3");

    this.ws.on("open", () => {
      console.log("Connected to Binance WebSocket.");
      this.sendPriceRequest(); // Send the request to get ETHUSDT price
    });

    this.ws.on("message", (data) => {
      const response = JSON.parse(data.toString());
      // Check for price updates in the response
      if (response.status === 200) {
        this.latestPrice = parseFloat(response.result.price);
      }
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.ws.on("close", () => {
      console.log("Disconnected from Binance WebSocket.");
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
    });
  }

  // Method to send the request for ETHUSDT price
  private sendPriceRequest() {
    const request = {
      id: "043a7cf2-bde3-4888-9604-c8ac41fcba4d",
      method: "ticker.price",
      params: {
        symbol: "ETHUSDT",
      },
    };
    this.ws.send(JSON.stringify(request));
  }

  // Method to get the latest price
  public async getLatestPrice(): Promise<number | null> {
    if (this.ws.readyState === WebSocket.OPEN) {
      await this.sendPriceRequest(); // Ensure price request is sent only if WebSocket is open
    } else {
      console.log("WebSocket is not connected, can't get latest price.");
    }
    return this.latestPrice;
  }
}

export const ethPriceWS = EthPriceWebSocket.getInstance();
