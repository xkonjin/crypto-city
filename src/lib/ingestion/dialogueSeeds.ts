import type { SocialProfileMetadata } from './socialAdapters';
import { filterDialogueSeeds } from './safetyFilters';

export function buildDialogueSeeds(metadata: SocialProfileMetadata): string[] {
  const base = [
    ...metadata.topics.map((topic) => `topic:${topic}`),
    `tone:${metadata.tone}`,
  ];

  if (metadata.bio) {
    base.push(metadata.bio);
  }

  if (metadata.emojis.length > 0) {
    base.push(`emoji:${metadata.emojis.slice(0, 3).join('')}`);
  }

  return filterDialogueSeeds(base);
}
