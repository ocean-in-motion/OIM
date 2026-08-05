# Mel Carter Photography

Marketing site for Mel Carter Photography — weddings & couples, portraits,
headshots, and pet photography/film.

## Structure

- `index.html` — the whole public site (Home, Photography, Videography,
  Contact) as a single-page app with hash-based routing
- `admin/index.html` — content dashboard for uploading photos/videos and
  managing what shows in the site's galleries (Firebase-backed)
- `thank-you/index.html` — landing page shown after a successful contact
  form submission
- `firebase-config.js` — Firebase project connection (Firestore + Storage
  + Auth power the admin dashboard and galleries)
- `images/` — logo and favicon assets
- `robots.txt` — keeps `/admin` out of search indexing

## Setup

See [`SETUP.md`](./SETUP.md) for the remaining one-time steps (enabling
Firestore/Auth/Storage in the Firebase console) before the admin dashboard
and photo uploads are fully live.

## Deploying

This is a static site — no build step. Deploy by pointing any static host
(GitHub Pages, Netlify, Vercel, Firebase Hosting, etc.) at this folder.
