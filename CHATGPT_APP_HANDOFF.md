# MLP Video Library - ChatGPT App Handoff

This file summarizes the current Marketplace Literacy Project app so ChatGPT or another developer can quickly understand, analyze, and continue the work.

## Project Summary

**App name:** MLP Video Library  
**Organization:** Marketplace Literacy Project (MLP)  
**Purpose:** A Windows-first educator/facilitator resource library for Marketplace Literacy videos and related resources.  
**Important:** The app does not host or download YouTube videos. It stores metadata and YouTube links only, then plays videos through embedded YouTube players.

## Current User-Facing Hierarchy

The public browsing hierarchy is now:

```text
Language -> Resource Format -> Category -> Resource
```

The older hierarchy should not be visible in the public UI:

```text
Language -> Program -> Category -> Resource
```

`program = Marketplace Literacy` may remain as backend metadata, but it should not be a required public navigation layer.

## Public Flow

1. Home page introduces the resource library.
2. User selects a language.
3. User selects a resource format.
4. User selects a category.
5. Category page opens directly into a playable resource layout:
   - Embedded YouTube player for the first or selected resource.
   - Category resource list in the sidebar.
   - Previous/next resource navigation.
   - Open on YouTube button.
   - Description/facilitator notes.
   - Transcript/script area.

## Languages

Seeded/public languages:

- English
- French
- Hindi
- Spanish
- Swahili
- Telugu

Language fallback thumbnails are local files in:

```text
public/thumbnails/languages/
```

Do not use internet thumbnails unless explicitly requested.

## Resource Formats

Visible resource formats:

- Image Diaries
- Doodle
- Animation
- VideoScribe
- Global
- Vocations
- Online

Additional backend/admin formats may exist:

- Interview
- Documentary Clip
- Facilitator Video
- Script / Transcript
- Discussion Prompt
- Facilitator Guide

Older values are normalized in admin startup logic:

- `Doodle Video` -> `Doodle`
- `Image Diary` -> `Image Diaries`

## Categories

Current categories:

- Introduction
- General Marketplace Literacy
- Personal and Professional Aspirations
- Consumer Literacy
- Entrepreneurial Literacy
- Sustainability Literacy

Important naming:

- Do not use `Marketplace Foundations`.
- Use `General Marketplace Literacy`.
- Avoid public UI terms like `Course`, `Lesson`, and `Module`.
- In public/admin UI, prefer `Language`, `Resource Format`, `Category`, and `Resource`.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite
- Prisma ORM
- bcrypt password hashing
- Cookie-based admin session
- Electron packaging for Windows
- YouTube Data API v3 for playlist import
- YouTube iframe embeds for playback

## Main Local Paths

Project root:

```text
C:\Users\uwish\Documents\Codex\2026-05-05\you-are-building-a-windows-first
```

Updated Windows executable:

```text
dist\win-unpacked\MLP Video Library.exe
```

Updated zip:

```text
dist\MLP-Video-Library-Windows-Unpacked-1.0.0.zip
```

## Important Source Files

Public pages:

```text
src/app/page.tsx
src/app/resources/page.tsx
src/app/resources/[language]/page.tsx
src/app/resources/[language]/[format]/page.tsx
src/app/resources/[language]/[format]/[category]/page.tsx
src/app/search/page.tsx
src/app/videos/[id]/page.tsx
```

Admin pages:

```text
src/app/admin/login/page.tsx
src/app/admin/(protected)/layout.tsx
src/app/admin/(protected)/page.tsx
src/app/admin/(protected)/videos/page.tsx
src/app/admin/(protected)/videos/new/page.tsx
src/app/admin/(protected)/import/page.tsx
src/app/admin/(protected)/playlists/page.tsx
src/app/admin/(protected)/playlists/new/page.tsx
src/app/admin/(protected)/languages/page.tsx
src/app/admin/(protected)/modules/page.tsx
src/app/admin/(protected)/homepage/page.tsx
src/app/admin/(protected)/settings/page.tsx
src/app/admin/actions.ts
```

Shared components/helpers:

```text
src/components/admin-shell.tsx
src/components/admin-form.tsx
src/components/resource-card.tsx
src/components/public-header.tsx
src/components/public-footer.tsx
src/components/youtube-url-helper.tsx
src/components/bulk-resource-selector.tsx
src/lib/auth.ts
src/lib/prisma.ts
src/lib/resource-taxonomy.ts
src/lib/youtube.ts
src/lib/admin-defaults.ts
src/lib/sanitize.ts
src/lib/uploads.ts
```

Database and packaging:

```text
prisma/schema.prisma
prisma/seed.ts
electron/main.cjs
scripts/package-server.mjs
scripts/after-pack.cjs
package.json
start.bat
.env
.env.example
README.md
```

## Database Models

Prisma models currently include:

- `User`
- `Language`
- `Module` (used as Category in UI)
- `Playlist` (also called Resource Collection in parts of admin UI)
- `Video` (used as Resource)
- `PlaylistVideo`
- `HomepageSection`
- `HomepageSectionPlaylist`
- `Settings`

Key `Video` fields:

- `languageId`
- `program`
- `resourceFormat`
- `category`
- `resourceTitle`
- `resourceType`
- `youtubeUrl`
- `youtubeVideoId`
- `embedUrl`
- `sourcePlaylistId`
- `sourcePlaylistUrl`
- `thumbnailUrl`
- `uploadedThumbnailPath`
- `transcript`
- `description`
- `orderIndex`
- `isPublished`
- `visibility`

## Admin Authentication

Admin routes are protected by:

```text
src/app/admin/(protected)/layout.tsx
```

Login page is outside the protected route group:

```text
src/app/admin/login/page.tsx
```

The admin shell wraps protected admin pages and should remain visible after login.

Default local admin account:

```text
Email: admin@marketplaceliteracy.org
Password: ChangeMe123!
```

Warning: change this password before deployment.

## Known Admin Login Fix

There was a bug where clicking admin navigation sent the user back to login. It was fixed by:

- Moving protected admin pages under `src/app/admin/(protected)/`.
- Making `src/app/admin/layout.tsx` a simple passthrough.
- Wrapping protected admin pages with `AdminShell`.
- Validating the session inside the protected layout.
- Using cookie-based session persistence.
- Passing `COOKIE_SECURE=false` for local/Electron.

If this bug returns, inspect:

```text
src/app/admin/layout.tsx
src/app/admin/(protected)/layout.tsx
src/proxy.ts
src/lib/auth.ts
electron/main.cjs
```

## Admin Features

Admin can currently:

- Log in/out.
- View dashboard stats.
- Manage resources.
- Add/edit/delete resources.
- Bulk select resources.
- Select all visible resources.
- Bulk update selected resources:
  - Language
  - Resource Format
  - Category
  - Collection
  - Visibility
  - Resource Type
  - Region
  - Audience
  - Tags
- Bulk delete selected resources.
- Manage resource collections/playlists.
- Manage languages.
- Manage categories.
- Manage homepage sections.
- Manage settings.
- Import from YouTube.

## Admin Manage Resources

Manage Resources supports:

- Search
- Language filter
- Resource Format filter
- Category filter
- Page size selector: 10, 30, 50
- Working pagination links
- Previous/Next links
- Bulk actions

Search icon layout was fixed so it no longer overlaps the input text.

## YouTube Playlist Import

YouTube playlist import is on:

```text
/admin/import
```

Admin must select:

- Language
- Resource Format
- Category
- Resource Type
- Optional app collection/playlist
- Visibility
- Region
- Audience
- Tags

The app calls the YouTube Data API v3 `playlistItems.list` endpoint server-side only.

Import behavior:

- Extracts YouTube playlist ID.
- Paginates through all playlist items.
- Saves each item as a `Video`/Resource record.
- Stores YouTube watch URL and embed URL.
- Stores `sourcePlaylistId` and `sourcePlaylistUrl`.
- Uses local/language fallback thumbnail, not YouTube thumbnail.
- Does not download videos.
- Avoids duplicate imports using `youtubeVideoId + languageId + category`.
- Can add imported videos to a selected app collection.
- Can replace the selected app collection contents during import.

## Environment Variables

`.env.example` includes:

```env
DATABASE_URL="file:../dev.db"
SESSION_SECRET="replace-this-with-a-long-random-secret-before-deployment"
YOUTUBE_API_KEY=""
COOKIE_SECURE="false"
```

`.env` contains local values. Do not expose the YouTube API key publicly.

The Windows/Electron app now passes environment values into the bundled server using:

```text
electron/main.cjs
```

The packaged app includes:

```text
dist/win-unpacked/resources/mlp.env
```

## YouTube API Key Security Note

A YouTube API key was added for local testing. Because it was shared in chat, it should be rotated before public deployment.

The API key should be restricted to:

- YouTube Data API v3

For local Windows testing, app restrictions may be left as `None`. For deployment, restrict it based on the server/deployment environment.

## Public Routes

Current public routes:

```text
/
/resources
/resources/[language]
/resources/[language]/[format]
/resources/[language]/[format]/[category]
/search
/videos/[id]
/playlists
/playlists/[id]
/languages
/modules
```

`/videos/[id]` redirects to the new resource hierarchy route:

```text
/resources/[language]/[format]/[category]?resource=[id]
```

## Admin Routes

Current admin routes:

```text
/admin/login
/admin
/admin/videos
/admin/videos/new
/admin/playlists
/admin/playlists/new
/admin/import
/admin/languages
/admin/modules
/admin/homepage
/admin/settings
/admin/logout
```

## Build and Run Commands

Install dependencies:

```powershell
npm.cmd install
```

Set up database:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

Run development server:

```powershell
npm.cmd run dev
```

Run production build:

```powershell
npm.cmd run build
```

Run lint:

```powershell
npm.cmd run lint
```

Build Windows app:

```powershell
npm.cmd run build
npm.cmd run package:server
npx.cmd electron-builder --win dir
```

Package zip:

```powershell
Compress-Archive -Path "dist\win-unpacked\*" -DestinationPath "dist\MLP-Video-Library-Windows-Unpacked-1.0.0.zip" -Force
```

## Windows App Behavior

The Windows app uses Electron.

Electron:

- Starts the bundled Next standalone server.
- Chooses an available local port automatically.
- Opens the app in an Electron window.
- Stores the user database in Electron `userData`.
- Copies a seed database on first run.
- Passes env vars to the server.

Key file:

```text
electron/main.cjs
```

## Visual/UI Direction

The app should feel:

- Clean
- Light-themed
- Professional
- Educator/facilitator friendly
- NGO/university-like
- Organized and calm

Preferred colors:

- Background: light gray
- Cards: white
- Accent: warm red/brown
- Text: deep blue/charcoal
- Borders: soft gray

Avoid:

- Social-media feel
- Course/lesson wording
- Extra topic/subcategory levels
- Internet thumbnails unless explicitly approved
- Broken or question-mark icons

## Quality Checks Already Performed Recently

Recent checks passed:

- `npm run lint`
- `npm run build`
- Public route smoke test:
  - `/resources/en`
  - `/resources/en/doodle`
  - `/resources/en/doodle/general-marketplace-literacy`
- Admin login smoke test.
- Admin session persistence after navigation.
- Admin resource format filter.
- Admin import page Resource Format selectors.
- Packaged `.exe` launch and smoke test.

## Current Expected Behavior

Public:

- User chooses Language.
- User chooses Resource Format.
- User chooses Category.
- Category opens directly with playable resource.
- Resources list appears on the same page.

Admin:

- Admin remains logged in while navigating.
- Admin can import YouTube playlists into selected Language + Resource Format + Category.
- Admin can bulk manage resources.
- Admin can filter resources by Language + Resource Format + Category.

## Things to Watch For in Future Work

- Do not reintroduce a public Program navigation level.
- Do not create topic/subcategory pages.
- Do not use `Marketplace Foundations`.
- Keep imported YouTube videos as links only.
- Keep YouTube API key server-side only.
- Keep local thumbnails as fallbacks.
- If changing route structure, run `npm.cmd run build` to catch conflicts.
- If rebuilding Electron while app is running, close the app first to avoid Windows file locks.

