import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Client from '../models/Client.js';
import Company from '../models/Company.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

/**
 * Creates a complete timestamped backup snapshot of all MongoDB collections
 */
export async function createDatabaseBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `billflow-backup-${timestamp}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  const [clients, company, invoices, payments, subscriptions] = await Promise.all([
    Client.find({}).lean(),
    Company.find({}).lean(),
    Invoice.find({}).lean(),
    Payment.find({}).lean(),
    Subscription.find({}).lean(),
  ]);

  const backupData = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    counts: {
      clients: clients.length,
      company: company.length,
      invoices: invoices.length,
      payments: payments.length,
      subscriptions: subscriptions.length,
    },
    collections: {
      clients,
      company,
      invoices,
      payments,
      subscriptions,
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`🔒 [Data Backup] Saved database backup to: ${backupFilePath}`);

  return {
    success: true,
    fileName: backupFileName,
    filePath: backupFilePath,
    createdAt: backupData.createdAt,
    counts: backupData.counts,
  };
}

/**
 * Lists available database backup files
 */
export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        fileName: f,
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
