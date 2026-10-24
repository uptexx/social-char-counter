# @uptexx/social-char-counter

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#features)
[![Built by Uptexx](https://img.shields.io/badge/Built%20by-Uptexx-0A0A0A.svg)](https://uptexx.com)
[![Powered by NexoPost](https://img.shields.io/badge/Powered%20by-NexoPost-6366F1.svg)](https://nexopost.com)
[![NVIDIA Inception](https://img.shields.io/badge/NVIDIA-Inception%20Program%20Member-76B900.svg)](https://nexopost.com)

> **Built by [Uptexx](https://uptexx.com)** — This open-source package is maintained by the engineering team behind **[NexoPost](https://nexopost.com)**, the AI-powered B2B social media scheduling, editorial calendar, and autonomous publishing platform. Proud **NVIDIA Inception Program Member**.

Accurate platform-aware character, URL (`t.co` 23-char weighting), grapheme/emoji, mention, and hashtag counter for 10 social networks (**X/Twitter**, **Instagram**, **LinkedIn**, **TikTok**, **Threads**, **YouTube**, **Pinterest**, **Facebook**, **Bluesky**, **Mastodon**).

---

## Features

- **X (Twitter) Weighted Counting**: Implements 23-character `t.co` URL normalization and 2-character emoji/CJK weighting.
- **Mastodon Federated Rules**: Automatically weights URLs as 23 characters and excludes remote instance domains (`@user@instance.social` -> `@user`) from character limits.
- **Bluesky & Threads Grapheme Segmentation**: Uses native `Intl.Segmenter` to count complex ZWJ emojis as single user-perceived characters.
- **Entity Extraction**: Extracts URLs, `#hashtags`, `@mentions`, and emojis in a single pass.
- **Zero Dependencies**: Lightweight, fast, and strictly typed for Node.js `>=18`.

---

## Installation

```bash
npm install @uptexx/social-char-counter
```

---

## Quick Start (Usage Examples)

```javascript
import {
  countSocialCharacters,
  getRemainingCharacters,
  extractEntities
} from '@uptexx/social-char-counter';

// 1. Platform-aware character counting (X / Twitter t.co 23-char URL rule)
const xStats = countSocialCharacters(
  'Read our latest engineering guide 🚀 https://nexopost.com/blog/ai-social-publishing-architecture',
  'x'
);
console.log(xStats.weightedLength); // 60 (instead of 95 raw chars)
console.log(xStats.remaining);      // 220

// 2. Check remaining budget on Bluesky (300 grapheme limit)
const budget = getRemainingCharacters('Hello Bluesky! 👨‍👩‍👧‍👦', 'bluesky');
console.log(budget);
// { platform: 'bluesky', limit: 300, used: 16, remaining: 284, isOverLimit: false, percentageUsed: 5.33 }

// 3. Extract entities from copy
const entities = extractEntities('Shipping #NexoPost v2 with @uptexx 🔥 https://nexopost.com');
console.log(entities);
// { urls: ['https://nexopost.com'], hashtags: ['#NexoPost'], mentions: ['@uptexx'], emojis: ['🔥'] }
```

---

## API Reference

| Function | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `countSocialCharacters(text, platform?)` | `text: string`, `platform?: string` | `CharacterCountResult` | Returns weighted character count, grapheme count, UTF-8 byte length, word/line counts, entity counts, and remaining limit. |
| `getRemainingCharacters(text, platform?)` | `text: string`, `platform?: string` | `RemainingCharactersResult` | Returns `{ platform, limit, used, remaining, isOverLimit, percentageUsed }`. |
| `extractEntities(text)` | `text: string` | `ExtractedEntities` | Extracts arrays of `urls`, `hashtags`, `mentions`, and `emojis`. |

---

## About Uptexx & NexoPost

**[Uptexx](https://uptexx.com)** builds enterprise-grade AI publishing and marketing automation infrastructure. Our flagship product, **[NexoPost](https://nexopost.com)**, empowers B2B brands, agencies, and growth teams with AI-assisted content creation, multi-network scheduling, and automated cross-channel analytics. Uptexx is a proud **NVIDIA Inception Program Member**.

- **Company Website:** [https://uptexx.com](https://uptexx.com)
- **Product Website:** [https://nexopost.com](https://nexopost.com)
- **License:** MIT © Kuzey Tech Bilgi Teknolojileri Ticaret Limited Sirketi (Uptexx)
