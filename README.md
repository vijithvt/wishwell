# Wishwell — Birthday Studio

A standalone, embeddable birthday poster studio built with React, TypeScript, Vite, Tailwind CSS, a shadcn-style Radix Button, and a local SQLite API. Includes ten original ChatGPT-generated backgrounds and locally bundled calligraphy fonts.

## Run

Requires Node.js 24 (the server uses built-in `node:sqlite`).

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. On shells without PowerShell script restrictions, `npm` also works. `npm.cmd run build` produces `dist`; `npm.cmd start` serves the built app at http://127.0.0.1:3001.

## Features

- Ten editable square/portrait birthday templates, category filters and search.
- Student/person CRUD with DOB, instrument/department, emoji and optional photo.
- Birthday countdowns and upcoming calendar. Feb 29 birthdays use Feb 28 in non-leap years.
- Company name, logo, organization type and portrait border color settings.
- Instrument-aware music learning wishes; company and school wishes; custom copy.
- Editable greeting, calligraphic or serif name, emoji or circular portrait.
- PNG downloads at 1080×1080 or 1080×1350, with locally hosted fonts and artwork.
- Saved posters store a snapshot of artwork selection, copy and branding.
- Six synthetic students seeded on first launch. No real student photos included.

## Design and implementation plan

1. Generate ten text-free birthday backgrounds; keep personalized content editable in React.
2. Build a reusable poster renderer and typed repository contract.
3. Implement local SQLite storage, seeded demo people and validation.
4. Add the gallery, editor, people calendar, saved posters and brand settings.
5. Validate DOB edge cases, persistent CRUD, image exports and responsive layout.

## Integrate with your existing app

Use `BirthdayStudio` from `src/BirthdayStudio.tsx`. It accepts a `repository: Repository` prop; the default talks to the SQLite API. Implement the eight repository operations in `src/lib/types.ts` with your authenticated Supabase client to replace SQLite. This project does not require Supabase credentials and does not connect to your existing project.

Copy `src/BirthdayStudio.tsx`, `src/components`, `src/lib`, fonts/imports from `src/main.tsx`, and `public/templates` into your app. Import the studio stylesheet on its route. The stylesheet currently includes global element rules; scope those beneath `.studio` or isolate the route when merging with existing styling. The Button uses the same Radix Slot / CVA pattern as shadcn/ui and can be replaced by your existing Button.

```tsx
import { BirthdayStudio } from "./BirthdayStudio";
// Implement Repository using your own Supabase tables and auth context.
<BirthdayStudio repository={yourSupabaseRepository} />;
```

Suggested Supabase model: `birthday_people` (id, organization_id, name, dob, course, emoji, photo), `birthday_brands` (organization_id, name, type, logo, accent), `birthday_posters` (id, organization_id, title, draft jsonb, brand jsonb, created_at). Apply your application's organization-based RLS policies and private storage rules. Use signed or same-origin image URLs with canvas-compatible CORS in the Supabase adapter; the local demo stores uploaded images as data URLs.

## Storage and limitations

The local database is `data/birthdays.sqlite`, excluded from git. The API binds only to localhost; it is a single-workspace prototype without authentication or multitenancy. Add your existing Supabase authentication and authorization when integrating. Photos/logos accept PNG, JPEG or WebP up to 4 MB each. Brand edits preview immediately; Save brand settings persists them. Opening a saved poster restores its brand snapshot for editing; this does not persist the brand until explicitly saved. Saving a poster creates a new snapshot. Birthdays use the device's local calendar date. Long copy wraps; review your preview before exporting.

Generated artwork is stored in `public/templates/`; the exact prompt set is in `docs/template-prompts.md`. Image generation happens during development, not at runtime; no image API key is needed to use the studio.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The browser test writes screenshots and sample exported posters into `docs/` and exercises the local API. Use `DB_PATH` to select an isolated SQLite database for test runs if desired.

Framework references: [Vite guide](https://vite.dev/guide/), [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).
