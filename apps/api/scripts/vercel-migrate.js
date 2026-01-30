const { execSync } = require('child_process');

if (process.env.VERCEL_ENV === 'production') {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('Skipping prisma migrate deploy for non-production Vercel env.');
}
