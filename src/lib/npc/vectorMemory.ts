/**
 * Vector Memory Types for NPC Semantic Memory Retrieval
 *
 * Implements semantic search and clustering for NPC memories using
 * local TF-IDF embeddings (no external API calls).
 *
 * Part of Phase 8: Polish & Scale (GitHub Issue #197)
 */

/**
 * Vector embedding for a memory.
 * Stores the numerical representation of memory text for similarity search.
 */
export interface VectorEmbedding {
  /** Unique identifier for this embedding */
  id: string;
  /** ID of the associated memory */
  memoryId: string;
  /** Vector representation of the text (TF-IDF weighted bag-of-words) */
  vector: number[];
  /** Original text that was embedded */
  text: string;
  /** Timestamp when this embedding was created */
  createdAt: number;
}

/**
 * Result of a similarity search.
 * Contains the memory ID, similarity score, and full embedding data.
 */
export interface SimilarityResult {
  /** ID of the matching memory */
  memoryId: string;
  /** Cosine similarity score (0 to 1) */
  score: number;
  /** Full embedding data */
  embedding: VectorEmbedding;
}

/**
 * Hybrid score combining semantic, recency, and importance.
 * Used for more nuanced memory retrieval.
 */
export interface HybridScore {
  /** ID of the memory */
  memoryId: string;
  /** Semantic similarity score (0 to 1) */
  semantic: number;
  /** Recency score (0 to 1, higher = more recent) */
  recency: number;
  /** Importance score (0 to 1, normalized from 1-10 scale) */
  importance: number;
  /** Combined weighted score: semantic*0.4 + recency*0.3 + importance*0.3 */
  combined: number;
}

/**
 * Cluster of semantically similar memories.
 * Created by k-means clustering algorithm.
 */
export interface MemoryCluster {
  /** Unique identifier for this cluster */
  id: string;
  /** Centroid vector (average of all member vectors) */
  centroid: number[];
  /** IDs of memories belonging to this cluster */
  memberIds: string[];
  /** Descriptive theme/topic of the cluster */
  theme: string;
}

/**
 * Metadata for memory scoring in hybrid search.
 */
export interface MemoryMetadata {
  /** Timestamp of the memory */
  timestamp: number;
  /** Importance rating (1-10) */
  importance: number;
}

/**
 * Configuration for hybrid search weights.
 * Default: semantic=0.4, recency=0.3, importance=0.3
 */
export const HYBRID_SEARCH_WEIGHTS = {
  /** Weight for semantic similarity */
  semantic: 0.4,
  /** Weight for recency */
  recency: 0.3,
  /** Weight for importance */
  importance: 0.3,
};

/**
 * Crypto-native vocabulary for TF-IDF embeddings.
 * Includes common crypto terms, city simulation terms, and general vocabulary.
 */
export const CRYPTO_VOCABULARY: string[] = [
  // Cryptocurrencies
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "dogecoin",
  "doge",
  "solana",
  "sol",
  "cardano",
  "ada",
  "polygon",
  "matic",
  "avalanche",
  "avax",
  "chainlink",
  "link",
  "uniswap",
  "uni",
  "aave",
  "compound",

  // DeFi terms
  "defi",
  "dex",
  "cex",
  "amm",
  "liquidity",
  "pool",
  "yield",
  "farming",
  "staking",
  "swap",
  "lending",
  "borrowing",
  "collateral",
  "leverage",
  "margin",
  "perpetual",
  "futures",
  "options",
  "derivatives",
  "protocol",

  // NFT terms
  "nft",
  "mint",
  "minting",
  "collection",
  "marketplace",
  "opensea",
  "rarible",
  "art",
  "digital",
  "token",
  "tokenize",
  "tokenomics",

  // Trading terms
  "trading",
  "trade",
  "trader",
  "buy",
  "sell",
  "hold",
  "hodl",
  "position",
  "long",
  "short",
  "bull",
  "bear",
  "bullish",
  "bearish",
  "pump",
  "dump",
  "fomo",
  "fud",
  "rug",
  "rugpull",
  "moon",
  "mooning",
  "dip",
  "crash",
  "rally",
  "breakout",
  "resistance",
  "support",
  "volume",
  "volatility",

  // Wallet terms
  "wallet",
  "address",
  "transaction",
  "gas",
  "fee",
  "transfer",
  "send",
  "receive",
  "balance",
  "private",
  "public",
  "key",
  "seed",
  "phrase",
  "metamask",
  "ledger",
  "hardware",

  // City/simulation terms
  "building",
  "office",
  "exchange",
  "market",
  "cafe",
  "restaurant",
  "park",
  "home",
  "residence",
  "workplace",
  "shop",
  "store",
  "bank",
  "gallery",
  "museum",
  "library",
  "hospital",
  "school",
  "university",
  "factory",
  "warehouse",
  "tower",
  "plaza",
  "street",
  "road",
  "path",
  "district",

  // Actions and activities
  "walk",
  "walking",
  "run",
  "running",
  "sit",
  "sitting",
  "eat",
  "eating",
  "drink",
  "drinking",
  "work",
  "working",
  "rest",
  "resting",
  "sleep",
  "sleeping",
  "talk",
  "talking",
  "meet",
  "meeting",
  "visit",
  "visiting",

  // Social terms
  "friend",
  "friends",
  "colleague",
  "neighbor",
  "stranger",
  "group",
  "community",
  "conversation",
  "discussion",
  "chat",
  "message",
  "social",

  // Emotional terms
  "happy",
  "sad",
  "angry",
  "excited",
  "worried",
  "nervous",
  "confident",
  "stressed",
  "relaxed",
  "surprised",
  "disappointed",
  "satisfied",

  // Time-related
  "morning",
  "afternoon",
  "evening",
  "night",
  "day",
  "week",
  "month",
  "year",
  "today",
  "yesterday",
  "tomorrow",

  // Common verbs
  "saw",
  "see",
  "saw",
  "heard",
  "hear",
  "found",
  "find",
  "made",
  "make",
  "got",
  "get",
  "went",
  "go",
  "came",
  "come",
  "took",
  "take",
  "gave",
  "give",
  "told",
  "tell",
  "said",
  "say",

  // Crypto slang
  "whale",
  "diamond",
  "hands",
  "paper",
  "ape",
  "apeing",
  "bag",
  "bags",
  "bagholder",
  "degen",
  "normie",
  "maxi",
  "maximalist",
  "pleb",
  "ngmi",
  "wagmi",
  "gm",
  "gn",

  // Quantitative terms
  "price",
  "value",
  "amount",
  "quantity",
  "percentage",
  "gain",
  "loss",
  "profit",
  "revenue",
  "cost",
  "expensive",
  "cheap",
  "high",
  "low",
  "increase",
  "decrease",
  "rise",
  "fall",
  "surge",
  "plunge",

  // General nouns
  "people",
  "person",
  "place",
  "thing",
  "event",
  "time",
  "money",
  "crypto",
  "cryptocurrency",
  "news",
  "information",
  "data",
  "chart",
  "graph",
  "analysis",
  "report",
  "update",
];

/**
 * Generate a unique embedding ID.
 */
export function generateEmbeddingId(): string {
  return `emb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique cluster ID.
 */
export function generateClusterId(): string {
  return `cluster_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
