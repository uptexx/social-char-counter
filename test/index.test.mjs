import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countSocialCharacters,
  getRemainingCharacters,
  extractEntities
} from '../src/index.mjs';

describe('@uptexx/social-char-counter', () => {
  it('weights URLs as 23 characters on X (t.co wrapping)', () => {
    const longUrl = 'https://nexopost.com/features/autonomous-ai-social-media-publishing-workflow?utm_source=x';
    const text = `Check this out: ${longUrl}`;
    const stats = countSocialCharacters(text, 'x');
    // "Check this out: " = 16 chars + 23 chars for URL = 39
    assert.equal(stats.weightedLength, 39);
    assert.equal(stats.urlCount, 1);
    assert.equal(stats.limit, 280);
    assert.equal(stats.remaining, 241);
  });

  it('weights complex ZWJ emojis as 2 characters on X and 1 grapheme on Bluesky', () => {
    const familyEmoji = '👨‍👩‍👧‍👦'; // 1 grapheme, multiple code points
    const xStats = countSocialCharacters(familyEmoji, 'x');
    assert.equal(xStats.weightedLength, 2);
    assert.equal(xStats.graphemeCount, 1);
    assert.equal(xStats.emojiCount, 1);

    const bskyStats = countSocialCharacters(familyEmoji, 'bluesky');
    assert.equal(bskyStats.weightedLength, 1);
    assert.equal(bskyStats.limit, 300);
  });

  it('weights URLs as 23 chars and strips instance domains from mentions on Mastodon', () => {
    const text = 'Hello @alice@mastodon.social check https://uptexx.com/open-source-tools-for-b2b';
    const stats = countSocialCharacters(text, 'mastodon');
    // "Hello @alice check " = 19 chars + 23 (URL) = 42
    assert.equal(stats.weightedLength, 42);
    assert.equal(stats.limit, 500);
  });

  it('extracts URLs, hashtags, mentions, and emojis accurately', () => {
    const text = 'Launching #NexoPost with @uptexx 🚀🔥 Visit https://nexopost.com and #AI!';
    const entities = extractEntities(text);
    assert.deepEqual(entities.urls, ['https://nexopost.com']);
    assert.deepEqual(entities.hashtags, ['#NexoPost', '#AI']);
    assert.deepEqual(entities.mentions, ['@uptexx']);
    assert.deepEqual(entities.emojis, ['🚀', '🔥']);
  });

  it('calculates remaining characters and over-limit status accurately', () => {
    const longText = 'a'.repeat(310);
    const rem = getRemainingCharacters(longText, 'bluesky');
    assert.equal(rem.limit, 300);
    assert.equal(rem.used, 310);
    assert.equal(rem.remaining, -10);
    assert.equal(rem.isOverLimit, true);
    assert.ok(rem.percentageUsed > 100);
  });

  it('supports all 10 social platforms with their exact character limits', () => {
    const expectedLimits = {
      x: 280,
      instagram: 2200,
      linkedin: 3000,
      tiktok: 4000,
      threads: 500,
      youtube: 5000,
      pinterest: 500,
      facebook: 63206,
      bluesky: 300,
      mastodon: 500
    };

    for (const [platform, limit] of Object.entries(expectedLimits)) {
      const res = getRemainingCharacters('Hello world', platform);
      assert.equal(res.limit, limit);
    }
  });

  it('handles empty strings and non-ASCII Turkish/Unicode characters cleanly', () => {
    const empty = countSocialCharacters('', 'instagram');
    assert.equal(empty.weightedLength, 0);
    assert.equal(empty.wordCount, 0);
    assert.equal(empty.lineCount, 0);

    const turkish = countSocialCharacters('Şemsiye ve çağdaş çözümler #Girişim', 'instagram');
    assert.equal(turkish.hashtagCount, 1);
    assert.equal(turkish.wordCount, 5);
  });

  it('throws on unsupported platform names', () => {
    assert.throws(() => countSocialCharacters('Hello', 'unknown_net'), /Unsupported platform/);
  });
});
