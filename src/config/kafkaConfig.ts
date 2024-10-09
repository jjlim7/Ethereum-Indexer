import config from "./config";
import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "etherscan-app",
  brokers: config.kafkaBrokers,
});
