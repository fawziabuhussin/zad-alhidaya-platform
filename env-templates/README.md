# Environment Variables for Vercel

This folder contains ready-to-import `.env` files for Vercel projects. Vercel supports direct import of `.env` files.

## Files

- `api.env` → Import this into the `zad-alhidaya-platform-api` Vercel project
- `web.env` → Import this into the `zad-alhidaya-web` Vercel project

## How to Import in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Click **Import** button
3. Select the appropriate `.env` file (`api.env` or `web.env`)
4. Choose which environments to apply (Production, Preview, Development)
5. Click **Import**
6. **Redeploy** your project for changes to take effect

## For Local Development

Copy the `.env` file to your project directory:
- `api.env` → `apps/api/.env`
- `web.env` → `apps/web/.env.local`

Update any values as needed (e.g., use `localhost` URLs for local development).


