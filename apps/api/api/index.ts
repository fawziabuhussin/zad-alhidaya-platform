// Vercel Serverless Function entry point
import app from '../src/index';

// Vercel adds /api/ prefix automatically for files in api/ folder
// So when Vercel calls /api/health, it becomes /api/api/health in Express
// We need to strip the extra /api prefix
const handler = (req: any, res: any) => {
  // Store original URL
  const originalUrl = req.url;
  
  // If URL starts with /api/, remove it (Vercel already added it)
  if (req.url && req.url.startsWith('/api/')) {
    req.url = req.url.replace('/api', '') || '/';
    // Also update the originalUrl property
    if (req.originalUrl) {
      req.originalUrl = req.url;
    }
  }
  
  // Handle root path
  if (req.url === '' || req.url === '/') {
    req.url = '/health';
  }
  
  return app(req, res);
};

export default handler;

