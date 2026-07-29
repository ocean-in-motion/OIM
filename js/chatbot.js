// O.I.M. guided-quiz chat widget — no AI, no backend, fully client-side.
// Helps an unsure visitor land on the right package or the contact page.

(function () {
  var CONTACT_EMAIL = 'oceaninmotionco@gmail.com';

  // Site uses clean URLs: root index.html lives at "/", every other page
  // lives one folder deep (e.g. "/packages/index.html" served as "/packages/").
  // This widget's markup is shared across every depth, so links need a
  // relative prefix that adapts to wherever the current page actually is.
  var _p = window.location.pathname.replace(/index\.html$/, '');
  var BASE = /\/(about|packages|contact|thank-you)\/?$/.test(_p) ? '../' : '';

  // ---------- conversation tree ----------
  var quiz = {
    start: {
      message: "Hey, I'm Motion Bot 🌊 I can help you find the right fit — mind if I ask a few quick questions?",
      options: [
        { label: "Sure, let's do it", next: 'stage' },
        { label: 'Just show me the packages', action: 'goto', url: BASE + 'packages/#core-packages' },
        { label: "I'd rather just email you", next: 'unsure' }
      ]
    },
    stage: {
      message: "First — where's your business right now?",
      options: [
        { label: 'Just starting out, or rebranding', next: 'newBiz' },
        { label: 'Established, but marketing feels scattered', next: 'scattered' },
        { label: 'Doing fine, want to scale aggressively', next: 'scaleUp' },
        { label: "Honestly, I'm not sure", next: 'unsure' }
      ]
    },
    newBiz: {
      message: 'Got it. What do you need most right now?',
      options: [
        { label: 'A professional brand identity', next: 'result', result: 'foundation' },
        { label: 'A website', next: 'result', result: 'website' },
        { label: 'Honestly, both', next: 'result', result: 'starter-bundle' },
        { label: 'Not sure yet', next: 'unsure' }
      ]
    },
    scattered: {
      message: "That's a common spot to be in. Which feels most true?",
      options: [
        { label: 'My website works, but growth stalled', next: 'result', result: 'growth' },
        { label: 'Nobody manages our social consistently', next: 'social' },
        { label: 'We need ongoing, hands-on marketing help', next: 'result', result: 'fractional' },
        { label: 'Not sure yet', next: 'unsure' }
      ]
    },
    social: {
      message: 'Got it — how much content are you hoping to put out each month?',
      options: [
        { label: 'Just a handful of posts', next: 'result', result: 'social-starter' },
        { label: 'A steady presence on 2–3 platforms', next: 'result', result: 'social-growth' },
        { label: 'A full content engine with video & ads', next: 'result', result: 'social-premium' }
      ]
    },
    scaleUp: {
      message: 'Love that. How involved do you want O.I.M. to be?',
      options: [
        { label: 'Take over marketing entirely', next: 'result', result: 'fractional' },
        { label: 'Be our long-term partner across everything', next: 'result', result: 'partnership' },
        { label: 'Not sure yet, just exploring', next: 'unsure' }
      ]
    }
  };

  // ---------- results ----------
  var results = {
    foundation: {
      name: 'Anchor — Foundation Package',
      desc: 'Sounds like you need a brand that looks as established as your business really is — logo, identity, and the essentials to launch with credibility.',
      addon: 'Marketing Materials (business cards, signage) and Content Creation (photography) tend to pair well here.',
      link: BASE + 'packages/#pkg-anchor'
    },
    website: {
      name: 'Harbor — Website Package',
      desc: 'A professional site built to be found, load fast, and actually convert visitors into leads.',
      addon: 'Ecommerce, booking systems, and ongoing website maintenance are the most common add-ons.',
      link: BASE + 'packages/#pkg-harbor'
    },
    'starter-bundle': {
      name: 'Anchor + Harbor',
      desc: 'If you need both, most new businesses start with Anchor for the brand itself, then move straight into Harbor so the site matches from day one.',
      addon: 'Bundling both up front usually saves a round of revisions later, since the site gets built around a brand that already exists.',
      link: BASE + 'packages/#pkg-anchor'
    },
    growth: {
      name: 'Current — Growth Package',
      desc: 'Ongoing SEO, GEO, and optimization for a business that already has its foundation in place and is ready to compound.',
      addon: 'Paid ads (Google or Meta) and monthly analytics reporting are popular additions.',
      link: BASE + 'packages/#pkg-current'
    },
    'social-starter': {
      name: 'Tide — Social Media Management (Starter)',
      desc: '4 monthly posts on one platform, handled for you — a simple, consistent presence.',
      addon: 'A little Content Creation (a quick photo or reel session) makes a noticeably bigger difference at this tier.',
      link: BASE + 'packages/#pkg-tide'
    },
    'social-growth': {
      name: 'Tide — Social Media Management (Growth)',
      desc: 'A steady, well-rounded presence across two to three platforms, with reels and community management.',
      addon: 'Paid social ads layer in nicely once the organic content is already consistent.',
      link: BASE + 'packages/#pkg-tide'
    },
    'social-premium': {
      name: 'Tide — Social Media Management (Premium)',
      desc: 'Full strategy, content planning, video editing, and ad management across multiple platforms.',
      addon: 'CRM implementation or email marketing are common next steps at this level.',
      link: BASE + 'packages/#pkg-tide'
    },
    fractional: {
      name: 'Fleet — Partnership Package',
      desc: 'Ocean In Motion becomes your marketing department — strategy, brand, and execution, run together every month.',
      addon: 'AI chatbot implementation and workflow automation are popular add-ons for teams at this stage.',
      link: BASE + 'packages/#pkg-fleet'
    },
    partnership: {
      name: 'Horizon — Business Growth Partnership',
      desc: 'Our highest level of engagement — every part of growth run by one long-term strategic partner.',
      addon: 'This tier is fully custom — add-ons just get folded directly into your proposal, nothing extra to bolt on.',
      link: BASE + 'packages/#pkg-horizon'
    }
  };

  var launcher, panel, body, tooltip, scrollHost;
  var lastResultKey = null;

  function injectMarkup() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<button class="oim-chat-launcher" id="oimChatLauncher" aria-label="Open Motion Bot" aria-expanded="false">' +
        '<span class="ping"></span>' +
        '<img class="icon-chat oim-bot-face" src="assets/motion-bot-face.svg" alt="Motion Bot">' +
        '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>' +
      '</button>' +
      '<div class="oim-chat-tooltip" id="oimChatTooltip">Hey, I\'m Motion Bot — not sure where to start? Ask me →</div>' +
      '<div class="oim-chat-panel" id="oimChatPanel" role="dialog" aria-label="Motion Bot">' +
        '<div class="oim-chat-header">' +
          '<span class="title"><img class="oim-bot-face-sm" src="assets/motion-bot-face.svg" alt="">Motion Bot</span>' +
          '<button class="oim-chat-close" id="oimChatCloseBtn" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="oim-chat-body" id="oimChatBody"></div>' +
        '<div class="oim-chat-footer"><button class="oim-chat-restart" id="oimChatRestart">Start over</button></div>' +
      '</div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    launcher = document.getElementById('oimChatLauncher');
    panel = document.getElementById('oimChatPanel');
    body = document.getElementById('oimChatBody');
    tooltip = document.getElementById('oimChatTooltip');
    scrollHost = body;

    launcher.addEventListener('click', togglePanel);
    document.getElementById('oimChatCloseBtn').addEventListener('click', closePanel);
    document.getElementById('oimChatRestart').addEventListener('click', restart);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  function togglePanel() {
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    panel.classList.add('open');
    launcher.classList.add('open');
    launcher.setAttribute('aria-expanded', 'true');
    hideTooltip();
    try { sessionStorage.setItem('oimChatOpened', '1'); } catch (e) {}
    if (!body.childNodes.length) restart();
  }

  function closePanel() {
    panel.classList.remove('open');
    launcher.classList.remove('open');
    launcher.setAttribute('aria-expanded', 'false');
  }

  function hideTooltip() {
    tooltip.classList.remove('show');
  }

  function scrollToBottom() {
    scrollHost.scrollTop = scrollHost.scrollHeight;
  }

  // ---------- typing indicator ----------
  function showTyping(callback) {
    var typing = document.createElement('div');
    typing.className = 'oim-msg bot oim-typing-msg';
    typing.innerHTML = '<span class="oim-typing"><span></span><span></span><span></span></span>';
    body.appendChild(typing);
    scrollToBottom();
    var delay = 450 + Math.random() * 350;
    setTimeout(function () {
      typing.remove();
      callback();
    }, delay);
  }

  function addBotMessage(text, cb) {
    showTyping(function () {
      var div = document.createElement('div');
      div.className = 'oim-msg bot';
      div.textContent = text;
      body.appendChild(div);
      scrollToBottom();
      if (cb) cb();
    });
  }

  function addUserMessage(text) {
    var div = document.createElement('div');
    div.className = 'oim-msg user';
    div.textContent = text;
    body.appendChild(div);
    scrollToBottom();
  }

  function clearOptions() {
    var existing = body.querySelectorAll('.oim-chat-options');
    existing.forEach(function (el) { el.remove(); });
  }

  function addOptions(options) {
    var optWrap = document.createElement('div');
    optWrap.className = 'oim-chat-options';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'oim-chat-option';
      btn.textContent = opt.label;
      btn.addEventListener('click', function () { handleChoice(opt); });
      optWrap.appendChild(btn);
    });
    body.appendChild(optWrap);
    scrollToBottom();
  }

  function showStep(stepKey) {
    var step = quiz[stepKey];
    addBotMessage(step.message, function () {
      addOptions(step.options);
    });
  }

  function showResult(key) {
    lastResultKey = key;
    var r = results[key];
    addBotMessage("Here's what I'd point you toward:", function () {
      var card = document.createElement('div');
      card.className = 'oim-result-card';
      card.innerHTML =
        '<div class="pkg-name">' + r.name + '</div>' +
        '<p>' + r.desc + '</p>' +
        '<div class="oim-result-actions">' +
          '<a class="oim-chat-btn primary" href="' + r.link + '">See package</a>' +
          '<a class="oim-chat-btn ghost" href="' + BASE + 'contact/">Talk to us</a>' +
        '</div>';
      body.appendChild(card);
      scrollToBottom();
      setTimeout(function () {
        addBotMessage('Does that sound like a fit?', function () {
          addOptions([
            { label: "Yes, that's it", action: 'confirmResult' },
            { label: 'Not quite — show me something else', action: 'restartQuiz' },
            { label: 'What add-ons pair with this?', action: 'showAddon' }
          ]);
        });
      }, 400);
    });
  }

  function handleChoice(opt) {
    clearOptions();
    addUserMessage(opt.label);
    setTimeout(function () {
      if (opt.action === 'goto') {
        window.location.href = opt.url;
      } else if (opt.action === 'restartQuiz') {
        addBotMessage("No worries — let's try again.", function () {
          showStep('stage');
        });
      } else if (opt.action === 'confirmResult') {
        addBotMessage("Great choice \uD83C\uDF89 Use the buttons above whenever you're ready — I'll be here if you need anything else.");
      } else if (opt.action === 'showAddon') {
        var r = results[lastResultKey];
        addBotMessage(r ? r.addon : 'Happy to talk through add-ons directly — just reach out.');
      } else if (opt.next === 'result') {
        showResult(opt.result);
      } else if (opt.next === 'unsure') {
        showUnsure();
      } else {
        showStep(opt.next);
      }
    }, 300);
  }

  function showUnsure() {
    addBotMessage("No worries — that happens a lot. The easiest next step is just to reach out directly and we'll help you figure out the right fit.", function () {
      var card = document.createElement('div');
      card.className = 'oim-result-card';
      card.innerHTML =
        '<div class="pkg-name">Let\'s talk it through</div>' +
        '<p>Email us directly at <strong style="color:var(--ink);">' + CONTACT_EMAIL + '</strong>, or use the contact form and we\'ll walk you through it.</p>' +
        '<div class="oim-result-actions">' +
          '<a class="oim-chat-btn primary" href="' + BASE + 'contact/">Go to contact page</a>' +
        '</div>';
      body.appendChild(card);
      scrollToBottom();
    });
  }

  function restart() {
    body.innerHTML = '';
    lastResultKey = null;
    showStep('start');
  }

  function maybeShowTooltip() {
    var alreadyOpened;
    try { alreadyOpened = sessionStorage.getItem('oimChatOpened'); } catch (e) { alreadyOpened = null; }
    if (alreadyOpened) return;
    setTimeout(function () {
      if (!panel.classList.contains('open')) tooltip.classList.add('show');
    }, 3500);
    setTimeout(hideTooltip, 11000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectMarkup();
    maybeShowTooltip();
  });
})();
