// Turns a profile into CSS. `scope` is the selector the rules apply under:
// 'html' for real pages, or a container selector for the onboarding preview.
(function (global) {
  'use strict';

  const FONTS = {
    readable: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", Verdana, "Segoe UI", system-ui, sans-serif',
    dyslexic: '"OpenDyslexic", Lexend, "Comic Sans MS", "Comic Neue", Verdana, sans-serif',
    serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  };

  const SPACING = {
    comfortable: { line: 1.6, letter: '0.02em', word: '0.06em', para: '1.2em' },
    // WCAG 2.2 success criterion 1.4.12 (Text Spacing) values, with a little
    // extra line height.
    extra: { line: 1.8, letter: '0.12em', word: '0.16em', para: '2em' },
  };

  const PALETTES = {
    'light-contrast': { bg: '#ffffff', fg: '#000000', link: '#0000cc', visited: '#551a8b', border: '#000000' },
    'dark-contrast': { bg: '#000000', fg: '#ffffff', link: '#ffeb3b', visited: '#d7b4ff', border: '#ffffff' },
    sepia: { bg: '#f4ecd8', fg: '#3b2f1e', link: '#0b57a4', visited: '#6b3fa0', border: '#8a7a5c' },
  };

  // Elements that usually render icon fonts; changing their font breaks icons.
  const NOT_ICON = ':not(i):not([class*="icon" i]):not([class*="fa-"]):not([class*="material-symbols"]):not([class*="material-icons"]):not([aria-hidden="true"])';

  // Known cookie-consent / overlay containers from common providers.
  const POPUP_SELECTORS = [
    '#onetrust-consent-sdk', '#onetrust-banner-sdk', '#CybotCookiebotDialog', '#CybotCookiebotDialogBodyUnderlay',
    '#usercentrics-root', '#didomi-host', '.fc-consent-root', '.qc-cmp2-container', '[id^="sp_message_container"]',
    '#truste-consent-track', '.osano-cm-window', '.cc-window', '.cc-banner', '#cookie-banner', '#cookie-notice',
    '#cookieConsent', '.cookie-banner', '.cookie-consent', '.cookie-notice',
  ];

  function build(profile, scope) {
    const p = global.TailorProfile.normalizeProfile(profile);
    const S = scope || 'html';
    const all = `${S}, ${S} *`;
    const within = (sel) => sel.split(',').map((s) => `${S} ${s.trim()}`).join(', ');
    const text = 'p, li, dd, dt, td, th, blockquote, figcaption';
    const css = [];

    if (p.size !== 100) {
      css.push(`${S} { zoom: ${p.size / 100} !important; }`);
    }

    if (FONTS[p.font]) {
      css.push(`${S}, ${S} *${NOT_ICON} { font-family: ${FONTS[p.font]} !important; }`);
      css.push(`${within('pre, code, kbd, samp')}, ${within('pre *, code *')} { font-family: ui-monospace, Menlo, Consolas, monospace !important; }`);
    }

    const sp = SPACING[p.spacing];
    if (sp) {
      css.push(`${within(text)} { line-height: ${sp.line} !important; letter-spacing: ${sp.letter} !important; word-spacing: ${sp.word} !important; }`);
      css.push(`${within('p')} { margin-bottom: ${sp.para} !important; }`);
    }

    if (p.lineWidth === 'narrow') {
      css.push(`${within('p, li, blockquote, dd')} { max-width: 70ch !important; }`);
    }

    if (p.theme === 'dark') {
      // Invert the page, then invert media back so photos look normal.
      css.push(`${S} { filter: invert(1) hue-rotate(180deg) contrast(0.92) !important; background-color: #fff !important; }`);
      css.push(`${within('img, video, picture, canvas, iframe, embed, object, svg image, [style*="background-image"]')} { filter: invert(1) hue-rotate(180deg) !important; }`);
    } else if (PALETTES[p.theme]) {
      const c = PALETTES[p.theme];
      css.push(`${all} { background-color: ${c.bg} !important; color: ${c.fg} !important; border-color: ${c.border} !important; text-shadow: none !important; box-shadow: none !important; }`);
      css.push(`${S} *:not(img):not(video):not(picture):not(canvas):not(svg) { background-image: none !important; }`);
      css.push(`${within('a[href], a[href] *')} { color: ${c.link} !important; }`);
      css.push(`${within('a[href]:visited, a[href]:visited *')} { color: ${c.visited} !important; }`);
      css.push(`${within('button, input, select, textarea, [role="button"]')} { border: 2px solid ${c.fg} !important; }`);
      css.push(`${within('svg')} { fill: currentColor; }`);
    }

    if (p.underlineLinks) {
      css.push(`${within('a[href]')} { text-decoration: underline !important; text-underline-offset: 0.15em !important; }`);
    }

    if (p.reduceMotion) {
      css.push(`${all}, ${S} *::before, ${S} *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; animation-delay: 0s !important; transition-duration: 0.001ms !important; transition-delay: 0s !important; scroll-behavior: auto !important; }`);
      css.push(`${within('marquee')} { display: block !important; }`);
    }

    if (p.bigTargets) {
      css.push(`${within('button, [role="button"], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, summary')} { min-height: 44px !important; min-width: 44px !important; }`);
      css.push(`${within('input[type="checkbox"], input[type="radio"]')} { width: 22px !important; height: 22px !important; }`);
    }

    if (p.strongFocus) {
      css.push(`${within(':focus-visible')} { outline: 3px solid #ffbf47 !important; outline-offset: 2px !important; box-shadow: 0 0 0 6px #0b0c0c !important; }`);
    }

    if (p.hidePopups) {
      css.push(`${within(POPUP_SELECTORS.join(', '))}, ${within('[data-tailor-hidden]')} { display: none !important; }`);
      css.push(`${S}.tailor-unlock, ${S}.tailor-unlock body { overflow: auto !important; }`);
    }

    return css.join('\n');
  }

  global.TailorStyles = { build };
})(typeof self !== 'undefined' ? self : globalThis);
