// Vercel Serverless Function entry point
import app from '../src/index';

// Vercel adds /api/ prefix automatically for files in api/ folder
// So when user calls /api/courses, Vercel passes it as /api/courses to this handler
// But Express routes are defined without /api/ prefix (e.g., /courses)
// So we need to strip /api/ prefix from the URL
const handler = (req: any, res: any) => {
  // Clone the request to avoid mutating the original
  const url = req.url || '';
  
  // If URL starts with /api/, remove it (Express routes don't have /api/ prefix)
  if (url.startsWith('/api/')) {
    req.url = url.replace(/^\/api/, '') || '/';
    req.originalUrl = req.originalUrl ? req.originalUrl.replace(/^\/api/, '') || '/' : req.url;
  } else if (url === '/api') {
    // Handle /api root
    req.url = '/health';
    req.originalUrl = '/health';
  }
  
  // Handle empty root path
  if (!req.url || req.url === '') {
    req.url = '/health';
  }
  
  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Vercel Handler] Original: ${url}, Modified: ${req.url}`);
  }
  
  return app(req, res);
};

export default handler;

