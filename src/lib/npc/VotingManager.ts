/**
 * VotingManager - Manages elections and proposals for NPC factions
 * 
 * Handles the democratic/governance mechanics within factions:
 * - Leader and council elections
 * - Proposal creation and voting
 * - Vote delegation
 * - Quorum and majority calculations
 * 
 * Integrates with FactionManager to manage faction leadership changes.
 */

import type { FactionManager } from './FactionManager';
import type {
  Election,
  Proposal,
  Vote,
  VoteDelegation,
  Nominee,
  ElectionResult,
  ProposalResult,
  VotingConfig,
  ElectionType,
  ProposalType,
  VotingStage,
  SerializedElection,
  SerializedProposal,
} from './voting';
import { DEFAULT_VOTING_CONFIG } from './voting';

/**
 * Manager class for voting and governance operations
 */
export class VotingManager {
  /** Reference to faction manager for membership validation */
  private factionManager: FactionManager;
  
  /** Registry of all elections */
  private elections: Map<string, Election> = new Map();
  
  /** Registry of all proposals */
  private proposals: Map<string, Proposal> = new Map();
  
  /** Voting configuration */
  private config: VotingConfig;
  
  /** Counter for generating unique IDs */
  private idCounter: number = 0;

  constructor(factionManager: FactionManager, config?: Partial<VotingConfig>) {
    this.factionManager = factionManager;
    this.config = { ...DEFAULT_VOTING_CONFIG, ...config };
  }

  /**
   * Generate a unique ID for elections/proposals
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${this.idCounter++}`;
  }

  // ==================== Election Creation ====================

  /**
   * Create a new election for a faction
   * @param factionId - ID of the faction holding the election
   * @param type - Type of election (leader, council, proposal)
   * @returns The created election
   * @throws Error if faction doesn't exist
   */
  createElection(factionId: string, type: ElectionType): Election {
    const faction = this.factionManager.getFaction(factionId);
    if (!faction) {
      throw new Error(`Faction not found: ${factionId}`);
    }

    const quorum = this.getQuorumForType(type);
    const now = Date.now();

    const election: Election = {
      id: this.generateId('election'),
      factionId,
      type,
      nominees: [],
      votes: new Map(),
      delegations: new Map(),
      stage: 'nomination',
      quorum,
      startedAt: now,
      endsAt: now + this.config.nominationDuration * 60000, // Convert minutes to ms
      majorityType: 'simple',
      councilSeats: type === 'council' ? this.config.defaultCouncilSeats : undefined,
    };

    this.elections.set(election.id, election);
    return election;
  }

  /**
   * Get quorum percentage based on election type
   */
  private getQuorumForType(type: ElectionType): number {
    switch (type) {
      case 'leader':
        return this.config.leaderElectionQuorum;
      case 'council':
        return this.config.councilElectionQuorum;
      case 'proposal':
        return this.config.proposalQuorum;
      default:
        return 0.5;
    }
  }

  /**
   * Get an election by ID
   * @param electionId - Election ID
   * @returns The election or null if not found
   */
  getElection(electionId: string): Election | null {
    return this.elections.get(electionId) ?? null;
  }

  // ==================== Nomination ====================

  /**
   * Nominate a candidate for an election
   * @param electionId - Election ID
   * @param nominatorId - NPC ID making the nomination
   * @param nomineeId - NPC ID being nominated
   * @param platform - Optional campaign platform
   * @returns True if nomination successful
   */
  nominate(
    electionId: string,
    nominatorId: string,
    nomineeId: string,
    platform?: string
  ): boolean {
    const election = this.elections.get(electionId);
    if (!election) return false;

    // Can only nominate during nomination stage
    if (election.stage !== 'nomination') return false;

    const faction = this.factionManager.getFaction(election.factionId);
    if (!faction) return false;

    // Both nominator and nominee must be faction members
    if (!faction.memberIds.has(nominatorId)) return false;
    if (!faction.memberIds.has(nomineeId)) return false;

    // Check for duplicate nomination
    if (election.nominees.some(n => n.npcId === nomineeId)) return false;

    const nominee: Nominee = {
      npcId: nomineeId,
      nominatedBy: nominatorId,
      nominatedAt: Date.now(),
      platform,
    };

    election.nominees.push(nominee);
    return true;
  }

  // ==================== Vote Casting ====================

  /**
   * Cast a vote in an election
   * @param electionId - Election ID
   * @param voterId - NPC ID casting the vote
   * @param choice - The nominee ID to vote for
   * @param weight - Optional vote weight (defaults to 1 + delegated votes)
   * @returns True if vote was cast successfully
   */
  castVote(
    electionId: string,
    voterId: string,
    choice: string,
    weight?: number
  ): boolean {
    const election = this.elections.get(electionId);
    if (!election) return false;

    // Can only vote during voting stage
    if (election.stage !== 'voting') return false;

    const faction = this.factionManager.getFaction(election.factionId);
    if (!faction) return false;

    // Voter must be faction member
    if (!faction.memberIds.has(voterId)) return false;

    // Must vote for a valid nominee
    if (!election.nominees.some(n => n.npcId === choice)) return false;

    // Calculate weight including delegations
    const delegatedVotes = this.getDelegatedVotes(election, voterId);
    const totalWeight = weight ?? (1 + delegatedVotes.length);
    const delegatedFrom = delegatedVotes.length > 0 ? delegatedVotes : undefined;

    const vote: Vote = {
      voterId,
      choice,
      weight: totalWeight,
      delegatedFrom,
    };

    election.votes.set(voterId, vote);
    return true;
  }

  /**
   * Get list of NPCs who delegated their vote to this voter
   */
  private getDelegatedVotes(election: Election, delegateeId: string): string[] {
    const delegated: string[] = [];
    for (const [delegatorId, delegation] of election.delegations) {
      if (delegation.delegateeId === delegateeId) {
        delegated.push(delegatorId);
      }
    }
    return delegated;
  }

  // ==================== Vote Delegation ====================

  /**
   * Delegate voting power to another faction member
   * @param electionId - Election ID
   * @param delegatorId - NPC delegating their vote
   * @param delegateeId - NPC receiving the delegation
   * @returns True if delegation successful
   */
  delegateVote(
    electionId: string,
    delegatorId: string,
    delegateeId: string
  ): boolean {
    const election = this.elections.get(electionId);
    if (!election) return false;

    // Cannot self-delegate
    if (delegatorId === delegateeId) return false;

    const faction = this.factionManager.getFaction(election.factionId);
    if (!faction) return false;

    // Both must be faction members
    if (!faction.memberIds.has(delegatorId)) return false;
    if (!faction.memberIds.has(delegateeId)) return false;

    // Check for circular delegation
    if (this.wouldCreateCircularDelegation(election, delegatorId, delegateeId)) {
      return false;
    }

    const delegation: VoteDelegation = {
      delegatorId,
      delegateeId,
      electionId,
      delegatedAt: Date.now(),
    };

    election.delegations.set(delegatorId, delegation);
    return true;
  }

  /**
   * Check if delegation would create a circular chain
   */
  private wouldCreateCircularDelegation(
    election: Election,
    delegatorId: string,
    delegateeId: string
  ): boolean {
    // Check if delegatee has delegated to delegator (directly or indirectly)
    let current = delegateeId;
    const visited = new Set<string>();
    
    while (current && !visited.has(current)) {
      visited.add(current);
      const delegation = election.delegations.get(current);
      if (delegation) {
        if (delegation.delegateeId === delegatorId) {
          return true;
        }
        current = delegation.delegateeId;
      } else {
        break;
      }
    }
    
    return false;
  }

  // ==================== Election Advancement ====================

  /**
   * Advance election to the next stage
   * @param electionId - Election ID
   * @returns True if advancement successful
   */
  advanceElection(electionId: string): boolean {
    const election = this.elections.get(electionId);
    if (!election) return false;

    switch (election.stage) {
      case 'nomination':
        // Need at least one nominee to advance
        if (election.nominees.length === 0) return false;
        election.stage = 'voting';
        election.endsAt = Date.now() + this.config.votingDuration * 60000;
        return true;

      case 'voting':
        election.stage = 'counting';
        election.endsAt = Date.now() + this.config.countingDuration * 60000;
        return true;

      case 'counting':
        // Should use resolveElection instead
        return false;

      case 'resolved':
        return false;

      default:
        return false;
    }
  }

  // ==================== Election Resolution ====================

  /**
   * Resolve an election and determine the winner(s)
   * @param electionId - Election ID
   * @returns Election result or null if cannot be resolved
   */
  resolveElection(electionId: string): ElectionResult | null {
    const election = this.elections.get(electionId);
    if (!election) return null;
    if (election.stage !== 'counting') return null;

    const faction = this.factionManager.getFaction(election.factionId);
    if (!faction) return null;

    const memberCount = faction.memberIds.size;
    const totalVotes = election.votes.size;
    const quorumMet = totalVotes / memberCount >= election.quorum;

    // Calculate vote breakdown
    const voteBreakdown = new Map<string, number>();
    let totalWeight = 0;

    for (const vote of election.votes.values()) {
      const current = voteBreakdown.get(vote.choice as string) ?? 0;
      voteBreakdown.set(vote.choice as string, current + vote.weight);
      totalWeight += vote.weight;
    }

    // Determine winner(s)
    let winnerId: string | undefined;
    let winners: string[] | undefined;

    if (election.type === 'council' && election.councilSeats) {
      // Multiple winners for council
      const sorted = Array.from(voteBreakdown.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, election.councilSeats);
      winners = sorted.map(([id]) => id);
    } else {
      // Single winner for leader/proposal elections
      let maxVotes = 0;
      const tiedCandidates: string[] = [];

      for (const [candidateId, votes] of voteBreakdown) {
        if (votes > maxVotes) {
          maxVotes = votes;
          tiedCandidates.length = 0;
          tiedCandidates.push(candidateId);
        } else if (votes === maxVotes) {
          tiedCandidates.push(candidateId);
        }
      }

      // Tie-breaker: random selection or first nominated
      if (tiedCandidates.length > 1) {
        // Use first nominated as tie-breaker
        for (const nominee of election.nominees) {
          if (tiedCandidates.includes(nominee.npcId)) {
            winnerId = nominee.npcId;
            break;
          }
        }
      } else if (tiedCandidates.length === 1) {
        winnerId = tiedCandidates[0];
      }
    }

    // Update election state
    election.stage = 'resolved';
    election.winnerId = winnerId;
    election.winners = winners;

    return {
      electionId,
      winnerId,
      winners,
      totalVotes,
      totalWeight,
      quorumMet,
      voteBreakdown,
    };
  }

  // ==================== Proposal Management ====================

  /**
   * Create a governance proposal
   * @param factionId - Faction ID
   * @param proposerId - NPC creating the proposal
   * @param type - Type of proposal
   * @param title - Proposal title
   * @param description - Detailed description
   * @param proposedValue - Optional value (e.g., new tax rate)
   * @returns The created proposal
   * @throws Error if proposer is not a faction member
   */
  createProposal(
    factionId: string,
    proposerId: string,
    type: ProposalType,
    title: string,
    description: string,
    proposedValue?: unknown
  ): Proposal {
    const faction = this.factionManager.getFaction(factionId);
    if (!faction) {
      throw new Error(`Faction not found: ${factionId}`);
    }

    if (!faction.memberIds.has(proposerId)) {
      throw new Error(`Proposer ${proposerId} is not a member of faction ${factionId}`);
    }

    const now = Date.now();
    
    // Determine majority type - expulsion requires super-majority
    const majorityType = type === 'expulsion' ? 'super' : 'simple';

    const proposal: Proposal = {
      id: this.generateId('proposal'),
      factionId,
      proposerId,
      type,
      title,
      description,
      votes: new Map(),
      delegations: new Map(),
      status: 'active',
      quorum: this.config.proposalQuorum,
      createdAt: now,
      votingEndsAt: now + this.config.votingDuration * 60000,
      proposedValue,
      majorityType,
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * Get a proposal by ID
   * @param proposalId - Proposal ID
   * @returns The proposal or null if not found
   */
  getProposal(proposalId: string): Proposal | null {
    return this.proposals.get(proposalId) ?? null;
  }

  /**
   * Vote on a proposal
   * @param proposalId - Proposal ID
   * @param voterId - NPC casting the vote
   * @param inFavor - True to vote in favor, false to vote against
   * @param weight - Optional vote weight
   * @returns True if vote was cast successfully
   */
  voteOnProposal(
    proposalId: string,
    voterId: string,
    inFavor: boolean,
    weight?: number
  ): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return false;
    if (proposal.status !== 'active') return false;

    const faction = this.factionManager.getFaction(proposal.factionId);
    if (!faction) return false;

    if (!faction.memberIds.has(voterId)) return false;

    // Calculate weight including delegations
    const delegatedVotes = this.getDelegatedVotesForProposal(proposal, voterId);
    const totalWeight = weight ?? (1 + delegatedVotes.length);
    const delegatedFrom = delegatedVotes.length > 0 ? delegatedVotes : undefined;

    const vote: Vote = {
      voterId,
      choice: inFavor,
      weight: totalWeight,
      delegatedFrom,
    };

    proposal.votes.set(voterId, vote);
    return true;
  }

  /**
   * Get delegated votes for a proposal
   */
  private getDelegatedVotesForProposal(proposal: Proposal, delegateeId: string): string[] {
    const delegated: string[] = [];
    for (const [delegatorId, delegation] of proposal.delegations) {
      if (delegation.delegateeId === delegateeId) {
        delegated.push(delegatorId);
      }
    }
    return delegated;
  }

  /**
   * Resolve a proposal and determine outcome
   * @param proposalId - Proposal ID
   * @returns Proposal result
   */
  resolveProposal(proposalId: string): ProposalResult | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;
    if (proposal.status !== 'active') return null;

    const faction = this.factionManager.getFaction(proposal.factionId);
    if (!faction) return null;

    const memberCount = faction.memberIds.size;
    const totalVotes = proposal.votes.size;
    const quorumMet = totalVotes / memberCount >= proposal.quorum;

    // Count votes
    let forVotes = 0;
    let againstVotes = 0;
    let forWeight = 0;
    let againstWeight = 0;

    for (const vote of proposal.votes.values()) {
      if (vote.choice === true) {
        forVotes++;
        forWeight += vote.weight;
      } else {
        againstVotes++;
        againstWeight += vote.weight;
      }
    }

    // Calculate majority
    const totalWeight = forWeight + againstWeight;
    const forRatio = totalWeight > 0 ? forWeight / totalWeight : 0;
    
    const threshold = proposal.majorityType === 'super' 
      ? this.config.superMajorityThreshold 
      : 0.5;
    
    const majorityMet = forRatio > threshold;
    const passed = quorumMet && majorityMet;

    // Update proposal status
    proposal.status = passed ? 'passed' : 'rejected';

    return {
      proposalId,
      passed,
      forVotes,
      againstVotes,
      forWeight,
      againstWeight,
      quorumMet,
      majorityMet,
    };
  }

  // ==================== Query Methods ====================

  /**
   * Get active elections for a faction
   * @param factionId - Faction ID
   * @returns Array of active elections
   */
  getActiveElections(factionId: string): Election[] {
    const active: Election[] = [];
    for (const election of this.elections.values()) {
      if (election.factionId === factionId && election.stage !== 'resolved') {
        active.push(election);
      }
    }
    return active;
  }

  /**
   * Get active proposals for a faction
   * @param factionId - Faction ID
   * @returns Array of active proposals
   */
  getActiveProposals(factionId: string): Proposal[] {
    const active: Proposal[] = [];
    for (const proposal of this.proposals.values()) {
      if (proposal.factionId === factionId && proposal.status === 'active') {
        active.push(proposal);
      }
    }
    return active;
  }

  // ==================== Serialization ====================

  /**
   * Serialize voting data for storage
   */
  serialize(): {
    elections: SerializedElection[];
    proposals: SerializedProposal[];
    idCounter: number;
  } {
    const elections: SerializedElection[] = [];
    for (const election of this.elections.values()) {
      elections.push({
        id: election.id,
        factionId: election.factionId,
        type: election.type,
        nominees: election.nominees,
        votes: Array.from(election.votes.entries()),
        delegations: Array.from(election.delegations.entries()),
        stage: election.stage,
        quorum: election.quorum,
        startedAt: election.startedAt,
        endsAt: election.endsAt,
        winnerId: election.winnerId,
        winners: election.winners,
        majorityType: election.majorityType,
        councilSeats: election.councilSeats,
      });
    }

    const proposals: SerializedProposal[] = [];
    for (const proposal of this.proposals.values()) {
      proposals.push({
        id: proposal.id,
        factionId: proposal.factionId,
        proposerId: proposal.proposerId,
        type: proposal.type,
        title: proposal.title,
        description: proposal.description,
        votes: Array.from(proposal.votes.entries()),
        delegations: Array.from(proposal.delegations.entries()),
        status: proposal.status,
        quorum: proposal.quorum,
        createdAt: proposal.createdAt,
        votingEndsAt: proposal.votingEndsAt,
        proposedValue: proposal.proposedValue,
        majorityType: proposal.majorityType,
      });
    }

    return {
      elections,
      proposals,
      idCounter: this.idCounter,
    };
  }

  /**
   * Deserialize voting data from storage
   */
  deserialize(data: {
    elections: SerializedElection[];
    proposals: SerializedProposal[];
    idCounter: number;
  }): void {
    this.elections.clear();
    this.proposals.clear();

    for (const serialized of data.elections) {
      const election: Election = {
        id: serialized.id,
        factionId: serialized.factionId,
        type: serialized.type,
        nominees: serialized.nominees,
        votes: new Map(serialized.votes),
        delegations: new Map(serialized.delegations),
        stage: serialized.stage,
        quorum: serialized.quorum,
        startedAt: serialized.startedAt,
        endsAt: serialized.endsAt,
        winnerId: serialized.winnerId,
        winners: serialized.winners,
        majorityType: serialized.majorityType,
        councilSeats: serialized.councilSeats,
      };
      this.elections.set(election.id, election);
    }

    for (const serialized of data.proposals) {
      const proposal: Proposal = {
        id: serialized.id,
        factionId: serialized.factionId,
        proposerId: serialized.proposerId,
        type: serialized.type,
        title: serialized.title,
        description: serialized.description,
        votes: new Map(serialized.votes),
        delegations: new Map(serialized.delegations),
        status: serialized.status,
        quorum: serialized.quorum,
        createdAt: serialized.createdAt,
        votingEndsAt: serialized.votingEndsAt,
        proposedValue: serialized.proposedValue,
        majorityType: serialized.majorityType,
      };
      this.proposals.set(proposal.id, proposal);
    }

    this.idCounter = data.idCounter;
  }
}
