export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  suit: CardSuit;
  rank: number; // 2..14 (11=J, 12=Q, 13=K, 14=A)
}

export type HandRankingTier =
  | 'Trail'          // Three of a kind (Set/Trio)
  | 'Pure Sequence' // Straight Flush
  | 'Sequence'      // Straight
  | 'Color'         // Flush
  | 'Pair'          // Two of a kind
  | 'High Card';    // Highest rank card

export interface HandEvaluation {
  tier: HandRankingTier;
  tierScore: number; // 6 for Trail, 5 for Pure Seq, down to 1 for High Card
  tieBreaker: number; // Single comparable score for instant tie resolution
  name: string;
  cards: Card[];
}

export type TableType = 'public' | 'private';
export type TableStatus = 'waiting' | 'active' | 'showdown' | 'settled';
export type PlayerRoundState = 'blind' | 'seen' | 'folded';

export interface TablePlayer {
  userId: string;
  username: string;
  playerId: string;
  avatarUrl: string;
  seatNumber: number; // 0 to 5
  chips: number;
  currentBet: number;
  totalRoundContribution: number;
  state: PlayerRoundState;
  cards?: Card[]; // Hidden from others until showdown
  isAI?: boolean;
}

export interface DealerState {
  message: string;
  emotion: 'idle' | 'dealing' | 'turn' | 'showdown' | 'winner' | 'alert';
  isMuted: boolean;
  animationsEnabled: boolean;
}

export interface TeenPattiTableState {
  id: string;
  roomCode: string;
  tableName: string;
  tableType: TableType;
  status: TableStatus;
  bootAmount: number;
  currentStake: number;
  pot: number;
  maxPlayers: number;
  dealerSeat: number;
  currentTurnSeat: number;
  players: (TablePlayer | null)[];
  roundCount: number;
  dealer: DealerState;
  lastAction?: {
    userId: string;
    action: 'boot' | 'blind' | 'chaal' | 'raise' | 'pack' | 'show';
    amount?: number;
    description: string;
  };
  winnerResult?: {
    winnerUserId: string;
    winnerName: string;
    potAmount: number;
    handName: string;
    winningCards?: Card[];
  };
}
