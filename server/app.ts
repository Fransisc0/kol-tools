import compression from 'compression';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { CLASSES, MOON_SIGNS } from '../src/data/constants';
import type { TCRSDataResponse } from '../src/types';
import { createConcurrencyLimiter } from './concurrencyLimiter';
import { parseTCRSFile } from './tcrsParser';

const DEFAULT_PUBLIC_ORIGIN = 'https://fransisc0.github.io';
const CACHE_CONTROL = 'public, max-age=600, stale-while-revalidate=3600';

type DataLoader = (className: string, moonSign: string) => Promise<TCRSDataResponse>;

export interface AppOptions {
  allowedOrigins?: string[];
  dataLoader?: DataLoader;
  isProduction?: boolean;
  rateLimitMax?: number;
  maxConcurrentRequests?: number;
  serveClient?: boolean;
}

function getAllowedOrigins(isProduction: boolean): Set<string> {
  const configured = process.env.ALLOWED_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return new Set(configured);
  if (isProduction) return new Set([DEFAULT_PUBLIC_ORIGIN]);
  return new Set([DEFAULT_PUBLIC_ORIGIN, 'http://127.0.0.1:3000', 'http://localhost:3000']);
}

function apiCors(allowedOrigins: ReadonlySet<string>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Origin is not allowed.' });
      return;
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, If-None-Match');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

function apiMethods(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD') {
    next();
    return;
  }

  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  res.status(405).json({ error: 'Method not allowed.' });
}

function readQueryValue(value: unknown, fallback: string): { valid: boolean; value: string } {
  if (value === undefined) return { valid: true, value: fallback };
  if (typeof value !== 'string' || value.length === 0 || value.length > 40) {
    return { valid: false, value: fallback };
  }
  return { valid: true, value };
}

export async function createApp(options: AppOptions = {}): Promise<Express> {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const allowedOrigins = new Set(options.allowedOrigins ?? getAllowedOrigins(isProduction));
  const dataLoader = options.dataLoader ?? parseTCRSFile;
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('etag', 'strong');
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              baseUri: ["'none'"],
              frameAncestors: ["'none'"],
              formAction: ["'none'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.use('/api', apiCors(allowedOrigins), apiMethods);

  const tcrsLimiter = rateLimit({
    windowMs: 10 * 60 * 1_000,
    limit: options.rateLimitMax ?? 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait and try again.' },
  });
  const tcrsConcurrency = createConcurrencyLimiter(options.maxConcurrentRequests ?? 8);

  app.get('/api/tcrs', tcrsLimiter, tcrsConcurrency, async (req, res) => {
    const classResult = readQueryValue(req.query.class, 'Seal_Clubber');
    const signResult = readQueryValue(req.query.sign, 'Mongoose');
    if (!classResult.valid || !signResult.valid) {
      res.status(400).json({ error: 'Invalid class or moon sign specified.' });
      return;
    }

    const className = classResult.value;
    const moonSign = signResult.value;
    const validClass = CLASSES.some((entry) => entry.id === className);
    const validSign = MOON_SIGNS.some((entry) => entry.id === moonSign);

    if (!validClass || !validSign) {
      res.status(400).json({
        error: 'Invalid class or moon sign specified.',
        validClasses: CLASSES.map((entry) => entry.id),
        validSigns: MOON_SIGNS.map((entry) => entry.id),
      });
      return;
    }

    try {
      const data = await dataLoader(className, moonSign);
      res.setHeader('Cache-Control', CACHE_CONTROL);
      res.json(data);
    } catch {
      console.error(JSON.stringify({ level: 'error', event: 'tcrs_request_failed' }));
      res.status(500).json({ error: 'Failed to retrieve TCRS data. Please retry.' });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok' });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else if (options.serveClient ?? process.env.SERVE_CLIENT === 'true') {
    const pagesPath = path.join(process.cwd(), 'dist', 'pages');
    app.use(express.static(pagesPath, { index: 'index.html', maxAge: '1h' }));
    app.get('/kol-tools/tcrs/*', (_req, res) => {
      res.sendFile(path.join(pagesPath, 'tcrs', 'index.html'));
    });
  }

  return app;
}
