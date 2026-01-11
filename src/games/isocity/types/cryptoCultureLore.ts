/**
 * Crypto Culture Lore System
 * 
 * Deep cultural references, memes, catchphrases, and historical moments
 * that reward crypto-native players with recognition Easter eggs.
 * 
 * Tone: Sardonic, affectionate, never cruel to victims
 */

// ═══════════════════════════════════════════════════════════════════════════
// FAMOUS CRYPTO CATCHPHRASES & MEMES
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoCatchphrase {
  phrase: string;
  meaning: string;
  origin: string;
  usage: 'greeting' | 'exclamation' | 'advice' | 'cope' | 'celebration' | 'warning';
  famousExample?: string;
}

export const CRYPTO_CATCHPHRASES: CryptoCatchphrase[] = [
  // Greetings & Community
  {
    phrase: 'GM',
    meaning: 'Good Morning - A community ritual showing you\'re alive and your portfolio might be too',
    origin: 'Crypto Twitter circa 2020-2021, became NFT culture staple',
    usage: 'greeting',
    famousExample: 'GM frens. WAGMI.',
  },
  {
    phrase: 'GN',
    meaning: 'Good Night - Signing off, trusting the market not to collapse while you sleep',
    origin: 'Counterpart to GM culture',
    usage: 'greeting',
    famousExample: 'GN. Don\'t let the liquidations bite.',
  },
  {
    phrase: 'ser',
    meaning: 'Sir - Respectful address, often preceding bad news or desperate requests',
    origin: 'Intentional misspelling from early crypto communities',
    usage: 'greeting',
    famousExample: 'Ser, the peg.',
  },
  {
    phrase: 'fren',
    meaning: 'Friend - Community member, fellow traveler in the trenches',
    origin: 'Pepe meme culture merged with crypto',
    usage: 'greeting',
  },
  {
    phrase: 'anon',
    meaning: 'Anonymous person - Fellow pseudonymous community member',
    origin: '4chan culture carried into crypto',
    usage: 'greeting',
  },

  // Optimism & Cope
  {
    phrase: 'WAGMI',
    meaning: 'We\'re All Gonna Make It - Statement of collective optimism, often ironic',
    origin: 'Bodybuilding forums, adopted by crypto circa 2020',
    usage: 'cope',
    famousExample: 'WAGMI... right? ...RIGHT?',
  },
  {
    phrase: 'NGMI',
    meaning: 'Not Gonna Make It - Reserved for those who sell too early or miss opportunities',
    origin: 'Counter-WAGMI, used to mock poor decisions',
    usage: 'warning',
    famousExample: 'You sold? NGMI.',
  },
  {
    phrase: 'LFG',
    meaning: 'Let\'s F***ing Go - Peak enthusiasm, usually preceding a pump or a rug',
    origin: 'Gaming culture → crypto hype',
    usage: 'celebration',
  },
  {
    phrase: 'HODL',
    meaning: 'Hold On for Dear Life - Originally a typo, now a lifestyle',
    origin: 'BitcoinTalk forum 2013, user "GameKyuubi" was drunk',
    usage: 'advice',
    famousExample: 'I AM HODLING',
  },
  {
    phrase: 'Diamond Hands 💎🙌',
    meaning: 'Ability to hold through severe drawdowns without selling',
    origin: 'WallStreetBets, adopted by crypto during meme stock era',
    usage: 'celebration',
  },
  {
    phrase: 'Paper Hands 📄🙌',
    meaning: 'Selling at the first sign of trouble (considered weak)',
    origin: 'Counter to diamond hands',
    usage: 'warning',
  },
  {
    phrase: 'Probably Nothing',
    meaning: 'Almost certainly something major (sarcastic understatement)',
    origin: 'CT (Crypto Twitter) sarcasm culture',
    usage: 'exclamation',
    famousExample: 'Ethereum flipped Bitcoin in daily volume. Probably nothing.',
  },

  // Investment Advice (Not Financial)
  {
    phrase: 'DYOR',
    meaning: 'Do Your Own Research - Legal disclaimer disguised as advice',
    origin: 'Crypto forums, legal teams everywhere',
    usage: 'advice',
    famousExample: 'This is not financial advice. DYOR. NFA.',
  },
  {
    phrase: 'NFA',
    meaning: 'Not Financial Advice - The magic words that protect no one',
    origin: 'Legal necessity, crypto culture staple',
    usage: 'advice',
  },
  {
    phrase: 'Buy the Dip',
    meaning: 'Purchase during price decline (assumes it will go back up)',
    origin: 'Traditional investing, overdone in crypto',
    usage: 'advice',
    famousExample: 'Which dip? The dip of the dip of the dip?',
  },
  {
    phrase: 'When Lambo?',
    meaning: 'When will gains be sufficient to purchase a Lamborghini?',
    origin: 'Early Bitcoin culture, embodying crypto dreams of wealth',
    usage: 'exclamation',
    famousExample: 'Ser, wen lambo? Ser? SER?',
  },
  {
    phrase: 'Wen Moon?',
    meaning: 'When will prices skyrocket? (The eternal question)',
    origin: 'Evolved from "to the moon" rocket imagery',
    usage: 'exclamation',
  },

  // Warnings & Pain
  {
    phrase: 'REKT',
    meaning: 'Wrecked - Suffered severe losses, liquidated, destroyed',
    origin: 'Gaming culture → crypto losses',
    usage: 'warning',
    famousExample: 'He got rekt. We all got rekt.',
  },
  {
    phrase: 'Rugged',
    meaning: 'Project developers abandoned and took all funds',
    origin: 'DeFi era, describes rug pull exit scams',
    usage: 'warning',
    famousExample: 'We got rugged. Again.',
  },
  {
    phrase: 'Goxed',
    meaning: 'Lost funds due to exchange failure (from Mt. Gox)',
    origin: 'Mt. Gox collapse 2014',
    usage: 'warning',
    famousExample: 'Don\'t get goxed. Not your keys, not your coins.',
  },
  {
    phrase: 'This is Fine',
    meaning: 'Denial in the face of catastrophic portfolio decline',
    origin: 'KC Green "On Fire" comic, crypto-adopted',
    usage: 'cope',
  },

  // Bitconnect Special
  {
    phrase: 'Hey Hey Hey',
    meaning: 'Greeting/exclamation (ironic reference to Bitconnect)',
    origin: 'Carlos Matos Bitconnect presentation 2017',
    usage: 'greeting',
    famousExample: 'HEY HEY HEY! WASSA WASSA WASSUP!',
  },
  {
    phrase: 'BITCONNEEEECT',
    meaning: 'Exclamation of enthusiasm (ironic, cautionary)',
    origin: 'Carlos Matos extended scream',
    usage: 'exclamation',
  },
  {
    phrase: 'I am independently, financially independently',
    meaning: 'Claims of financial success (ironic)',
    origin: 'Carlos Matos speech (before losses)',
    usage: 'celebration',
  },

  // Technical Culture
  {
    phrase: 'Few Understand',
    meaning: 'The speaker believes they have special insight (often they don\'t)',
    origin: 'CT humble-brag culture',
    usage: 'exclamation',
    famousExample: 'This will change everything. Few understand.',
  },
  {
    phrase: 'Looks Rare',
    meaning: 'NFT appears valuable/unique (often sarcastic)',
    origin: 'NFT culture 2021',
    usage: 'exclamation',
  },
  {
    phrase: 'Have Fun Staying Poor',
    meaning: 'Dismissal of crypto skeptics (aged poorly when used by maximalists)',
    origin: 'Bitcoin maximalist culture',
    usage: 'warning',
  },
  {
    phrase: 'Number Go Up',
    meaning: 'The core value proposition of crypto (satirical)',
    origin: 'Satirical description of crypto investment thesis',
    usage: 'celebration',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HISTORICAL CRYPTO MOMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoHistoricalMoment {
  id: string;
  name: string;
  date: string;
  description: string;
  significance: string;
  memePotential: 'legendary' | 'high' | 'moderate';
}

export const CRYPTO_HISTORICAL_MOMENTS: CryptoHistoricalMoment[] = [
  {
    id: 'pizza_day',
    name: 'Bitcoin Pizza Day',
    date: 'May 22, 2010',
    description: 'Laszlo Hanyecz paid 10,000 BTC for two pizzas, marking the first real-world Bitcoin transaction.',
    significance: 'Those pizzas would be worth hundreds of millions today. We celebrate this annually with regret.',
    memePotential: 'legendary',
  },
  {
    id: 'hodl_origin',
    name: 'The Birth of HODL',
    date: 'December 18, 2013',
    description: 'User "GameKyuubi" posted "I AM HODLING" on BitcoinTalk while drunk during a price crash.',
    significance: 'A typo became a philosophy. A drunk post became a movement.',
    memePotential: 'legendary',
  },
  {
    id: 'sign_guy',
    name: 'Bitcoin Sign Guy',
    date: 'July 12, 2017',
    description: 'A man held a "Buy Bitcoin" sign behind Janet Yellen during congressional testimony.',
    significance: 'Grassroots marketing at its most audacious. He was escorted out but immortalized.',
    memePotential: 'high',
  },
  {
    id: 'laser_eyes',
    name: 'Laser Eyes Movement',
    date: 'February 2021',
    description: 'Bitcoin supporters added laser eyes to profile pictures, targeting $100K BTC.',
    significance: 'We\'re still waiting. The lasers remain. The $100K does not.',
    memePotential: 'high',
  },
  {
    id: 'elon_doge',
    name: 'Elon\'s Doge Tweets',
    date: '2021-ongoing',
    description: 'Elon Musk\'s tweets moved Dogecoin\'s price by billions. Repeatedly.',
    significance: 'Proof that memes can be worth more than fundamentals.',
    memePotential: 'legendary',
  },
  {
    id: 'snl_doge',
    name: 'SNL Doge Day',
    date: 'May 8, 2021',
    description: 'Elon Musk hosted SNL. Doge dumped 30%. The perfect "sell the news" moment.',
    significance: 'Never buy the hype of a scheduled event. The market knows.',
    memePotential: 'high',
  },
  {
    id: 'saylor_buys',
    name: 'MicroStrategy Goes All In',
    date: 'August 2020-ongoing',
    description: 'Michael Saylor converted MicroStrategy\'s treasury to Bitcoin. Then bought more. And more.',
    significance: 'Either the greatest corporate trade ever or the longest game of chicken with reality.',
    memePotential: 'moderate',
  },
  {
    id: 'el_salvador',
    name: 'El Salvador Adopts Bitcoin',
    date: 'September 7, 2021',
    description: 'El Salvador made Bitcoin legal tender. The world watched. The IMF complained.',
    significance: 'A country betting on Bitcoin. Results: pending.',
    memePotential: 'moderate',
  },
  {
    id: 'nft_beeple',
    name: 'Beeple\'s $69 Million NFT',
    date: 'March 11, 2021',
    description: 'Beeple sold an NFT for $69 million at Christie\'s. The art world had questions.',
    significance: 'NFTs entered the mainstream. The mainstream was confused.',
    memePotential: 'high',
  },
  {
    id: 'boating_accident',
    name: 'The Boating Accident Meme',
    date: 'Eternal',
    description: 'Crypto holders claim to have lost their keys in tragic boating accidents.',
    significance: 'Tax planning meets maritime tragedy. Very convenient. Very sad.',
    memePotential: 'legendary',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ADVISOR MESSAGES (Market-Cycle Aware)
// ═══════════════════════════════════════════════════════════════════════════

export type MarketCycle = 'bull' | 'bear' | 'crab' | 'mania' | 'capitulation';

export interface AdvisorMessage {
  message: string;
  cycle: MarketCycle | 'any';
  category: 'wisdom' | 'warning' | 'humor' | 'news' | 'reference';
}

export const ADVISOR_MESSAGES: AdvisorMessage[] = [
  // Bull Market
  { message: 'Everyone\'s a genius in a bull market. Even you!', cycle: 'bull', category: 'humor' },
  { message: 'Have you considered taking some profits? Just asking.', cycle: 'bull', category: 'wisdom' },
  { message: 'Your neighbor is asking about crypto. This is either very good or very bad.', cycle: 'bull', category: 'warning' },
  { message: 'When your Uber driver gives you trading tips, consider the implications.', cycle: 'bull', category: 'warning' },
  { message: 'WAGMI! (Results not guaranteed)', cycle: 'bull', category: 'humor' },

  // Bear Market
  { message: 'This is when generational wealth is built. Also destroyed.', cycle: 'bear', category: 'wisdom' },
  { message: 'The best time to build was yesterday. The second best time is during a bear market.', cycle: 'bear', category: 'wisdom' },
  { message: 'Your portfolio may be down, but your principles remain intact. Right?', cycle: 'bear', category: 'humor' },
  { message: 'Remember: unrealized losses aren\'t real. Neither is your net worth display.', cycle: 'bear', category: 'humor' },
  { message: 'Have you considered touching grass?', cycle: 'bear', category: 'wisdom' },

  // Crab Market (Sideways)
  { message: 'The market moves sideways. Your blood pressure moves everywhere else.', cycle: 'crab', category: 'humor' },
  { message: 'Patience is a virtue. So is closing the portfolio app.', cycle: 'crab', category: 'wisdom' },
  { message: 'Nothing is happening. This is somehow still stressful.', cycle: 'crab', category: 'humor' },

  // Mania
  { message: 'When shoeshine boys give stock tips... we all know how that ends.', cycle: 'mania', category: 'warning' },
  { message: 'If it seems too good to be true, it probably has great marketing.', cycle: 'mania', category: 'warning' },
  { message: 'The only thing going up faster than prices is hubris.', cycle: 'mania', category: 'warning' },

  // Capitulation
  { message: 'It\'s always darkest before it gets slightly less dark.', cycle: 'capitulation', category: 'humor' },
  { message: 'This is where diamond hands are forged. Or shattered.', cycle: 'capitulation', category: 'wisdom' },
  { message: 'The Recovery Ward is accepting new patients.', cycle: 'capitulation', category: 'humor' },

  // Any Market
  { message: 'Not your keys, not your coins. Still true after all these years.', cycle: 'any', category: 'wisdom' },
  { message: 'The best investment is the one you can sleep through. Can you?', cycle: 'any', category: 'wisdom' },
  { message: 'DYOR. Then do it again. Then question everything.', cycle: 'any', category: 'wisdom' },
  { message: 'Time in the market beats timing the market. Most of the time.', cycle: 'any', category: 'wisdom' },
  { message: 'Have you backed up your seed phrase? No? Do it now. I\'ll wait.', cycle: 'any', category: 'warning' },

  // Historical References
  { message: 'Remember Mt. Gox? The market remembers.', cycle: 'any', category: 'reference' },
  { message: 'Someone just lost keys in a boating accident. Very convenient.', cycle: 'any', category: 'reference' },
  { message: '"The algorithm is working perfectly." — Words spoken before disaster', cycle: 'any', category: 'reference' },
  { message: 'Somewhere, someone is independently, financially independently.', cycle: 'any', category: 'reference' },
];

// ═══════════════════════════════════════════════════════════════════════════
// NEWS TICKER HEADLINES (Market-Cycle Aware)
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsHeadline {
  headline: string;
  cycle: MarketCycle | 'any';
  source: string; // Fake news source
}

export const NEWS_HEADLINES: NewsHeadline[] = [
  // Bull Market Headlines
  { headline: 'Local Degen Claims "This Time It\'s Different." Sources Confirm It Never Is.', cycle: 'bull', source: 'The Blockchain Times' },
  { headline: 'Man Who Bought Top Now Explains Why It\'s Actually Good', cycle: 'bull', source: 'Crypto Daily' },
  { headline: 'Venture Capital Firm Announces New $500M Fund For "Whatever\'s Hot"', cycle: 'bull', source: 'VC Weekly' },
  { headline: 'Influencer\'s Portfolio Up 400%. No, You Cannot See The Trades.', cycle: 'bull', source: 'CT Gazette' },

  // Bear Market Headlines
  { headline: 'Studies Show Staring At Red Charts Burns Calories Through Stress', cycle: 'bear', source: 'Wellness Crypto' },
  { headline: 'Local Builder Finally Has Time To Actually Build', cycle: 'bear', source: 'The Blockchain Times' },
  { headline: 'Man Discovers "Diamond Hands" Were Actually Just Paralysis', cycle: 'bear', source: 'Crypto Daily' },
  { headline: '"We\'re Early" Enters Fourth Consecutive Year', cycle: 'bear', source: 'CT Gazette' },

  // Scandal Headlines
  { headline: 'Exchange Assures Users Funds Are Safe. Users Concerned.', cycle: 'any', source: 'Breaking Blocks' },
  { headline: 'Founder\'s "Temporary Pause" Enters Week 47', cycle: 'any', source: 'The Blockchain Times' },
  { headline: 'Audited Protocol Discovers Audits Are Just Suggestions', cycle: 'any', source: 'DeFi Daily' },
  { headline: 'Stablecoin Becomes Unstablecoin. Developers "Surprised."', cycle: 'any', source: 'Breaking Blocks' },

  // General Headlines  
  { headline: 'Man Explains Blockchain To Family. Family Now Avoids Man.', cycle: 'any', source: 'Lifestyle Crypto' },
  { headline: 'Hot New Token Has Everything: Hype, Marketing, No Product', cycle: 'any', source: 'CT Gazette' },
  { headline: 'Research Shows 94% Of Crypto Advice Is "Not Financial Advice"', cycle: 'any', source: 'Academia Chain' },
  { headline: 'Gas Fees Low Enough To Use Network. Nation Celebrates.', cycle: 'any', source: 'Ethereum Observer' },
  { headline: 'DAO Debates Proposal For 47th Consecutive Day', cycle: 'any', source: 'Governance Weekly' },
  { headline: 'Anonymous Whale Makes Move. Market Speculates For 72 Hours.', cycle: 'any', source: 'On-Chain Intel' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  category: 'building' | 'survival' | 'trading' | 'culture' | 'scandal';
  unlockCondition: string;
}

export const CRYPTO_ACHIEVEMENTS: CryptoAchievement[] = [
  // Building Achievements
  { id: 'first_block', name: 'Genesis Block', description: 'Place your first building', icon: '🏗️', rarity: 'common', category: 'building', unlockCondition: 'Place any building' },
  { id: 'hodl_district', name: 'Diamond District', description: 'Build 10 residential buildings', icon: '💎', rarity: 'uncommon', category: 'building', unlockCondition: 'Build 10 residential' },
  { id: 'dex_empire', name: 'DEX Empire', description: 'Build 5 commercial buildings', icon: '📈', rarity: 'uncommon', category: 'building', unlockCondition: 'Build 5 commercial' },
  { id: 'hash_power', name: 'Hash Power', description: 'Build 3 industrial buildings', icon: '⛏️', rarity: 'uncommon', category: 'building', unlockCondition: 'Build 3 industrial' },
  { id: 'governance_forum', name: 'Quorum Achieved', description: 'Build City Hall', icon: '🏛️', rarity: 'rare', category: 'building', unlockCondition: 'Build City Hall' },
  { id: 'moonshot', name: 'Moonshot', description: 'Build the Space Program', icon: '🚀', rarity: 'legendary', category: 'building', unlockCondition: 'Build Space Program' },

  // Survival Achievements
  { id: 'bear_survivor', name: 'Bear Market Survivor', description: 'Survive a market downturn without demolishing buildings', icon: '🐻', rarity: 'rare', category: 'survival', unlockCondition: 'Survive downturn' },
  { id: 'diamond_hands', name: 'Diamond Hands', description: 'Never sell a building for 30 in-game days', icon: '💎🙌', rarity: 'legendary', category: 'survival', unlockCondition: '30 days no demolition' },
  { id: 'paper_hands', name: 'Paper Hands', description: 'Demolish 10 buildings in one session', icon: '📄🙌', rarity: 'common', category: 'survival', unlockCondition: 'Demolish 10 buildings' },
  
  // Culture Achievements
  { id: 'gm_gn', name: 'GM Fren', description: 'Play the game in both morning and night', icon: '🌅', rarity: 'common', category: 'culture', unlockCondition: 'Play AM and PM' },
  { id: 'wagmi', name: 'WAGMI', description: 'Achieve positive treasury balance', icon: '🎉', rarity: 'uncommon', category: 'culture', unlockCondition: 'Positive treasury' },
  { id: 'touch_grass', name: 'Touch Grass', description: 'Build a park', icon: '🌱', rarity: 'common', category: 'culture', unlockCondition: 'Build park' },
  { id: 'probably_nothing', name: 'Probably Nothing', description: 'Build the museum', icon: '🏛️', rarity: 'rare', category: 'culture', unlockCondition: 'Build museum' },
  
  // Scandal-Related Achievements (Dark Humor)
  { id: 'first_rug', name: 'First Rug', description: 'Experience your first building destruction event', icon: '🪤', rarity: 'uncommon', category: 'scandal', unlockCondition: 'Random event destroys building' },
  { id: 'not_goxed', name: 'Not Goxed', description: 'Keep all buildings safe for 50 days', icon: '🔐', rarity: 'legendary', category: 'scandal', unlockCondition: '50 days no losses' },
  { id: 'boating_accident', name: 'Boating Accident', description: 'Demolish a building near water', icon: '🚤', rarity: 'rare', category: 'scandal', unlockCondition: 'Demolish near water' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get random catchphrase
 */
export function getRandomCatchphrase(): CryptoCatchphrase {
  return CRYPTO_CATCHPHRASES[Math.floor(Math.random() * CRYPTO_CATCHPHRASES.length)];
}

/**
 * Get catchphrases by usage type
 */
export function getCatchphrasesByUsage(usage: CryptoCatchphrase['usage']): CryptoCatchphrase[] {
  return CRYPTO_CATCHPHRASES.filter(c => c.usage === usage);
}

/**
 * Get advisor message for current market cycle
 */
export function getAdvisorMessage(cycle: MarketCycle): AdvisorMessage {
  const relevant = ADVISOR_MESSAGES.filter(m => m.cycle === cycle || m.cycle === 'any');
  return relevant[Math.floor(Math.random() * relevant.length)];
}

/**
 * Get news headline for current market cycle
 */
export function getNewsHeadline(cycle: MarketCycle): NewsHeadline {
  const relevant = NEWS_HEADLINES.filter(h => h.cycle === cycle || h.cycle === 'any');
  return relevant[Math.floor(Math.random() * relevant.length)];
}

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): CryptoAchievement | undefined {
  return CRYPTO_ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: CryptoAchievement['category']): CryptoAchievement[] {
  return CRYPTO_ACHIEVEMENTS.filter(a => a.category === category);
}
