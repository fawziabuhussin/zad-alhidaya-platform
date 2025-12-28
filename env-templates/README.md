# Environment Templates

This folder contains ready-to-import environment-variable templates for the Vercel projects. Importing these files saves you from manually typing every key while still letting you tweak the values (for example by pasting a fresh Neon `DATABASE_URL` or rotating JWT secrets).

## Files

- `api.env.template` → use this with the `zad-alhidaya-platform-api` Vercel project. It lists the database connection, JWT secrets, and other API-only values.
- `web.env.template` → use this with the `zad-alhidaya-web` project. It wires the frontend to the deployed API URLs.

## Workflow

1. Copy either template to a temporary file (or download directly) and fill in the real secrets.
2. In Vercel, go to **Settings > Environment Variables > Import > File** and select the prepared file.
3. Assign each template to the appropriate environment (Production/Preview/Development) and save.
4. Trigger a redeploy so the new values ship with the build.

For local development, copy a template to `.env.local`, update the URLs/secrets you need, and restart the app. Keep real secrets out of Git by keeping `.env.local` ignored.


