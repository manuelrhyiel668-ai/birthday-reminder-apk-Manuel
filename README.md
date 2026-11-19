# Confetti — Birthday Reminder

Confetti is an installable web app for remembering the people you care about. It pairs a warm, illustrated interface with a personal birthday circle, countdowns, favorites, notes, and annual calendar reminders.

## Features

- Add, edit, and remove birthdays, with an optional birth year, relationship, favorite, avatar color, and gift notes.
- Browse upcoming birthdays, search your circle, and filter by relationship or favorites.
- Explore a monthly calendar, including annual handling for February 29 birthdays.
- Export one birthday or your whole circle as recurring `.ics` calendar events with your selected alerts.
- Install on Android, iPhone, iPad, or desktop from a supported browser. Share the app by link.
- Preview a clearly labeled sample circle until you save your first birthday.

This is an installable web app, not an Android APK. Reminder notifications come from the calendar application after importing the calendar file and enabling its notifications. Confetti does not send background web push notifications.

## Technology

React 19, TypeScript, Vite, Lucide icons, and custom CSS power the interface. A Hono application runs on Netlify Server. Birthdays persist in Netlify Database through the Drizzle ORM adapter. A web app manifest and service worker provide installation and cache the static app shell. Icons and the cake illustration use original vector artwork.

## Local development

Use Node.js 24 or later. Install dependencies and run through Netlify CLI so the frontend, server, and database integration share one origin:

```sh
npm install
netlify dev --port 8889
```

Open `http://localhost:8889`. Netlify provides database configuration for the linked project. Do not put credentials in source files.

The deploy pipeline runs the Vite production build. Netlify automatically applies migrations from `netlify/database/migrations/` before publishing. For schema changes, edit `db/schema.ts` and generate a named migration with `npx drizzle-kit generate --name <descriptive_name>`. Do not manually apply migrations.

To regenerate the checked-in install icons after changing their vector source:

```sh
node scripts/generate-icons.mjs
```

## Installation and data

On Android, open the site in Chrome and use **Install app** or **Add to Home screen** in the browser menu. On iPhone and iPad, open it in Safari, tap **Share**, and choose **Add to Home Screen**. Chrome and Edge also offer desktop installation. The app includes installation help and uses the native browser install prompt where available. Installation requires HTTPS in production.

Birthdays are stored online and scoped to a cryptographically random, HTTP-only browser cookie. Visitors have separate circles without creating an account. Clearing site data, changing browsers, or moving to another device creates a new circle; there is no account recovery or cross-device synchronization. Export a calendar copy to keep your dates outside the app.

The service worker caches only static assets. Birthday responses are never cached locally. An internet connection is required to load or save your circle. Calendar events already imported work according to the calendar app's notification and offline settings. Updating or deleting a birthday in Confetti does not automatically update a previously imported calendar event.
