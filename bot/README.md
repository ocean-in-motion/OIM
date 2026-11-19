# Motion Bot backend (Netlify Function)

GitHub Pages is static, so the Claude API key can't live in the site's JavaScript.
This small Netlify function holds the key and talks to Claude. The website itself stays on GitHub Pages.

## Set up (about 5 minutes)
1. Netlify > **Add new site > Import an existing project** > pick the `ocean-in-motion/OIM` repo.
2. Build settings: **Base directory** = `bot`. Leave the rest as is. Name the site something like `oim-motion-bot`.
3. Site configuration > **Environment variables** > add `ANTHROPIC_API_KEY` = your key. Then trigger a redeploy.
4. Your endpoint is `https://<site-name>.netlify.app/.netlify/functions/chat`. Put that in `js/chatbot.js` as `CHAT_API`.

Until `CHAT_API` is set, Motion Bot keeps working as the guided quiz.

## Safety built in
- Only ocean-in-motion.com (and the github.io mirror) can call it.
- 20 messages per visitor per 10 minutes, short replies (400-token cap), last 12 messages only.
- Set a monthly spend limit on the key in the Anthropic Console.
