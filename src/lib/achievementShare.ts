/**
 * Achievement Share System
 * 
 * Generates shareable achievement cards and social media content.
 * Implements canvas-based card generation with Cobie's sardonic commentary.
 */

import { Achievement } from '@/types/game';

// Achievement stats for card generation
export interface AchievementShareStats {
  treasury: number;
  population: number;
  days: number;
}

// Cobie quips for achievements - sardonic, self-deprecating, gaming metaphors
const COBIE_ACHIEVEMENT_QUIPS: Record<string, string[]> = {
  // Population achievements
  pop_100: [
    "A hundred citizens in your crypto city. Still probably more trustworthy than most token holders.",
    "First 100 residents. That's already larger than most DAO governance participation.",
    "Small town energy. At least they can't rug you.",
  ],
  pop_500: [
    "500 people now trust your urban planning. Weird flex but okay.",
    "Growing village vibes. Still waiting for the 'when moon' graffiti to appear.",
    "You're basically running a mid-size Discord server now.",
  ],
  pop_1000: [
    "A thousand citizens. That's like, way more than attended most NFT conferences.",
    "Town status achieved. The probability of someone yelling 'wagmi' increases daily.",
    "You've stumbled into actual city building. I'm somewhat impressed.",
  ],
  pop_5000: [
    "Small city unlocked. Population: still smaller than CT accounts with less followers than a microwave.",
    "Five thousand people. Each one statistically likely to ask 'wen utility'.",
    "This is actually starting to look like something. Not financial advice.",
  ],
  pop_10000: [
    "Ten thousand citizens. You're basically running a small protocol now.",
    "City status. The metagame is strong with this one.",
    "More residents than most chains have daily active users. Just saying.",
  ],
  pop_25000: [
    "Major city territory. The alpha was infrastructure spending all along.",
    "25k pop. That's like a successful token launch worth of people. Actually engaged ones.",
    "You've built something real. Probably. Unless this is all a simulation. Wait...",
  ],
  pop_50000: [
    "Metropolis achieved. You're either very good or very stubborn. Possibly both.",
    "Fifty thousand citizens. Touch grass... wait, you probably already have parks.",
    "The absolute state of your city building skills. Unironically impressed.",
  ],

  // Economy achievements
  money_10000: [
    "Ten thousand in the treasury. That's almost enough for one NFT mint. Almost.",
    "Stable finances. The boring play that actually works.",
    "Not broke yet. A rare achievement in this space, honestly.",
  ],
  money_50000: [
    "Prosperous city vibes. Your treasury has survived longer than most yield farms.",
    "Fifty K in the bank. That's actual money, not 'governance tokens'.",
    "Financial stability achieved. The metagame most people skip.",
  ],
  money_100000: [
    "Hundred thousand in treasury. You've out-TVL'd most DeFi protocols.",
    "Wealthy municipality. No VCs were harmed in the making of this treasury.",
    "Six figures in the bank. Did you... not ape into anything?",
  ],
  money_500000: [
    "Half a million. Your treasury management might actually be... good?",
    "Economic powerhouse. This is what sustainable yield actually looks like.",
    "Five hundred K. The 'have fun staying poor' crowd is typing...",
  ],

  // Service achievements  
  happiness_80: [
    "80% happiness. Your citizens are happier than most token holders on a red day.",
    "Happy citizens achievement. The real alpha was quality of life all along.",
    "Four out of five citizens are vibing. The fifth one is probably on CT.",
  ],
  happiness_95: [
    "95% happiness. Utopia achieved. This can't be sustainable. Right?",
    "Near-perfect happiness. Either you're really good or the metrics are lying.",
    "Utopia unlocked. Your city is less toxic than most Telegram groups.",
  ],
  education_90: [
    "90% education. Your citizens might actually read the whitepaper now.",
    "Educated population. The probability of smart contract exploits decreases.",
    "Center of learning. DYOR culture finally taking root.",
  ],
  safety_90: [
    "90% safety. Fewer rugs than most DeFi protocols.",
    "Safe haven status. Your city has more security than most bridges.",
    "Extremely safe. The complete opposite of ape-ing into new mints.",
  ],
  health_90: [
    "90% health rating. Your citizens touch grass AND go to the doctor.",
    "Healthy living unlocked. Probably not staring at charts 24/7.",
    "Health focus paying off. Unlike most portfolios, this actually improved.",
  ],
  environment_80: [
    "80% environment. Green city achievement. Carbon neutral before it was cool.",
    "Environmental focus. Your city cares more about trees than most DAOs.",
    "Green vibes. Probably the only 'green' thing in crypto right now.",
  ],

  // Longevity achievements
  year_5: [
    "Five years of city building. That's like 35 crypto years.",
    "Half a decade. Still here. Still building. Based.",
    "Five year plan complete. The diamond hands of city management.",
  ],
  year_10: [
    "A decade of leadership. You've outlasted most exchanges at this point.",
    "Ten years. Multiple cycles survived. This is actually impressive.",
    "Decade of building. The long game is the only game that matters.",
  ],
  year_25: [
    "Twenty-five years. Silver jubilee. You've been here since before ETH.",
    "Quarter century of city building. This is some serious conviction.",
    "Silver jubilee. Generational wealth meets generational city planning.",
  ],

  // Building achievements
  first_stadium: [
    "First stadium. Hosting events before the NFT ticketing hype.",
    "Sports fan achievement. At least physical attendance is provable.",
    "Stadium built. The original proof of attendance.",
  ],
  first_airport: [
    "Airport unlocked. Ready for takeoff. Unlike most L2 bridges.",
    "First airport. International arrivals: not your private keys.",
    "Aviation infrastructure. Flying is still faster than most L1 finality.",
  ],
  first_university: [
    "University built. Higher education. The long-term play.",
    "First university. Teaching citizens to DYOR properly.",
    "Education infrastructure. The compound interest of human capital.",
  ],
  space_program: [
    "Space program! To the moon! Wait, we actually mean it literally this time.",
    "Space infrastructure. The ultimate 'going up' strategy.",
    "To the stars. Finally, a 'moon' reference that's actually about space.",
  ],
};

// Default quips for achievements without specific ones
const DEFAULT_QUIPS = [
  "Achievement unlocked. The grind was real.",
  "Another milestone. Keep building.",
  "You're making progress. Probably.",
  "Nice work. Not financial advice, but nice work.",
  "Achievement acquired. The metagame continues.",
  "Leveling up your city game. Based.",
];

/**
 * Get a random Cobie quip for an achievement
 */
export function getCobieAchievementQuip(achievementId: string): string {
  const quips = COBIE_ACHIEVEMENT_QUIPS[achievementId] || DEFAULT_QUIPS;
  return quips[Math.floor(Math.random() * quips.length)];
}

/**
 * Format a number with K/M suffixes for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Generate a shareable achievement card as a PNG blob
 */
export async function generateAchievementCard(
  achievement: Achievement,
  stats: AchievementShareStats
): Promise<Blob> {
  // Card dimensions
  const width = 600;
  const height = 400;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Inner border glow effect
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // Header: Achievement Unlocked
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 ACHIEVEMENT UNLOCKED', width / 2, 55);

  // Decorative line under header
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 75);
  ctx.lineTo(width - 100, 75);
  ctx.stroke();

  // Achievement name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  ctx.fillText(`"${achievement.name}"`, width / 2, 125);

  // Achievement description
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(achievement.description, width / 2, 160);

  // Stats section
  const statsY = 210;
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  
  // Treasury
  ctx.textAlign = 'left';
  ctx.fillText(`Treasury: $${formatNumber(stats.treasury)}`, 60, statsY);
  
  // Population
  ctx.textAlign = 'center';
  ctx.fillText(`Population: ${formatNumber(stats.population)}`, width / 2, statsY);
  
  // Days played
  ctx.textAlign = 'right';
  ctx.fillText(`Day: ${stats.days}`, width - 60, statsY);

  // Cobie quote section
  const quoteY = 270;
  const quip = getCobieAchievementQuip(achievement.id);
  
  // Quote background
  ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
  ctx.fillRect(40, quoteY - 25, width - 80, 70);
  
  // Quote text
  ctx.fillStyle = '#d1d5db';
  ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  
  // Word wrap the quote
  const maxWidth = width - 100;
  const words = quip.split(' ');
  let line = '';
  let lineY = quoteY;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(`"${line.trim()}"`, width / 2, lineY);
      line = word + ' ';
      lineY += 22;
      // For second line, don't add quote marks
      ctx.fillText(line.trim(), width / 2, lineY);
    } else {
      line = testLine;
    }
  }
  // Final line
  if (line.trim()) {
    ctx.fillText(`"${line.trim()}"`, width / 2, lineY);
  }
  
  // Attribution
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('— Cobie', width - 60, quoteY + 50);

  // Footer: Play link
  ctx.fillStyle = '#6b7280';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎮 Play at crypto-city.game', width / 2, height - 30);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image blob'));
      }
    }, 'image/png');
  });
}

/**
 * Generate shareable text for Twitter
 */
export function generateShareText(achievement: Achievement): string {
  const quip = getCobieAchievementQuip(achievement.id);
  
  return `🏆 Just unlocked "${achievement.name}" in Crypto City!

${achievement.description}

"${quip.length > 100 ? quip.substring(0, 97) + '...' : quip}" — Cobie

Play free: crypto-city.game`;
}

/**
 * Generate Twitter share URL
 */
export function generateTwitterShareUrl(achievement: Achievement): string {
  const text = generateShareText(achievement);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

/**
 * Download achievement card as image
 */
export async function downloadAchievementCard(
  achievement: Achievement,
  stats: AchievementShareStats
): Promise<void> {
  const blob = await generateAchievementCard(achievement, stats);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = `crypto-city-${achievement.id}-${Date.now()}.png`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
}
