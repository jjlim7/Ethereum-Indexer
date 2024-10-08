import axios from "axios";
import { EthPrice } from "../models/ethPriceModel";
import { formatDateForMongoDB } from "../utils/dateformatter";

// Function to fetch and save historical ETH prices
export const fetchAndSaveEthPriceHistory = async () => {
  let endTime = Date.now(); // Current time in milliseconds
  const yearsAgo = 10;
  let startTime = endTime - yearsAgo * 365 * 24 * 60 * 60 * 1000; // 4 years in milliseconds

  const startDatestr = formatDateForMongoDB(startTime);

  const minDate = await EthPrice.findOne().sort({ timeStamp: 1 });
  if (minDate) {
    endTime = new Date(minDate!.timeStamp).getTime();
  }

  if (startTime > endTime) {
    console.log(
      `Eth Price History from ${startDatestr} has already been indexed`
    );
    return;
  }

  while (startTime < endTime) {
    try {
      const request_params = {
        symbol: "ETHUSDT",
        interval: "1d",
        startTime: startTime,
      };

      const response = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        {
          params: request_params,
        }
      );

      const priceData = response.data;

      // Check if there's no more data
      if (priceData.length === 0) {
        break;
      }

      // Loop through price data and save each entry to MongoDB
      for (const entry of priceData) {
        const [openTime, open, high, low, close, volume, closeTime] = entry;

        let date = new Date(openTime);
        date.setHours(0, 0, 0, 0);

        const ethPriceDocument = new EthPrice({
          ethPriceInUSDT: parseFloat(close), // Use the close price
          timeStamp: date, // Use the open time for the timestamp
        });

        await ethPriceDocument.save().catch((err) => {
          if (err.code !== 11000) {
            // Ignore duplicate key errors (unique constraint)
            console.error("Error saving ETH price:", err);
          }
        });
      }

      console.log(
        `Fetched and saved ${priceData.length} records from ${new Date(
          startTime
        ).toISOString()}.`
      );

      // Update startTime to the last fetched record's open time
      startTime = priceData[priceData.length - 1][0] + 1;
    } catch (error) {
      console.error("Error fetching ETH price history:", error);
      throw error; // Rethrow the error for further handling
    }
  }
};

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

// Get Latest ETH Price
export const getEthPriceAtTime = async (startTime?: number) => {
  // If startTime is not specified, latest ETHUSDT price is retrieved
  if (startTime && new Date().getTime() > startTime) {
    startTime = Number(undefined);
  }

  let request_params = {
    symbol: "ETHUSDT",
    interval: "1d",
    ...(startTime ? { startTime } : {}),
  };

  try {
    const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
      params: request_params,
    });

    // extract the price
    const priceData = response.data;
    const idx = startTime ? 0 : priceData.length - 1; // get latest if starttime is not specified
    if (priceData.length > 0) {
      const closePrice = priceData[idx][4]; // Close price is at index 4
      return parseFloat(closePrice); // Return the price as a number
    } else {
      throw new Error("No price data available for the given time range.");
    }
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    throw error; // Rethrow the error for further handling
  }
};
