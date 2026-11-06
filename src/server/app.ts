import express from 'express';
import apiRouter from './routes';

export const app = express();

// Body parser limits
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Full CORS support for web and mobile clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Production Health Check Handler
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    app: 'Sanjeevani Triage',
    time: new Date().toISOString(),
    gemini_available: !!process.env.GEMINI_API_KEY,
    configured_model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    environment: process.env.NODE_ENV || 'production',
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API routes for both /api/v1 and /v1 to seamlessly support Vercel serverless rewrites
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);

export default app;
