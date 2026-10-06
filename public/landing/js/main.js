/* ==========================================================================
   Latimore Life & Legacy LLC — Contact Landing Page
   main.js
   --------------------------------------------------------------------------
   EDIT THE "CONFIG" BLOCK BELOW — that is the only place you need to touch
   to change your phone number, email, scheduling link, quote link, or social
   profile URLs. Every button on the page reads from it automatically.
   ========================================================================== */

'use strict';

/* ==========================================================================
   ▼▼▼  CONFIG — EDIT THESE VALUES  ▼▼▼
   ========================================================================== */
const CONFIG = {

  /* --- Phone & text ------------------------------------------------------ */
  // Digits only, including country code. Used for tel: and sms: links.
  phone:      '+15709001977',
  phoneLabel: '(570) 900-1977',

  /* --- Email ------------------------------------------------------------- */
  email: 'jackson1989@latimorelegacy.com',

  /* --- Scheduling link --------------------------------------------------- */
  // Your online booking link (Calendly, Acuity, HubSpot, etc.).
  // Leave as '' and the "Book" buttons will scroll to the booking section
  // on this page instead.
  bookingUrl: '/book',

  /* --- Embedded scheduling calendar ---------------------------------------- */
  // Paste the iframe embed URL of your scheduling calendar (Google Calendar
  // appointment schedule, Calendly inline embed URL, etc.).
  // Leave as '' and the embedded calendar stays hidden.
  calendarEmbedUrl: '/book',

  /* --- Instant quote / instant application link -------------------------- */
  // The carrier link your "Get an Instant Quote" card and the QR code point to.
  // Leave as '' and the QR code will point at this page's booking section.
  quoteUrl: 'https://agents.ethoslife.com/invite/29ad1',

  /* --- Social profiles --------------------------------------------------- */
  // Paste the full URL of each profile. Leave '' to mark the link as
  // "not set yet" (it will appear dimmed on the page until you fill it in).
  facebook:  'https://www.facebook.com/share/1EVpBCEZuf/',
  instagram: 'https://www.instagram.com/latimorelifelegacy25',
  linkedin:  'https://www.linkedin.com/in/startwithjacksongfi',

  /* --- Chat button (bottom-right floating button) ------------------------ */
  // 'sms'  = opens a text message to your phone
  // 'call' = opens the phone dialer
  chatMode: 'sms'
};

/* ==========================================================================
   ▲▲▲  END OF CONFIG  ▲▲▲
   No edits needed below this line.
   ========================================================================== */


/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Absolute URL of this page — used as a safe fallback target. */
function pageUrl() {
  return window.location.origin + window.location.pathname;
}

/** Resolve a CONFIG link, falling back to an on-page anchor when unset. */
function resolveLink(value, fallback) {
  return value && String(value).trim() !== '' ? String(value).trim() : fallback;
}


/* --------------------------------------------------------------------------
   1. Apply CONFIG across the page
   -------------------------------------------------------------------------- */
function applyConfig() {
  const linkMap = {
    phone:     'tel:' + CONFIG.phone,
    sms:       'sms:' + CONFIG.phone,
    email:     'mailto:' + CONFIG.email,
    booking:   resolveLink(CONFIG.bookingUrl, '#book'),
    quote:     resolveLink(CONFIG.quoteUrl, '#book'),
    facebook:  resolveLink(CONFIG.facebook, '#top'),
    instagram: resolveLink(CONFIG.instagram, '#top'),
    linkedin:  resolveLink(CONFIG.linkedin, '#top')
  };

  const textMap = {
    phone:      CONFIG.phoneLabel,
    phoneLabel: CONFIG.phoneLabel,
    email:      CONFIG.email
  };

  // Links
  $$('[data-config-href]').forEach((el) => {
    const key = el.getAttribute('data-config-href');
    if (!(key in linkMap)) return;

    const value = linkMap[key];
    el.setAttribute('href', value);

    // Mark links whose real destination hasn't been supplied yet.
    const unset = value === '#top' || (key === 'booking' && !CONFIG.bookingUrl) ||
                  (key === 'quote' && !CONFIG.quoteUrl);
    el.classList.toggle('is-unset', unset);
    if (unset) el.setAttribute('data-unset-link', 'true');

    // External links open safely in a new tab.
    if (/^https?:/i.test(value)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Text
  $$('[data-config-text]').forEach((el) => {
    const key = el.getAttribute('data-config-text');
    if (textMap[key]) el.textContent = textMap[key];
  });

  // Floating chat button
  const fab = $('.chat-fab');
  if (fab) {
    fab.setAttribute('href', CONFIG.chatMode === 'call' ? 'tel:' + CONFIG.phone : 'sms:' + CONFIG.phone);
  }
}



/* --------------------------------------------------------------------------
   1b. Embedded scheduling calendar
   -------------------------------------------------------------------------- */
function wireCalendarEmbed() {
  const wrap = document.getElementById('book-calendar');
  const frame = document.getElementById('calendar-iframe');
  const url = CONFIG.calendarEmbedUrl && String(CONFIG.calendarEmbedUrl).trim();
  if (!wrap || !frame || !url) return;   // stays hidden until a URL is set
  const destination = new URL(url, window.location.origin);
  const params = new URLSearchParams(window.location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'lead_session_id']) {
    if (params.has(key)) destination.searchParams.set(key, params.get(key));
  }
  frame.setAttribute('src', destination.href);
  wrap.hidden = false;
}

/* --------------------------------------------------------------------------
   2. Footer year
   -------------------------------------------------------------------------- */
function setYear() {
  const el = $('#year');
  if (el) el.textContent = String(new Date().getFullYear());
}


/* --------------------------------------------------------------------------
   3. QR code — generated in the browser, no external service required
   -------------------------------------------------------------------------- */
function buildQr() {
  const holder = $('#qr-code');
  if (!holder) return;

  const target = resolveLink(CONFIG.bookingUrl, '/book');
  // A QR code needs an absolute http(s) URL to be scannable.
  const payload = new URL(target, 'https://www.latimorelifelegacy.com').href;

  const fail = () => {
    holder.hidden = true;
    const note = $('#qr-fallback');
    if (note) note.hidden = false;
  };

  // Primary: QRCode.js (loaded from CDN)
  if (typeof window.QRCode === 'function') {
    try {
      new window.QRCode(holder, {           // eslint-disable-line no-new
        text: payload,
        width: 150,
        height: 150,
        colorDark: '#14543C',
        colorLight: '#FFFFFF',
        correctLevel: window.QRCode.CorrectLevel.M
      });
      return;
    } catch (err) {
      /* fall through to the image fallback */
    }
  }

  // Fallback: QR as an image from a public generator
  try {
    const img = document.createElement('img');
    img.alt = 'QR code linking to appointment booking';
    img.width = 150;
    img.height = 150;
    img.loading = 'lazy';
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' +
              encodeURIComponent(payload);
    img.addEventListener('error', fail);
    holder.appendChild(img);
  } catch (err) {
    fail();
  }
}


/* --------------------------------------------------------------------------
   4. Mobile navigation drawer
   -------------------------------------------------------------------------- */
function initNav() {
  const toggle = $('#nav-toggle');
  const nav = $('#primary-nav');
  if (!toggle || !nav) return;

  const isDesktop = () => window.matchMedia('(min-width: 1080px)').matches;

  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
  };

  const open = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
  };

  toggle.addEventListener('click', () => {
    if (nav.classList.contains('is-open')) close();
    else open();
  });

  // Close after choosing a destination
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && !isDesktop()) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      close();
      toggle.focus();
    }
  });

  // Close when tapping outside the drawer
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (isDesktop()) return;
    if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
  });

  // Reset state when crossing into the desktop layout
  window.addEventListener('resize', () => {
    if (isDesktop()) close();
  });
}


/* --------------------------------------------------------------------------
   5. Sticky header shadow
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  let ticking = false;
  const update = () => {
    header.classList.toggle('is-stuck', window.scrollY > 8);
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
}


/* --------------------------------------------------------------------------
   6. Reveal content as it scrolls into view
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = $$('[data-reveal]');

  if (!items.length) return;

  // No IntersectionObserver or motion is turned off: show everything.
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  // Stagger siblings slightly for a polished cascade.
  items.forEach((el, index) => {
    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
    const position = siblings.indexOf(el);
    if (position > 0) {
      el.style.transitionDelay = Math.min(position * 70, 350) + 'ms';
    }
    observer.observe(el);
  });
}


/* --------------------------------------------------------------------------
   7. Bootstrap
   -------------------------------------------------------------------------- */
function init() {
  applyConfig();
  wireCalendarEmbed();
  setYear();
  buildQr();
  initNav();
  initHeader();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
