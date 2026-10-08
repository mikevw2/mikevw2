/*
 * Real Feed — AI video detector.
 *
 * Pure scoring logic with no DOM access, so it can run in the content script
 * and in Node tests. A video is described by the metadata visible in the feed
 * (title, caption, hashtags, channel, platform badges) and scored against a
 * set of weighted signals. Nothing here looks at pixels: the most reliable
 * evidence available inside a feed is what the platform and the creator say
 * about the video.
 */
(function (root) {
  'use strict';

  const THRESHOLDS = { strict: 30, balanced: 50, relaxed: 80 };

  // Disclosure labels the platforms attach to synthetic media. YouTube shows
  // "Altered or synthetic content"; TikTok shows "AI-generated" and
  // "Creator labeled as AI-generated" (C2PA-detected media is labeled too).
  const PLATFORM_LABEL =
    /altered or synthetic content|creator label?led (?:this )?as ai[- ]generated|contains ai[- ]generated media|label?led as ai[- ]generated|ai[- ]generated (?:content|media) label/;
  const BADGE_LABEL = /\bai[- ]generated\b|\bsynthetic content\b|\bai info\b/;

  // Generator names. Bare "sora", "veo" and "runway" are ambiguous (a Kingdom
  // Hearts character, Spanish for "I see", fashion shows), so on their own
  // they only count in unambiguous forms; after "made with" any name counts.
  const TOOL_NAMES = [
    'sora', 'veo', 'kling', 'runway', 'runwayml', 'midjourney', 'hailuo', 'minimax',
    'pika', 'pikalabs', 'luma', 'lumaai', 'dream machine', 'stable diffusion',
    'comfyui', 'deforum', 'seedance', 'higgsfield', 'invideo',
  ];
  const TOOL_ALT = TOOL_NAMES.map((t) => t.replace(/ /g, '\\s?')).join('|');
  const TOOL_MENTION = [
    'sora ?2', 'sora ai', 'openai sora', 'veo ?[23]', 'google veo', 'kling(?: ?ai| ?[12](?:\\.\\d)?)?',
    'runway ?ml', 'runway gen ?[1-4]', 'midjourney', 'hailuo(?: ?ai)?', 'pika ?labs', 'pika ?ai',
    'luma ?ai', 'dream machine', 'stable diffusion', 'comfyui', 'deforum', 'seedance', 'higgsfield',
    'invideo ai',
  ].join('|');

  const STRONG_TAGS = [
    'aigenerated', 'aigeneratedvideo', 'aivideo', 'aivideos', 'aiart', 'aiartwork',
    'aianimation', 'aifilm', 'aishortfilm', 'aimovie', 'aishorts', 'aicontent',
    'aimusicvideo', 'aiinfluencer', 'aimodel', 'generativeai', 'genai', 'aicreated',
    'madewithai', 'createdwithai', 'aigeneratedart', 'aicinema', 'aitrailer',
    'sora', 'sora2', 'soraai', 'openaisora', 'veo', 'veo3', 'googleveo', 'kling',
    'klingai', 'runwayml', 'runwaygen3', 'runwaygen4', 'midjourney', 'hailuo',
    'hailuoai', 'minimaxai', 'pikalabs', 'pikaart', 'lumaai', 'dreammachine',
    'stablediffusion', 'comfyui', 'deforum', 'seedance', 'higgsfield',
  ];
  const STRONG_TAG_RE = new RegExp('#(' + STRONG_TAGS.join('|') + ')(?![\\w])', 'g');

  const AI_TERM = '(?:ai|a\\.i\\.|artificial intelligence|' + TOOL_ALT + ')';

  const RULES = [
    {
      id: 'ai-phrase',
      weight: 50,
      reason: 'Described as AI-made',
      re: new RegExp(
        '\\b(?:made|created|generated|produced|animated|rendered|edited|filmed|imagined|done)\\s(?:\\w+\\s)?(?:with|by|using|in|on|through)\\s' +
          AI_TERM + '\\b|\\b(?:ai|a\\.i\\.)[- ](?:generated|created|made|animated|animation|video|videos|short film|film|movie|art|artwork|music video|commercial|trailer|influencer|model|slop|cinema|clip)\\b|\\b(?:fully|100%|entirely|completely)\\s(?:ai|a\\.i\\.)\\b|\\bnot real\\b.{0,30}\\b(?:ai|a\\.i\\.)\\b'
      ),
    },
    {
      id: 'tool-name',
      weight: 30,
      reason: 'Mentions an AI video generator',
      re: new RegExp('(?<![#\\w])(?:' + TOOL_MENTION + ')\\b'),
    },
    {
      id: 'ai-hashtag',
      weight: 35,
      reason: 'Tagged #ai',
      re: /#(?:ai|a\.i|aii)(?![\w])/,
    },
    {
      id: 'ai-word',
      weight: 10,
      reason: 'Mentions AI',
      re: /\b(?:ai|a\.i\.)\b/,
    },
  ];

  // Context that suggests a video is *about* AI (news, tutorials, reviews,
  // debunks) rather than being AI-generated footage itself.
  const ABOUT_AI =
    /\b(?:how to|tutorial|explained|explainer|review|reviews|reaction|reacts?|news|vs\.?|versus|comparison|compared|detect|detecting|spot|spotting|is (?:this|it) (?:real|ai)|real or (?:ai|fake)|podcast|interview|lecture|course|guide|prompt(?:s|ing)? (?:guide|tips)|tips|workflow|step by step|beginners?|breakdown|debunk(?:ed|ing)?|fact check)\b/;

  // Creators explicitly saying the footage is human-made.
  const NOT_AI = /#noai\b|#notai\b|#humanmade\b|\bno ai\b|\bnot ai\b|\bwithout ai\b|\bzero ai\b|\bhuman[- ]made\b|\breal footage\b/;

  function normalize(s) {
    if (!s) return '';
    // NFKC folds "𝗔𝗜" style unicode fonts back to plain letters.
    return String(s).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function normalizeHandle(h) {
    if (!h) return '';
    let s = String(h).trim().toLowerCase();
    try {
      s = decodeURIComponent(s);
    } catch (_) {
      /* keep as-is */
    }
    s = s.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '').split(/[/?#]/)[0];
    if (!s) return '';
    return s.startsWith('@') ? s : '@' + s;
  }

  function listHas(list, handle, name) {
    if (!Array.isArray(list) || !list.length) return false;
    const n = normalize(name);
    return list.some((entry) => {
      const e = normalizeHandle(entry);
      if (!e) return false;
      if (handle && e === handle) return true;
      // Also match a plain display name ("Dreamscape AI") typed without "@".
      return !!n && e.slice(1) === n.replace(/^@/, '');
    });
  }

  function channelLooksAI(channel, handle) {
    const reasons = [];
    if (channel && /(?:^|[^\p{L}])AI(?:$|[^\p{L}])/u.test(String(channel).normalize('NFKC'))) {
      reasons.push('Channel name contains "AI"');
    } else if (handle && /(?:^@|[._-])ai(?:[._-]|$)|aiart|aivideo|aifilm|aistudio|aicinema|sora|veo3|kling|midjourney/.test(handle)) {
      reasons.push('Channel handle suggests AI content');
    }
    return reasons;
  }

  /**
   * Score a video.
   * @param {object} video {title, description, hashtags[], channel, channelId, labels[], text}
   * @param {object} settings {sensitivity, blockedChannels[], allowedChannels[], customKeywords[]}
   * @returns {{isAI:boolean, score:number, threshold:number, reasons:string[], verdict:string}}
   */
  function evaluate(video, settings) {
    settings = settings || {};
    video = video || {};
    const threshold = THRESHOLDS[settings.sensitivity] || THRESHOLDS.balanced;
    const handle = normalizeHandle(video.channelId);

    if (listHas(settings.allowedChannels, handle, video.channel)) {
      return { isAI: false, score: 0, threshold, reasons: ['Channel is on your trusted list'], verdict: 'allowed' };
    }
    if (listHas(settings.blockedChannels, handle, video.channel)) {
      return { isAI: true, score: 1000, threshold, reasons: ['Channel is on your AI blocklist'], verdict: 'blocked' };
    }

    const tags = (video.hashtags || []).map((t) => '#' + normalize(t).replace(/^#/, '').replace(/\s/g, ''));
    const content = normalize([video.title, video.description, tags.join(' ')].join(' \n '));
    const labelText = normalize([(video.labels || []).join(' \n '), video.text].join(' \n '));

    let score = 0;
    const reasons = [];
    const add = (w, r) => {
      score += w;
      reasons.push(r);
    };

    const platformLabel =
      PLATFORM_LABEL.test(labelText) || (video.labels || []).some((l) => BADGE_LABEL.test(normalize(l)));
    if (platformLabel) add(100, 'Platform labeled it AI-generated / synthetic');

    const strongTags = new Set((content.match(STRONG_TAG_RE) || []).map((t) => t.toLowerCase()));
    if (strongTags.size) {
      add(60, 'AI hashtag: ' + Array.from(strongTags).slice(0, 3).join(' '));
      if (strongTags.size > 1) add(20, 'Multiple AI hashtags');
    }

    for (const rule of RULES) {
      // A specific signal already covers the generic "AI" mention.
      if (rule.id === 'ai-word' && reasons.length) continue;
      if (rule.re.test(content)) add(rule.weight, rule.reason);
    }

    for (const kw of settings.customKeywords || []) {
      const k = normalize(kw);
      if (k && content.includes(k)) add(50, 'Matches your keyword "' + kw.trim() + '"');
    }

    const channelReasons = channelLooksAI(video.channel, handle);
    channelReasons.forEach((r) => add(25, r));

    if (!platformLabel) {
      if (NOT_AI.test(content)) add(-60, 'Creator says it is not AI');
      else if (score > 0 && ABOUT_AI.test(content)) add(-30, 'Looks like a video about AI, not made by it');
    }

    score = Math.max(0, score);
    return {
      isAI: score >= threshold,
      score,
      threshold,
      reasons: reasons.length ? reasons : ['No AI signals'],
      verdict: score >= threshold ? 'ai' : 'clean',
    };
  }

  const api = { evaluate, normalize, normalizeHandle, THRESHOLDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.AIFF = root.AIFF || {};
    root.AIFF.detector = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
