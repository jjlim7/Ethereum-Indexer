import { kafka } from "../config/kafkaConfig";

const producer = kafka.producer();

export const sendToKafka = async (transactions: any) => {
  await producer.connect();
  try {
    // Batch transactions into smaller chunks (e.g., batches of 100)
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      // Send each batch to Kafka
      await producer.send({
        topic: "transaction-data",
        messages: batch.map((tx: { hash: any }) => ({
          key: tx.hash,
          value: JSON.stringify(tx),
        })),
      });

      console.log(`Sent batch of ${batch.length} transactions to Kafka.`);
    }
    console.log("Transaction data sent to Kafka successfully.");
  } catch (error) {
    console.error("Error sending data to Kafka:", error);
  } finally {
    await producer.disconnect();
  }
};