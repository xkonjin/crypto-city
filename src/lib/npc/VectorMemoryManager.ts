/**
 * VectorMemoryManager - Semantic Memory Retrieval System
 *
 * Implements semantic search, hybrid scoring, and clustering for NPC memories
 * using local TF-IDF embeddings. No external API calls required.
 *
 * Features:
 * - TF-IDF based text embeddings with crypto-native vocabulary
 * - Cosine similarity for semantic search
 * - Hybrid search combining semantic, recency, and importance
 * - K-means clustering for memory organization
 * - Batch operations for efficiency
 * - Performance target: 1000+ memories searchable in <100ms
 *
 * Part of Phase 8: Polish & Scale (GitHub Issue #197)
 */

import {
  VectorEmbedding,
  SimilarityResult,
  HybridScore,
  MemoryCluster,
  MemoryMetadata,
  CRYPTO_VOCABULARY,
  HYBRID_SEARCH_WEIGHTS,
  generateEmbeddingId,
  generateClusterId,
} from "./vectorMemory";

/**
 * VectorMemoryManager handles all vector-based memory operations.
 */
export class VectorMemoryManager {
  /** Stored embeddings indexed by memory ID */
  private embeddings: Map<string, VectorEmbedding> = new Map();

  /** Memory metadata for hybrid search */
  private metadata: Map<string, MemoryMetadata> = new Map();

  /** Vocabulary set for fast lookup */
  private vocabularySet: Set<string>;

  /** Vocabulary array for indexing */
  private vocabularyArray: string[];

  /** IDF values for each term in vocabulary */
  private idfValues: Map<string, number> = new Map();

  /** Document count for IDF calculation */
  private documentCount: number = 0;

  /** Term document frequency for IDF */
  private termDocumentFreq: Map<string, number> = new Map();

  /** Stored clusters */
  private clusters: Map<string, MemoryCluster> = new Map();

  /**
   * Initialize the VectorMemoryManager with crypto-native vocabulary.
   */
  constructor() {
    this.vocabularySet = new Set(
      CRYPTO_VOCABULARY.map((term) => term.toLowerCase())
    );
    this.vocabularyArray = Array.from(this.vocabularySet);

    // Initialize IDF values (will be updated as documents are added)
    for (const term of this.vocabularyArray) {
      this.idfValues.set(term, 1.0);
      this.termDocumentFreq.set(term, 0);
    }
  }

  /**
   * Get the vocabulary set.
   */
  getVocabulary(): Set<string> {
    return this.vocabularySet;
  }

  /**
   * Get current embedding count.
   */
  getEmbeddingCount(): number {
    return this.embeddings.size;
  }

  /**
   * Tokenize and normalize text.
   * Converts to lowercase, removes punctuation, splits into words.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Calculate term frequency for a document.
   */
  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;

    if (totalTokens === 0) return tf;

    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Normalize by total tokens
    Array.from(tf.entries()).forEach(([term, count]) => {
      tf.set(term, count / totalTokens);
    });

    return tf;
  }

  /**
   * Update IDF values based on document corpus.
   */
  private updateIDF(): void {
    if (this.documentCount === 0) return;

    for (const term of this.vocabularyArray) {
      const docFreq = this.termDocumentFreq.get(term) || 0;
      // IDF = log(N / (1 + df)) + 1 (smoothed IDF)
      const idf = Math.log(this.documentCount / (1 + docFreq)) + 1;
      this.idfValues.set(term, idf);
    }
  }

  /**
   * Generate embedding from text using TF-IDF.
   * Returns a normalized vector of vocabulary length.
   *
   * @param text - Text to embed
   * @returns Normalized vector representation
   */
  generateEmbedding(text: string): number[] {
    const tokens = this.tokenize(text);
    const tf = this.calculateTF(tokens);

    // Create TF-IDF vector
    const vector: number[] = new Array(this.vocabularyArray.length).fill(0);

    for (let i = 0; i < this.vocabularyArray.length; i++) {
      const term = this.vocabularyArray[i];
      const termTF = tf.get(term) || 0;
      const termIDF = this.idfValues.get(term) || 1.0;
      vector[i] = termTF * termIDF;
    }

    // Normalize the vector to unit length
    return this.normalizeVector(vector);
  }

  /**
   * Normalize a vector to unit length.
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) return vector;

    return vector.map((val) => val / magnitude);
  }

  /**
   * Add or update an embedding for a memory.
   *
   * @param memoryId - ID of the memory
   * @param text - Text content of the memory
   */
  addEmbedding(memoryId: string, text: string): void {
    const existingEmbedding = this.embeddings.get(memoryId);

    // Update term document frequency
    const tokens = new Set(this.tokenize(text));

    // If updating, remove old term contributions
    if (existingEmbedding) {
      const oldTokens = new Set(this.tokenize(existingEmbedding.text));
      Array.from(oldTokens).forEach((token) => {
        if (this.vocabularySet.has(token)) {
          const freq = this.termDocumentFreq.get(token) || 0;
          this.termDocumentFreq.set(token, Math.max(0, freq - 1));
        }
      });
    } else {
      this.documentCount++;
    }

    // Add new term contributions
    Array.from(tokens).forEach((token) => {
      if (this.vocabularySet.has(token)) {
        const freq = this.termDocumentFreq.get(token) || 0;
        this.termDocumentFreq.set(token, freq + 1);
      }
    });

    // Update IDF values
    this.updateIDF();

    // Generate and store embedding
    const vector = this.generateEmbedding(text);
    const embedding: VectorEmbedding = {
      id: existingEmbedding?.id || generateEmbeddingId(),
      memoryId,
      vector,
      text,
      createdAt: existingEmbedding?.createdAt || Date.now(),
    };

    this.embeddings.set(memoryId, embedding);
  }

  /**
   * Remove an embedding by memory ID.
   *
   * @param memoryId - ID of the memory to remove
   */
  removeEmbedding(memoryId: string): void {
    const embedding = this.embeddings.get(memoryId);
    if (!embedding) return;

    // Update term document frequency
    const tokens = new Set(this.tokenize(embedding.text));
    Array.from(tokens).forEach((token) => {
      if (this.vocabularySet.has(token)) {
        const freq = this.termDocumentFreq.get(token) || 0;
        this.termDocumentFreq.set(token, Math.max(0, freq - 1));
      }
    });

    this.documentCount--;
    this.embeddings.delete(memoryId);
    this.metadata.delete(memoryId);

    // Update IDF values
    this.updateIDF();
  }

  /**
   * Calculate cosine similarity between two vectors.
   *
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Cosine similarity (-1 to 1)
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    // Handle different lengths by using minimum length
    const minLength = Math.min(vec1.length, vec2.length);

    if (minLength === 0) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Find similar memories by text query.
   *
   * @param queryText - Text to search for
   * @param limit - Maximum results to return
   * @returns Array of similarity results sorted by score
   */
  findSimilar(queryText: string, limit: number): SimilarityResult[] {
    if (this.embeddings.size === 0) return [];

    const queryVector = this.generateEmbedding(queryText);
    const results: SimilarityResult[] = [];

    Array.from(this.embeddings.entries()).forEach(([memoryId, embedding]) => {
      const score = this.cosineSimilarity(queryVector, embedding.vector);
      // Convert from [-1, 1] to [0, 1] range for easier interpretation
      const normalizedScore = (score + 1) / 2;

      results.push({
        memoryId,
        score: normalizedScore,
        embedding,
      });
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Set metadata for a memory (for hybrid search).
   *
   * @param memoryId - ID of the memory
   * @param metadata - Timestamp and importance data
   */
  setMemoryMetadata(memoryId: string, metadata: MemoryMetadata): void {
    this.metadata.set(memoryId, metadata);
  }

  /**
   * Calculate recency score (0 to 1).
   * More recent = higher score.
   *
   * @param timestamp - Memory timestamp
   * @param maxAge - Maximum age in milliseconds for normalization (default: 30 days)
   */
  private calculateRecencyScore(
    timestamp: number,
    maxAge: number = 1000 * 60 * 60 * 24 * 30
  ): number {
    const age = Date.now() - timestamp;
    if (age >= maxAge) return 0;
    return 1 - age / maxAge;
  }

  /**
   * Hybrid search combining semantic, recency, and importance.
   *
   * @param queryText - Text to search for
   * @param recencyWeight - Weight for recency (default from config)
   * @param importanceWeight - Weight for importance (default from config)
   * @param limit - Maximum results to return
   * @returns Array of hybrid scores sorted by combined score
   */
  hybridSearch(
    queryText: string,
    recencyWeight: number = HYBRID_SEARCH_WEIGHTS.recency,
    importanceWeight: number = HYBRID_SEARCH_WEIGHTS.importance,
    limit: number
  ): HybridScore[] {
    if (this.embeddings.size === 0) return [];

    // Calculate semantic weight as remainder
    const semanticWeight = 1 - recencyWeight - importanceWeight;

    const queryVector = this.generateEmbedding(queryText);
    const results: HybridScore[] = [];

    Array.from(this.embeddings.entries()).forEach(([memoryId, embedding]) => {
      const semanticScore = this.cosineSimilarity(queryVector, embedding.vector);
      // Normalize semantic score from [-1, 1] to [0, 1]
      const normalizedSemantic = (semanticScore + 1) / 2;

      // Get metadata or use defaults
      const meta = this.metadata.get(memoryId) || {
        timestamp: embedding.createdAt,
        importance: 5,
      };

      const recencyScore = this.calculateRecencyScore(meta.timestamp);
      const importanceScore = meta.importance / 10; // Normalize 1-10 to 0-1

      const combinedScore =
        normalizedSemantic * semanticWeight +
        recencyScore * recencyWeight +
        importanceScore * importanceWeight;

      results.push({
        memoryId,
        semantic: normalizedSemantic,
        recency: recencyScore,
        importance: importanceScore,
        combined: combinedScore,
      });
    });

    // Sort by combined score descending
    results.sort((a, b) => b.combined - a.combined);

    return results.slice(0, limit);
  }

  /**
   * Cluster memories using k-means algorithm.
   *
   * @param memoryIds - IDs of memories to cluster
   * @param numClusters - Number of clusters to create
   * @returns Array of memory clusters
   */
  clusterMemories(memoryIds: string[], numClusters: number): MemoryCluster[] {
    // Get embeddings for the specified memories
    const validEmbeddings: Array<{ id: string; vector: number[] }> = [];

    for (const id of memoryIds) {
      const embedding = this.embeddings.get(id);
      if (embedding) {
        validEmbeddings.push({ id, vector: embedding.vector });
      }
    }

    if (validEmbeddings.length === 0) return [];

    // Adjust cluster count if we have fewer memories than requested clusters
    const actualClusters = Math.min(numClusters, validEmbeddings.length);

    // Initialize centroids using k-means++ style initialization
    const centroids: number[][] = this.initializeCentroids(
      validEmbeddings.map((e) => e.vector),
      actualClusters
    );

    // K-means iterations
    const maxIterations = 10;
    let assignments: number[] = new Array(validEmbeddings.length).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign each point to nearest centroid
      const newAssignments: number[] = [];
      for (const embedding of validEmbeddings) {
        let bestCluster = 0;
        let bestSimilarity = -2;

        for (let c = 0; c < centroids.length; c++) {
          const similarity = this.cosineSimilarity(embedding.vector, centroids[c]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestCluster = c;
          }
        }

        newAssignments.push(bestCluster);
      }

      // Check for convergence
      const converged = newAssignments.every(
        (a, i) => a === assignments[i]
      );
      assignments = newAssignments;

      if (converged) break;

      // Update centroids
      for (let c = 0; c < centroids.length; c++) {
        const clusterVectors: number[][] = [];
        for (let i = 0; i < validEmbeddings.length; i++) {
          if (assignments[i] === c) {
            clusterVectors.push(validEmbeddings[i].vector);
          }
        }

        if (clusterVectors.length > 0) {
          centroids[c] = this.calculateCentroid(clusterVectors);
        }
      }
    }

    // Build cluster objects
    const clusterMap = new Map<number, string[]>();
    for (let i = 0; i < validEmbeddings.length; i++) {
      const cluster = assignments[i];
      const members = clusterMap.get(cluster) || [];
      members.push(validEmbeddings[i].id);
      clusterMap.set(cluster, members);
    }

    const clusters: MemoryCluster[] = [];
    for (let c = 0; c < centroids.length; c++) {
      const memberIds = clusterMap.get(c) || [];
      if (memberIds.length > 0) {
        const cluster: MemoryCluster = {
          id: generateClusterId(),
          centroid: centroids[c],
          memberIds,
          theme: this.generateClusterTheme(memberIds),
        };
        clusters.push(cluster);
        this.clusters.set(cluster.id, cluster);
      }
    }

    return clusters;
  }

  /**
   * Initialize centroids using k-means++ style initialization.
   */
  private initializeCentroids(vectors: number[][], k: number): number[][] {
    if (vectors.length === 0 || k === 0) return [];

    const centroids: number[][] = [];

    // First centroid: random selection
    const firstIndex = Math.floor(Math.random() * vectors.length);
    centroids.push([...vectors[firstIndex]]);

    // Remaining centroids: select based on distance
    while (centroids.length < k) {
      const distances: number[] = vectors.map((vec) => {
        let minDist = Infinity;
        for (const centroid of centroids) {
          const dist = 1 - this.cosineSimilarity(vec, centroid);
          if (dist < minDist) minDist = dist;
        }
        return minDist;
      });

      // Select based on squared distance probability
      const sumDist = distances.reduce((a, b) => a + b * b, 0);
      let random = Math.random() * sumDist;

      for (let i = 0; i < vectors.length; i++) {
        random -= distances[i] * distances[i];
        if (random <= 0) {
          centroids.push([...vectors[i]]);
          break;
        }
      }

      // Fallback if random selection failed
      if (centroids.length < k && centroids.length === centroids.length) {
        const nextIndex = (centroids.length * 17) % vectors.length;
        centroids.push([...vectors[nextIndex]]);
      }
    }

    return centroids;
  }

  /**
   * Calculate centroid (mean) of a set of vectors.
   */
  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);

    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += vec[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      centroid[i] /= vectors.length;
    }

    return this.normalizeVector(centroid);
  }

  /**
   * Generate theme for a cluster based on its members.
   */
  private generateClusterTheme(memberIds: string[]): string {
    // Get all text from cluster members
    const texts: string[] = [];
    for (const id of memberIds) {
      const embedding = this.embeddings.get(id);
      if (embedding) {
        texts.push(embedding.text);
      }
    }

    if (texts.length === 0) return "";

    // Find most frequent significant terms
    const termCounts = new Map<string, number>();
    texts.forEach((text) => {
      const tokens = this.tokenize(text);
      const uniqueTokens = new Set(tokens);
      Array.from(uniqueTokens).forEach((token) => {
        if (this.vocabularySet.has(token)) {
          termCounts.set(token, (termCounts.get(token) || 0) + 1);
        }
      });
    });

    // Sort by frequency and get top terms
    const sortedTerms = Array.from(termCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([term]) => term);

    return sortedTerms.join(" ");
  }

  /**
   * Get theme for an existing cluster.
   *
   * @param clusterId - ID of the cluster
   * @returns Theme string or empty string if not found
   */
  getClusterTheme(clusterId: string): string {
    const cluster = this.clusters.get(clusterId);
    return cluster?.theme || "";
  }

  /**
   * Batch update embeddings for multiple memories.
   * More efficient than individual updates.
   *
   * @param memories - Array of memory objects with id and text
   */
  batchUpdateEmbeddings(memories: Array<{ id: string; text: string }>): void {
    if (memories.length === 0) return;

    // First pass: update term document frequencies
    for (const memory of memories) {
      const existingEmbedding = this.embeddings.get(memory.id);
      const tokens = new Set(this.tokenize(memory.text));

      // Remove old term contributions if updating
      if (existingEmbedding) {
        const oldTokens = new Set(this.tokenize(existingEmbedding.text));
        Array.from(oldTokens).forEach((token) => {
          if (this.vocabularySet.has(token)) {
            const freq = this.termDocumentFreq.get(token) || 0;
            this.termDocumentFreq.set(token, Math.max(0, freq - 1));
          }
        });
      } else {
        this.documentCount++;
      }

      // Add new term contributions
      Array.from(tokens).forEach((token) => {
        if (this.vocabularySet.has(token)) {
          const freq = this.termDocumentFreq.get(token) || 0;
          this.termDocumentFreq.set(token, freq + 1);
        }
      });
    }

    // Update IDF values once
    this.updateIDF();

    // Second pass: generate embeddings
    for (const memory of memories) {
      const existingEmbedding = this.embeddings.get(memory.id);
      const vector = this.generateEmbedding(memory.text);

      const embedding: VectorEmbedding = {
        id: existingEmbedding?.id || generateEmbeddingId(),
        memoryId: memory.id,
        vector,
        text: memory.text,
        createdAt: existingEmbedding?.createdAt || Date.now(),
      };

      this.embeddings.set(memory.id, embedding);
    }
  }

  /**
   * Set createdAt timestamp for an embedding (for testing).
   *
   * @param memoryId - ID of the memory
   * @param timestamp - New timestamp
   */
  setEmbeddingCreatedAt(memoryId: string, timestamp: number): void {
    const embedding = this.embeddings.get(memoryId);
    if (embedding) {
      embedding.createdAt = timestamp;
    }
  }

  /**
   * Prune embeddings older than maxAge.
   *
   * @param maxAge - Maximum age in milliseconds
   * @returns Number of embeddings pruned
   */
  pruneOldEmbeddings(maxAge: number): number {
    const now = Date.now();
    let prunedCount = 0;

    const toRemove: string[] = [];

    Array.from(this.embeddings.entries()).forEach(([memoryId, embedding]) => {
      if (now - embedding.createdAt > maxAge) {
        toRemove.push(memoryId);
      }
    });

    for (const memoryId of toRemove) {
      this.removeEmbedding(memoryId);
      prunedCount++;
    }

    return prunedCount;
  }
}
