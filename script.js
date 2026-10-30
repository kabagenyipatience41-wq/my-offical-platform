/* ==========================================================
   Kabagenyi Patience — bright blog
   Theme switcher, typing effect, story filters, session panel.
   Everything runs locally; nothing is sent to a server.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- Safe storage ---------- */
  var memory = { localStorage: {}, sessionStorage: {} };
  var store = {
    get: function (area, key) {
      try { return window[area].getItem(key); }
      catch (e) { return Object.prototype.hasOwnProperty.call(memory[area], key) ? memory[area][key] : null; }
    },
    set: function (area, key, value) {
      try { window[area].setItem(key, value); }
      catch (e) { memory[area][key] = String(value); }
    },
    remove: function (area, key) {
      try { window[area].removeItem(key); }
      catch (e) { delete memory[area][key]; }
    }
  };

  var KEYS = {
    theme: 'kp-theme', guest: 'kp-guest',
    firstVisit: 'kp-first-visit', totalVisits: 'kp-total-visits',
    sessionStart: 'kp-session-start', pageViews: 'kp-session-views',
    postsOpened: 'kp-session-posts', themeChanges: 'kp-session-theme-changes',
    clicks: 'kp-session-clicks'
  };

  var THEMES = [
    { id: 'sunshine', label: 'Sunshine' },
    { id: 'berry',    label: 'Berry' },
    { id: 'mint',     label: 'Mint' },
    { id: 'sky',      label: 'Sky' },
    { id: 'neon',     label: 'Neon Night' }
  ];

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pageLoadedAt = Date.now();
  var maxScroll = 0;
  var activeFilter = 'all';

  /* ==========================================================
     THEMES
     ========================================================== */
  var picker = document.getElementById('themePicker');
  var footerTheme = document.getElementById('footerTheme');

  var SWATCH = {
    sunshine: 'linear-gradient(135deg,#ff4d8d,#ffb400)',
    berry:    'linear-gradient(135deg,#d6249f,#5b21b6)',
    mint:     'linear-gradient(135deg,#00a884,#2ad4ff)',
    sky:      'linear-gradient(135deg,#1e6bff,#00c2ff)',
    neon:     'linear-gradient(135deg,#ff2fb3,#00f0ff)'
  };

  function themeLabel(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i].label;
    return id;
  }
  function currentTheme() { return root.getAttribute('data-theme') || 'sunshine'; }

  function applyTheme(id, userInitiated) {
    root.setAttribute('data-theme', id);
    store.set('localStorage', KEYS.theme, id);
    if (footerTheme) footerTheme.textContent = themeLabel(id);
    var buttons = picker.querySelectorAll('.theme-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.theme === id));
    }
    if (userInitiated) {
      var n = parseInt(store.get('sessionStorage', KEYS.themeChanges) || '0', 10) + 1;
      store.set('sessionStorage', KEYS.themeChanges, String(n));
      renderSession();
    }
  }

  function buildPicker() {
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-btn';
      b.dataset.theme = t.id;
      b.title = t.label;
      b.setAttribute('aria-label', t.label + ' theme');
      b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--swatch', SWATCH[t.id]);
      b.addEventListener('click', function (e) {
        applyTheme(t.id, true);
        burst(e.clientX, e.clientY, ['🎨', '✨', '💖']);
      });
      picker.appendChild(b);
    });
  }

  /* ==========================================================
     EMOJI BURST (small delight)
     ========================================================== */
  var burstLayer = document.getElementById('burstLayer');
  function burst(x, y, emojis) {
    if (reduceMotion || !burstLayer) return;
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('span');
      s.className = 'burst';
      s.textContent = emojis[i % emojis.length];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', (Math.random() * 220 - 110) + 'px');
      s.style.setProperty('--dy', (Math.random() * -180 - 20) + 'px');
      s.style.setProperty('--rot', (Math.random() * 120 - 60) + 'deg');
      burstLayer.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 1200); })(s);
    }
  }

  var sticker = document.getElementById('sticker');
  if (sticker) {
    sticker.addEventListener('click', function (e) {
      burst(e.clientX, e.clientY, ['🎉', '🌟', '💛', '🌈']);
    });
    document.querySelector('.hero-card').addEventListener('click', function (e) {
      burst(e.clientX, e.clientY, ['🎉', '🌟', '💛', '🌈']);
    });
  }

  /* ==========================================================
     TYPING EFFECT
     ========================================================== */
  var typedEl = document.getElementById('typed');
  var PHRASES = [
    "life as an IT student",
    "things I'm learning",
    "tech, ideas & small joys",
    "growing, one day at a time"
  ];

  function startTyping() {
    if (!typedEl) return;
    if (reduceMotion) { typedEl.textContent = PHRASES[0]; return; }
    var p = 0, c = 0, deleting = false;
    (function tick() {
      var word = PHRASES[p];
      typedEl.textContent = word.slice(0, c);
      var delay = deleting ? 35 : 80;
      if (!deleting && c === word.length) { deleting = true; delay = 1600; }
      else if (deleting && c === 0) { deleting = false; p = (p + 1) % PHRASES.length; delay = 400; }
      c += deleting ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  /* ==========================================================
     GUEST GREETING
     ========================================================== */
  var greetingEl = document.getElementById('greeting');
  var helloForm = document.getElementById('helloForm');
  var guestInput = document.getElementById('guestName');
  var formNote = document.getElementById('formNote');
  var forgetBtn = document.getElementById('forgetName');
  var DEFAULT_GREETING = greetingEl ? greetingEl.textContent : '';

  function getGuest() { return store.get('localStorage', KEYS.guest) || ''; }

  function showGreeting() {
    var name = getGuest();
    if (greetingEl) greetingEl.textContent = name ? 'Welcome, ' + name + '! 👋' : DEFAULT_GREETING;
    if (forgetBtn) forgetBtn.hidden = !name;
    if (guestInput && name) guestInput.value = name;
  }

  if (helloForm) {
    helloForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = guestInput.value.trim().replace(/[<>]/g, '').slice(0, 30);
      if (!name) { formNote.textContent = 'Type your name first, then say hello.'; return; }
      store.set('localStorage', KEYS.guest, name);
      showGreeting();
      formNote.textContent = "Lovely to meet you, " + name + "! I'll remember you on this device.";
      burst(window.innerWidth / 2, window.innerHeight / 2, ['👋', '💖', '✨']);
      renderSession();
    });
    forgetBtn.addEventListener('click', function () {
      store.remove('localStorage', KEYS.guest);
      guestInput.value = '';
      showGreeting();
      formNote.textContent = "Done — I've forgotten your name.";
      renderSession();
    });
  }

  /* ==========================================================
     STORY FILTERS + READ MORE
     ========================================================== */
  var chips = document.querySelectorAll('.chip');
  var posts = document.querySelectorAll('.post');
  var emptyNote = document.getElementById('emptyNote');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      posts.forEach(function (p) {
        var match = activeFilter === 'all' || p.dataset.category === activeFilter;
        p.hidden = !match;
        if (match) shown++;
      });
      emptyNote.hidden = shown !== 0;
      renderSession();
    });
  });

  function getOpenedPosts() {
    try { return JSON.parse(store.get('sessionStorage', KEYS.postsOpened) || '[]'); }
    catch (e) { return []; }
  }
  function markPostOpened(id) {
    var list = getOpenedPosts();
    if (list.indexOf(id) === -1) {
      list.push(id);
      store.set('sessionStorage', KEYS.postsOpened, JSON.stringify(list));
    }
  }
  function openPost(a) {
    a.querySelector('.post-body').hidden = false;
    var b = a.querySelector('.read-toggle');
    b.setAttribute('aria-expanded', 'true');
    b.textContent = 'Show less ↑';
  }
  function closePost(a) {
    a.querySelector('.post-body').hidden = true;
    var b = a.querySelector('.read-toggle');
    b.setAttribute('aria-expanded', 'false');
    b.textContent = 'Read more →';
  }

  posts.forEach(function (article) {
    article.querySelector('.read-toggle').addEventListener('click', function () {
      if (this.getAttribute('aria-expanded') === 'true') {
        closePost(article);
      } else {
        openPost(article);
        markPostOpened(article.dataset.postId);
      }
      renderSession();
    });
  });

  /* ==========================================================
     SESSION TRACKING
     ========================================================== */
  function initSession() {
    var now = new Date().toISOString();
    if (!store.get('localStorage', KEYS.firstVisit)) store.set('localStorage', KEYS.firstVisit, now);
    if (!store.get('sessionStorage', KEYS.sessionStart)) {
      store.set('sessionStorage', KEYS.sessionStart, now);
      var visits = parseInt(store.get('localStorage', KEYS.totalVisits) || '0', 10) + 1;
      store.set('localStorage', KEYS.totalVisits, String(visits));
    }
    var views = parseInt(store.get('sessionStorage', KEYS.pageViews) || '0', 10) + 1;
    store.set('sessionStorage', KEYS.pageViews, String(views));
  }

  // count clicks anywhere on the page
  document.addEventListener('click', function () {
    var n = parseInt(store.get('sessionStorage', KEYS.clicks) || '0', 10) + 1;
    store.set('sessionStorage', KEYS.clicks, String(n));
  });

  function formatDuration(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h) return h + 'h ' + m + 'm ' + sec + 's';
    if (m) return m + 'm ' + sec + 's';
    return sec + 's';
  }
  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  function detectBrowser() {
    var ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Microsoft Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Unknown';
  }
  function detectPlatform() {
    if (navigator.userAgentData && navigator.userAgentData.platform) return navigator.userAgentData.platform;
    var ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return navigator.platform || 'Unknown';
  }
  function referrerLabel() {
    if (!document.referrer) return 'Direct visit';
    try { return new URL(document.referrer).hostname || document.referrer; }
    catch (e) { return document.referrer; }
  }

  function collectSession() {
    var start = store.get('sessionStorage', KEYS.sessionStart);
    var startMs = start ? new Date(start).getTime() : pageLoadedAt;
    var filterLabel = activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
    return {
      visit: {
        visitor: getGuest() || 'Not shared yet',
        sessionStarted: formatDate(start),
        sessionDuration: formatDuration(Date.now() - startMs),
        timeOnThisPage: formatDuration(Date.now() - pageLoadedAt),
        pageViewsThisSession: store.get('sessionStorage', KEYS.pageViews) || '1',
        totalVisits: store.get('localStorage', KEYS.totalVisits) || '1',
        firstVisit: formatDate(store.get('localStorage', KEYS.firstVisit)),
        arrivedFrom: referrerLabel()
      },
      activity: {
        storiesOpened: getOpenedPosts().length + ' of ' + posts.length,
        topicFilter: filterLabel,
        clicks: store.get('sessionStorage', KEYS.clicks) || '0',
        themeNow: themeLabel(currentTheme()),
        themeChanges: store.get('sessionStorage', KEYS.themeChanges) || '0',
        scrollDepth: Math.round(maxScroll) + '%'
      },
      device: {
        browser: detectBrowser(),
        platform: detectPlatform(),
        language: navigator.language || '—',
        timeZone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '—',
        screen: window.screen.width + ' × ' + window.screen.height,
        window: window.innerWidth + ' × ' + window.innerHeight,
        connection: navigator.onLine ? 'Online' : 'Offline'
      }
    };
  }

  var LABELS = {
    visitor: 'Visitor', sessionStarted: 'Session started', sessionDuration: 'Session length',
    timeOnThisPage: 'Time on this page', pageViewsThisSession: 'Page views (session)',
    totalVisits: 'Total visits', firstVisit: 'First visit', arrivedFrom: 'Arrived from',
    storiesOpened: 'Stories opened', topicFilter: 'Topic filter', clicks: 'Clicks', themeNow: 'Current theme',
    themeChanges: 'Theme changes', scrollDepth: 'Scroll depth',
    browser: 'Browser', platform: 'Platform', language: 'Language', timeZone: 'Time zone',
    screen: 'Screen', window: 'Window', connection: 'Connection'
  };
  var GROUPS = { visit: 'Visit', activity: 'Activity', device: 'Device' };

  var panel = document.getElementById('sessionPanel');
  var body = document.getElementById('sessionBody');
  var scrim = document.getElementById('scrim');
  var toggle = document.getElementById('sessionToggle');
  var statusEl = document.getElementById('panelStatus');

  function isPanelOpen() { return panel.classList.contains('open'); }

  function renderSession() {
    if (!isPanelOpen()) return;
    var data = collectSession();
    body.textContent = '';
    Object.keys(GROUPS).forEach(function (gk) {
      var group = document.createElement('section');
      group.className = 'info-group';
      var h = document.createElement('h3');
      h.textContent = GROUPS[gk];
      group.appendChild(h);
      var dl = document.createElement('dl');
      dl.className = 'info-list';
      Object.keys(data[gk]).forEach(function (k) {
        var row = document.createElement('div');
        row.className = 'info-row';
        var dt = document.createElement('dt'); dt.textContent = LABELS[k];
        var dd = document.createElement('dd'); dd.textContent = data[gk][k];
        row.appendChild(dt); row.appendChild(dd);
        dl.appendChild(row);
      });
      group.appendChild(dl);
      if (gk === 'activity') {
        var bar = document.createElement('div');
        bar.className = 'progress';
        bar.setAttribute('aria-hidden', 'true');
        var fill = document.createElement('span');
        fill.style.width = Math.round(maxScroll) + '%';
        bar.appendChild(fill);
        group.appendChild(bar);
      }
      body.appendChild(group);
    });
  }

  var ticker = null, lastFocus = null;

  function openPanel() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    statusEl.textContent = '';
    renderSession();
    ticker = setInterval(renderSession, 1000);
    document.getElementById('sessionClose').focus();
  }
  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    clearInterval(ticker); ticker = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  toggle.addEventListener('click', function () { isPanelOpen() ? closePanel() : openPanel(); });
  document.getElementById('sessionClose').addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isPanelOpen()) closePanel(); });

  document.getElementById('copySession').addEventListener('click', function () {
    var text = JSON.stringify(collectSession(), null, 2);
    var done = function () { statusEl.textContent = 'Session info copied!'; };
    var fail = function () { statusEl.textContent = 'Could not copy automatically — please copy manually.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  });

  document.getElementById('resetSession').addEventListener('click', function () {
    [KEYS.sessionStart, KEYS.pageViews, KEYS.postsOpened, KEYS.themeChanges, KEYS.clicks].forEach(function (k) {
      store.remove('sessionStorage', k);
    });
    pageLoadedAt = Date.now();
    maxScroll = 0;
    store.set('sessionStorage', KEYS.sessionStart, new Date().toISOString());
    store.set('sessionStorage', KEYS.pageViews, '1');
    posts.forEach(closePost);
    statusEl.textContent = 'Session reset. Your theme and name were kept.';
    renderSession();
  });

  /* ---------- Scroll depth ---------- */
  function updateScroll() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', renderSession);
  window.addEventListener('online', renderSession);
  window.addEventListener('offline', renderSession);

  /* ==========================================================
     INIT
     ========================================================== */
  document.getElementById('year').textContent = new Date().getFullYear();
  buildPicker();
  applyTheme(currentTheme(), false);
  initSession();
  showGreeting();
  startTyping();
  updateScroll();
})();
