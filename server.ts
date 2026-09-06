import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  // Disable X-Powered-By header to prevent server technology fingerprinting
  app.disable('x-powered-by');

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Strict JSON payload body size limit to prevent Denial-of-Service / memory exhaustion attacks
  app.use(express.json({ limit: '512kb' }));

  // In-memory sliding rate limiter for all /api endpoints to protect Gemini API quota and server resources
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

  app.use('/api', (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(ip);

    if (!clientRecord || now > clientRecord.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    if (clientRecord.count >= MAX_REQUESTS_PER_WINDOW) {
      res.setHeader('Retry-After', Math.ceil((clientRecord.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before sending another AI query.',
      });
    }

    clientRecord.count += 1;
    next();
  });

  // Clean up stale rate limiter entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Health check route for Cloud Run
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'SmartCart AI' });
  });

  // API router mounted first
  app.use('/api', apiRouter);

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SmartCart AI server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
