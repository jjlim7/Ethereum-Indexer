import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "etherscan-app",
  brokers: ["localhost:9092"],
});
