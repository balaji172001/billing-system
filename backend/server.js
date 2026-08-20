import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import compression from 'compression';

import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import analyticsRoutes from './routes/analytics.js';
import seoRoutes from './routes/seo.js';
import systemRoutes from './routes/system.js';

import authMiddleware from './middleware/auth.js';
import { setupHelmet, setupMongoSanitize, globalLimiter, authLimiter } from './middleware/security.js';
import { overloadGuard } from './middleware/overloadGuard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billing-system';

// ── Security & Performance Middlewares ────────────────────────
app.use(setupHelmet()); // Security Headers (CSP, HSTS, X-Frame-Options)
app.use(compression()); // Gzip/Brotli response compression
app.use(setupMongoSanitize()); // Prevent NoSQL injection
app.use(overloadGuard); // Overload protection / load shedding guard
app.use(globalLimiter); // Global rate limiter

// ── CORS & Parsing Middlewares ─────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' })); // Strict JSON payload size limit

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [PID:${process.pid}] ${req.method} ${req.url}`);
  next();
});

// ── SEO & Static Crawler Routes ────────────────────────────────
app.use('/', seoRoutes);

// ── Public Routes (no auth required) ──────────────────────────
app.use('/api/auth/login', authLimiter); // Auth brute-force protection
app.use('/api/auth', authRoutes);

// PDF download: accepts token from ?token= query param (for direct <a href> links)
app.get('/api/invoices/:id/pdf', (req, res, next) => {
  const token = req.query.token || (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. Please log in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development');
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// ── Protected Routes (JWT required) ───────────────────────────
app.use('/api/company', authMiddleware, companyRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/system', systemRoutes);

// Base health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BillFlow Load-Balanced Security API is running.',
    processId: process.pid,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ [PID:${process.pid}] Unhandled Error:`, err.stack || err.message);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

// ── Database Connection & Server Startup ───────────────────────
const mongoOptions = {
  maxPoolSize: 50, // Connection pool limit for high concurrent load
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose
  .connect(MONGODB_URI, mongoOptions)
  .then(() => {
    console.log(`✅ [PID:${process.pid}] Connected to MongoDB with poolSize=${mongoOptions.maxPoolSize}`);
    app.listen(PORT, () => {
      console.log(`🚀 [PID:${process.pid}] Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ [PID:${process.pid}] Failed to connect to MongoDB:`, err);
    process.exit(1);
  });
