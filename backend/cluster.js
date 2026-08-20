import cluster from 'node:cluster';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numCPUs = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

if (cluster.isPrimary || cluster.isMaster) {
  console.log(`⚡ [Cluster Primary ${process.pid}] Starting BillFlow Load-Balanced Cluster`);
  console.log(`⚡ [Cluster Primary ${process.pid}] Launching ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`✅ [Worker ${worker.process.pid}] is online and processing requests.`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️ [Worker ${worker.process.pid}] died (code: ${code}, signal: ${signal}). Forking replacement worker...`);
    cluster.fork();
  });
} else {
  // Worker process runs server.js
  import('./server.js');
}
