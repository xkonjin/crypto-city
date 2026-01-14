/**
 * NPC Voting & Governance System Types
 * 
 * Defines types for the democratic/governance mechanics within factions.
 * Enables NPCs to participate in elections, vote on proposals, and delegate voting power.
 * 
 * Integrates with FactionManager to manage leadership elections and policy changes.
 */

/**
 * Voting stage progression for elections
 */
export type VotingStage = 'nomination' | 'voting' | 'counting' | 'resolved';

/**
 * Types of proposals that can be voted on
 */
export type ProposalType = 
  | 'tax_change'     // Change faction tax rate
  | 'law_change'     // Change faction rules
  | 'policy_change'  // Change faction policies
  | 'expulsion'      // Remove a member from faction
  | 'alliance';      // Form alliance with another faction

/**
 * Types of elections
 */
export type ElectionType = 'leader' | 'council' | 'proposal';

/**
 * Status of a proposal
 */
export type ProposalStatus = 'pending' | 'active' | 'passed' | 'rejected' | 'expired';

/**
 * Majority type for voting resolution
 */
export type MajorityType = 'simple' | 'super';

/**
 * Single vote cast by an NPC
 */
export interface Vote {
  /** ID of the NPC casting the vote */
  voterId: string;
  /** The choice made (nominee ID for elections, true/false for proposals) */
  choice: string | boolean;
  /** Voting power/weight of this vote */
  weight: number;
  /** If this vote includes delegated power, from whom */
  delegatedFrom?: string[];
}

/**
 * Delegation of voting power from one NPC to another
 */
export interface VoteDelegation {
  /** NPC delegating their vote */
  delegatorId: string;
  /** NPC receiving the delegation */
  delegateeId: string;
  /** Election ID this delegation applies to */
  electionId: string;
  /** Timestamp when delegation was made */
  delegatedAt: number;
}

/**
 * Nominee in an election
 */
export interface Nominee {
  /** NPC ID of the nominee */
  npcId: string;
  /** NPC ID of who nominated them */
  nominatedBy: string;
  /** Timestamp when nominated */
  nominatedAt: number;
  /** Campaign platform/promise */
  platform?: string;
}

/**
 * Election for faction leadership or council positions
 */
export interface Election {
  /** Unique identifier */
  id: string;
  /** Faction holding the election */
  factionId: string;
  /** Type of election */
  type: ElectionType;
  /** List of nominees */
  nominees: Nominee[];
  /** Votes cast in this election */
  votes: Map<string, Vote>;
  /** Vote delegations in this election */
  delegations: Map<string, VoteDelegation>;
  /** Current stage of the election */
  stage: VotingStage;
  /** Minimum participation required */
  quorum: number;
  /** Timestamp when election started */
  startedAt: number;
  /** Timestamp when election will/did end */
  endsAt: number;
  /** ID of the winner (set when resolved) */
  winnerId?: string;
  /** Array of winner IDs for council elections */
  winners?: string[];
  /** Whether super-majority is required */
  majorityType: MajorityType;
  /** Number of council seats for council elections */
  councilSeats?: number;
}

/**
 * Governance proposal for faction decision-making
 */
export interface Proposal {
  /** Unique identifier */
  id: string;
  /** Faction where proposal is being voted on */
  factionId: string;
  /** NPC who proposed this */
  proposerId: string;
  /** Type of proposal */
  type: ProposalType;
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Votes cast on this proposal */
  votes: Map<string, Vote>;
  /** Vote delegations for this proposal */
  delegations: Map<string, VoteDelegation>;
  /** Current status */
  status: ProposalStatus;
  /** Minimum participation required */
  quorum: number;
  /** Timestamp when proposal was created */
  createdAt: number;
  /** Timestamp when voting ends */
  votingEndsAt: number;
  /** The proposed new value (e.g., new tax rate) */
  proposedValue?: unknown;
  /** Whether super-majority is required */
  majorityType: MajorityType;
}

/**
 * Election results summary
 */
export interface ElectionResult {
  electionId: string;
  winnerId?: string;
  winners?: string[];
  totalVotes: number;
  totalWeight: number;
  quorumMet: boolean;
  voteBreakdown: Map<string, number>;
}

/**
 * Proposal results summary
 */
export interface ProposalResult {
  proposalId: string;
  passed: boolean;
  forVotes: number;
  againstVotes: number;
  forWeight: number;
  againstWeight: number;
  quorumMet: boolean;
  majorityMet: boolean;
}

/**
 * Configuration for election/proposal quorum and timing
 */
export interface VotingConfig {
  /** Default quorum for leader elections (0-1, percentage of members) */
  leaderElectionQuorum: number;
  /** Default quorum for council elections */
  councilElectionQuorum: number;
  /** Default quorum for proposals */
  proposalQuorum: number;
  /** Duration of nomination phase in game minutes */
  nominationDuration: number;
  /** Duration of voting phase in game minutes */
  votingDuration: number;
  /** Duration of counting phase in game minutes */
  countingDuration: number;
  /** Threshold for super-majority (e.g., 0.66 for 2/3) */
  superMajorityThreshold: number;
  /** Number of council seats by default */
  defaultCouncilSeats: number;
}

/**
 * Default voting configuration
 */
export const DEFAULT_VOTING_CONFIG: VotingConfig = {
  leaderElectionQuorum: 0.5,  // 50% participation required
  councilElectionQuorum: 0.4, // 40% participation required
  proposalQuorum: 0.3,        // 30% participation required
  nominationDuration: 1440,   // 1 game day for nominations
  votingDuration: 2880,       // 2 game days for voting
  countingDuration: 60,       // 1 game hour for counting
  superMajorityThreshold: 0.66,
  defaultCouncilSeats: 3,
};

/**
 * Serialized election for storage
 */
export interface SerializedElection {
  id: string;
  factionId: string;
  type: ElectionType;
  nominees: Nominee[];
  votes: [string, Vote][];
  delegations: [string, VoteDelegation][];
  stage: VotingStage;
  quorum: number;
  startedAt: number;
  endsAt: number;
  winnerId?: string;
  winners?: string[];
  majorityType: MajorityType;
  councilSeats?: number;
}

/**
 * Serialized proposal for storage
 */
export interface SerializedProposal {
  id: string;
  factionId: string;
  proposerId: string;
  type: ProposalType;
  title: string;
  description: string;
  votes: [string, Vote][];
  delegations: [string, VoteDelegation][];
  status: ProposalStatus;
  quorum: number;
  createdAt: number;
  votingEndsAt: number;
  proposedValue?: unknown;
  majorityType: MajorityType;
}

/**
 * Hitchhiker's Guide style descriptions for voting concepts
 */
export const VOTING_DESCRIPTIONS: Record<string, string> = {
  election: "The process by which crypto citizens pretend their vote matters. At least the blockchain makes it auditable.",
  nomination: "When someone suggests a candidate, usually themselves. Democracy at its finest.",
  delegation: "Outsourcing your civic duty to someone who probably also doesn't care.",
  quorum: "The minimum number of people required to legitimize a decision nobody asked for.",
  proposal: "A formal way of saying 'I have an idea' that requires 47 signatures and a governance vote.",
  supermajority: "When regular agreement isn't enough, so you need even more agreement. Very decentralized.",
};
