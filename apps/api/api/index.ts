// Vercel Serverless Function entry point
import app from '../src/index';

// Export Express app directly - Vercel will handle routing
// The routes in Express are defined without /api/ prefix
// Vercel's vercel.json routes will map /api/* to this handler
// So /api/courses becomes /courses in Express
export default app;

