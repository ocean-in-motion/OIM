# Motion Bot proxy (Cloudflare Worker)

GitHub Pages is static, so the Claude API key can't live in the site's JavaScript
(anyone could copy it). This tiny worker holds the key and talks to Claude.

## Deploy (about 5 minutes, free tier is plenty)
1. Create a free Cloudflare account, then install Wrangler: `npm i -g wrangler` and run `wrangler login`.
2. In this `worker/` folder run: `wrangler deploy`
3. Add your key as a secret: `wrangler secret put ANTHROPIC_API_KEY` and paste it when asked.
4. Copy the worker URL it prints (looks like `https://oim-motion-bot.<you>.workers.dev`).
5. Put that URL in `js/chatbot.js` as `CHAT_API`, commit and push.

Until `CHAT_API` is filled in, Motion Bot keeps working as the guided quiz.

## Safety built in
- Only ocean-in-motion.com (and the github.io mirror) can call it.
- 20 messages per visitor per 10 minutes, short replies (400 token cap), last 12 messages only.
- Set a monthly spend limit on the key in the Anthropic Console.
