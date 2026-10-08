/* Real Feed — YouTube adapter: finds video cards and reads their metadata. */
(function (root) {
  'use strict';
  const AIFF = root.AIFF;

  // Thumbnails in home, search, subscriptions, sidebar, channel pages and the
  // Shorts shelf (desktop + m.youtube.com).
  const GRID = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-reel-item-renderer',
    'ytd-playlist-video-renderer',
    'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'ytm-video-with-context-renderer',
    'ytm-compact-video-renderer',
    'ytm-rich-item-renderer',
    'ytm-reel-item-renderer',
  ].join(',');
  // The vertical Shorts player: one renderer per short.
  const FEED = 'ytd-reel-video-renderer';
  // Metadata block under the main player on /watch.
  const WATCH = 'ytd-watch-metadata';
  const ALL = [GRID, FEED, WATCH].join(',');

  const TITLE = [
    '#video-title',
    '#video-title-link',
    '.yt-lockup-metadata-view-model__title',
    '.yt-lockup-metadata-view-model-wiz__title',
    '.shortsLockupViewModelHostMetadataTitle',
    '.shortsLockupViewModelHostOutsideMetadataTitle',
    '.ytShortsVideoTitleViewModelShortsVideoTitle',
    'yt-shorts-video-title-view-model',
    '#title h1',
    'h1',
    'h2',
    'h3',
    '.media-item-headline',
  ].join(',');
  const CHANNEL_NAME = [
    'ytd-channel-name #text',
    'ytd-channel-name a',
    '#channel-name',
    '.yt-content-metadata-view-model__metadata-text',
    '.yt-content-metadata-view-model-wiz__metadata-text',
    '.ytReelChannelBarViewModelChannelName',
    '.media-item-byline',
  ].join(',');
  const CHANNEL_LINK = 'a[href^="/@"], a[href*="youtube.com/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]';
  const DESCRIPTION = '#description-text, .metadata-snippet-text, #description-inline-expander, ytd-text-inline-expander, #description';
  const DISCLOSURE =
    'how-this-was-made-section-view-model, ytd-how-this-was-made-section-view-model, [class*="howThisWasMade"], [class*="how-this-was-made"]';
  const BADGES = 'ytd-badge-supported-renderer, badge-shape, yt-badge-view-model, .badge, .yt-badge-shape, ' + DISCLOSURE;

  function findCards(doc) {
    return Array.from(doc.querySelectorAll(ALL)).filter(
      (el) => !el.parentElement || !el.parentElement.closest(GRID)
    );
  }

  function kindOf(el) {
    if (el.matches(FEED)) return 'feed';
    if (el.matches(WATCH)) return 'watch';
    return 'grid';
  }

  function extract(el) {
    const kind = kindOf(el);
    let title = AIFF.textOf(el, TITLE);
    if (!title) {
      const a = el.querySelector('a[title], a[aria-label]');
      title = a ? a.getAttribute('title') || a.getAttribute('aria-label') || '' : '';
    }
    let channelId = AIFF.handleFromLinks(el, CHANNEL_LINK);
    const channel = AIFF.textOf(el, CHANNEL_NAME);
    let description = AIFF.textOf(el, DESCRIPTION);
    const labels = AIFF.allText(el, BADGES);

    if (kind === 'watch') {
      // The disclosure lives in the structured description panel, outside the
      // metadata block, so look for it page-wide.
      labels.push(...AIFF.allText(document, DISCLOSURE));
      if (!channelId) channelId = AIFF.handleFromLinks(document.querySelector('ytd-video-owner-renderer'), CHANNEL_LINK);
    }
    if (!title && !channel) return null;

    const hashtags = AIFF.allText(el, 'a[href^="/hashtag/"]');
    const text = AIFF.ownText(el, kind === 'watch' ? 6000 : 2000);
    return { platform: 'youtube', kind, title, description, channel, channelId, hashtags, labels, text };
  }

  function skip(el) {
    const btn = document.querySelector(
      '#navigation-button-down button, #navigation-button-down ytd-button-renderer, button[aria-label="Next video"]'
    );
    if (btn) btn.click();
    else if (el.nextElementSibling) el.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pause(el, kind) {
    if (kind === 'watch') AIFF.pauseVideos(document.querySelector('#movie_player'));
    else AIFF.pauseVideos(el);
  }

  AIFF.platforms.youtube = { id: 'youtube', findCards, extract, skip, pause };
})(globalThis);
