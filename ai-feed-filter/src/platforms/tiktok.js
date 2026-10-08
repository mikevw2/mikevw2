/* Real Feed — TikTok adapter: finds feed items and reads their metadata. */
(function (root) {
  'use strict';
  const AIFF = root.AIFF;

  // Thumbnail grids: profile, liked, favorites, search, explore, tag and sound pages.
  const GRID = [
    '[data-e2e="user-post-item"]',
    '[data-e2e="user-liked-item"]',
    '[data-e2e="favorites-item"]',
    '[data-e2e="search_top-item"]',
    '[data-e2e="search_video-item"]',
    '[data-e2e="explore-item"]',
    '[data-e2e="challenge-item"]',
    '[data-e2e="music-item"]',
  ].join(',');
  // Full-screen snap feeds: For You and Following.
  const FEED = ['[data-e2e="recommend-list-item-container"]', '[data-e2e="feed-video"]', 'article[data-scroll-index]'].join(',');
  // Single video page (/@user/video/123).
  const WATCH = '[class*="DivVideoDetailContainer"], [class*="DivBrowserModeContainer"]';
  const ALL = [GRID, FEED, WATCH].join(',');

  const DESC =
    '[data-e2e="video-desc"], [data-e2e="browse-video-desc"], [data-e2e="search-card-video-caption"], [data-e2e="search-card-desc"], [data-e2e="user-post-item-desc"]';
  const AUTHOR =
    '[data-e2e="video-author-uniqueid"], [data-e2e="browse-username"], [data-e2e="search-card-user-unique-id"], [data-e2e="video-author-nickname"]';
  const LABELS = '[data-e2e*="aigc"], [data-e2e*="ai-label"], [class*="AIGC"], [class*="Aigc"], [class*="AILabel"]';

  function findCards(doc) {
    return Array.from(doc.querySelectorAll(ALL)).filter((el) => !el.parentElement || !el.parentElement.closest(ALL));
  }

  function kindOf(el) {
    if (el.matches(FEED)) return 'feed';
    if (el.matches(GRID)) return 'grid';
    return 'watch';
  }

  function extract(el) {
    const kind = kindOf(el);
    let description = AIFF.textOf(el, DESC);
    // Grid thumbnails carry the caption + hashtags in the image alt text.
    const img = el.querySelector('img[alt]');
    if (img && img.alt && !description.includes(img.alt)) description = (description + ' ' + img.alt).trim();

    let channelId = AIFF.handleFromLinks(el, 'a[href^="/@"], a[href*="tiktok.com/@"]');
    const author = AIFF.textOf(el, AUTHOR);
    if (!channelId && author) channelId = '@' + author.replace(/^@/, '').trim().toLowerCase();
    // Items on a profile grid belong to the profile owner.
    if (!channelId && kind === 'grid') {
      const m = location.pathname.match(/^\/(@[^/]+)/);
      if (m) channelId = decodeURIComponent(m[1]).toLowerCase();
    }

    const hashtags = AIFF.allText(el, 'a[href^="/tag/"], a[href*="/tag/"]');
    const labels = AIFF.allText(el, LABELS);
    const text = AIFF.ownText(el, 2500);
    if (!description && !channelId && !text) return null;
    return { platform: 'tiktok', kind, title: '', description, channel: author, channelId, hashtags, labels, text };
  }

  function skip(el) {
    const btn = document.querySelector(
      '[data-e2e="arrow-down"], button[aria-label="Go to next video"], button[aria-label="Next video"]'
    );
    if (btn) return btn.click();
    if (el.nextElementSibling) return el.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
  }

  function pause(el) {
    AIFF.pauseVideos(el);
  }

  AIFF.platforms.tiktok = { id: 'tiktok', findCards, extract, skip, pause };
})(globalThis);
