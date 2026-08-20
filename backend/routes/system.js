import express from 'express';
import { createDatabaseBackup, listBackups } from '../utils/backup.js';
import { getSystemHealthStats } from '../middleware/overloadGuard.js';
import Client from '../models/Client.js';
import Company from '../models/Company.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

/**
 * GET /api/system/health
 * Public health check & performance statistics endpoint
 */
router.get('/health', (req, res) => {
  const healthStats = getSystemHealthStats();
  res.json({
    status: 'ok',
    system: healthStats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/system/backup
 * Triggers an instant data snapshot backup of all database collections
 */
router.post('/backup', async (req, res) => {
  try {
    const result = await createDatabaseBackup();
    res.json({
      message: 'Database backup successfully created.',
      backup: result,
    });
  } catch (err) {
    console.error('❌ Database backup error:', err);
    res.status(500).json({ message: 'Failed to create database backup.', error: err.message });
  }
});

/**
 * GET /api/system/backups
 * Lists all existing database backups
 */
router.get('/backups', (req, res) => {
  try {
    const backups = listBackups();
    res.json({ backups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve backups list.', error: err.message });
  }
});

/**
 * POST /api/system/reset-data
 * Completely removes all local database records across all collections
 */
router.post('/reset-data', async (req, res) => {
  try {
    const clientRes = await Client.deleteMany({});
    const invoiceRes = await Invoice.deleteMany({});
    const paymentRes = await Payment.deleteMany({});
    const companyRes = await Company.deleteMany({});
    const subRes = await Subscription.deleteMany({});

    res.json({
      message: 'All local database data successfully removed.',
      deleted: {
        clients: clientRes.deletedCount,
        invoices: invoiceRes.deletedCount,
        payments: paymentRes.deletedCount,
        company: companyRes.deletedCount,
        subscriptions: subRes.deletedCount,
      },
    });
  } catch (err) {
    console.error('❌ Data reset error:', err);
    res.status(500).json({ message: 'Failed to clear local data.', error: err.message });
  }
});

export default router;
