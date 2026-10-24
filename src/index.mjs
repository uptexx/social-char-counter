/**
 * @uptexx/social-char-counter
 * Accurate platform-aware character, URL (t.co 23-char weighting), grapheme/emoji,
 * mention, and hashtag counter for 10 social networks.
 *
 * Built by Uptexx (https://uptexx.com) — Powered by NexoPost (https://nexopost.com)
 */

const PLATFORM_LIMITS = Object.freeze({
  x: { limit: 280, urlWeight: 23, emojiWeight: 2, mode: 'x-weighted' },
  instagram: { limit: 2200, urlWeight: null, emojiWeight: null, mode: 'codepoints' },
  linkedin: { limit: 3000, urlWeight: null, emojiWeight: null, mode: 'utf16' },
  tiktok: { limit: 4000, urlWeight: null, emojiWeight: null, mode: 'utf16' },
  threads: { limit: 500, urlWeight: null, emojiWeight: null, mode: 'graphemes' },
  youtube: { limit: 5000, urlWeight: null, emojiWeight: null, mode: 'utf16' },
  pinterest: { limit: 500, urlWeight: null, emojiWeight: null, mode: 'utf16' },
  facebook: { limit: 63206, urlWeight: null, emojiWeight: null, mode: 'utf16' },
  bluesky: { limit: 300, urlWeight: null, emojiWeight: null, mode: 'graphemes' },
  mastodon: { limit: 500, urlWeight: 23, emojiWeight: null, mode: 'mastodon-weighted' }
});

const PLATFORM_ALIASES = {
  twitter: 'x',
  'x.com': 'x',
  ig: 'instagram',
  yt: 'youtube',
  fb: 'facebook',
  bsky: 'bluesky'
};

const graphemeSegmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const HASHTAG_REGEX = /(?:^|[\s([{-])(#[a-zA-Z0-9_\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]+)/g;
const MENTION_REGEX = /(?:^|[\s([{-])(@[a-zA-Z0-9_.-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?)/g;
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

/**
 * Normalizes platform identifier.
 * @param {string} [platform='x']
 * @returns {string}
 */
function resolvePlatform(platform = 'x') {
  if (!platform || typeof platform !== 'string') {
    throw new TypeError('Platform must be a non-empty string.');
  }
  const clean = platform.trim().toLowerCase();
  const key = PLATFORM_ALIASES[clean] || clean;
  if (!PLATFORM_LIMITS[key]) {
    throw new Error(
      `Unsupported platform "${platform}". Supported platforms: ${Object.keys(PLATFORM_LIMITS).join(', ')}`
    );
  }
  return key;
}

/**
 * Splits a string into user-perceived grapheme clusters.
 * @param {string} text
 * @returns {string[]}
 */
function splitGraphemes(text) {
  if (!text) return [];
  return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
}

/**
 * Extracts URLs, hashtags, mentions, and emojis from social media post text.
 *
 * @param {string} text - Input post text
 * @returns {{ urls: string[], hashtags: string[], mentions: string[], emojis: string[] }}
 */
export function extractEntities(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { urls: [], hashtags: [], mentions: [], emojis: [] };
  }

  const urls = [];
  for (const match of text.matchAll(URL_REGEX)) {
    const cleanedUrl = match[0].replace(/[.,!?;:)]+$/, '');
    urls.push(cleanedUrl);
  }

  const hashtags = [];
  for (const match of text.matchAll(HASHTAG_REGEX)) {
    hashtags.push(match[1]);
  }

  const mentions = [];
  for (const match of text.matchAll(MENTION_REGEX)) {
    const cleanedMention = match[1].replace(/[.,!?;:)]+$/, '');
    mentions.push(cleanedMention);
  }

  const graphemes = splitGraphemes(text);
  const emojis = graphemes.filter((g) => EMOJI_REGEX.test(g));

  return {
    urls,
    hashtags,
    mentions,
    emojis
  };
}

/**
 * Calculates X (Twitter) weighted character count:
 * - Every URL counts as 23 characters (t.co wrapping).
 * - Emoji and CJK/wide characters outside standard single-weight ranges count as 2.
 * - Standard ASCII/Latin characters count as 1.
 *
 * @param {string} text
 * @param {string[]} urls
 * @returns {number}
 */
function calculateXWeightedLength(text, urls) {
  let working = text;
  let urlChars = 0;

  for (const url of urls) {
    const idx = working.indexOf(url);
    if (idx !== -1) {
      working = working.slice(0, idx) + working.slice(idx + url.length);
      urlChars += 23;
    }
  }

  const graphemes = splitGraphemes(working);
  let textWeight = 0;

  for (const g of graphemes) {
    if (EMOJI_REGEX.test(g)) {
      textWeight += 2;
      continue;
    }
    const codePoint = g.codePointAt(0) || 0;
    // Twitter text v3 single-weight ranges: 0x0000 - 0x10FF, 0x2000 - 0x200D, 0x2010 - 0x201F, 0x2032 - 0x2037
    const isSingleWeight =
      (codePoint >= 0x0000 && codePoint <= 0x10ff) ||
      (codePoint >= 0x2000 && codePoint <= 0x200d) ||
      (codePoint >= 0x2010 && codePoint <= 0x201f) ||
      (codePoint >= 0x2032 && codePoint <= 0x2037);
    textWeight += isSingleWeight ? 1 : 2;
  }

  return urlChars + textWeight;
}

/**
 * Calculates Mastodon weighted character count:
 * - Every HTTP/HTTPS URL counts as 23 characters.
 * - Remote mentions (@user@domain.tld) only count the @user part toward the limit.
 *
 * @param {string} text
 * @param {string[]} urls
 * @returns {number}
 */
function calculateMastodonWeightedLength(text, urls) {
  let working = text;
  let urlChars = 0;

  for (const url of urls) {
    const idx = working.indexOf(url);
    if (idx !== -1) {
      working = working.slice(0, idx) + working.slice(idx + url.length);
      urlChars += 23;
    }
  }

  // Strip instance domain from federated mentions (@user@domain.com -> @user)
  working = working.replace(
    /(^|[\s([{-])(@[a-zA-Z0-9_.-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '$1$2'
  );

  return urlChars + splitGraphemes(working).length;
}

/**
 * Calculates platform-aware character counts and rich text metrics.
 *
 * @param {string} text - Input post text
 * @param {string} [platform='x'] - Target platform identifier
 * @returns {{
 *   platform: string,
 *   weightedLength: number,
 *   rawLength: number,
 *   graphemeCount: number,
 *   codePointCount: number,
 *   byteLength: number,
 *   wordCount: number,
 *   lineCount: number,
 *   urlCount: number,
 *   hashtagCount: number,
 *   mentionCount: number,
 *   emojiCount: number,
 *   limit: number,
 *   remaining: number,
 *   isOverLimit: boolean
 * }}
 */
export function countSocialCharacters(text, platform = 'x') {
  const safeText = typeof text === 'string' ? text : '';
  const normalizedText = safeText.normalize('NFC');
  const platformKey = resolvePlatform(platform);
  const rules = PLATFORM_LIMITS[platformKey];

  const entities = extractEntities(normalizedText);
  const graphemes = splitGraphemes(normalizedText);
  const codePoints = Array.from(normalizedText);
  const byteLength = Buffer.byteLength(normalizedText, 'utf8');
  const words = normalizedText.trim() ? normalizedText.trim().split(/\s+/).length : 0;
  const lines = normalizedText.length === 0 ? 0 : normalizedText.split(/\r\n|\r|\n/).length;

  let weightedLength = 0;
  switch (rules.mode) {
    case 'x-weighted':
      weightedLength = calculateXWeightedLength(normalizedText, entities.urls);
      break;
    case 'mastodon-weighted':
      weightedLength = calculateMastodonWeightedLength(normalizedText, entities.urls);
      break;
    case 'graphemes':
      weightedLength = graphemes.length;
      break;
    case 'codepoints':
      weightedLength = codePoints.length;
      break;
    case 'utf16':
    default:
      weightedLength = normalizedText.length;
      break;
  }

  const remaining = rules.limit - weightedLength;

  return {
    platform: platformKey,
    weightedLength,
    rawLength: normalizedText.length,
    graphemeCount: graphemes.length,
    codePointCount: codePoints.length,
    byteLength,
    wordCount: words,
    lineCount: lines,
    urlCount: entities.urls.length,
    hashtagCount: entities.hashtags.length,
    mentionCount: entities.mentions.length,
    emojiCount: entities.emojis.length,
    limit: rules.limit,
    remaining,
    isOverLimit: remaining < 0
  };
}

/**
 * Returns remaining character budget for a given social platform.
 *
 * @param {string} text - Input post text
 * @param {string} [platform='x'] - Target platform identifier
 * @returns {{
 *   platform: string,
 *   limit: number,
 *   used: number,
 *   remaining: number,
 *   isOverLimit: boolean,
 *   percentageUsed: number
 * }}
 */
export function getRemainingCharacters(text, platform = 'x') {
  const stats = countSocialCharacters(text, platform);
  const percentageUsed = Number(((stats.weightedLength / stats.limit) * 100).toFixed(2));

  return {
    platform: stats.platform,
    limit: stats.limit,
    used: stats.weightedLength,
    remaining: stats.remaining,
    isOverLimit: stats.isOverLimit,
    percentageUsed
  };
}
