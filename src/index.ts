import {
  extractEntities as extract,
  countSocialCharacters as countChars,
  getRemainingCharacters as getRemaining
} from './index.mjs';

import type {
  ExtractedEntities,
  CharacterCountResult,
  RemainingCharactersResult
} from './index.d.ts';

export function extractEntities(text: string): ExtractedEntities {
  return extract(text);
}

export function countSocialCharacters(
  text: string,
  platform = 'x'
): CharacterCountResult {
  return countChars(text, platform);
}

export function getRemainingCharacters(
  text: string,
  platform = 'x'
): RemainingCharactersResult {
  return getRemaining(text, platform);
}
