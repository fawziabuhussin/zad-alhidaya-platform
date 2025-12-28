// Vercel Serverless Function entry point
import app from '../src/index';

// Vercel adds /api/ prefix automatically, so we need to handle routes correctly
// The Express app already has /api/ routes, so Vercel will call them as /api/api/*
// We create a wrapper that strips the /api prefix if needed
const handler = (req: any, res: any) => {
  // If the path starts with /api/api, remove one /api prefix
  if (req.url && req.url.startsWith('/api/api')) {
    req.url = req.url.replace('/api/api', '/api');
  }
  return app(req, res);
};

export default handler;

