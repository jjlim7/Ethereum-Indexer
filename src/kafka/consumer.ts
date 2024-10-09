import config from "../config/config";
import connectDB from "../config/database";
import { kafka } from "../config/kafkaConfig";
import { indexTransactionData } from "../utils/indexer";

console.log("Consumer starting...");
console.log("Kafka brokers:", config.kafkaBrokers);

const consumer = kafka.consumer({ groupId: "transaction-group" });
console.log("Kafka client created");

export const consumeFromKafka = async () => {
  // Connect to MongoDB
  await connectDB();

  console.log("Connecting to consumer...");
  await consumer.connect();
  console.log("Consumer connected");

  console.log("Subscribing to topic...");
  await consumer.subscribe({ topic: "transaction-data", fromBeginning: true });
  console.log("Subscribed to topic");

  await consumer.run({
    eachBatch: async ({ batch }) => {
      let transactionData = [];
      for (let message of batch.messages) {
        const tx = JSON.parse(message.value!.toString());
        transactionData.push(tx);
      }
      await indexTransactionData(transactionData);
    },
  });

  console.log("Consumer running");
};
