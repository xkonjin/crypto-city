/**
 * Fallen Protocols Museum System
 * 
 * A "Hitchhiker's Guide to the Galaxy" style museum exhibit system featuring
 * sardonic tributes to real crypto scandals, collapses, and cautionary tales.
 * 
 * These exhibits appear in the Block Archive (museum building) and serve as
 * both education and dark humor for crypto natives.
 */

/**
 * Exhibit categories within the Fallen Protocols wing
 */
export type ExhibitCategory =
  | 'exchange_collapses'    // CEX failures
  | 'algorithmic_disasters' // Stablecoin/algo failures  
  | 'ponzi_schemes'         // Classic scams
  | 'rug_pulls'             // DeFi rugs
  | 'hacks'                 // Major security breaches
  | 'regulatory_raids'      // Legal troubles
  | 'personality_cults';    // Fallen leaders

/**
 * Historical accuracy rating
 */
export type HistoricalAccuracy = 
  | 'documented'           // Well-documented facts
  | 'alleged'              // Alleged/unproven claims
  | 'satirical';           // Satirical interpretation

/**
 * Museum exhibit entry
 */
export interface FallenProtocolExhibit {
  id: string;
  name: string;
  category: ExhibitCategory;
  year: number;
  estimatedLosses: string;
  headline: string;
  description: string;
  placard: string;           // Museum-style information card
  artifacts: string[];       // Items in the exhibit
  famousQuotes: string[];    // Real or satirical quotes
  lessonsLearned: string[];  // Sardonic takeaways
  accuracy: HistoricalAccuracy;
  realWorld: {
    eventName: string;
    primaryFigures: string[];
    references: string[];
  };
}

/**
 * The Fallen Protocols Museum Collection
 * 
 * Tone: Sardonic, educational, never cruel to victims, always critical of perpetrators
 */
export const FALLEN_PROTOCOLS: FallenProtocolExhibit[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // EXCHANGE COLLAPSES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'mt_gox',
    name: 'The Great Goxing',
    category: 'exchange_collapses',
    year: 2014,
    estimatedLosses: '$450 million (850,000 BTC)',
    headline: 'The Exchange That Invented Getting Goxed',
    description: `
      In 2014, Mt. Gox was handling 70% of all Bitcoin transactions. Then it wasn't handling 
      anything at all. The exchange discovered it had been slowly hemorrhaging Bitcoin since 
      2011, losing 850,000 BTC to what was either the world's most patient hacker or the 
      world's worst accounting.
      
      CEO Mark Karpeles became the face of "when exchanges go wrong," though his cats remained 
      blameless. The incident gave crypto its first major vocabulary contribution: "getting goxed" - 
      the experience of watching your assets disappear into the blockchain ether.
    `,
    placard: `
      MT. GOX (2010-2014)
      "Magic: The Gathering Online Exchange"
      
      Originally built to trade fantasy cards. Ended up trading 
      people's retirement funds into the void. An upgrade, technically.
      
      Handling 70% of global Bitcoin volume at its peak, Mt. Gox 
      demonstrated that "too big to fail" and "too incompetent to 
      succeed" are not mutually exclusive.
    `,
    artifacts: [
      'Original Mt. Gox website screenshot (2011)',
      'Mark Karpeles\'s famous "technical difficulties" announcement',
      'A hardware wallet that actually worked (for comparison)',
      'List of 127 excuses given during the collapse',
    ],
    famousQuotes: [
      '"We are working very hard to resolve the situation." - Mark Karpeles (repeatedly)',
      '"I\'m sorry." - Mark Karpeles (eventually)',
      '"At this point, 744,408 bitcoins are missing." - Mt. Gox announcement',
      '"goxed" - Now in the crypto dictionary',
    ],
    lessonsLearned: [
      'Not your keys, not your coins',
      'If an exchange is named after fantasy cards, diversify',
      'When a CEO keeps cats in the office, check the books',
      '"We\'re working on it" has a half-life of about three years',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'Mt. Gox Collapse',
      primaryFigures: ['Mark Karpeles'],
      references: ['2014 bankruptcy filing', 'FBI investigation', '2024 creditor repayment saga'],
    },
  },

  {
    id: 'ftx',
    name: 'The Effective Altruist\'s Dilemma',
    category: 'exchange_collapses',
    year: 2022,
    estimatedLosses: '$8-10 billion',
    headline: 'When "Doing Good" Meant Doing Time',
    description: `
      FTX was supposed to be different. Its founder spoke of effective altruism, wore cargo 
      shorts to Congress, and promised to give away his billions to save the world. He also, 
      allegedly, spent customer funds on Bahamas penthouses and a peculiar amount of Farmville-style 
      games.
      
      The collapse took eight days. The trial took six weeks. The sentence: 25 years. 
      
      It turned out that "effective altruism" and "effective asset allocation" were very different 
      things. The philosophy of doing the most good became a masterclass in doing the most fraud.
    `,
    placard: `
      FTX (2019-2022)
      "The Most Trusted Name in Crypto"
      
      Sponsored: The Miami Heat arena, MLB umpires, Tom Brady, 
      Larry David, and one memorable Super Bowl ad.
      
      Did NOT sponsor: An accounting department, apparently.
      
      Key Innovation: Proving that effective altruism and effective 
      embezzlement can coexist in the same press release.
    `,
    artifacts: [
      'FTX Arena naming rights (revoked)',
      'Congressional testimony video (now evidence)',
      'The Larry David "Don\'t Miss Out" commercial (ironic in retrospect)',
      'Original "What Happened" tweet thread from November 8, 2022',
      'A single cargo short (symbolic)',
    ],
    famousQuotes: [
      '"Sometimes life creeps up on you." - The founder, shortly before arrest',
      '"We\'re fine. Assets are fine." - November 7, 2022',
      '"I made a lot of mistakes." - November 10, 2022',
      '"What the f*** happened?" - Everyone else, November 8, 2022',
    ],
    lessonsLearned: [
      'If a CEO looks like he just woke up, check if the company is awake',
      'Effective altruism requires having assets to be altruistic with',
      'Celebrity endorsements are not financial audits',
      'When someone promises to do good later, verify they\'re doing good now',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'FTX/Alameda Research Collapse',
      primaryFigures: ['Sam Bankman-Fried', 'Caroline Ellison', 'Gary Wang'],
      references: ['November 2022 collapse', '2023-2024 trials', 'Effective Altruism fallout'],
    },
  },

  {
    id: 'quadriga',
    name: 'The Cold Wallet Mystery',
    category: 'exchange_collapses',
    year: 2019,
    estimatedLosses: '$215 million CAD',
    headline: 'The CEO Who Took the Password to His Grave (Maybe)',
    description: `
      When QuadrigaCX founder Gerald Cotten died during his honeymoon in India, he took the 
      passwords to $215 million in customer funds with him. Or did he?
      
      The cold wallets were empty. Had been for months. The "exchange" was apparently a one-man 
      Ponzi scheme run from a laptop that nobody could unlock. Except the wallets were already 
      drained. And some customers still aren't sure if he's actually dead.
      
      The mystery spawned a Netflix documentary, an exhumation request, and a new crypto proverb: 
      "Don't trust, verify, and maybe check the death certificate twice."
    `,
    placard: `
      QUADRIGACX (2013-2019)
      "Canada's Largest Cryptocurrency Exchange"
      
      Security Measures:
      - Cold wallets (✓)
      - Single point of failure (✓)  
      - CEO as only keyholder (✓)
      - Contingency plan (✗)
      
      The only exchange where "the founder died" was both the 
      explanation and the unanswered question.
    `,
    artifacts: [
      'Encrypted laptop (still locked)',
      'Indian death certificate (disputed)',
      'Empty cold wallet addresses',
      'Netflix documentary poster',
      'Customer petition for exhumation',
    ],
    famousQuotes: [
      '"Unfortunately, I do not know the password." - The widow',
      '"The cold wallets appear to be empty." - Ernst & Young',
      '"Is he actually dead?" - Reddit, continually',
      '"Exit scam or tragedy? Yes." - Crypto Twitter',
    ],
    lessonsLearned: [
      'Bus factor: 1 = Bad',
      'Cold wallets mean nothing if they\'re empty',
      'Always verify the honeymoon itinerary',
      'If one person has all the keys, you have zero decentralization',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'QuadrigaCX Collapse',
      primaryFigures: ['Gerald Cotten', 'Michael Patryn'],
      references: ['December 2018 death', 'OSC investigation', 'Netflix "Trust No One" documentary'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ALGORITHMIC DISASTERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'terra_luna',
    name: 'The Algorithmic Implosion',
    category: 'algorithmic_disasters',
    year: 2022,
    estimatedLosses: '$40-60 billion',
    headline: 'The Stablecoin That Wasn\'t',
    description: `
      UST was supposed to maintain its dollar peg through algorithmic magic and mint-and-burn 
      mechanics with LUNA. For a while, it worked. For a while, 20% APY on Anchor seemed normal. 
      For a while, "algorithmic stablecoin" wasn't an oxymoron.
      
      In May 2022, the music stopped. UST depegged. LUNA went into a death spiral. $40 billion 
      vanished in 72 hours. The founder, from his comfortable position as a Twitter personality, 
      watched his creation implode while posting "more steadfast than ever."
      
      He later became one of crypto's most wanted men. The algorithm, it turned out, was 
      excellent at destroying value. Just not at preserving it.
    `,
    placard: `
      TERRA/LUNA (2018-2022)
      "The Decentralized Stablecoin Ecosystem"
      
      The Anchor Protocol promised:
      - 20% APY on deposits
      - Algorithmic stability
      - The future of money
      
      The Anchor Protocol delivered:
      - 100% losses on deposits
      - Algorithmic instability  
      - The past of Ponzinomics
      
      Peak market cap: $60 billion. Final value: Your guess.
    `,
    artifacts: [
      'UST at $0.01 chart screenshot',
      'LUNA at $0.00001 chart screenshot',
      'Do Kwon\'s "Lunatics" merchandise (collector\'s item)',
      'Anchor Protocol 20% APY advertisement',
      'INTERPOL Red Notice (reproduction)',
    ],
    famousQuotes: [
      '"I don\'t debate the poor." - The founder, pre-collapse',
      '"More steadfast than ever." - The founder, mid-collapse',
      '"95% are going to die. But there\'s also entertainment in watching them die too." - The founder, 2021',
      '"Ser, the peg." - Everyone, May 2022',
    ],
    lessonsLearned: [
      'If the yield seems impossible, it is',
      'Algorithmic stablecoins are stable until they\'re not',
      'Arrogance on Twitter ages poorly',
      'Death spirals: not just a metaphor',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'Terra/Luna Collapse',
      primaryFigures: ['Do Kwon'],
      references: ['May 2022 depeg', 'Anchor Protocol', '2023 arrest in Montenegro'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PONZI SCHEMES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bitconnect',
    name: 'The Hey-Hey-Hey Heard Round the World',
    category: 'ponzi_schemes',
    year: 2018,
    estimatedLosses: '$2.5 billion',
    headline: 'BITCONNEEEEECT!',
    description: `
      Bitconnect promised up to 40% monthly returns through a "trading bot" that nobody ever 
      saw. At its peak, it was worth $463 per token. Its promoters held conferences. They 
      danced on stage. One particularly enthusiastic investor gave a presentation that would 
      become the single most memed moment in crypto history.
      
      "Hey hey hey! What's up, Bitconnect!" Carlos Matos shouted, his enthusiasm genuine, his 
      investment doomed. The company collapsed in January 2018. The token went to zero. But 
      the meme? The meme achieved immortality.
      
      Carlos later sold his viral moment as an NFT. Because of course he did.
    `,
    placard: `
      BITCONNECT (2016-2018)
      "The World's First Bitcoin Lending Platform"
      
      Promised Returns: 40% monthly
      Actual Returns: -100%
      Meme Value: Priceless
      
      The only Ponzi scheme whose promotional video became 
      a form of cultural currency more valuable than its token.
      
      "WASSA WASSA WASSUP!" - Now an official greeting
    `,
    artifacts: [
      'Carlos Matos conference video (on loop)',
      'Original Bitconnect promotional materials',
      'The infamous Bitconnect logo',
      'Carlos Matos NFT (yes, this exists)',
      'List of 8,000+ affected investors',
    ],
    famousQuotes: [
      '"Hey hey hey! What\'s up, Bitconnect!" - Carlos Matos',
      '"My wife doesn\'t believe in me! I told her, well honey, this is real!" - Carlos Matos',
      '"BITCONNEEEEEECT!" - Carlos Matos (the extended version)',
      '"I am independently, financially independently." - Carlos Matos',
    ],
    lessonsLearned: [
      'If returns seem too good to be true, they are',
      'Conference hype is not due diligence',
      'The louder the promotion, the bigger the scam',
      'At least the memes are free',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'Bitconnect Collapse',
      primaryFigures: ['Carlos Matos', 'Satish Kumbhani', 'Glenn Arcaro'],
      references: ['January 2018 shutdown', '2022 DOJ indictments', 'Immortal meme status'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LENDING PLATFORM COLLAPSES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'celsius',
    name: 'The Banking Unbanked (Into Bankruptcy)',
    category: 'exchange_collapses',
    year: 2022,
    estimatedLosses: '$4.7 billion',
    headline: 'Unbank Yourself, Then Unexist Your Savings',
    description: `
      Celsius offered up to 18% APY on crypto deposits. Their pitch: "Unbank yourself." 
      Their CEO wore hoodies with the slogan and preached financial freedom from traditional 
      banking. The irony was not subtle when the platform froze withdrawals and filed for 
      bankruptcy.
      
      It turned out that "unbanking" meant removing all the regulations that protect depositors. 
      The company was doing risky DeFi trades with customer funds. When the music stopped, 
      $4.7 billion in customer assets were frozen.
      
      The CEO later faced fraud charges. The hoodies became collector's items of a different sort.
    `,
    placard: `
      CELSIUS NETWORK (2017-2022)
      "Unbank Yourself"
      
      Services Offered:
      - High-yield savings accounts
      - Crypto-backed loans
      - A false sense of security
      
      Services Delivered:
      - Frozen accounts
      - Bankruptcy proceedings  
      - A renewed appreciation for FDIC insurance
    `,
    artifacts: [
      '"Unbank Yourself" merchandise',
      'Withdrawal freeze announcement',
      'Screenshot of 18% APY offerings',
      'Chapter 11 filing documents',
      'The algorithm that wasn\'t',
    ],
    famousQuotes: [
      '"Celsius is not a Ponzi scheme." - The CEO, before the Ponzi scheme collapsed',
      '"Deposits are safe." - Narrator: They were not safe',
      '"Due to extreme market conditions..." - The freeze announcement',
      '"Banks are not your friends." - True, but neither was Celsius',
    ],
    lessonsLearned: [
      'Unbanking yourself means unprotecting yourself',
      '18% APY requires asking where it comes from',
      'If a CEO wears the product on their hoodie, check the fine print',
      'Yield is not free; someone is paying for it (probably you)',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'Celsius Network Collapse',
      primaryFigures: ['Alex Mashinsky'],
      references: ['June 2022 withdrawal freeze', 'July 2022 bankruptcy', '2023 fraud charges'],
    },
  },

  {
    id: 'three_arrows',
    name: 'The Three Arrows That Missed',
    category: 'exchange_collapses',
    year: 2022,
    estimatedLosses: '$3 billion+',
    headline: 'Supercycle? More Like Super-Liquidation',
    description: `
      Three Arrows Capital (3AC) was once one of crypto's most celebrated hedge funds. Its 
      founders preached the "supercycle" thesis - that Bitcoin would only go up forever. They 
      borrowed against this thesis. Heavily.
      
      When the market turned, 3AC couldn't meet margin calls. The fund that had billions in 
      assets under management went from hero to bankruptcy in weeks. The founders fled to 
      yachts (allegedly) and then to Dubai (definitely).
      
      Their collapse triggered a domino effect that took down Voyager, BlockFi, and contributed 
      to Celsius and FTX's problems. One fund's hubris became an industry-wide contagion.
    `,
    placard: `
      THREE ARROWS CAPITAL (2012-2022)
      "A Crypto-Focused Hedge Fund"
      
      Investment Thesis: Supercycle means numbers only go up
      Risk Management: What's that?
      Leverage: Yes
      
      Final Status: Liquidated
      Founder Location: Ask the yacht
      
      Contribution to Crypto: Teaching an entire industry 
      about counterparty risk the hard way.
    `,
    artifacts: [
      'Supercycle thesis whitepaper',
      'Margin call notices (multiple)',
      'Photos of the founders\' yacht',
      'List of companies 3AC took down with them',
      'GBTC position disclosure',
    ],
    famousQuotes: [
      '"I\'m sorry everyone." - One founder, via tweet, while reportedly on a yacht',
      '"We are committed to working this out." - Narrator: They were on a yacht',
      '"The supercycle is intact." - It was not intact',
      '"We have always been risk-averse." - Documentation suggested otherwise',
    ],
    lessonsLearned: [
      'Hedge funds can be wrong, with leverage',
      'Counterparty risk is real',
      '"We\'re sorry" means more when you\'re not on a yacht',
      'Supercycles: mostly marketing',
    ],
    accuracy: 'documented',
    realWorld: {
      eventName: 'Three Arrows Capital Collapse',
      primaryFigures: ['Su Zhu', 'Kyle Davies'],
      references: ['June 2022 liquidation', 'Voyager/BlockFi domino effect', 'Singapore arrest warrant'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEGENDARY NPCs (Based on Real Crypto Figures - Satirized)
// ═══════════════════════════════════════════════════════════════════════════

export interface LegendaryNPC {
  id: string;
  name: string;                    // Satirical name
  realInspiration: string;         // Who they're based on
  role: string;                    // Their role in Crypto City
  personality: string;             // Brief description
  catchphrases: string[];          // Things they say
  location: string;                // Where to find them
  questline?: string;              // Optional quest description
}

export const LEGENDARY_NPCS: LegendaryNPC[] = [
  {
    id: 'carl_memes',
    name: 'Carl "WASSA" Memes',
    realInspiration: 'Carlos Matos (Bitconnect)',
    role: 'Motivational Speaker',
    personality: 'Perpetually enthusiastic about everything, even when everything is on fire',
    catchphrases: [
      'WASSA WASSA WASSUP!',
      'My wife STILL doesn\'t believe in me!',
      'I am independently, financially... well, it\'s complicated now.',
      'Let me tell you about this AMAZING opportunity!',
    ],
    location: 'Town Hall Stage (giving presentations to empty seats)',
    questline: 'Help Carl recover from his previous "investment" and find legitimate work in the city.',
  },
  {
    id: 'ghost_of_gox',
    name: 'The Ghost of Gox',
    realInspiration: 'Mark Karpeles (Mt. Gox)',
    role: 'Cautionary Spirit',
    personality: 'Apologetic, haunted by technical difficulties',
    catchphrases: [
      'Technical difficulties... always technical difficulties...',
      'I\'m working very hard to resolve this.',
      'Have you backed up your keys?',
      'The exchange is experiencing... issues.',
    ],
    location: 'Appears randomly in exchange buildings, warning of potential problems',
  },
  {
    id: 'the_altruist',
    name: 'The Effective Altruist',
    realInspiration: 'SBF and Effective Altruism movement',
    role: 'Philosopher (Suspended)',
    personality: 'Speaks in utilitarian calculations, dresses like a college student, claims good intentions',
    catchphrases: [
      'I\'m doing this for the greater good!',
      'The expected value calculations work out, trust me.',
      'I barely sleep. I\'m too busy... being effective.',
      'Have you considered the long-term impact?',
    ],
    location: 'Court House (attending proceedings)',
  },
  {
    id: 'stable_sam',
    name: 'Stable Sam',
    realInspiration: 'Do Kwon (Terra/Luna)',
    role: 'Former Economist',
    personality: 'Arrogant, tweets through crises, doesn\'t debate "the poor"',
    catchphrases: [
      'The algorithm is working perfectly.',
      'You just don\'t understand the math.',
      'More steadfast than ever!',
      'I don\'t debate people who question the peg.',
    ],
    location: 'Hiding somewhere in the city',
    questline: 'Track down Stable Sam and serve him a subpoena.',
  },
  {
    id: 'cold_wallet_mystery',
    name: 'The Man Who Knew the Password',
    realInspiration: 'Gerald Cotten (QuadrigaCX)',
    role: 'Mystery Figure',
    personality: 'May or may not exist. Password status: unknown.',
    catchphrases: [
      '...',
      '*static*',
      'The cold wallets are... somewhere.',
      '*no response*',
    ],
    location: 'Unknown. Reports of sightings unconfirmed.',
  },
  {
    id: 'the_unbankable',
    name: 'The Unbankable',
    realInspiration: 'Alex Mashinsky (Celsius)',
    role: 'Former Banker Turned Un-Banker',
    personality: 'Wears branded hoodies, promotes financial freedom while limiting withdrawals',
    catchphrases: [
      'Unbank yourself!',
      'Banks are not your friends.',
      'Your funds are safe... ish.',
      'Due to extreme market conditions...',
    ],
    location: 'Recovery Ward (visiting)',
  },
  {
    id: 'yacht_boys',
    name: 'The Yacht Boys',
    realInspiration: 'Su Zhu and Kyle Davies (3AC)',
    role: 'Former Hedge Fund Managers',
    personality: 'Twin brothers who believe in supercycles and maritime law',
    catchphrases: [
      'Sorry everyone!',
      'The supercycle is still intact!',
      'We\'re working this out... from international waters.',
      'Risk management? That\'s for the unleveraged.',
    ],
    location: 'Marina docks (their yacht is always "just leaving")',
  },
  {
    id: 'the_investigator',
    name: 'The Masked Detective',
    realInspiration: 'ZachXBT',
    role: 'On-Chain Investigator',
    personality: 'Anonymous, follows the money, exposes frauds',
    catchphrases: [
      'The wallets don\'t lie.',
      'Thread incoming...',
      'Another day, another rug exposed.',
      'Public blockchain = public receipts.',
    ],
    location: 'Rooftops at night, following transaction trails',
    questline: 'Help the Masked Detective trace funds from a suspicious new project.',
  },
  {
    id: 'coffee_crusader',
    name: 'The Truth Brewer',
    realInspiration: 'Coffeezilla',
    role: 'Investigative Journalist',
    personality: 'Caffeinated truth-seeker, makes videos about scams',
    catchphrases: [
      'Let\'s break down what actually happened here.',
      'The evidence suggests otherwise.',
      'I contacted them for comment. They did not respond.',
      'This is going to be a long one.',
    ],
    location: 'The newsroom, surrounded by coffee cups and evidence boards',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all exhibits by category
 */
export function getExhibitsByCategory(category: ExhibitCategory): FallenProtocolExhibit[] {
  return FALLEN_PROTOCOLS.filter(exhibit => exhibit.category === category);
}

/**
 * Get a random quote from a specific exhibit
 */
export function getRandomQuote(exhibitId: string): string | undefined {
  const exhibit = FALLEN_PROTOCOLS.find(e => e.id === exhibitId);
  if (!exhibit || exhibit.famousQuotes.length === 0) return undefined;
  return exhibit.famousQuotes[Math.floor(Math.random() * exhibit.famousQuotes.length)];
}

/**
 * Get a random lesson from a specific exhibit
 */
export function getRandomLesson(exhibitId: string): string | undefined {
  const exhibit = FALLEN_PROTOCOLS.find(e => e.id === exhibitId);
  if (!exhibit || exhibit.lessonsLearned.length === 0) return undefined;
  return exhibit.lessonsLearned[Math.floor(Math.random() * exhibit.lessonsLearned.length)];
}

/**
 * Get NPC by ID
 */
export function getNPC(id: string): LegendaryNPC | undefined {
  return LEGENDARY_NPCS.find(npc => npc.id === id);
}

/**
 * Get random catchphrase from an NPC
 */
export function getNPCCatchphrase(id: string): string | undefined {
  const npc = getNPC(id);
  if (!npc || npc.catchphrases.length === 0) return undefined;
  return npc.catchphrases[Math.floor(Math.random() * npc.catchphrases.length)];
}

/**
 * Get all exhibits sorted by year
 */
export function getExhibitsChronologically(): FallenProtocolExhibit[] {
  return [...FALLEN_PROTOCOLS].sort((a, b) => a.year - b.year);
}

/**
 * Calculate total estimated losses across all exhibits
 */
export function getTotalEstimatedLosses(): string {
  // This is for display purposes - actual values are complex
  return '$60+ billion';
}
