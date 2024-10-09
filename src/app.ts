import express, { Application } from "express";
import dotenv from "dotenv";
import transactionRoutes from "./routes/transactionRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerOutput from "./swagger_output.json";

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api", transactionRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));

export default app;
