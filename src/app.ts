import express, { Application } from 'express';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', transactionRoutes);

export default app;
