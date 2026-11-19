# Project guide

Confetti is a React/Vite birthday reminder deployed on Netlify. It is an installable web app; Android APK compilation is outside this project's scope.

## Architecture

- `src/App.tsx` owns navigation and transient interface state. Views are rendered within the root page; there are no client-side URL routes.
- `src/components/` contains the birthday editor, accessible native dialog wrapper, calendar, birthday list, and original cake artwork.
- `src/lib.ts` centralizes date calculations, sample content, API access, and RFC 5545 calendar export.
- `src/styles.css` contains the complete responsive design. The palette uses warm ivory, terracotta, and muted botanical accents. Fraunces is the display typeface; DM Sans is the body typeface.
- `netlify/server/index.ts` is the single Hono server entrypoint. It handles `/api/*` only. Static Vite output serves the root page and assets.
- `db/schema.ts` is the source of truth for database tables. `db/index.ts` creates the Drizzle client using `drizzle-orm/netlify-db`.
- `netlify/database/migrations/` contains generated SQL and schema snapshots. Netlify applies migrations at deployment. Do not apply them directly or alter an applied migration.
- `public/manifest.webmanifest`, `public/sw.js`, and `public/icons/` implement installation. `scripts/generate-icons.mjs` regenerates PNG icons from their SVG source.

## Conventions

Use TypeScript, React function components, plain CSS, and Lucide icons. Keep UI copy warm, concise, and specific. Maintain loading, error, offline, empty, and success states. Dialogs use the native dialog element for focus trapping and keyboard dismissal. Respect reduced-motion preferences. Personal birthday records must never appear in the shared site metadata.

Use Node.js 24 or later for Netlify Server. Keep both `drizzle-orm` and `drizzle-kit` on the beta tag because the Netlify Database adapter requires it. Use `.js` specifiers for server-side TypeScript imports as supported by the server bundler. For database changes, update the schema, then run `npx drizzle-kit generate --name <descriptive_name>`; this is code generation, not a migration application.

Use Netlify Database for all persistent application records. Never replace it with local storage, local JSON, or process memory. Browser memory is only for the current UI. API responses must have `Cache-Control: private, no-store`, and the service worker must never cache them.

## Important decisions

The app uses browser-scoped circles without user accounts. A random HTTP-only, SameSite cookie identifies a circle; only its SHA-256 digest is used for database scoping, and it is never returned in JSON. Every read, update, and delete must remain scoped to the current circle. Mutations require the same origin and JSON content where applicable. Do not log browser cookies or expose database errors or configuration.

Sample birthdays exist only in the frontend when the saved circle is empty. They are clearly labeled, never written to the database, and cannot be exported as personal calendar reminders. Saving the first real birthday replaces the sample circle.

Birth years are optional. Date comparisons use local calendar days rather than elapsed hours to handle daylight saving changes. February 29 is celebrated on the last day of February in every year, and exported recurrence rules use the same policy. Calendar export uses stable event IDs, escapes text, and folds lines by UTF-8 byte length.

Reminders are delivered by the user's calendar after importing `.ics` events, not by background web push. Changes do not synchronize to imported calendar events. Keep these limits visible in the relevant flows. Do not add a notification toggle that cannot deliver notifications.

The service worker precaches the root HTML and the hashed entry assets referenced by the built page. It caches static content only. Bump its cache version when changing the offline strategy and remove only Confetti's caches.

## Running and verification

Use `netlify dev --port 8889` for local work when permitted so the API and frontend run together. The platform automatically validates production builds. Follow the current session's rules about whether local build, development, and test commands may be run.
