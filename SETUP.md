# Mel Carter Photography — setup checklist

Your Firebase project, Web3Forms key, email, and Instagram are already wired
into the site. Two things still need to be switched on inside the Firebase
console before the gallery/admin dashboard fully works:

## 1. Turn on Firestore (free on Spark)
Firebase console → **Build → Firestore Database → Create database**.
Any location is fine; start in production mode (the site only reads/writes
through the admin login, so default rules are fine to start).

## 2. Turn on Authentication (free on Spark)
Firebase console → **Build → Authentication → Sign-in method** → enable
**Email/Password**. Then go to the **Users** tab → **Add user** and create
the login you'll use at `/admin` (any email + password you choose — it
doesn't have to be melcarterphotography@gmail.com).

## 3. Turn on Storage — requires the Blaze plan
As of Feb 2026, Firebase requires the pay-as-you-go **Blaze** plan for
*any* Cloud Storage usage, even tiny amounts — this is a Firebase-wide
policy change, not something specific to this site. You still get the
same free monthly quota on Blaze; it just needs a card on file.
Firebase console → bottom-left **Upgrade** → choose Blaze → link a card.
Then **Build → Storage → Get started**.

Until Storage is enabled, photo uploads in `/admin` will fail — but you can
still add YouTube videos via the admin dashboard, since those don't need
Storage. The public site itself works fine right now; it just shows
placeholder gallery tiles until real content is uploaded.

## Already done
- Firebase project connected (`firebase-config.js`)
- Contact form wired to Web3Forms (your key is in `index.html`)
- Email set to melcarterphotography@gmail.com (contact page + footer)
- Instagram linked (contact page + footer)

Facebook/Pinterest icons were left out rather than pointing nowhere — send
me those links any time and I'll drop them back in.
