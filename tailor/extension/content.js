// Runs on every page. Fetches the profile from the service worker and
// reshapes the page locally. Nothing about the profile is sent to the site.
(function () {
  'use strict';

  if (window.__tailorLoaded) return;
  window.__tailorLoaded = true;

  const host = location.hostname;
  const STYLE_ID = 'tailor-style';

  let profile = null;
  let siteOff = false;
  let observer = null;
  let lastGesture = 0;

  const active = () => Boolean(profile) && !siteOff;

  // ---- Styles -------------------------------------------------------------

  function applyStyles() {
    let el = document.getElementById(STYLE_ID);
    if (!active()) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
    }
    el.textContent = TailorStyles.build(profile, 'html');
    // Keep ours last so it wins ties with the page's own !important rules.
    (document.head || document.documentElement).appendChild(el);
  }

  // ---- Autoplay -----------------------------------------------------------

  // Media that starts playing without a recent click or keypress gets paused.
  function onPlay(e) {
    if (!active() || !profile.stopAutoplay) return;
    const media = e.target;
    if (!(media instanceof HTMLMediaElement)) return;
    if (Date.now() - lastGesture < 1500) return;
    media.pause();
  }

  function stopAutoplayIn(root) {
    root.querySelectorAll('video[autoplay], audio[autoplay]').forEach((m) => {
      m.removeAttribute('autoplay');
      m.autoplay = false;
      if (!m.paused) m.pause();
    });
  }

  // ---- Pop-ups and cookie walls ---------------------------------------------

  const CONSENT_WORDS = /\b(cookies?|consent|gdpr|privacy choices|your privacy)\b/i;
  const NAG_WORDS = /\b(subscribe|newsletter|sign up|disable (your )?ad ?block|turn off (your )?ad ?block|get \d+% off)\b/i;

  function isOverlay(el) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const coverage = (r.width * r.height) / (innerWidth * innerHeight);
    const txt = (el.innerText || '').slice(0, 2000);
    // Cookie bars are usually small; nag walls usually cover most of the screen.
    if (CONSENT_WORDS.test(txt) && /accept|agree|allow|reject|manage|ok\b|got it/i.test(txt)) return true;
    if (coverage > 0.4 && NAG_WORDS.test(txt)) return true;
    // A dimmed full-screen backdrop with no text of its own.
    if (coverage > 0.9 && txt.trim() === '' && parseFloat(cs.opacity) < 1) return true;
    return false;
  }

  function hidePopups() {
    if (!active() || !profile.hidePopups || !document.body) return;
    let hid = false;
    for (const el of document.body.querySelectorAll('body > *, body > * > *')) {
      if (el.id === 'tailor-reader-host' || el.hasAttribute('data-tailor-hidden')) continue;
      if (isOverlay(el)) {
        el.setAttribute('data-tailor-hidden', '');
        hid = true;
      }
    }
    if (hid || document.querySelector('[data-tailor-hidden]')) {
      document.documentElement.classList.add('tailor-unlock');
    }
  }

  function restorePopups() {
    document.querySelectorAll('[data-tailor-hidden]').forEach((el) => el.removeAttribute('data-tailor-hidden'));
    document.documentElement.classList.remove('tailor-unlock');
  }

  // ---- Watching the page ------------------------------------------------------

  let scanQueued = false;
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(() => {
      scanQueued = false;
      if (!active()) return;
      if (profile.stopAutoplay) stopAutoplayIn(document);
      if (profile.hidePopups) hidePopups();
    }, 300);
  }

  function startWatching() {
    if (observer) return;
    observer = new MutationObserver(() => {
      // Put our stylesheet back if a page script removed it.
      if (active() && !document.getElementById(STYLE_ID)) applyStyles();
      queueScan();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function applyAll() {
    applyStyles();
    if (!active()) {
      restorePopups();
      return;
    }
    if (!profile.hidePopups) restorePopups();
    startWatching();
    queueScan();
  }

  // ---- Reader view ------------------------------------------------------------

  const SKIP = new Set(['NAV', 'ASIDE', 'FOOTER', 'HEADER', 'FORM', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'svg', 'IFRAME', 'TEMPLATE', 'DIALOG']);
  const BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'IMG', 'TABLE']);
  const INLINE = new Set(['A', 'STRONG', 'B', 'EM', 'I', 'CODE', 'BR', 'SUP', 'SUB', 'MARK']);

  function isHidden(el) {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    if (el.hasAttribute('data-tailor-hidden')) return true;
    const cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden';
  }

  // Finds the element holding the main text, by scoring containers of <p>s.
  function findMainContent() {
    const scores = new Map();
    const add = (el, n) => el && scores.set(el, (scores.get(el) || 0) + n);
    for (const p of document.body.querySelectorAll('p')) {
      if (p.closest('nav, aside, footer, form, [data-tailor-hidden]')) continue;
      const len = p.textContent.trim().length;
      if (len < 40) continue;
      const score = Math.min(len / 100, 5) + (p.textContent.match(/,/g) || []).length * 0.3;
      add(p.parentElement, score);
      add(p.parentElement && p.parentElement.parentElement, score / 2);
    }
    let best = null;
    let bestScore = 0;
    for (const [el, score] of scores) {
      if (score > bestScore) {
        best = el;
        bestScore = score;
      }
    }
    const article = document.querySelector('article');
    if (article && (!best || article.contains(best) || best.contains(article)) && article.textContent.length > 500) {
      return best && article.contains(best) ? best.closest('article') || best : article;
    }
    return best || document.querySelector('main') || document.body;
  }

  // Safe copy of inline content: text, links and simple emphasis only.
  function copyInline(src, dest) {
    for (const node of src.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        dest.appendChild(document.createTextNode(node.textContent));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP.has(node.tagName) || isHidden(node)) continue;
        if (INLINE.has(node.tagName)) {
          const el = document.createElement(node.tagName.toLowerCase());
          if (node.tagName === 'A') {
            const href = node.href;
            if (/^https?:/i.test(href)) {
              el.href = href;
              el.target = '_blank';
              el.rel = 'noopener noreferrer';
            }
          }
          copyInline(node, el);
          dest.appendChild(el);
        } else {
          copyInline(node, dest);
        }
      }
    }
  }

  function copyBlock(node) {
    const tag = node.tagName;
    if (tag === 'IMG') {
      if (!/^https?:|^data:image\//i.test(node.src) || node.naturalWidth < 80) return null;
      const img = document.createElement('img');
      img.src = node.currentSrc || node.src;
      img.alt = node.alt || '';
      return img;
    }
    if (tag === 'FIGURE') {
      const fig = document.createElement('figure');
      const img = node.querySelector('img');
      const copied = img && copyBlock(img);
      if (copied) fig.appendChild(copied);
      const cap = node.querySelector('figcaption');
      if (cap) {
        const c = document.createElement('figcaption');
        copyInline(cap, c);
        fig.appendChild(c);
      }
      return fig.childNodes.length ? fig : null;
    }
    if (tag === 'UL' || tag === 'OL') {
      const list = document.createElement(tag.toLowerCase());
      for (const li of node.children) {
        if (li.tagName !== 'LI' || isHidden(li)) continue;
        const item = document.createElement('li');
        copyInline(li, item);
        if (item.textContent.trim()) list.appendChild(item);
      }
      return list.children.length ? list : null;
    }
    if (tag === 'PRE') {
      const pre = document.createElement('pre');
      pre.textContent = node.textContent;
      return pre;
    }
    if (tag === 'TABLE') {
      // Tables are flattened to rows of text; layout tables are common.
      const table = document.createElement('table');
      for (const row of node.querySelectorAll('tr')) {
        const tr = document.createElement('tr');
        for (const cell of row.children) {
          const td = document.createElement(cell.tagName === 'TH' ? 'th' : 'td');
          td.textContent = cell.textContent.trim();
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      return table.rows.length ? table : null;
    }
    const el = document.createElement(tag.toLowerCase());
    copyInline(node, el);
    return el.textContent.trim() ? el : null;
  }

  function collectBlocks(root, out) {
    for (const node of root.children) {
      if (SKIP.has(node.tagName) || isHidden(node)) continue;
      if (BLOCKS.has(node.tagName)) {
        const copy = copyBlock(node);
        if (copy) out.push(copy);
      } else {
        collectBlocks(node, out);
      }
    }
    return out;
  }

  function readerCss(p) {
    const palettes = {
      default: ['#fbfbf8', '#1d1d1b', '#0b57d0'],
      dark: ['#15171a', '#e8e6e3', '#8ab4f8'],
      'light-contrast': ['#ffffff', '#000000', '#0000cc'],
      'dark-contrast': ['#000000', '#ffffff', '#ffeb3b'],
      sepia: ['#f4ecd8', '#3b2f1e', '#0b57a4'],
    };
    const [bg, fg, link] = palettes[p.theme] || palettes.default;
    const fonts = {
      default: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      readable: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", Verdana, sans-serif',
      dyslexic: '"OpenDyslexic", Lexend, "Comic Sans MS", Verdana, sans-serif',
      serif: 'Georgia, "Iowan Old Style", serif',
    };
    const line = { default: 1.6, comfortable: 1.75, extra: 1.9 }[p.spacing];
    const letter = { default: 'normal', comfortable: '0.02em', extra: '0.12em' }[p.spacing];
    const word = { default: 'normal', comfortable: '0.06em', extra: '0.16em' }[p.spacing];
    const width = p.lineWidth === 'narrow' ? '60ch' : '70ch';
    const motion = p.reduceMotion ? '' : 'animation: tailor-in 160ms ease-out;';
    return `
      :host { all: initial; }
      .wrap { position: fixed; inset: 0; z-index: 2147483647; overflow-y: auto; background: ${bg}; color: ${fg};
        font-family: ${fonts[p.font] || fonts.default}; font-size: ${(19 * p.size) / 100}px; line-height: ${line};
        letter-spacing: ${letter}; word-spacing: ${word}; ${motion} }
      @keyframes tailor-in { from { opacity: 0; } to { opacity: 1; } }
      .bar { position: sticky; top: 0; display: flex; gap: 8px; align-items: center; justify-content: flex-end;
        padding: 10px 16px; background: ${bg}; border-bottom: 1px solid color-mix(in srgb, ${fg} 20%, transparent); }
      .bar .src { margin-right: auto; font-size: 0.75em; opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      button { font: inherit; font-size: 0.8em; color: ${fg}; background: transparent; cursor: pointer;
        border: 2px solid currentColor; border-radius: 8px; padding: 6px 14px; min-height: 40px; }
      button:focus-visible, a:focus-visible { outline: 3px solid #ffbf47; outline-offset: 2px; }
      article { max-width: ${width}; margin: 0 auto; padding: 24px 20px 96px; }
      h1 { font-size: 1.8em; line-height: 1.25; margin: 0.4em 0 0.6em; }
      h2 { font-size: 1.35em; line-height: 1.3; margin: 1.6em 0 0.5em; }
      h3, h4, h5, h6 { font-size: 1.1em; margin: 1.4em 0 0.4em; }
      p, li, blockquote { margin: 0 0 1.1em; }
      a { color: ${link}; text-decoration: underline; text-underline-offset: 0.15em; }
      img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 6px; }
      figcaption { font-size: 0.8em; opacity: 0.8; text-align: center; }
      blockquote { border-left: 4px solid currentColor; padding-left: 1em; opacity: 0.9; }
      pre { white-space: pre-wrap; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.85em;
        padding: 1em; border-radius: 8px; background: color-mix(in srgb, ${fg} 8%, transparent); }
      table { border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
      td, th { border: 1px solid color-mix(in srgb, ${fg} 30%, transparent); padding: 6px 10px; text-align: left; }
      .summary { border: 2px solid currentColor; border-radius: 10px; padding: 12px 18px; margin: 0 0 1.5em; }
      .summary h2 { margin-top: 0.2em; font-size: 1.05em; }
      .note { font-size: 0.8em; opacity: 0.75; }
    `;
  }

  let readerHost = null;

  function closeReader() {
    if (!readerHost) return;
    readerHost.remove();
    readerHost = null;
    document.documentElement.style.removeProperty('overflow');
  }

  // Uses Chrome's built-in, on-device Summarizer API when the browser has it.
  // Nothing is sent to a server.
  async function addSummaryButton(bar, article, text) {
    const Summ = self.Summarizer;
    if (!Summ || typeof Summ.availability !== 'function') return;
    let state;
    try {
      state = await Summ.availability();
    } catch {
      return;
    }
    if (state === 'unavailable') return;
    const btn = document.createElement('button');
    btn.textContent = 'Key points';
    btn.title = 'Summarise on this device (no data leaves your computer)';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = state === 'available' ? 'Summarising…' : 'Downloading model…';
      try {
        const s = await Summ.create({ type: 'key-points', format: 'plain-text', length: 'short' });
        const result = await s.summarize(text.slice(0, 12000));
        const box = document.createElement('section');
        box.className = 'summary';
        const h = document.createElement('h2');
        h.textContent = 'Key points';
        box.appendChild(h);
        const ul = document.createElement('ul');
        for (const line of result.split('\n')) {
          const t = line.replace(/^[\s*•-]+/, '').trim();
          if (!t) continue;
          const li = document.createElement('li');
          li.textContent = t;
          ul.appendChild(li);
        }
        box.appendChild(ul);
        const note = document.createElement('p');
        note.className = 'note';
        note.textContent = 'Written by an on-device AI model. Check important details against the text below.';
        box.appendChild(note);
        article.insertBefore(box, article.children[1] || null);
        btn.remove();
      } catch (err) {
        btn.textContent = 'Summary unavailable';
        console.warn('Tailor: summarizer failed', err);
      }
    });
    bar.insertBefore(btn, bar.lastChild);
  }

  function openReader() {
    if (readerHost) return true;
    if (!document.body) return false;
    const p = TailorProfile.normalizeProfile(profile);
    const main = findMainContent();
    const blocks = collectBlocks(main, []);
    const heading = document.querySelector('h1');
    const title = (heading && heading.textContent.trim()) || document.title;
    if (!blocks.some((b) => b.tagName === 'H1')) {
      const h1 = document.createElement('h1');
      h1.textContent = title;
      blocks.unshift(h1);
    }

    readerHost = document.createElement('div');
    readerHost.id = 'tailor-reader-host';
    // A closed shadow root keeps the page's own scripts from reading or
    // restyling the simplified copy.
    const shadow = readerHost.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = readerCss(p);
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Simplified page');
    const bar = document.createElement('div');
    bar.className = 'bar';
    const src = document.createElement('span');
    src.className = 'src';
    src.textContent = `Simplified view of ${host || 'this page'}`;
    const close = document.createElement('button');
    close.textContent = 'Back to original';
    close.addEventListener('click', closeReader);
    bar.append(src, close);
    const article = document.createElement('article');
    article.append(...blocks);
    wrap.append(bar, article);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeReader();
    });
    shadow.append(style, wrap);
    document.documentElement.appendChild(readerHost);
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    close.focus();
    addSummaryButton(bar, article, article.innerText);
    return true;
  }

  // ---- Wiring -------------------------------------------------------------------

  function refresh() {
    chrome.runtime.sendMessage({ type: 'tailor:get-profile', host }, (res) => {
      if (chrome.runtime.lastError || !res) return;
      profile = res.profile;
      siteOff = res.off;
      if (!profile) closeReader();
      applyAll();
    });
  }

  addEventListener('pointerdown', () => { lastGesture = Date.now(); }, true);
  addEventListener('keydown', () => { lastGesture = Date.now(); }, true);
  document.addEventListener('play', onPlay, true);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'vault' in changes) refresh();
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.type !== 'string') return false;
    if (msg.type === 'tailor:refresh') {
      refresh();
    } else if (msg.type === 'tailor:status') {
      sendResponse({ host, hasProfile: Boolean(profile), off: siteOff, readerOpen: Boolean(readerHost) });
    } else if (msg.type === 'tailor:reader') {
      if (!profile) {
        sendResponse({ ok: false, reason: 'no-profile' });
      } else if (readerHost) {
        closeReader();
        sendResponse({ ok: true, readerOpen: false });
      } else {
        sendResponse({ ok: openReader(), readerOpen: true });
      }
    }
    return false;
  });

  refresh();
})();
