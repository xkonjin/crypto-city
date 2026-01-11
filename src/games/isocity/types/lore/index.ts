/**
 * Crypto City Lore System
 * 
 * Centralized exports for all lore, culture, and narrative modules.
 * Provides access to building names, fallen protocols museum, 
 * cultural references, and legendary NPCs.
 */

// Building Display Names & Categories
export {
  type BuildingCategory,
  type BuildingDisplayInfo,
  type CategoryDisplayInfo,
  BUILDING_DISPLAY_INFO,
  CATEGORY_DISPLAY_INFO,
  getBuildingDisplayName,
  getBuildingDescription,
  getBuildingLore,
  getBuildingCategory,
  getBuildingIcon,
  getBuildingDisplayInfo,
  getCategoryDisplayInfo,
  getBuildingsByCategory,
  getAllCategories,
} from '../buildingDisplayNames';

// Fallen Protocols Museum System
export {
  type ExhibitCategory,
  type HistoricalAccuracy,
  type FallenProtocolExhibit,
  type LegendaryNPC,
  FALLEN_PROTOCOLS,
  LEGENDARY_NPCS,
  getExhibitsByCategory,
  getRandomQuote,
  getRandomLesson,
  getNPC,
  getNPCCatchphrase,
  getExhibitsChronologically,
  getTotalEstimatedLosses,
} from '../fallenProtocols';

// Crypto Culture & Memes
export {
  type CryptoCatchphrase,
  type CryptoHistoricalMoment,
  type MarketCycle,
  type AdvisorMessage,
  type NewsHeadline,
  type CryptoAchievement,
  CRYPTO_CATCHPHRASES,
  CRYPTO_HISTORICAL_MOMENTS,
  ADVISOR_MESSAGES,
  NEWS_HEADLINES,
  CRYPTO_ACHIEVEMENTS,
  getRandomCatchphrase,
  getCatchphrasesByUsage,
  getAdvisorMessage,
  getNewsHeadline,
  getAchievement,
  getAchievementsByCategory,
} from '../cryptoCultureLore';
