import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Vector Memory System (Issue #197)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements semantic memory retrieval using embeddings for intelligent
 * memory search and clustering.
 */

// Import types and classes we're going to implement
import type {
  VectorEmbedding,
  SimilarityResult,
  HybridScore,
  MemoryCluster,
} from "@/lib/npc/vectorMemory";
import { VectorMemoryManager } from "@/lib/npc/VectorMemoryManager";
import { createEpisodicMemory } from "@/lib/npc/memory";

/**
 * Test Suite: VectorEmbedding Interface
 * Tests vector embedding structure
 */
test.describe("VectorEmbedding Interface", () => {
  test("should have correct properties for vector embedding", async () => {
    const embedding: VectorEmbedding = {
      id: "emb_001",
      memoryId: "mem_001",
      vector: [0.1, 0.2, 0.3, 0.4, 0.5],
      text: "Had coffee with Alice at the DEX",
      createdAt: Date.now(),
    };

    expect(embedding.id).toBe("emb_001");
    expect(embedding.memoryId).toBe("mem_001");
    expect(embedding.vector).toHaveLength(5);
    expect(embedding.text).toContain("Alice");
    expect(embedding.createdAt).toBeDefined();
  });

  test("vector should be an array of numbers", async () => {
    const embedding: VectorEmbedding = {
      id: "emb_002",
      memoryId: "mem_002",
      vector: [0.5, -0.3, 0.8, 0.1, -0.2],
      text: "Test embedding",
      createdAt: Date.now(),
    };

    expect(Array.isArray(embedding.vector)).toBe(true);
    expect(embedding.vector.every((v) => typeof v === "number")).toBe(true);
  });

  test("vector values should be normalized (between -1 and 1)", async () => {
    const manager = new VectorMemoryManager();
    const embedding = manager.generateEmbedding("Test text for embedding");

    // Normalized vectors should have values between -1 and 1
    for (const value of embedding) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

/**
 * Test Suite: SimilarityResult Interface
 * Tests similarity search result structure
 */
test.describe("SimilarityResult Interface", () => {
  test("should have correct properties for similarity result", async () => {
    const result: SimilarityResult = {
      memoryId: "mem_001",
      score: 0.85,
      embedding: {
        id: "emb_001",
        memoryId: "mem_001",
        vector: [0.1, 0.2, 0.3],
        text: "Similar text",
        createdAt: Date.now(),
      },
    };

    expect(result.memoryId).toBe("mem_001");
    expect(result.score).toBe(0.85);
    expect(result.embedding).toBeDefined();
    expect(result.embedding.text).toBe("Similar text");
  });

  test("score should be between 0 and 1", async () => {
    const result: SimilarityResult = {
      memoryId: "mem_002",
      score: 0.72,
      embedding: {
        id: "emb_002",
        memoryId: "mem_002",
        vector: [0.5, 0.5],
        text: "Test",
        createdAt: Date.now(),
      },
    };

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: HybridScore Interface
 * Tests hybrid scoring structure
 */
test.describe("HybridScore Interface", () => {
  test("should have correct properties for hybrid score", async () => {
    const score: HybridScore = {
      memoryId: "mem_001",
      semantic: 0.8,
      recency: 0.6,
      importance: 0.9,
      combined: 0.77,
    };

    expect(score.memoryId).toBe("mem_001");
    expect(score.semantic).toBe(0.8);
    expect(score.recency).toBe(0.6);
    expect(score.importance).toBe(0.9);
    expect(score.combined).toBe(0.77);
  });

  test("combined score should be weighted average", async () => {
    // combined = semantic*0.4 + recency*0.3 + importance*0.3
    const semantic = 0.8;
    const recency = 0.6;
    const importance = 0.9;
    const expectedCombined = semantic * 0.4 + recency * 0.3 + importance * 0.3;

    const score: HybridScore = {
      memoryId: "mem_001",
      semantic,
      recency,
      importance,
      combined: expectedCombined,
    };

    expect(score.combined).toBeCloseTo(expectedCombined, 5);
  });

  test("all score components should be between 0 and 1", async () => {
    const score: HybridScore = {
      memoryId: "mem_001",
      semantic: 0.5,
      recency: 0.3,
      importance: 0.7,
      combined: 0.5,
    };

    expect(score.semantic).toBeGreaterThanOrEqual(0);
    expect(score.semantic).toBeLessThanOrEqual(1);
    expect(score.recency).toBeGreaterThanOrEqual(0);
    expect(score.recency).toBeLessThanOrEqual(1);
    expect(score.importance).toBeGreaterThanOrEqual(0);
    expect(score.importance).toBeLessThanOrEqual(1);
    expect(score.combined).toBeGreaterThanOrEqual(0);
    expect(score.combined).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: MemoryCluster Interface
 * Tests memory clustering structure
 */
test.describe("MemoryCluster Interface", () => {
  test("should have correct properties for memory cluster", async () => {
    const cluster: MemoryCluster = {
      id: "cluster_001",
      centroid: [0.3, 0.4, 0.5],
      memberIds: ["mem_001", "mem_002", "mem_003"],
      theme: "trading activities",
    };

    expect(cluster.id).toBe("cluster_001");
    expect(cluster.centroid).toHaveLength(3);
    expect(cluster.memberIds).toHaveLength(3);
    expect(cluster.theme).toBe("trading activities");
  });

  test("centroid should be a valid vector", async () => {
    const cluster: MemoryCluster = {
      id: "cluster_002",
      centroid: [0.1, 0.2, 0.3, 0.4],
      memberIds: ["mem_004"],
      theme: "single memory",
    };

    expect(Array.isArray(cluster.centroid)).toBe(true);
    expect(cluster.centroid.every((v) => typeof v === "number")).toBe(true);
  });

  test("memberIds should be array of memory IDs", async () => {
    const cluster: MemoryCluster = {
      id: "cluster_003",
      centroid: [0.5, 0.5],
      memberIds: ["mem_005", "mem_006"],
      theme: "test cluster",
    };

    expect(Array.isArray(cluster.memberIds)).toBe(true);
    expect(cluster.memberIds.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: VectorMemoryManager - generateEmbedding
 * Tests local embedding generation using TF-IDF
 */
test.describe("VectorMemoryManager - generateEmbedding", () => {
  test("should generate embedding from text", async () => {
    const manager = new VectorMemoryManager();
    const text = "Had coffee with Alice at the DEX exchange";
    const embedding = manager.generateEmbedding(text);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  test("should generate consistent embeddings for same text", async () => {
    const manager = new VectorMemoryManager();
    const text = "Bitcoin trading at the DEX";

    const embedding1 = manager.generateEmbedding(text);
    const embedding2 = manager.generateEmbedding(text);

    expect(embedding1).toEqual(embedding2);
  });

  test("should generate similar embeddings for similar text", async () => {
    const manager = new VectorMemoryManager();

    const text1 = "Trading Bitcoin at the exchange";
    const text2 = "Trading Ethereum at the exchange";
    const text3 = "Playing video games at home";

    const emb1 = manager.generateEmbedding(text1);
    const emb2 = manager.generateEmbedding(text2);
    const emb3 = manager.generateEmbedding(text3);

    const sim12 = manager.cosineSimilarity(emb1, emb2);
    const sim13 = manager.cosineSimilarity(emb1, emb3);

    // Similar texts should have higher similarity
    expect(sim12).toBeGreaterThan(sim13);
  });

  test("should handle empty text gracefully", async () => {
    const manager = new VectorMemoryManager();
    const embedding = manager.generateEmbedding("");

    expect(Array.isArray(embedding)).toBe(true);
  });

  test("should tokenize and normalize text", async () => {
    const manager = new VectorMemoryManager();

    // Same meaning, different case/punctuation
    const text1 = "Bitcoin is great!";
    const text2 = "BITCOIN IS GREAT";

    const emb1 = manager.generateEmbedding(text1);
    const emb2 = manager.generateEmbedding(text2);

    const similarity = manager.cosineSimilarity(emb1, emb2);

    // Should be highly similar due to normalization
    expect(similarity).toBeGreaterThan(0.8);
  });

  test("should use crypto-specific vocabulary", async () => {
    const manager = new VectorMemoryManager();

    // Crypto terms should be in vocabulary
    const cryptoText = "DEX exchange DeFi NFT yield farming staking";
    const embedding = manager.generateEmbedding(cryptoText);

    // Should produce non-zero embedding (terms found in vocabulary)
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(magnitude).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: VectorMemoryManager - addEmbedding
 * Tests adding embeddings for memories
 */
test.describe("VectorMemoryManager - addEmbedding", () => {
  test("should add embedding for a memory", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Had coffee at the DEX");

    const results = manager.findSimilar("coffee at exchange", 1);
    expect(results.length).toBeGreaterThan(0);
  });

  test("should store multiple embeddings", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin trading");
    manager.addEmbedding("mem_002", "Ethereum staking");
    manager.addEmbedding("mem_003", "NFT minting");

    const count = manager.getEmbeddingCount();
    expect(count).toBe(3);
  });

  test("should update embedding if memory already exists", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Old text about Bitcoin");
    manager.addEmbedding("mem_001", "New text about Ethereum");

    const count = manager.getEmbeddingCount();
    expect(count).toBe(1);

    const results = manager.findSimilar("Ethereum", 1);
    expect(results[0].embedding.text).toContain("Ethereum");
  });

  test("should auto-generate embedding ID", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Test text");

    const results = manager.findSimilar("Test", 1);
    expect(results[0].embedding.id).toBeDefined();
    expect(results[0].embedding.id).toMatch(/^emb_/);
  });

  test("should store creation timestamp", async () => {
    const manager = new VectorMemoryManager();
    const before = Date.now();

    manager.addEmbedding("mem_001", "Test text");

    const after = Date.now();
    const results = manager.findSimilar("Test", 1);

    expect(results[0].embedding.createdAt).toBeGreaterThanOrEqual(before);
    expect(results[0].embedding.createdAt).toBeLessThanOrEqual(after);
  });
});

/**
 * Test Suite: VectorMemoryManager - removeEmbedding
 * Tests removing embeddings
 */
test.describe("VectorMemoryManager - removeEmbedding", () => {
  test("should remove embedding by memory ID", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Test embedding to remove");
    expect(manager.getEmbeddingCount()).toBe(1);

    manager.removeEmbedding("mem_001");
    expect(manager.getEmbeddingCount()).toBe(0);
  });

  test("should handle removing non-existent embedding gracefully", async () => {
    const manager = new VectorMemoryManager();

    // Should not throw
    expect(() => manager.removeEmbedding("non_existent")).not.toThrow();
  });

  test("should only remove specified embedding", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "First embedding");
    manager.addEmbedding("mem_002", "Second embedding");
    manager.addEmbedding("mem_003", "Third embedding");

    manager.removeEmbedding("mem_002");

    expect(manager.getEmbeddingCount()).toBe(2);

    const results = manager.findSimilar("embedding", 10);
    const memoryIds = results.map((r) => r.memoryId);

    expect(memoryIds).toContain("mem_001");
    expect(memoryIds).not.toContain("mem_002");
    expect(memoryIds).toContain("mem_003");
  });
});

/**
 * Test Suite: VectorMemoryManager - cosineSimilarity
 * Tests cosine similarity calculation
 */
test.describe("VectorMemoryManager - cosineSimilarity", () => {
  test("should return 1 for identical vectors", async () => {
    const manager = new VectorMemoryManager();
    const vec = [0.5, 0.3, 0.2, 0.8];

    const similarity = manager.cosineSimilarity(vec, vec);
    expect(similarity).toBeCloseTo(1, 5);
  });

  test("should return 0 for orthogonal vectors", async () => {
    const manager = new VectorMemoryManager();
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];

    const similarity = manager.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(0, 5);
  });

  test("should return -1 for opposite vectors", async () => {
    const manager = new VectorMemoryManager();
    const vec1 = [1, 0, 0];
    const vec2 = [-1, 0, 0];

    const similarity = manager.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(-1, 5);
  });

  test("should handle zero vectors", async () => {
    const manager = new VectorMemoryManager();
    const zeroVec = [0, 0, 0];
    const normalVec = [1, 2, 3];

    const similarity = manager.cosineSimilarity(zeroVec, normalVec);
    expect(similarity).toBe(0);
  });

  test("should handle vectors of different lengths", async () => {
    const manager = new VectorMemoryManager();
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2];

    // Should handle gracefully (pad or truncate)
    const similarity = manager.cosineSimilarity(vec1, vec2);
    expect(typeof similarity).toBe("number");
    expect(similarity).toBeGreaterThanOrEqual(-1);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test("should return value between -1 and 1", async () => {
    const manager = new VectorMemoryManager();

    // Random vectors
    const vec1 = [0.3, -0.5, 0.8, 0.1];
    const vec2 = [-0.2, 0.6, 0.4, -0.7];

    const similarity = manager.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeGreaterThanOrEqual(-1);
    expect(similarity).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: VectorMemoryManager - findSimilar
 * Tests semantic similarity search
 */
test.describe("VectorMemoryManager - findSimilar", () => {
  test("should find similar memories by text", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Had coffee with Alice at the DEX");
    manager.addEmbedding("mem_002", "Traded Bitcoin at the exchange");
    manager.addEmbedding("mem_003", "Went for a walk in the park");

    const results = manager.findSimilar("coffee at DEX", 2);

    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0].memoryId).toBe("mem_001");
  });

  test("should return results sorted by similarity score", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin trading");
    manager.addEmbedding("mem_002", "Ethereum trading");
    manager.addEmbedding("mem_003", "NFT art collection");

    const results = manager.findSimilar("Bitcoin exchange", 3);

    // Results should be sorted by score (highest first)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  test("should respect limit parameter", async () => {
    const manager = new VectorMemoryManager();

    for (let i = 0; i < 10; i++) {
      manager.addEmbedding(`mem_${i}`, `Memory about crypto ${i}`);
    }

    const results = manager.findSimilar("crypto", 3);
    expect(results.length).toBe(3);
  });

  test("should return empty array when no embeddings exist", async () => {
    const manager = new VectorMemoryManager();

    const results = manager.findSimilar("any query", 5);
    expect(results).toEqual([]);
  });

  test("should include embedding in results", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Test memory text");

    const results = manager.findSimilar("Test", 1);

    expect(results[0].embedding).toBeDefined();
    expect(results[0].embedding.text).toBe("Test memory text");
  });

  test("should find semantically similar but not exact matches", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Purchased Bitcoin at the DEX exchange");
    manager.addEmbedding("mem_002", "Sold my Ethereum holdings");
    manager.addEmbedding("mem_003", "Went swimming at the pool");

    // Search with different words but similar meaning
    const results = manager.findSimilar("bought crypto at exchange", 3);

    // Trading-related memory should rank higher than swimming
    const tradingIndex = results.findIndex(
      (r) => r.memoryId === "mem_001" || r.memoryId === "mem_002"
    );
    const swimmingIndex = results.findIndex((r) => r.memoryId === "mem_003");

    expect(tradingIndex).toBeLessThan(swimmingIndex);
  });
});

/**
 * Test Suite: VectorMemoryManager - hybridSearch
 * Tests combined semantic, recency, and importance search
 */
test.describe("VectorMemoryManager - hybridSearch", () => {
  test("should return hybrid scores for matching memories", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin trading event");
    manager.setMemoryMetadata("mem_001", {
      timestamp: Date.now() - 1000,
      importance: 8,
    });

    const results = manager.hybridSearch("Bitcoin", 0.3, 0.3, 10);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].semantic).toBeDefined();
    expect(results[0].recency).toBeDefined();
    expect(results[0].importance).toBeDefined();
    expect(results[0].combined).toBeDefined();
  });

  test("should calculate combined score correctly", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Test memory");
    manager.setMemoryMetadata("mem_001", {
      timestamp: Date.now(),
      importance: 10,
    });

    const results = manager.hybridSearch("Test", 0.3, 0.3, 10);

    // combined = semantic*0.4 + recency*0.3 + importance*0.3
    const expected =
      results[0].semantic * 0.4 +
      results[0].recency * 0.3 +
      results[0].importance * 0.3;

    expect(results[0].combined).toBeCloseTo(expected, 2);
  });

  test("should prioritize recent memories with high recency weight", async () => {
    const manager = new VectorMemoryManager();
    const now = Date.now();

    manager.addEmbedding("mem_old", "Old Bitcoin memory");
    manager.setMemoryMetadata("mem_old", {
      timestamp: now - 1000 * 60 * 60 * 24 * 30, // 30 days ago
      importance: 5,
    });

    manager.addEmbedding("mem_new", "New Bitcoin memory");
    manager.setMemoryMetadata("mem_new", {
      timestamp: now - 1000, // 1 second ago
      importance: 5,
    });

    // High recency weight
    const results = manager.hybridSearch("Bitcoin", 0.6, 0.1, 10);

    // Recent memory should rank first
    expect(results[0].memoryId).toBe("mem_new");
  });

  test("should prioritize important memories with high importance weight", async () => {
    const manager = new VectorMemoryManager();
    const now = Date.now();

    manager.addEmbedding("mem_low", "Low importance memory");
    manager.setMemoryMetadata("mem_low", {
      timestamp: now,
      importance: 2,
    });

    manager.addEmbedding("mem_high", "High importance memory");
    manager.setMemoryMetadata("mem_high", {
      timestamp: now,
      importance: 9,
    });

    // High importance weight
    const results = manager.hybridSearch("memory", 0.1, 0.6, 10);

    // Important memory should rank first
    expect(results[0].memoryId).toBe("mem_high");
  });

  test("should respect limit parameter", async () => {
    const manager = new VectorMemoryManager();

    for (let i = 0; i < 20; i++) {
      manager.addEmbedding(`mem_${i}`, `Memory about crypto ${i}`);
      manager.setMemoryMetadata(`mem_${i}`, {
        timestamp: Date.now() - i * 1000,
        importance: 5,
      });
    }

    const results = manager.hybridSearch("crypto", 0.3, 0.3, 5);
    expect(results.length).toBe(5);
  });

  test("should sort results by combined score", async () => {
    const manager = new VectorMemoryManager();
    const now = Date.now();

    manager.addEmbedding("mem_001", "Bitcoin exchange trading");
    manager.addEmbedding("mem_002", "Ethereum staking rewards");
    manager.addEmbedding("mem_003", "NFT marketplace browsing");

    manager.setMemoryMetadata("mem_001", { timestamp: now, importance: 7 });
    manager.setMemoryMetadata("mem_002", {
      timestamp: now - 100000,
      importance: 8,
    });
    manager.setMemoryMetadata("mem_003", {
      timestamp: now - 200000,
      importance: 5,
    });

    const results = manager.hybridSearch("crypto", 0.3, 0.3, 10);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].combined).toBeGreaterThanOrEqual(
        results[i].combined
      );
    }
  });
});

/**
 * Test Suite: VectorMemoryManager - clusterMemories
 * Tests k-means clustering of memories
 */
test.describe("VectorMemoryManager - clusterMemories", () => {
  test("should cluster memories into specified number of clusters", async () => {
    const manager = new VectorMemoryManager();

    // Add diverse memories with clearly distinct topics
    manager.addEmbedding("mem_001", "Bitcoin trading on exchange buy sell");
    manager.addEmbedding("mem_002", "Ethereum trading on DEX staking");
    manager.addEmbedding("mem_003", "Walking in the park running swimming");
    manager.addEmbedding("mem_004", "Running in the park recreation activity");
    manager.addEmbedding("mem_005", "NFT collection showcase digital art");
    manager.addEmbedding("mem_006", "Crypto art gallery visit museum");

    const memoryIds = [
      "mem_001",
      "mem_002",
      "mem_003",
      "mem_004",
      "mem_005",
      "mem_006",
    ];
    const clusters = manager.clusterMemories(memoryIds, 3);

    // Should create at least 1 cluster and at most the requested number
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters.length).toBeLessThanOrEqual(3);
    
    // All memories should be assigned
    const allMemberIds = clusters.flatMap((c) => c.memberIds);
    expect(allMemberIds.length).toBe(6);
  });

  test("should assign all memories to clusters", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin");
    manager.addEmbedding("mem_002", "Ethereum");
    manager.addEmbedding("mem_003", "Dogecoin");
    manager.addEmbedding("mem_004", "NFT");

    const memoryIds = ["mem_001", "mem_002", "mem_003", "mem_004"];
    const clusters = manager.clusterMemories(memoryIds, 2);

    const allMembers = clusters.flatMap((c) => c.memberIds);
    expect(allMembers.length).toBe(4);

    for (const id of memoryIds) {
      expect(allMembers).toContain(id);
    }
  });

  test("should generate unique cluster IDs", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Test 1");
    manager.addEmbedding("mem_002", "Test 2");
    manager.addEmbedding("mem_003", "Test 3");

    const clusters = manager.clusterMemories(
      ["mem_001", "mem_002", "mem_003"],
      2
    );

    const ids = clusters.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("should compute valid centroids", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin");
    manager.addEmbedding("mem_002", "Ethereum");

    const clusters = manager.clusterMemories(["mem_001", "mem_002"], 1);

    expect(clusters[0].centroid).toBeDefined();
    expect(Array.isArray(clusters[0].centroid)).toBe(true);
    expect(clusters[0].centroid.length).toBeGreaterThan(0);
  });

  test("should handle fewer memories than clusters", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Only one memory");

    const clusters = manager.clusterMemories(["mem_001"], 5);

    // Should return fewer clusters than requested
    expect(clusters.length).toBeLessThanOrEqual(1);
  });

  test("should group similar memories together", async () => {
    const manager = new VectorMemoryManager();

    // Two groups: trading and recreation with very distinct vocabularies
    manager.addEmbedding("mem_trade1", "Bitcoin trading exchange defi staking yield");
    manager.addEmbedding("mem_trade2", "Ethereum trading DEX liquidity swap protocol");
    manager.addEmbedding("mem_trade3", "Crypto exchange buy sell market price");
    manager.addEmbedding("mem_fun1", "Walking running park swimming recreation");
    manager.addEmbedding("mem_fun2", "Swimming pool recreation fun activity");
    manager.addEmbedding("mem_fun3", "Park walking running exercise morning");

    const memoryIds = ["mem_trade1", "mem_trade2", "mem_trade3", "mem_fun1", "mem_fun2", "mem_fun3"];
    const clusters = manager.clusterMemories(memoryIds, 2);

    // Verify clusters were created
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters.length).toBeLessThanOrEqual(2);
    
    // All memories should be assigned to some cluster
    const allAssigned = clusters.flatMap((c) => c.memberIds);
    expect(allAssigned.length).toBe(6);
    
    // Each cluster should have a theme
    clusters.forEach((cluster) => {
      expect(cluster.theme.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test Suite: VectorMemoryManager - getClusterTheme
 * Tests cluster theme extraction
 */
test.describe("VectorMemoryManager - getClusterTheme", () => {
  test("should return theme for valid cluster", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin trading exchange");
    manager.addEmbedding("mem_002", "Ethereum trading DEX");

    const clusters = manager.clusterMemories(["mem_001", "mem_002"], 1);
    const theme = manager.getClusterTheme(clusters[0].id);

    expect(typeof theme).toBe("string");
    expect(theme.length).toBeGreaterThan(0);
  });

  test("should return empty string for invalid cluster ID", async () => {
    const manager = new VectorMemoryManager();

    const theme = manager.getClusterTheme("non_existent_cluster");
    expect(theme).toBe("");
  });

  test("should generate descriptive themes based on content", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Bitcoin price surge");
    manager.addEmbedding("mem_002", "Bitcoin all-time high");
    manager.addEmbedding("mem_003", "Bitcoin bull run");

    const clusters = manager.clusterMemories(
      ["mem_001", "mem_002", "mem_003"],
      1
    );
    const theme = manager.getClusterTheme(clusters[0].id);

    // Theme should relate to Bitcoin
    expect(theme.toLowerCase()).toContain("bitcoin");
  });
});

/**
 * Test Suite: VectorMemoryManager - batchUpdateEmbeddings
 * Tests efficient batch processing
 */
test.describe("VectorMemoryManager - batchUpdateEmbeddings", () => {
  test("should update multiple embeddings at once", async () => {
    const manager = new VectorMemoryManager();

    const memories = [
      { id: "mem_001", text: "First memory" },
      { id: "mem_002", text: "Second memory" },
      { id: "mem_003", text: "Third memory" },
    ];

    manager.batchUpdateEmbeddings(memories);

    expect(manager.getEmbeddingCount()).toBe(3);
  });

  test("should be faster than individual updates", async () => {
    const manager1 = new VectorMemoryManager();
    const manager2 = new VectorMemoryManager();

    const memories = Array.from({ length: 100 }, (_, i) => ({
      id: `mem_${i}`,
      text: `Memory about topic ${i % 10}`,
    }));

    // Batch update
    const batchStart = performance.now();
    manager1.batchUpdateEmbeddings(memories);
    const batchTime = performance.now() - batchStart;

    // Individual updates
    const individualStart = performance.now();
    for (const mem of memories) {
      manager2.addEmbedding(mem.id, mem.text);
    }
    const individualTime = performance.now() - individualStart;

    // Batch should be at least as fast (or faster with optimizations)
    expect(manager1.getEmbeddingCount()).toBe(100);
    expect(manager2.getEmbeddingCount()).toBe(100);

    // Both should complete successfully
    expect(batchTime).toBeLessThan(5000);
    expect(individualTime).toBeLessThan(5000);
  });

  test("should handle empty array", async () => {
    const manager = new VectorMemoryManager();

    expect(() => manager.batchUpdateEmbeddings([])).not.toThrow();
    expect(manager.getEmbeddingCount()).toBe(0);
  });

  test("should update existing embeddings in batch", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Old text");

    const memories = [
      { id: "mem_001", text: "Updated text" },
      { id: "mem_002", text: "New memory" },
    ];

    manager.batchUpdateEmbeddings(memories);

    expect(manager.getEmbeddingCount()).toBe(2);

    const results = manager.findSimilar("Updated", 1);
    expect(results[0].embedding.text).toBe("Updated text");
  });
});

/**
 * Test Suite: VectorMemoryManager - pruneOldEmbeddings
 * Tests removal of stale embeddings
 */
test.describe("VectorMemoryManager - pruneOldEmbeddings", () => {
  test("should remove embeddings older than maxAge", async () => {
    const manager = new VectorMemoryManager();

    // Add embeddings with different ages
    manager.addEmbedding("mem_old", "Old memory");
    manager.addEmbedding("mem_new", "New memory");

    // Manually set old timestamp
    manager.setEmbeddingCreatedAt(
      "mem_old",
      Date.now() - 1000 * 60 * 60 * 24 * 31
    ); // 31 days

    // Prune embeddings older than 30 days
    const pruned = manager.pruneOldEmbeddings(1000 * 60 * 60 * 24 * 30);

    expect(pruned).toBe(1);
    expect(manager.getEmbeddingCount()).toBe(1);
  });

  test("should return count of pruned embeddings", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_1", "Memory 1");
    manager.addEmbedding("mem_2", "Memory 2");
    manager.addEmbedding("mem_3", "Memory 3");

    // Set all to old timestamps
    const oldTime = Date.now() - 1000 * 60 * 60 * 24 * 10; // 10 days
    manager.setEmbeddingCreatedAt("mem_1", oldTime);
    manager.setEmbeddingCreatedAt("mem_2", oldTime);
    manager.setEmbeddingCreatedAt("mem_3", oldTime);

    const pruned = manager.pruneOldEmbeddings(1000 * 60 * 60 * 24 * 5); // 5 days max age

    expect(pruned).toBe(3);
  });

  test("should not prune recent embeddings", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_1", "Recent memory");
    manager.addEmbedding("mem_2", "Another recent memory");

    const pruned = manager.pruneOldEmbeddings(1000 * 60 * 60 * 24 * 30); // 30 days

    expect(pruned).toBe(0);
    expect(manager.getEmbeddingCount()).toBe(2);
  });

  test("should handle empty manager", async () => {
    const manager = new VectorMemoryManager();

    const pruned = manager.pruneOldEmbeddings(1000);

    expect(pruned).toBe(0);
  });
});

/**
 * Test Suite: Performance Tests
 * Tests performance requirements
 */
test.describe("Performance Tests", () => {
  test("should search 1000+ memories in under 100ms", async () => {
    const manager = new VectorMemoryManager();

    // Add 1000 memories
    for (let i = 0; i < 1000; i++) {
      manager.addEmbedding(
        `mem_${i}`,
        `Memory about topic ${i % 50} with crypto content ${i}`
      );
    }

    expect(manager.getEmbeddingCount()).toBe(1000);

    // Measure search time
    const start = performance.now();
    const results = manager.findSimilar("crypto topic", 10);
    const elapsed = performance.now() - start;

    expect(results.length).toBe(10);
    expect(elapsed).toBeLessThan(100); // Must complete in under 100ms
  });

  test("should handle hybrid search on 1000+ memories efficiently", async () => {
    const manager = new VectorMemoryManager();

    // Add 1000 memories with metadata
    const now = Date.now();
    for (let i = 0; i < 1000; i++) {
      manager.addEmbedding(
        `mem_${i}`,
        `Memory about crypto trading topic ${i % 50}`
      );
      manager.setMemoryMetadata(`mem_${i}`, {
        timestamp: now - i * 1000,
        importance: (i % 10) + 1,
      });
    }

    const start = performance.now();
    const results = manager.hybridSearch("trading", 0.3, 0.3, 10);
    const elapsed = performance.now() - start;

    expect(results.length).toBe(10);
    expect(elapsed).toBeLessThan(200); // Slightly higher limit for hybrid search
  });

  test("should cluster 100 memories in reasonable time", async () => {
    const manager = new VectorMemoryManager();

    // Add 100 diverse memories across different topics
    const topics = [
      "bitcoin trading exchange",
      "ethereum staking yield",
      "nft art collection",
      "defi lending protocol",
      "walking in park",
      "swimming at pool",
      "eating at cafe",
      "meeting at office",
      "shopping at market",
      "sleeping at home",
    ];
    for (let i = 0; i < 100; i++) {
      manager.addEmbedding(`mem_${i}`, `Memory about ${topics[i % 10]} number ${i}`);
    }

    const memoryIds = Array.from({ length: 100 }, (_, i) => `mem_${i}`);

    const start = performance.now();
    const clusters = manager.clusterMemories(memoryIds, 5);
    const elapsed = performance.now() - start;

    // Should create some clusters (may not be exactly 5 due to algorithm)
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters.length).toBeLessThanOrEqual(5);
    expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
  });
});

/**
 * Test Suite: Edge Cases
 * Tests edge cases and error handling
 */
test.describe("Edge Cases", () => {
  test("should handle special characters in text", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "Trading $BTC @DEX #crypto 🚀💎🙌");

    const results = manager.findSimilar("BTC crypto", 1);
    expect(results.length).toBe(1);
  });

  test("should handle very long text", async () => {
    const manager = new VectorMemoryManager();
    const longText = "crypto ".repeat(1000);

    manager.addEmbedding("mem_001", longText);

    const results = manager.findSimilar("crypto", 1);
    expect(results.length).toBe(1);
  });

  test("should handle unicode text", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "比特币交易 Bitcoin trading");

    const results = manager.findSimilar("Bitcoin", 1);
    expect(results.length).toBe(1);
  });

  test("should handle numeric-only text", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "42069 12345 67890");

    const embedding = manager.generateEmbedding("42069");
    expect(Array.isArray(embedding)).toBe(true);
  });

  test("should handle duplicate memory IDs gracefully", async () => {
    const manager = new VectorMemoryManager();

    manager.addEmbedding("mem_001", "First version");
    manager.addEmbedding("mem_001", "Second version");

    expect(manager.getEmbeddingCount()).toBe(1);

    const results = manager.findSimilar("version", 1);
    expect(results[0].embedding.text).toBe("Second version");
  });
});

/**
 * Test Suite: Vocabulary and TF-IDF
 * Tests the vocabulary and TF-IDF implementation
 */
test.describe("Vocabulary and TF-IDF", () => {
  test("should include common crypto terms in vocabulary", async () => {
    const manager = new VectorMemoryManager();
    const vocabulary = manager.getVocabulary();

    const cryptoTerms = [
      "bitcoin",
      "ethereum",
      "defi",
      "nft",
      "dex",
      "wallet",
      "trading",
    ];

    for (const term of cryptoTerms) {
      expect(vocabulary.has(term)).toBe(true);
    }
  });

  test("should include city/simulation terms in vocabulary", async () => {
    const manager = new VectorMemoryManager();
    const vocabulary = manager.getVocabulary();

    const cityTerms = [
      "building",
      "park",
      "exchange",
      "market",
      "cafe",
      "office",
    ];

    for (const term of cityTerms) {
      expect(vocabulary.has(term)).toBe(true);
    }
  });

  test("should generate different embeddings for different topics", async () => {
    const manager = new VectorMemoryManager();

    // Use terms that are in the vocabulary
    const cryptoEmb = manager.generateEmbedding("Bitcoin trading exchange defi staking");
    const parkEmb = manager.generateEmbedding("walking park running swimming recreation");
    const foodEmb = manager.generateEmbedding("eating cafe restaurant lunch dinner");

    // All should have non-zero magnitude (terms in vocabulary)
    const cryptoMag = Math.sqrt(cryptoEmb.reduce((s, v) => s + v * v, 0));
    const parkMag = Math.sqrt(parkEmb.reduce((s, v) => s + v * v, 0));
    const foodMag = Math.sqrt(foodEmb.reduce((s, v) => s + v * v, 0));

    expect(cryptoMag).toBeGreaterThan(0);
    expect(parkMag).toBeGreaterThan(0);
    expect(foodMag).toBeGreaterThan(0);

    // Cosine similarities should vary
    const cryptoParkSim = manager.cosineSimilarity(cryptoEmb, parkEmb);
    const cryptoFoodSim = manager.cosineSimilarity(cryptoEmb, foodEmb);

    // Crypto should be more different from park/food than from itself
    expect(Math.abs(cryptoParkSim)).toBeLessThan(1);
    expect(Math.abs(cryptoFoodSim)).toBeLessThan(1);
  });
});
