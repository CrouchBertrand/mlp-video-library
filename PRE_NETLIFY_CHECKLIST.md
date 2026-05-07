# Pre-Netlify Checklist

Use this before connecting `marketplaceliteracyglobal.org`.

## Project Readiness

- [ ] GitHub repository is ready.
- [ ] `.env`, API keys, passwords, `dev.db`, `node_modules`, `.next`, and `dist` are not committed.
- [ ] `npm install` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes for local SQLite.
- [ ] `npm run build:netlify` passes with a Postgres `DATABASE_URL`.
- [ ] Public hierarchy is `Language -> Resource Format -> Category -> Resource`.
- [ ] No public Course, Module, Lesson, Topic, or Program navigation level.
- [ ] No `Marketplace Foundations` label appears in the app.

## Hosted Database

- [ ] Neon or Supabase Postgres database is created.
- [ ] Production `DATABASE_URL` is saved securely.
- [ ] `npm run db:push:postgres` has been run against the hosted database.
- [ ] `npm run db:seed:postgres` has been run once, or real content has been migrated.
- [ ] Database backup/export process is known.

## Netlify Environment Variables

- [ ] `DATABASE_URL`
- [ ] `SESSION_SECRET`
- [ ] `YOUTUBE_API_KEY`
- [ ] `COOKIE_SECURE=true`
- [ ] `NETLIFY_NEXT_SKEW_PROTECTION=true`
- [ ] `NODE_VERSION=20`
- [ ] `NEXT_PUBLIC_SITE_URL=https://temporary-site.netlify.app`

## Security

- [ ] Default admin password is changed.
- [ ] YouTube API key is rotated before public launch if it was shared during development.
- [ ] Admin routes are protected.
- [ ] Admin pages are noindexed.
- [ ] Browser refresh while logged in keeps the admin session.

## Temporary Netlify URL Testing

- [ ] Homepage loads.
- [ ] `/resources` loads.
- [ ] Language pages load.
- [ ] Resource Format pages load.
- [ ] Category pages show resources directly.
- [ ] Resource playback works.
- [ ] YouTube embeds work.
- [ ] Search works.
- [ ] Admin login works.
- [ ] Admin navigation works.
- [ ] Resource create/edit/delete works.
- [ ] YouTube playlist import works.
- [ ] Mobile layout is usable.
- [ ] HTTPS works.
- [ ] 404 page works.

## Domain Cutover

- [ ] Old DNS records are recorded.
- [ ] Old app/hosting will remain active for 2-4 weeks.
- [ ] Netlify domain settings show exact DNS records.
- [ ] No DNS change has been made before final approval.
