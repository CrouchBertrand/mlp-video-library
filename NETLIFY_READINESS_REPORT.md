# Netlify Readiness Report

Date: 2026-05-07

## Already Ready

- The app runs as a normal Next.js App Router web app.
- Electron code is isolated in the `electron` folder and is not required for Netlify.
- Public navigation follows `Language -> Resource Format -> Category -> Resource`.
- Admin session persists while navigating when cookies are configured correctly.
- YouTube videos are stored as links and metadata only.
- YouTube playback uses embed URLs.
- Playlist import runs server-side and does not expose the YouTube API key to frontend code.
- Attached local language thumbnails are present under `public/thumbnails/languages`.

## Changed Automatically

- Added `netlify.toml` with a Netlify build command and admin noindex header.
- Updated `next.config.ts` so Netlify uses the normal Next.js runtime while Windows packaging keeps standalone output.
- Added `prisma/schema.postgres.prisma` for hosted Postgres deployment.
- Added Netlify/Postgres npm scripts:
  - `build:netlify`
  - `db:generate:postgres`
  - `db:push:postgres`
  - `db:seed:postgres`
- Updated `.env.example` with Netlify production variables.
- Expanded `.gitignore` to protect secrets, databases, build output, and packaged app files.
- Updated admin auth so `SESSION_SECRET` is required in production.
- Added basic failed-login rate limiting.
- Added admin route metadata to prevent indexing.
- Updated YouTube playlist duplicate matching to include YouTube video ID, language, resource format, and category.
- Updated deployment and rollback instructions in `README.md`.
- Added `PRE_NETLIFY_CHECKLIST.md`.

## Must Be Done Manually

- Create or choose the GitHub repository.
- Create the Netlify site from that GitHub repository.
- Create a hosted Postgres database in Neon or Supabase.
- Add the production `DATABASE_URL` to Netlify.
- Add `SESSION_SECRET`, `YOUTUBE_API_KEY`, `COOKIE_SECURE=true`, and other required env vars to Netlify.
- Run the Postgres database setup commands against the hosted database.
- Change the default admin password before public launch.
- Rotate the YouTube API key before public launch if it was shared during development.
- Test the temporary Netlify URL.
- Approve DNS changes only after the temporary URL is working.

## Verification Run Locally

- `npm install`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with SQLite.
- `npm run db:push`: passed.
- `prisma validate --schema=prisma/schema.postgres.prisma`: passed when `DATABASE_URL` used a Postgres-style URL.
- `npm audit --omit=dev`: reported a moderate advisory inside the current Next.js dependency tree; the suggested automatic fix is a breaking downgrade, so it was not applied.
- `npm start -- -p 3032`: app started and `/api/health` returned OK.
- Smoke tests passed:
  - homepage
  - resource category page
  - admin login persistence
  - admin import page
  - admin manage resources page

## Known Production Requirement

`npm run build:netlify` requires a real hosted Postgres `DATABASE_URL`. It cannot be fully tested with the local SQLite `DATABASE_URL=file:../dev.db`, because the Netlify build intentionally uses the Postgres Prisma schema.

## DNS Status

No deployment was made and no DNS changes were made.
