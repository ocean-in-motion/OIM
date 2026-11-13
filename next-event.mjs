// Next Event: reads @dj_narci's recent public Instagram posts (Business Discovery) and has
// Claude look at each photo post ONCE to decide whether it's a flyer for an event. For event
// flyers it pulls out the name, date, times and venue and writes a short description.
// The site shows the soonest event that hasn't happened yet.
// Narci never logs in and doesn't have to tag anything. (#event still works as an override.)
//
// Netlify environment variables:
//   FB_TOKEN           Page access token for the Facebook Page linked to your Instagram Business account
//   IG_USER_ID         Your Instagram Business account ID (not Narci's)
//   ANTHROPIC_API_KEY  From console.anthropic.com. Without it, only posts tagged #event are used (caption shown).
//   IG_TARGET          Optional. Defaults to dj_narci
//   GRAPH_VER          Optional. Defaults to v27.0
//   CLAUDE_MODEL       Optional. Defaults to claude-haiku-5-5
//   EVENT_TZ           Optional. Defaults to America/New_York

import { getStore } from "@netlify/blobs";

const TAG = /(^|\s)#event(?![\w])/i;   // manual override: always treat as an event
const LOOK_BACK_POSTS = 12;            // how many recent posts to consider
const MAX_AGE_DAYS = 75;               // ignore posts older than this (flyers go up a few weeks ahead)
const HAPPENING_GRACE_H = 5;           // keep showing an event this long after it starts if no end time
const MAX_NEW_READS = 4;               // new posts Claude reads per visit (keeps us under Netlify's 10s limit)
const READ_TIMEOUT_MS = 7500;          // give up on a read after this; it retries next visit

async function readSaved(post, store) {
  if (!store) return undefined;
  try { const v = await store.get(`post-${post.id}`, { type: "json" }); return v ? v.info : undefined; } catch (e) { return undefined; }
}
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((r) => setTimeout(() => r(null), ms))]);
}

export default async () => {
  // trim: pasted values often carry a stray space, newline or quotes
  const clean = (v) => (v || "").trim().replace(/^["']|["']$/g, "");
  const FB_TOKEN = clean(process.env.FB_TOKEN), IG_USER_ID = clean(process.env.IG_USER_ID);
  const ANTHROPIC_API_KEY = clean(process.env.ANTHROPIC_API_KEY);
  process.env.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY;
  const target = process.env.IG_TARGET || "dj_narci";
  const ver = process.env.GRAPH_VER || "v27.0";
  if (!FB_TOKEN || !IG_USER_ID) return json({ error: "Missing FB_TOKEN or IG_USER_ID" }, 500, false);

  const fields =
    `business_discovery.username(${target})` +
    `{media.limit(${LOOK_BACK_POSTS}){id,caption,media_type,media_url,permalink,timestamp,children{media_type,media_url}}}`;
  const url = `https://graph.facebook.com/${ver}/${IG_USER_ID}?fields=${encodeURIComponent(fields)}&access_token=${FB_TOKEN}`;

  let posts;
  try {
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok || body.error) {
      // Common causes: token expired, or the target account is personal or private.
      console.error("Instagram error:", JSON.stringify(body.error || body));
      // Meta's own message (never contains the token) so the problem is visible right here
      const e = body.error || {};
      return json({ error: "Instagram request failed", meta: { message: e.message, type: e.type, code: e.code, subcode: e.error_subcode } }, 502, false);
    }
    posts = body.business_discovery?.media?.data || [];
  } catch (err) {
    console.error(err);
    return json({ error: "Instagram request failed" }, 502, false);
  }

  // Photo posts only (first slide of carousels), recent enough to be about something upcoming.
  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
  const candidates = posts
    .map((p) => ({ ...p, image: firstImage(p) }))
    .filter((p) => p.image && new Date(p.timestamp).getTime() > cutoff);

  // ---- No API key: old behaviour, newest post tagged #event, caption only ----
  if (!ANTHROPIC_API_KEY) {
    const p = candidates.find((c) => TAG.test(c.caption || ""));
    return json({ event: p ? toEvent(p, null) : null });
  }

  // ---- Claude reads each candidate once, results are saved per post ----
  // Netlify's free plan stops a function after ~10s, so each visit reads at most a few
  // new posts (in parallel, with a time limit). The rest get read on the next visits.
  const store = openStore();
  const saved = await Promise.all(candidates.map((p) => readSaved(p, store)));
  let fresh = 0, pending = 0;
  const analysed = await Promise.all(candidates.map(async (p, i) => {
    if (saved[i] !== undefined) return { post: p, info: saved[i] };
    if (fresh >= MAX_NEW_READS) { pending++; return { post: p, info: null }; }
    fresh++;
    const info = await withTimeout(analysePost(p, store), READ_TIMEOUT_MS);
    if (info === null) pending++;
    return { post: p, info };
  }));

  const now = Date.now();
  const upcoming = analysed
    .filter(({ post, info }) => info && (info.is_event || TAG.test(post.caption || "")) && info.startISO)
    .filter(({ info }) => {
      const end = info.endISO ? new Date(info.endISO).getTime() : new Date(info.startISO).getTime() + HAPPENING_GRACE_H * 36e5;
      return end > now;                                   // not over yet
    })
    .sort((a, b) => new Date(a.info.startISO) - new Date(b.info.startISO));   // soonest first

  if (upcoming.length) return json({ event: toEvent(upcoming[0].post, upcoming[0].info) }, 200, pending === 0);
  // Still reading posts and nothing found yet: tell the page to try again shortly (not cached).
  if (pending) return json({ pending }, 503, false);

  // A #event post Claude couldn't date: still show it with its caption.
  const tagged = analysed.find(({ post }) => TAG.test(post.caption || ""));
  if (tagged && !(tagged.info && tagged.info.startISO)) return json({ event: toEvent(tagged.post, null) });

  return json({ event: null });   // nothing coming up: the section hides itself
};

function toEvent(post, info) {
  return {
    image: post.image,
    caption: cleanCaption(post.caption),
    ticketUrl: findTicketLink(post.caption),
    permalink: post.permalink,
    postedAt: post.timestamp,
    details: info && info.date ? info : null,   // null -> the page shows the caption instead
  };
}

/* ---------- Claude: is this an event flyer? If so, what are the details? ---------- */

function openStore() {
  try { return getStore("flyer-details-v2"); } catch (e) { return null; }
}

async function analysePost(post, store) {
  const cacheKey = `post-${post.id}`;
  if (store) {
    try { const saved = await store.get(cacheKey, { type: "json" }); if (saved) return saved.info; } catch (e) {}
  }

  let info;
  try {
    const img = await fetch(post.image);
    if (!img.ok) throw new Error(`flyer image ${img.status}`);
    const mediaType = (img.headers.get("content-type") || "image/jpeg").split(";")[0];
    const data = Buffer.from(await img.arrayBuffer()).toString("base64");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 600,
        tools: [{
          name: "save_post",
          description: "Save whether this Instagram post is a flyer for a specific event, and its details if so.",
          input_schema: {
            type: "object",
            properties: {
              is_event: { type: "boolean", description: "true only if the post promotes a specific event (party, club night, show, festival set) with a date. Recaps, photos, mixes, merch, memes and generic promos are false." },
              title: { type: ["string", "null"], description: "Event name in normal capitalization (e.g. 'Rum in the Sun')" },
              subtitle: { type: ["string", "null"], description: "Short tagline printed on the flyer (e.g. 'One year anniversary'), else null" },
              description: { type: ["string", "null"], description: "1-2 short sentences (under 220 characters) for the DJ's website describing the night: the vibe, the music, anything special. Only use what's on the flyer or in the caption. No emojis, no hashtags." },
              date: { type: ["string", "null"], description: "YYYY-MM-DD. Infer the year from the post date if the flyer omits it." },
              start: { type: ["string", "null"], description: "Start time, 24h HH:MM" },
              end: { type: ["string", "null"], description: "End time, 24h HH:MM, or null" },
              venue: { type: ["string", "null"], description: "Venue name" },
              address: { type: ["string", "null"], description: "Street address and city, or just the city if that's all that's shown" },
            },
            required: ["is_event", "title", "subtitle", "description", "date", "start", "end", "venue", "address"],
          },
        }],
        tool_choice: { type: "tool", name: "save_post" },
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text:
              `This image is from DJ Narci's Instagram (Afrobeats, dancehall, soca, Tampa Bay), posted ${post.timestamp}.\n` +
              `Caption:\n${(post.caption || "").slice(0, 1500)}\n\n` +
              `Decide whether it's a flyer for a specific event. If it is, save the details from the flyer ` +
              `(use the caption if the flyer is unclear) and write the short description. ` +
              `Use null for anything that isn't shown. Don't guess.` },
          ],
        }],
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`Claude ${res.status}: ${JSON.stringify(body.error || body).slice(0, 300)}`);
    const out = (body.content || []).find((c) => c.type === "tool_use")?.input;
    if (!out) throw new Error("no answer");
    const tz = process.env.EVENT_TZ || "America/New_York";
    info = {
      ...out,
      startISO: out.date && out.start ? zonedISO(out.date, out.start, tz) : null,
      endISO: out.date && out.start && out.end ? zonedISO(out.date, out.end, tz, out.start) : null,
    };
  } catch (err) {
    console.error(`Reading post ${post.id} failed:`, err.message || err);
    return null;   // not saved, so it tries again next time
  }

  if (store) { try { await store.setJSON(cacheKey, { info, savedAt: new Date().toISOString() }); } catch (e) {} }
  return info;
}

// "2026-11-15" + "16:00" in America/New_York -> ISO string with the right offset.
// An end time earlier than the start (e.g. 10PM to 2AM) rolls over to the next day.
function zonedISO(date, time, tz, startTime) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  let day = d;
  if (startTime && time < startTime) day += 1;
  const guess = Date.UTC(y, mo - 1, day, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asIfUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asIfUTC - guess)).toISOString();
}

/* ---------- helpers ---------- */

function firstImage(post) {
  if (post.media_type === "IMAGE") return post.media_url || null;
  if (post.media_type === "CAROUSEL_ALBUM") {
    const first = post.children?.data?.[0];
    return first?.media_type === "IMAGE" ? first.media_url || null : null;
  }
  return null; // videos and Reels
}

// Whole caption; only the #event tag is removed.
function cleanCaption(caption = "") {
  return caption
    .replace(/(^|\s)#event(?![\w])/gi, "$1")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// First link written in the caption becomes the "Get tickets" button
// (e.g. posh.vip/..., eventbrite.com/..., onelinkentertainment.com). null if there isn't one.
function findTicketLink(caption = "") {
  const m = caption.match(/\bhttps?:\/\/[^\s)]+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|vip|co|io|events?|tickets?|link|me|us|app)(?:\/[^\s)]*)?/i);
  if (!m) return null;
  const url = m[0].replace(/[.,!?]+$/, "");
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

function json(body, status = 200, cache = true) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
      // Netlify's CDN keeps the answer for 15 minutes, so Instagram and Claude are asked rarely.
      "Netlify-CDN-Cache-Control": cache ? "public, s-maxage=900, stale-while-revalidate=3600" : "no-store",
    },
  });
}

// Reading a batch of new posts can take a few seconds the first time.
export const config = { path: "/api/next-event" };
