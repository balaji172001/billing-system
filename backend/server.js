import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import authRoutes        from './routes/auth.js';
import companyRoutes     from './routes/company.js';
import clientRoutes      from './routes/clients.js';
import invoiceRoutes     from './routes/invoices.js';
import paymentRoutes     from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import analyticsRoutes   from './routes/analytics.js';
import authMiddleware    from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT        = process.env.PORT        || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billing-system';

// ── Core Middlewares ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Public routes (no auth required) ──────────────────────────
app.use('/api/auth', authRoutes);

// PDF download: accepts token from ?token= query param (for direct <a href> links)
app.get('/api/invoices/:id/pdf', (req, res, next) => {
  const token = req.query.token
    || (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. Please log in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// ── Protected routes (JWT required) ───────────────────────────
app.use('/api/company',       authMiddleware, companyRoutes);
app.use('/api/clients',       authMiddleware, clientRoutes);
app.use('/api/invoices',      authMiddleware, invoiceRoutes);
app.use('/api/payments',      authMiddleware, paymentRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/analytics',     authMiddleware, analyticsRoutes);

// Base health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BillFlow API is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ── Database Connection & Server Startup ───────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`✅ Connected to MongoDB: ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
