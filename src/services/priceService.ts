import axios from 'axios'; // Ensure axios is installed and imported

// Implement API call to Binance SPOT API
export const getEthPriceAtTime = async (timestamp: string) => {
    const startTime = Number(timestamp);

    try {
        const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
            params: {
                symbol: 'ETHUSDT',
                interval: '1d',
                startTime: startTime,
            },
        });

        // extract the price
        const priceData = response.data;
        if (priceData.length > 0) {
            const closePrice = priceData[0][4]; // Close price is at index 4
            return parseFloat(closePrice); // Return the price as a number
        } else {
            throw new Error('No price data available for the given time range.');
        }
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        throw error; // Rethrow the error for further handling
    }
};
