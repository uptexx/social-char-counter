/**
 * @uptexx/social-char-counter
 * Accurate platform-aware character, URL (t.co 23-char weighting), grapheme/emoji,
 * mention, and hashtag counter for 10 social networks.
 */

export interface ExtractedEntities {
  urls: string[];
  hashtags: string[];
  mentions: string[];
  emojis: string[];
}

export interface CharacterCountResult {
  platform: string;
  weightedLength: number;
  rawLength: number;
  graphemeCount: number;
  codePointCount: number;
  byteLength: number;
  wordCount: number;
  lineCount: number;
  urlCount: number;
  hashtagCount: number;
  mentionCount: number;
  emojiCount: number;
  limit: number;
  remaining: number;
  isOverLimit: boolean;
}

export interface RemainingCharactersResult {
  platform: string;
  limit: number;
  used: number;
  remaining: number;
  isOverLimit: boolean;
  percentageUsed: number;
}

export declare function extractEntities(text: string): ExtractedEntities;
export declare function countSocialCharacters(
  text: string,
  platform?: string
): CharacterCountResult;
export declare function getRemainingCharacters(
  text: string,
  platform?: string
): RemainingCharactersResult;
