# Ethereum Indexer

## Table of Contents
1. [Overview](#overview)
2. [Environment Variables](#setup-environment-variables)
3. [Running the Application](#running-the-application)
   - [Using Docker](#using-docker)
   - [Testing REST API Interface via Swagger UI](#testing-rest-api-interface-via-swagger-ui)
4. [Architectural Considerations](#architectural-considerations)

## Overview
The backend system is built to keep track of all the transactions involved in the Uniswap V3 USDC/ETH pool. The system supports both real-time and historical batch data processing via Etherscan API, Web3.js, and Binance API (for ETH/USDT price)

> [!NOTE]
> For more information on the architectural considerations, please refer to [here](#architectural-considerations)

## Setup Environment Variables
Make sure to create a .env file in the root directory of the project with the following variables:
```
MONGO_URI=
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=

ETHERSCAN_API_KEY=
INFURA_MAINNET_WS=
TARGET_ADDRESS=
KAFKA_BROKERS=
```

## Running the Application

### Using Docker

1. Build and start the application along with its dependencies (MongoDB, Kafka, and Zookeeper), run:

```sh
docker-compose up --build -d
```

2. To check logs for each component
```sh
docker-compose logs -f node-app
docker-compose logs -f consumer-app
```

3. Run Test
```sh
docker compose run node-app npm run test -- BlockIndexerService.test.ts --forceExit
docker compose run node-app npm run test -- EthPriceService.test.ts 
```

### Testing REST API Interface via Swagger UI

Once the application is running, you can navigate to Swagger UI to execute APIs by visiting:
```
http://localhost:3000/api-docs
```

## Architectural Considerations

![alt text](screenshots/architecture.png)
**1. Event-Driven Architecture: Asynchronous Processing using Kafka**
   - Consideration: Event-driven architecture provides high decoupling between services, allowing the system to handle high transaction volumes efficiently with each component operating asynchronously. 

**2. Websocket Streams for Live Data**
   - Consideration: By using Infura for blockchain events and Binance API for price updates, the architecture can handle real-time data flow with minimal delays, crucial for time-sensitive data like transaction fees.

**3. MongoDB (Database):**
   - Consideration: The choice of MongoDB is driven by its flexibility in handling different data structures, which is useful for both transaction logs and historical data.

**4. Circuit Breaker Pattern & Rate Limiting**
   - Consideration: If the system detects a failure in the real-time price fetch or blockchain data fetch, the circuit breaker stops the requests temporarily to prevent the system from wasting resources on repeated failed attempts and allows it to recover more gracefully.
   - Additionally, a retry mechanism with backoff is implemented to gradually resume requests to the external services. This helps in reducing the load on the APIs while attempting to restore functionality.

## Why Kafka?

In today's data-driven landscape, the ability to process and analyze information in real-time is crucial for businesses and applications. Apache Kafka, a distributed event streaming platform, has become a cornerstone for building robust real-time data pipelines. Its versatility and scalability make it an ideal choice for applications ranging from financial services to blockchain indexing. This article explores the role of Kafka in optimizing data pipelines for real-time processing, with a focus on its application in Ethereum blockchain indexing, as exemplified by the Ethereum-Indexer project.

---

### **Understanding Apache Kafka**

Apache Kafka is an open-source platform designed for building real-time streaming data pipelines and applications. It enables the publication, subscription, storage, and processing of data streams in a fault-tolerant and scalable manner. Kafka's architecture comprises several key components:

- **Producers:** Entities that publish data to Kafka topics.
- **Topics:** Categories or feeds to which records are sent.
- **Consumers:** Entities that subscribe to topics to read and process data.
- **Brokers:** Servers that store and serve data.
- **Zookeeper:** A service that coordinates and manages Kafka brokers.

Kafka's design ensures high throughput, low latency, and durability, making it suitable for handling large volumes of real-time data.

---

### **Kafka in Real-Time Data Pipelines**

Kafka serves as the backbone for real-time data pipelines by facilitating the seamless flow of data between systems. Its role in such pipelines includes:

1. **Data Ingestion:** Kafka efficiently collects data from various sources, including databases, applications, and IoT devices, and streams it into the pipeline.

2. **Data Buffering:** Kafka acts as a buffer, decoupling data producers and consumers. This decoupling allows consumers to process data at their own pace without impacting producers.

3. **Data Processing:** Integration with stream processing frameworks like Apache Flink or Kafka Streams enables real-time data transformation, filtering, and aggregation.

4. **Data Delivery:** Kafka ensures reliable delivery of processed data to target systems such as databases, data lakes, or analytics platforms.

By leveraging Kafka, organizations can build scalable and resilient data pipelines that support real-time analytics and decision-making.

---

### **Case Study: Ethereum-Indexer Project**

The Ethereum-Indexer project exemplifies the use of Kafka in real-time data processing within the blockchain domain. This project focuses on tracking transactions in the Uniswap V3 USDC/ETH pool, supporting both real-time and historical data processing. The system integrates various technologies, including Etherscan API, Web3.js, and Binance API, to achieve its objectives.

**Architecture Overview:**

The Ethereum-Indexer employs a microservices architecture, with Kafka serving as the central communication hub. The architecture includes:

- **Data Producers:** Services that fetch transaction data from the Ethereum blockchain and publish it to Kafka topics.

- **Data Consumers:** Services that subscribe to Kafka topics to process and store transaction data in a MongoDB database.

- **Real-Time Processing:** Consumers process incoming data streams to provide up-to-date information on transactions and liquidity.

- **Historical Data Processing:** Batch processing services retrieve and process historical transaction data to ensure comprehensive coverage.

**Benefits of Using Kafka:**

In the Ethereum-Indexer project, Kafka offers several advantages:

- **Scalability:** Kafka's partitioning and replication features allow the system to handle high volumes of transaction data efficiently.

- **Fault Tolerance:** Kafka's durability ensures that data is not lost, even in the event of consumer failures.

- **Flexibility:** The decoupling of producers and consumers enables independent scaling and maintenance of services.

- **Real-Time Processing:** Kafka's low-latency data streaming capabilities facilitate timely processing and analysis of blockchain transactions.

By integrating Kafka, the Ethereum-Indexer achieves a robust and efficient data pipeline capable of handling the dynamic nature of blockchain data.

---

### **Optimizing Kafka for Real-Time Processing**

To maximize Kafka's potential in real-time data pipelines, consider the following optimization strategies:

1. **Partitioning Strategy:** Design topics with an appropriate number of partitions to balance load and enable parallel processing.

2. **Replication Factor:** Set a suitable replication factor to ensure data durability and availability without incurring unnecessary overhead.

3. **Consumer Group Management:** Organize consumers into groups to enable load balancing and fault tolerance.

4. **Resource Allocation:** Allocate sufficient resources (CPU, memory, disk I/O) to Kafka brokers to handle anticipated data loads.

5. **Monitoring and Tuning:** Implement monitoring tools to track performance metrics and adjust configurations as needed to maintain optimal performance.

By applying these strategies, organizations can enhance Kafka's performance, ensuring efficient and reliable real-time data processing.

---

### **Conclusion**

Apache Kafka plays a pivotal role in building and optimizing real-time data pipelines across various domains, including blockchain indexing. Its robust architecture and scalability make it an ideal choice for applications requiring low-latency data processing. The Ethereum-Indexer project demonstrates Kafka's effectiveness in handling real-time blockchain data, providing valuable insights into its practical applications. By leveraging Kafka's capabilities and implementing best practices, organizations can develop efficient data pipelines that meet the demands of real-time analytics and decision-making. 
