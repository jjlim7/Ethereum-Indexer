import connectDB from "../config/database";
import { kafka } from "../config/kafkaConfig";
import { indexTransactionData } from "../utils/indexer";

const consumer = kafka.consumer({ groupId: "transaction-group" });

export const consumeFromKafka = async () => {
  // Connect to MongoDB
  await connectDB();

  await consumer.connect();
  await consumer.subscribe({ topic: "transaction-data", fromBeginning: true });

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
};
