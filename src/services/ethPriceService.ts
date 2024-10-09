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
  private connectionPromise!: Promise<void>; // Promise to track connection status
  private isDisconnecting: boolean = false;

  private constructor() {
    super();
    this.connectionPromise = this.connect();
  }

  // Method to get the singleton instance
  public static getInstance(): EthPriceWebSocket {
    if (!EthPriceWebSocket.instance) {
      EthPriceWebSocket.instance = new EthPriceWebSocket();
    }
    return EthPriceWebSocket.instance;
  }

  // Method to connect to the WebSocket
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket("wss://ws-api.binance.com:443/ws-api/v3");

      this.ws.on("open", () => {
        console.log("Connected to Binance WebSocket.");
        this.sendPriceRequest(); // Send the request to get ETHUSDT price
        resolve(); // Resolve the promise when connected
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
        reject(error); // Reject the promise on error
      });

      this.ws.on("close", () => {
        if (!this.isDisconnecting) {
          console.log("Disconnected from Binance WebSocket. Reconnecting...");
          // Attempt to reconnect after a delay only if not intentionally disconnected
          setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
        }
      });
    });
  }

  public disconnect() {
    this.isDisconnecting = true;
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      console.log("Disconnected from Binance WebSocket.");
    } else {
      console.log("WebSocket is not connected, cannot disconnect.");
    }
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
    await this.connectionPromise; // Wait for the WebSocket to be connected
    if (this.ws.readyState === WebSocket.OPEN) {
      await this.sendPriceRequest();
      return await this.waitForLatestPrice();
    } else {
      console.log("WebSocket is not connected, can't get latest price.");
      return null;
    }
  }

  // Method to wait for the latest price to be set
  private waitForLatestPrice(): Promise<number | null> {
    return new Promise((resolve) => {
      const checkPrice = () => {
        if (this.latestPrice !== null) {
          resolve(this.latestPrice); // Resolve with the latest price
        } else {
          setTimeout(checkPrice, 100); // Check again after a short delay
        }
      };
      checkPrice(); // Start checking for the latest price
    });
  }
}

export const ethPriceWS = EthPriceWebSocket.getInstance();
