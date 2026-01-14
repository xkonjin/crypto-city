import { test, expect } from "@playwright/test";

/**
 * NPC Voting & Governance System Tests (#188)
 * 
 * TDD Phase 1: Tests for the voting and governance mechanics including:
 * - Election creation and lifecycle
 * - Nomination process
 * - Vote casting and delegation
 * - Proposal creation and voting
 * - Election and proposal resolution
 * - Quorum and majority calculations
 */

// Import types and classes for testing
import type {
  Election,
  Proposal,
  Vote,
  VoteDelegation,
  Nominee,
  ElectionResult,
  ProposalResult,
  VotingConfig,
} from "@/lib/npc/voting";
import {
  DEFAULT_VOTING_CONFIG,
  VOTING_DESCRIPTIONS,
} from "@/lib/npc/voting";
import { VotingManager } from "@/lib/npc/VotingManager";
import { FactionManager } from "@/lib/npc/FactionManager";

/**
 * Test Suite: Voting Types
 */
test.describe("Voting Types", () => {
  test("should define Vote interface with required properties", async () => {
    const vote: Vote = {
      voterId: "npc-1",
      choice: "nominee-1",
      weight: 1,
    };

    expect(typeof vote.voterId).toBe("string");
    expect(vote.choice).toBeDefined();
    expect(typeof vote.weight).toBe("number");
  });

  test("should define Vote interface with optional delegation", async () => {
    const vote: Vote = {
      voterId: "npc-1",
      choice: "nominee-1",
      weight: 3,
      delegatedFrom: ["npc-2", "npc-3"],
    };

    expect(Array.isArray(vote.delegatedFrom)).toBe(true);
    expect(vote.delegatedFrom).toContain("npc-2");
  });

  test("should define VoteDelegation interface", async () => {
    const delegation: VoteDelegation = {
      delegatorId: "npc-1",
      delegateeId: "npc-2",
      electionId: "election-1",
      delegatedAt: Date.now(),
    };

    expect(typeof delegation.delegatorId).toBe("string");
    expect(typeof delegation.delegateeId).toBe("string");
    expect(typeof delegation.electionId).toBe("string");
    expect(typeof delegation.delegatedAt).toBe("number");
  });

  test("should define Nominee interface", async () => {
    const nominee: Nominee = {
      npcId: "npc-1",
      nominatedBy: "npc-2",
      nominatedAt: Date.now(),
      platform: "Lower taxes for all!",
    };

    expect(typeof nominee.npcId).toBe("string");
    expect(typeof nominee.nominatedBy).toBe("string");
    expect(typeof nominee.nominatedAt).toBe("number");
    expect(typeof nominee.platform).toBe("string");
  });

  test("should have DEFAULT_VOTING_CONFIG with all required fields", async () => {
    expect(DEFAULT_VOTING_CONFIG.leaderElectionQuorum).toBe(0.5);
    expect(DEFAULT_VOTING_CONFIG.councilElectionQuorum).toBe(0.4);
    expect(DEFAULT_VOTING_CONFIG.proposalQuorum).toBe(0.3);
    expect(DEFAULT_VOTING_CONFIG.nominationDuration).toBeGreaterThan(0);
    expect(DEFAULT_VOTING_CONFIG.votingDuration).toBeGreaterThan(0);
    expect(DEFAULT_VOTING_CONFIG.countingDuration).toBeGreaterThan(0);
    expect(DEFAULT_VOTING_CONFIG.superMajorityThreshold).toBe(0.66);
    expect(DEFAULT_VOTING_CONFIG.defaultCouncilSeats).toBe(3);
  });

  test("should have Hitchhiker's Guide descriptions for voting concepts", async () => {
    expect(VOTING_DESCRIPTIONS.election).toBeDefined();
    expect(VOTING_DESCRIPTIONS.nomination).toBeDefined();
    expect(VOTING_DESCRIPTIONS.delegation).toBeDefined();
    expect(VOTING_DESCRIPTIONS.quorum).toBeDefined();
    expect(VOTING_DESCRIPTIONS.proposal).toBeDefined();
    expect(VOTING_DESCRIPTIONS.supermajority).toBeDefined();
  });
});

/**
 * Test Suite: VotingManager - Election Creation
 */
test.describe("VotingManager - Election Creation", () => {
  test("should create leader election for faction", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);
    factionManager.joinFaction("npc-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    expect(election).toBeDefined();
    expect(election.id).toBeDefined();
    expect(election.factionId).toBe(faction.id);
    expect(election.type).toBe("leader");
    expect(election.stage).toBe("nomination");
    expect(election.nominees).toEqual([]);
    expect(election.votes.size).toBe(0);
  });

  test("should create council election for faction", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "council");

    expect(election.type).toBe("council");
    expect(election.councilSeats).toBe(DEFAULT_VOTING_CONFIG.defaultCouncilSeats);
  });

  test("should create proposal election for faction", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "proposal");

    expect(election.type).toBe("proposal");
  });

  test("should set appropriate quorum based on election type", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);

    const leaderElection = votingManager.createElection(faction.id, "leader");
    expect(leaderElection.quorum).toBe(DEFAULT_VOTING_CONFIG.leaderElectionQuorum);

    const councilElection = votingManager.createElection(faction.id, "council");
    expect(councilElection.quorum).toBe(DEFAULT_VOTING_CONFIG.councilElectionQuorum);
  });

  test("should throw error for non-existent faction", async () => {
    const factionManager = new FactionManager();
    const votingManager = new VotingManager(factionManager);

    expect(() => votingManager.createElection("non-existent", "leader")).toThrow();
  });

  test("should set startedAt and endsAt timestamps", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    expect(election.startedAt).toBeGreaterThan(0);
    expect(election.endsAt).toBeGreaterThan(election.startedAt);
  });

  test("should get election by id", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const created = votingManager.createElection(faction.id, "leader");

    const retrieved = votingManager.getElection(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  test("should return null for non-existent election", async () => {
    const factionManager = new FactionManager();
    const votingManager = new VotingManager(factionManager);

    const election = votingManager.getElection("non-existent");
    expect(election).toBeNull();
  });
});

/**
 * Test Suite: VotingManager - Nomination
 */
test.describe("VotingManager - Nomination", () => {
  test("should nominate a candidate during nomination stage", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.nominate(election.id, "npc-1", "candidate-1");

    expect(result).toBe(true);
    expect(election.nominees.length).toBe(1);
    expect(election.nominees[0].npcId).toBe("candidate-1");
    expect(election.nominees[0].nominatedBy).toBe("npc-1");
  });

  test("should allow self-nomination", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.nominate(election.id, "npc-1", "npc-1");

    expect(result).toBe(true);
    expect(election.nominees[0].npcId).toBe("npc-1");
    expect(election.nominees[0].nominatedBy).toBe("npc-1");
  });

  test("should not nominate non-faction member", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.nominate(election.id, "npc-1", "outsider");

    expect(result).toBe(false);
    expect(election.nominees.length).toBe(0);
  });

  test("should not allow non-member to nominate", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.nominate(election.id, "outsider", "candidate-1");

    expect(result).toBe(false);
  });

  test("should not nominate during voting stage", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    
    // Advance to voting stage
    votingManager.nominate(election.id, "npc-1", "candidate-1");
    votingManager.advanceElection(election.id);

    const result = votingManager.nominate(election.id, "npc-1", "leader-1");

    expect(result).toBe(false);
    expect(election.nominees.length).toBe(1);
  });

  test("should not allow duplicate nominations", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);
    factionManager.joinFaction("npc-2", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    votingManager.nominate(election.id, "npc-1", "candidate-1");
    const result = votingManager.nominate(election.id, "npc-2", "candidate-1");

    expect(result).toBe(false);
    expect(election.nominees.length).toBe(1);
  });

  test("should add platform to nomination", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    votingManager.nominate(election.id, "candidate-1", "candidate-1", "HODL forever!");

    expect(election.nominees[0].platform).toBe("HODL forever!");
  });
});

/**
 * Test Suite: VotingManager - Vote Casting
 */
test.describe("VotingManager - Vote Casting", () => {
  test("should cast vote during voting stage", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);

    const result = votingManager.castVote(election.id, "voter-1", "candidate-1");

    expect(result).toBe(true);
    expect(election.votes.size).toBe(1);
    expect(election.votes.get("voter-1")?.choice).toBe("candidate-1");
  });

  test("should cast vote with custom weight", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);

    votingManager.castVote(election.id, "voter-1", "candidate-1", 5);

    expect(election.votes.get("voter-1")?.weight).toBe(5);
  });

  test("should not cast vote during nomination stage", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");

    const result = votingManager.castVote(election.id, "voter-1", "candidate-1");

    expect(result).toBe(false);
    expect(election.votes.size).toBe(0);
  });

  test("should not allow non-member to vote", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);

    const result = votingManager.castVote(election.id, "outsider", "candidate-1");

    expect(result).toBe(false);
  });

  test("should not vote for non-nominee", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);
    factionManager.joinFaction("not-nominated", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);

    const result = votingManager.castVote(election.id, "voter-1", "not-nominated");

    expect(result).toBe(false);
  });

  test("should allow changing vote before resolution", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("candidate-1", faction.id);
    factionManager.joinFaction("candidate-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.nominate(election.id, "candidate-2", "candidate-2");
    votingManager.advanceElection(election.id);

    votingManager.castVote(election.id, "voter-1", "candidate-1");
    votingManager.castVote(election.id, "voter-1", "candidate-2");

    expect(election.votes.get("voter-1")?.choice).toBe("candidate-2");
    expect(election.votes.size).toBe(1);
  });
});

/**
 * Test Suite: VotingManager - Vote Delegation
 */
test.describe("VotingManager - Vote Delegation", () => {
  test("should delegate vote to another member", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("delegator", faction.id);
    factionManager.joinFaction("delegatee", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.delegateVote(election.id, "delegator", "delegatee");

    expect(result).toBe(true);
    expect(election.delegations.has("delegator")).toBe(true);
    expect(election.delegations.get("delegator")?.delegateeId).toBe("delegatee");
  });

  test("should not delegate to non-member", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("delegator", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.delegateVote(election.id, "delegator", "outsider");

    expect(result).toBe(false);
  });

  test("should not delegate if delegator is not a member", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("delegatee", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.delegateVote(election.id, "outsider", "delegatee");

    expect(result).toBe(false);
  });

  test("should increase delegatee vote weight when voting", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("delegator", faction.id);
    factionManager.joinFaction("delegatee", faction.id);
    factionManager.joinFaction("candidate", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate", "candidate");
    
    votingManager.delegateVote(election.id, "delegator", "delegatee");
    votingManager.advanceElection(election.id);
    votingManager.castVote(election.id, "delegatee", "candidate");

    const vote = election.votes.get("delegatee");
    expect(vote?.weight).toBe(2); // Own vote + delegated vote
    expect(vote?.delegatedFrom).toContain("delegator");
  });

  test("should not allow self-delegation", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.delegateVote(election.id, "npc-1", "npc-1");

    expect(result).toBe(false);
  });

  test("should prevent circular delegation", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);
    factionManager.joinFaction("npc-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    votingManager.delegateVote(election.id, "npc-1", "npc-2");
    const result = votingManager.delegateVote(election.id, "npc-2", "npc-1");

    expect(result).toBe(false);
  });
});

/**
 * Test Suite: VotingManager - Election Advancement
 */
test.describe("VotingManager - Election Advancement", () => {
  test("should advance from nomination to voting", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");

    const result = votingManager.advanceElection(election.id);

    expect(result).toBe(true);
    expect(election.stage).toBe("voting");
  });

  test("should advance from voting to counting", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id); // to voting

    const result = votingManager.advanceElection(election.id);

    expect(result).toBe(true);
    expect(election.stage).toBe("counting");
  });

  test("should not advance without nominees", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");

    const result = votingManager.advanceElection(election.id);

    expect(result).toBe(false);
    expect(election.stage).toBe("nomination");
  });

  test("should not advance resolved election", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);
    factionManager.joinFaction("voter-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);
    votingManager.castVote(election.id, "voter-1", "candidate-1");
    votingManager.castVote(election.id, "leader-1", "candidate-1");
    votingManager.advanceElection(election.id); // to counting
    votingManager.resolveElection(election.id);

    const result = votingManager.advanceElection(election.id);

    expect(result).toBe(false);
  });
});

/**
 * Test Suite: VotingManager - Election Resolution
 */
test.describe("VotingManager - Election Resolution", () => {
  test("should resolve leader election with winner", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);
    factionManager.joinFaction("candidate-2", faction.id);
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("voter-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.nominate(election.id, "candidate-2", "candidate-2");
    votingManager.advanceElection(election.id);

    // candidate-1 gets 3 votes, candidate-2 gets 2 votes
    votingManager.castVote(election.id, "leader-1", "candidate-1");
    votingManager.castVote(election.id, "voter-1", "candidate-1");
    votingManager.castVote(election.id, "voter-2", "candidate-1");
    votingManager.castVote(election.id, "candidate-1", "candidate-1");
    votingManager.castVote(election.id, "candidate-2", "candidate-2");

    votingManager.advanceElection(election.id); // to counting
    const result = votingManager.resolveElection(election.id);

    expect(result).toBeDefined();
    expect(result?.winnerId).toBe("candidate-1");
    expect(election.stage).toBe("resolved");
    expect(election.winnerId).toBe("candidate-1");
  });

  test("should resolve council election with multiple winners", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("c1", faction.id);
    factionManager.joinFaction("c2", faction.id);
    factionManager.joinFaction("c3", faction.id);
    factionManager.joinFaction("c4", faction.id);
    factionManager.joinFaction("voter", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "council");
    votingManager.nominate(election.id, "c1", "c1");
    votingManager.nominate(election.id, "c2", "c2");
    votingManager.nominate(election.id, "c3", "c3");
    votingManager.nominate(election.id, "c4", "c4");
    votingManager.advanceElection(election.id);

    // Vote for multiple candidates (council voting)
    votingManager.castVote(election.id, "leader-1", "c1");
    votingManager.castVote(election.id, "voter", "c2");
    votingManager.castVote(election.id, "c1", "c1");
    votingManager.castVote(election.id, "c2", "c2");
    votingManager.castVote(election.id, "c3", "c3");
    votingManager.castVote(election.id, "c4", "c4");

    votingManager.advanceElection(election.id);
    const result = votingManager.resolveElection(election.id);

    expect(result).toBeDefined();
    expect(result?.winners).toBeDefined();
    expect(result?.winners?.length).toBeLessThanOrEqual(DEFAULT_VOTING_CONFIG.defaultCouncilSeats);
  });

  test("should return null if quorum not met", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    // Add many members to ensure quorum can't be met with 1 vote
    for (let i = 0; i < 10; i++) {
      factionManager.joinFaction(`member-${i}`, faction.id);
    }
    factionManager.joinFaction("candidate-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.advanceElection(election.id);

    // Only one vote (less than 50% quorum)
    votingManager.castVote(election.id, "leader-1", "candidate-1");

    votingManager.advanceElection(election.id);
    const result = votingManager.resolveElection(election.id);

    expect(result?.quorumMet).toBe(false);
  });

  test("should handle tie-breaking", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate-1", faction.id);
    factionManager.joinFaction("candidate-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate-1", "candidate-1");
    votingManager.nominate(election.id, "candidate-2", "candidate-2");
    votingManager.advanceElection(election.id);

    votingManager.castVote(election.id, "leader-1", "candidate-1");
    votingManager.castVote(election.id, "candidate-1", "candidate-1");
    votingManager.castVote(election.id, "candidate-2", "candidate-2");

    votingManager.advanceElection(election.id);
    const result = votingManager.resolveElection(election.id);

    // Should have a winner (tie-breaker used)
    expect(result?.winnerId).toBeDefined();
  });
});

/**
 * Test Suite: VotingManager - Proposals
 */
test.describe("VotingManager - Proposals", () => {
  test("should create proposal", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("proposer", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "proposer",
      "tax_change",
      "Lower Taxes",
      "Reduce tax rate to 5%"
    );

    expect(proposal).toBeDefined();
    expect(proposal.id).toBeDefined();
    expect(proposal.factionId).toBe(faction.id);
    expect(proposal.proposerId).toBe("proposer");
    expect(proposal.type).toBe("tax_change");
    expect(proposal.title).toBe("Lower Taxes");
    expect(proposal.description).toBe("Reduce tax rate to 5%");
    expect(proposal.status).toBe("active");
  });

  test("should not create proposal from non-member", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);

    expect(() =>
      votingManager.createProposal(
        faction.id,
        "outsider",
        "tax_change",
        "Lower Taxes",
        "Description"
      )
    ).toThrow();
  });

  test("should vote on proposal", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "tax_change",
      "Lower Taxes",
      "Description"
    );

    const result = votingManager.voteOnProposal(proposal.id, "voter-1", true);

    expect(result).toBe(true);
    expect(proposal.votes.size).toBe(1);
    expect(proposal.votes.get("voter-1")?.choice).toBe(true);
  });

  test("should vote against proposal", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "law_change",
      "New Rule",
      "Description"
    );

    const result = votingManager.voteOnProposal(proposal.id, "voter-1", false);

    expect(result).toBe(true);
    expect(proposal.votes.get("voter-1")?.choice).toBe(false);
  });

  test("should resolve passed proposal", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("voter-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "tax_change",
      "Lower Taxes",
      "Description"
    );

    // All vote in favor
    votingManager.voteOnProposal(proposal.id, "leader-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-2", true);

    const result = votingManager.resolveProposal(proposal.id);

    expect(result).toBeDefined();
    expect(result?.passed).toBe(true);
    expect(proposal.status).toBe("passed");
  });

  test("should resolve rejected proposal", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("voter-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "expulsion",
      "Remove Member",
      "Description"
    );

    // Majority vote against
    votingManager.voteOnProposal(proposal.id, "leader-1", false);
    votingManager.voteOnProposal(proposal.id, "voter-1", false);
    votingManager.voteOnProposal(proposal.id, "voter-2", true);

    const result = votingManager.resolveProposal(proposal.id);

    expect(result).toBeDefined();
    expect(result?.passed).toBe(false);
    expect(proposal.status).toBe("rejected");
  });

  test("should support all proposal types", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);

    const types = ["tax_change", "law_change", "policy_change", "expulsion", "alliance"] as const;

    for (const type of types) {
      const proposal = votingManager.createProposal(
        faction.id,
        "leader-1",
        type,
        `${type} Proposal`,
        `Description for ${type}`
      );
      expect(proposal.type).toBe(type);
    }
  });
});

/**
 * Test Suite: VotingManager - Super-majority
 */
test.describe("VotingManager - Super-majority", () => {
  test("should require super-majority for expulsion proposals", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("voter-2", faction.id);
    factionManager.joinFaction("target", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "expulsion",
      "Remove Target",
      "They keep shilling shitcoins"
    );

    expect(proposal.majorityType).toBe("super");

    // Simple majority (50%+) but not super-majority (66%+)
    votingManager.voteOnProposal(proposal.id, "leader-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-2", false);
    votingManager.voteOnProposal(proposal.id, "target", false);

    const result = votingManager.resolveProposal(proposal.id);

    expect(result?.majorityMet).toBe(false);
    expect(result?.passed).toBe(false);
  });

  test("should pass super-majority when threshold met", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("voter-1", faction.id);
    factionManager.joinFaction("voter-2", faction.id);

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "expulsion",
      "Remove Target",
      "Description"
    );

    // 3 votes for, 0 against = 100% > 66%
    votingManager.voteOnProposal(proposal.id, "leader-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-1", true);
    votingManager.voteOnProposal(proposal.id, "voter-2", true);

    const result = votingManager.resolveProposal(proposal.id);

    expect(result?.majorityMet).toBe(true);
    expect(result?.passed).toBe(true);
  });
});

/**
 * Test Suite: VotingManager - Active Elections/Proposals
 */
test.describe("VotingManager - Active Elections/Proposals", () => {
  test("should get active elections for faction", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    votingManager.createElection(faction.id, "leader");
    votingManager.createElection(faction.id, "council");

    const activeElections = votingManager.getActiveElections(faction.id);

    expect(activeElections.length).toBe(2);
  });

  test("should get active proposals for faction", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    votingManager.createProposal(faction.id, "leader-1", "tax_change", "Title", "Desc");
    votingManager.createProposal(faction.id, "leader-1", "law_change", "Title", "Desc");

    const activeProposals = votingManager.getActiveProposals(faction.id);

    expect(activeProposals.length).toBe(2);
  });

  test("should filter out resolved elections", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate", "candidate");
    votingManager.advanceElection(election.id);
    votingManager.castVote(election.id, "leader-1", "candidate");
    votingManager.castVote(election.id, "candidate", "candidate");
    votingManager.advanceElection(election.id);
    votingManager.resolveElection(election.id);

    // Create another active election
    votingManager.createElection(faction.id, "council");

    const activeElections = votingManager.getActiveElections(faction.id);

    expect(activeElections.length).toBe(1);
    expect(activeElections[0].type).toBe("council");
  });
});

/**
 * Test Suite: VotingManager - Serialization
 */
test.describe("VotingManager - Serialization", () => {
  test("should serialize and deserialize elections", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("candidate", faction.id);

    const votingManager = new VotingManager(factionManager);
    const election = votingManager.createElection(faction.id, "leader");
    votingManager.nominate(election.id, "candidate", "candidate");

    const serialized = votingManager.serialize();
    
    const newVotingManager = new VotingManager(factionManager);
    newVotingManager.deserialize(serialized);

    const restored = newVotingManager.getElection(election.id);
    expect(restored).toBeDefined();
    expect(restored?.nominees.length).toBe(1);
    expect(restored?.type).toBe("leader");
  });

  test("should serialize and deserialize proposals", async () => {
    const factionManager = new FactionManager();
    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const votingManager = new VotingManager(factionManager);
    const proposal = votingManager.createProposal(
      faction.id,
      "leader-1",
      "tax_change",
      "Lower Taxes",
      "Reduce to 5%"
    );

    votingManager.voteOnProposal(proposal.id, "leader-1", true);

    const serialized = votingManager.serialize();
    
    const newVotingManager = new VotingManager(factionManager);
    newVotingManager.deserialize(serialized);

    const restored = newVotingManager.getProposal(proposal.id);
    expect(restored).toBeDefined();
    expect(restored?.title).toBe("Lower Taxes");
    expect(restored?.votes.size).toBe(1);
  });
});
