import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import invoiceRoutes from './routes/invoices';
import purchaseOrderRoutes from './routes/purchaseOrders';
import statisticsRoutes from './routes/statistics';
import inventoryRoutes from './routes/inventory';

import logger from './logger/logger';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Request received: ${req.method} ${req.url}`);

  // Log request body for non-GET requests
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  }

  // Log request headers (optional - you can remove this if you don't want to log headers)
  if (req.headers.authorization) {
    logger.info(`Authorization: ${req.headers.authorization.substring(0, 20)}...`);
  }

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    logger.error('JSON parsing error:', {
      error: error.message,
      body: req.body,
      url: req.url,
      method: req.method,
    });
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: 'The request body contains malformed JSON. Please check your JSON syntax.',
    });
  }

  // Log other errors
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  // Send error response
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
});

export default app;
