import v8 from 'node:v8';

let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '500', 10);
const MEMORY_LIMIT_MB = parseInt(process.env.MEMORY_LIMIT_MB || '1024', 10);

/**
 * Overload Guard Middleware
 * Prevents node event loop starvation and server unreachability under traffic spikes.
 */
export const overloadGuard = (req, res, next) => {
  activeRequests++;

  // Check heap memory usage
  const memStats = process.memoryUsage();
  const heapUsedMB = Math.round(memStats.heapUsed / 1024 / 1024);

  // If server is severely overloaded, shed load gracefully with 503 Service Unavailable
  if (activeRequests > MAX_CONCURRENT_REQUESTS || heapUsedMB > MEMORY_LIMIT_MB) {
    activeRequests--;
    console.warn(`⚠️ [Overload Guard] Server high load shed! Active requests: ${activeRequests}, Heap: ${heapUsedMB}MB`);
    res.setHeader('Retry-After', '5'); // Suggest client retry in 5 seconds
    return res.status(503).json({
      status: 503,
      message: 'Server is currently experiencing high load. Please retry in a few seconds.',
      retryAfterSeconds: 5,
    });
  }

  // Decrement counter when request finishes
  res.on('finish', () => {
    activeRequests = Math.max(0, activeRequests - 1);
  });
  res.on('close', () => {
    activeRequests = Math.max(0, activeRequests - 1);
  });

  next();
};

/**
 * Health check endpoint stats helper
 */
export const getSystemHealthStats = () => {
  const mem = process.memoryUsage();
  return {
    activeRequests,
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    uptimeSeconds: Math.round(process.uptime()),
    pid: process.pid,
  };
};
