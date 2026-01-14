export type SocialTone = 'analytical' | 'hype' | 'friendly' | 'skeptical' | 'builder' | 'memelord';

export type SocialProfileMetadata = {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  topics: string[];
  emojis: string[];
  activeHours: number[];
  engagementRate: number;
  followerCount: number;
  followingCount: number;
  tone: SocialTone;
};

export interface SocialAdapter {
  id: string;
  displayName: string;
  fetchProfile: (handle: string) => Promise<SocialProfileMetadata>;
}

export const MockSocialAdapter: SocialAdapter = {
  id: 'mock',
  displayName: 'Mock Adapter',
  async fetchProfile(handle: string): Promise<SocialProfileMetadata> {
    return {
      id: `mock-${handle}`,
      handle,
      displayName: handle,
      bio: 'Based builder with a soft spot for memecoins.',
      topics: ['defi', 'nfts', 'layer2'],
      emojis: ['🚀', '🧱', '📈'],
      activeHours: [9, 12, 18, 22],
      engagementRate: 0.04,
      followerCount: 4200,
      followingCount: 900,
      tone: 'builder',
    };
  },
};
