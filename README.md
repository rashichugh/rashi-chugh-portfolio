# Rashi Chugh — Portfolio & Studio

A colourful, playful portfolio for **Rashi Chugh**, built with **Next.js App Router, TypeScript, Supabase and Vercel**. It uses Rashi’s real Behance projects, motion pieces, resume, experience and contact details.

## What’s included

### Public portfolio

- **Home** — animated hero, four featured projects, the interactive 3D Sticker Capsule Club, visible sticker artwork and an angular/parallax contact footer.
- **About (`/about`)** — a dedicated editable page with Rashi’s introduction, Everyday Toolkit, services, work experience and education.
- **Contact (`/contact`)** — separate project-enquiry and Google Meet modes, direct email/social links, visitor-local slot labels and honest delivery status.
- **Work archive** — category filters and a responsive project grid. Work entries are individual case studies rather than permanent discipline groupings.
- **Project pages** — image-led case studies, galleries, lightboxes, custom video controls and external embeds.
- **36 original sticker designs** — inline SVG artwork across four packs, used in the loader, page decorations, capsule machine and collectible reveals.
- **Motion and accessibility** — interactive session loader, immediate custom-cursor tracking, coordinated route transitions, spring reveals, keyboard controls, reduced-motion support and responsive mobile navigation.
- Local fonts, images, video and resume; the core portfolio does not depend on third-party asset CDNs at runtime.

### 3D Sticker Capsule Club

The old Wallpaper Studio has been removed. The Home playground is now a glass-domed capsule machine built with React Three Fiber, Drei and Rapier:

- Drag to orbit the machine, click its 3D crank, or use **Turn the crank**.
- A rigid-body capsule drops and tumbles out before a randomized sticker reveal and confetti burst.
- **Give it a shake** moves the capsules inside the chamber.
- With the stage focused, **Space** or **Enter** cranks and **S** shakes.
- The collection holds up to 18 drops in `localStorage`, shows the latest six, reopens collected stickers and can be cleared.
- The scene mounts near the viewport, pauses offscreen, adapts its rendering quality and respects reduced motion.
- A playable non-WebGL fallback keeps dispensing and collection available.
- There is intentionally no sound.

### Rashi Studio

- Preview/edit switch in the floating **Studio** control.
- Inline editing with debounced autosave and save feedback on Home and About.
- Editable hero, About, contact details and profile content.
- Lucide icon picker for services, with icons at the top-right of each card and no hover arrows.
- Editable toolkit cards with bundled SVG logos, custom SVG uploads, custom colours, five selectable silhouettes and add/remove controls.
- Add, remove and edit work and education cards, including periods, descriptions and card colours.
- Project metadata controls: title, slug, summary, category, year, tags, tools, cover, accent colour, sort order, featured state and Behance URL.
- Draft, publish and delete workflows.
- Full project block editor with drag-and-drop ordering, duplicate, hide/show and delete.
- Eleven block types: heading, rich text, image, grid/masonry gallery, video/embed, quote, callout, list, two-column text, button link and divider.
- Image/video uploads through Supabase Storage in production, plus direct URL inputs for images, galleries and videos.
- Supabase magic-link authentication with an email allowlist.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

With no Supabase environment variables, `npm run dev` runs in **browser-demo mode**. Open **Studio → Edit site** to try the editors. Demo edits persist in that browser’s `localStorage`; they are not shared or written to a server. Demo images are compressed before storage, and demo videos are limited to 4 MB. Use **Studio → Reset demo edits** to restore the authored content. Production builds fail closed when Supabase is not configured: visitors do not see Studio and admin APIs reject writes. For a deliberate private production-preview demo only, set the server-only `STUDIO_DEMO_MODE=true` variable; never enable it on the public deployment.

Google delivery is independent of demo mode. Without the Google variables below, slots are explicitly labelled as a rule-based preview and message/Meet submission returns an error instead of pretending to succeed.

## Connect Supabase

### 1. Create and seed the database

In a new Supabase project, open the SQL editor and run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

The seed adds all five current projects, the site content, and `rashichugh610@gmail.com` to `allowed_admins`. Add or remove other admin emails in that table as needed.

The schema also creates a public `portfolio-media` storage bucket with a 50 MB file limit. Public users get read-only access to published content. Writes go through protected server routes using the service-role key after authentication and allowlist verification.

### 2. Configure authentication

In **Supabase → Authentication → URL Configuration**, add:

- Site URL: your production URL, or `http://localhost:3000` for local development.
- Redirect URL: `https://your-domain.com/auth/callback`.
- Local redirect, if needed: `http://localhost:3000/auth/callback`.

Ensure the Email provider and magic-link sign-in are enabled. The seed allowlists `rashichugh610@gmail.com`; to sign in, Rashi opens **Studio login** in the footer (or `/auth`), enters that email, and opens the magic link sent by Supabase. After the callback returns to the portfolio, the bottom-left **Studio** chip appears for that authenticated, allowlisted account only. She can sign out from the same Studio menu. Other visitors and authenticated emails not present/active in `allowed_admins` do not receive editing controls or write access.

### 3. Add Supabase environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The service-role key is **server-only**. Never expose it through a `NEXT_PUBLIC_` variable or commit `.env.local`. Restart the dev server after changing environment variables.

## Connect Google messages and Meet booking

The Contact page uses **Rashi’s server-only Google OAuth refresh token**. Visitors do not sign in to Google and never receive or grant access to Rashi’s account.

### 1. Enable APIs and configure consent

1. Create or open a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Calendar API** and **Gmail API**.
3. Configure the OAuth consent screen and add these exact scopes:
   - `https://www.googleapis.com/auth/calendar.events` — create events and Meet conferences.
   - `https://www.googleapis.com/auth/calendar.events.freebusy` — read busy intervals without reading event details.
   - `https://www.googleapis.com/auth/gmail.send` — deliver enquiries and booking copies.
4. While the app is in Testing, add Rashi’s Google account as a test user. Google’s testing refresh tokens can expire; publish/verify the app as required for a durable production setup.

### 2. Create an OAuth client and refresh token

Create an **OAuth 2.0 Client ID → Web application** for Rashi’s Google Cloud project. One straightforward way to mint the token is Google’s OAuth 2.0 Playground:

1. Add `https://developers.google.com/oauthplayground` to the client’s authorized redirect URIs.
2. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
3. In its settings, enable **Use your own OAuth credentials** and enter the client ID and secret.
4. Authorize all three scopes above using Rashi’s Google account.
5. Exchange the authorization code for tokens and copy the **refresh token**. If Google does not return one, revoke the app’s access for that account and repeat authorization with consent/offline access.

Treat the refresh token like a password. It is used only in server routes to obtain short-lived access tokens.

### 3. Add Google environment variables

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REFRESH_TOKEN=your-long-lived-refresh-token
GOOGLE_CALENDAR_ID=primary
RASHI_CONTACT_EMAIL=rashichugh610@gmail.com
```

- `GOOGLE_CALENDAR_ID=primary` uses the authorized account’s primary calendar. To book into another calendar, use its calendar ID and ensure Rashi’s account can edit it.
- `RASHI_CONTACT_EMAIL` should be the authorized Gmail address, or a properly verified send-as alias for that account.
- None of these variables should use a `NEXT_PUBLIC_` prefix.

### 4. What each Contact mode does

**Project enquiry**

- Validates and rate-limits the request server-side.
- Sends the enquiry to Rashi through Gmail with the visitor as Reply-To.
- Sends the visitor a confirmation copy.

**Google Meet**

- Reads Google Calendar FreeBusy and removes conflicting slots.
- Rechecks availability immediately before creating an event, reducing stale-slot conflicts.
- Creates a Calendar event with a real Google Meet conference and both visitor and Rashi as attendees.
- Uses `sendUpdates=all`, so Google sends native Calendar invitations to both email addresses.
- Sends Rashi an additional Gmail booking copy containing the Meet link and notes.
- Returns the Meet and Calendar links only after Google confirms event creation.

If credentials are missing, the Meet button is disabled and both submission APIs return `503`; no success is simulated. If Google rejects a request, the UI shows a delivery error and keeps the direct-email fallback visible.

### 5. Booking rules

Dates follow Rashi’s calendar. Slot instants are returned in UTC and labelled in the visitor’s browser timezone.

| Variable | Default | Meaning |
|---|---:|---|
| `BOOKING_TIME_ZONE` | `Asia/Calcutta` | Rashi’s availability timezone (IST) |
| `BOOKING_DURATION_MINUTES` | `30` | Meeting and slot length |
| `BOOKING_START_HOUR` | `10` | First availability boundary, weekdays |
| `BOOKING_END_HOUR` | `18` | End-of-day boundary; the last default slot starts at 17:30 |
| `BOOKING_MIN_NOTICE_HOURS` | `2` | Minimum notice before a slot |
| `BOOKING_MAX_DAYS` | `60` | Advance-booking window |

Availability is Monday–Friday. With the defaults, a fully open weekday exposes 16 half-hour slots. All rules are environment-configurable.

### 6. Verify the live integration

After configuring and restarting/redeploying:

1. Open `/contact` and choose **Book a Google Meet**.
2. Confirm the setup warning is gone and choose a weekday/time.
3. Book using a test Gmail address.
4. Verify that the response shows a real `meet.google.com` link.
5. Check both attendees’ Google Calendars and inboxes for the invitation.
6. Create a conflicting Calendar event and confirm its slot disappears on a fresh availability request.
7. Submit a project enquiry and verify Rashi’s copy plus the visitor confirmation.

## Deploy to Vercel

1. Push this directory to a Git repository and import it in Vercel.
2. Keep the default Next.js settings: `npm install`, `npm run build`, Next.js output.
3. Add the Supabase and Google environment variables to Production, and to Preview only if those environments should deliver real email/bookings.
4. Set `NEXT_PUBLIC_SITE_URL` to the final production domain.
5. Add the production domain and `/auth/callback` redirect in Supabase Authentication.
6. Deploy, sign in at `/auth` with an allowlisted email, and run the Google verification checklist above.

Changing environment variables requires a redeploy/restart. Never commit `.env.local` or expose the Supabase service-role key, Google client secret or refresh token to browser code.

## Editing content

Open **Studio → Edit site**. Dashed outlines identify editable regions. Click, edit and blur a field; changes autosave after a short pause. **Save now** is also available.

For projects, open any project in edit mode or choose **Studio → New project**. Project stories use explicit **Save draft** and **Publish** actions so unfinished block edits are not accidentally published.

- Drag the grip handle to reorder blocks.
- Use **+ Add block** to insert at a precise position.
- Hidden blocks remain editable but do not render publicly.
- Uploaded production media is stored in Supabase Storage and returned as a public URL.

The initial content lives in `src/lib/default-content.ts`. After changing it, regenerate the SQL seed with `npm run seed`. Re-running the seed SQL resets seeded records to authored defaults, so do not run it over live edits unless that is intentional.

## Project structure

```text
src/
  app/
    about/                Dedicated About route
    contact/              Dedicated Contact route
    api/contact/          Slots, message and Meet server endpoints
    auth/                 Supabase authentication
  components/
    editor/               Block editor and media fields
    admin-provider.tsx    Studio mode and controls
    home.tsx              Home, featured work and capsule playground
    about.tsx             Editable About, Toolkit, Services and Journey
    contact.tsx           Enquiry and Meet booking interfaces
    interactive-playground.tsx  Dispensing, reveals and saved collection
    capsule-scene.tsx     R3F/Drei/Rapier machine and capsule physics
    toybox-stickers.tsx   36 original inline-SVG sticker designs
    sticker-trail.tsx     Home/About/Contact sticker decorations
    project-detail.tsx    Project display and publishing controls
    block-renderer.tsx    Public block layouts and lightbox
  lib/
    booking.ts            IST rules, slot generation and revalidation
    google.ts             Server-only OAuth, Calendar, Meet and Gmail
    contact-security.ts   Validation, honeypots and rate limits
    default-content.ts    Authored portfolio content
    content.ts            Server content reads with local fallback
    supabase/             Browser, server, middleware and admin clients
supabase/
  schema.sql              Tables, RLS and storage
  seed.sql                Initial site, projects and admin allowlist
public/
  images/                 Rashi’s project artwork and profile
  videos/                 Rashi’s motion work
  fonts/                  Self-hosted typefaces
  resume/                 Downloadable resume
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```

The current implementation passes lint, typecheck and the optimized production build. Browser/API QA is saved at `../research/capsule-pages-qa.cjs` and `../research/capsule-pages-qa.json`. It covers WebGL rendering, crank and keyboard dispensing, confetti, reload persistence, About reveals, Contact tabs and slot selection, sitemap routes, mobile overflow, a centered in-viewport mobile sticker reveal and the expected unconfigured `503` responses. Live Google delivery still requires the credential-based checklist above; OAuth secrets are not included in this project.

## Content note

Project imagery, motion pieces, resume content and profile photography come from Rashi’s supplied documents and her Behance profile: [behance.net/rashichugh](https://www.behance.net/rashichugh). Project descriptions avoid invented metrics, testimonials or client outcomes.

Default toolkit brand-vector paths are bundled from Simple Icons (CC0); product marks remain the property of their respective owners. Custom toolkit SVGs are stored with the site content rather than fetched at runtime.
