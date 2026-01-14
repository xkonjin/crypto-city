import type { NPCPersonality } from '@/lib/npc/personality';
import type { SocialProfileMetadata } from './socialAdapters';

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function mapTraitsFromSocial(metadata: SocialProfileMetadata): NPCPersonality {
  const emojiFactor = clamp(metadata.emojis.length / 6, 0, 1);
  const topicFactor = clamp(metadata.topics.length / 8, 0, 1);
  const engagementFactor = clamp(metadata.engagementRate * 10, 0, 1);
  const followerFactor = clamp(Math.log10(Math.max(metadata.followerCount, 1)) / 6, 0, 1);

  const tone = metadata.tone;
  const openness = clamp(0.4 + topicFactor * 0.3 + (tone === 'builder' ? 0.2 : 0));
  const conscientiousness = clamp(0.4 + (tone === 'analytical' ? 0.3 : 0) + (tone === 'builder' ? 0.2 : 0));
  const extraversion = clamp(0.3 + emojiFactor * 0.3 + engagementFactor * 0.2 + (tone === 'hype' ? 0.2 : 0));
  const agreeableness = clamp(0.4 + (tone === 'friendly' ? 0.3 : 0) - (tone === 'skeptical' ? 0.2 : 0));
  const neuroticism = clamp(0.3 + (tone === 'hype' ? 0.2 : 0) + (tone === 'skeptical' ? 0.2 : 0));

  const riskTolerance = clamp(0.35 + (tone === 'hype' ? 0.3 : 0) + (tone === 'memelord' ? 0.2 : 0));
  const fomo = clamp(0.3 + engagementFactor * 0.4 + (tone === 'hype' ? 0.2 : 0));
  const trustInInstitutions = clamp(0.4 - (tone === 'skeptical' ? 0.2 : 0) + (tone === 'analytical' ? 0.1 : 0));
  const technicalKnowledge = clamp(0.3 + (tone === 'builder' ? 0.4 : 0) + (tone === 'analytical' ? 0.2 : 0) + topicFactor * 0.2);
  const degenLevel = clamp(0.2 + (tone === 'memelord' ? 0.4 : 0) + (tone === 'hype' ? 0.3 : 0) + followerFactor * 0.1);

  return {
    bigFive: {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism,
    },
    crypto: {
      riskTolerance,
      fomo,
      trustInInstitutions,
      technicalKnowledge,
      degenLevel,
    },
  };
}
