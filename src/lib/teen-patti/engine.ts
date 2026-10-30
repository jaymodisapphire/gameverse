import { Card, CardSuit, HandEvaluation, HandRankingTier } from './types';

const SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<CardSuit, string> = {
  hearts: '#f43f5e',
  diamonds: '#f43f5e',
  clubs: '#38bdf8',
  spades: '#e2e8f0',
};

export function getRankLabel(rank: number): string {
  switch (rank) {
    case 14:
      return 'A';
    case 13:
      return 'K';
    case 12:
      return 'Q';
    case 11:
      return 'J';
    case 10:
      return '10';
    default:
      return String(rank);
  }
}

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Shuffles a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards from the top of the deck
 */
export function dealCards(deck: Card[], count: number = 3): { dealt: Card[]; remaining: Card[] } {
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { dealt, remaining };
}

/**
 * Checks if 3 sorted card ranks form a sequence.
 * In standard Teen Patti:
 * 1. A-K-Q (14, 13, 12) is the highest sequence.
 * 2. A-2-3 (14, 3, 2) is the second highest sequence.
 * 3. Followed by K-Q-J (13, 12, 11) down to 4-3-2 (4, 3, 2).
 */
function checkSequenceRanks(sortedRanks: number[]): { isSeq: boolean; seqStrength: number } {
  const [r0, r1, r2] = sortedRanks;

  // A-K-Q (14, 13, 12)
  if (r0 === 14 && r1 === 13 && r2 === 12) {
    return { isSeq: true, seqStrength: 14 };
  }

  // A-2-3 (14, 3, 2) -> in Teen Patti, ranked right below A-K-Q
  if (r0 === 14 && r1 === 3 && r2 === 2) {
    return { isSeq: true, seqStrength: 13.5 };
  }

  // Standard consecutive sequence (e.g. 13-12-11 down to 4-3-2)
  if (r0 === r1 + 1 && r1 === r2 + 1) {
    return { isSeq: true, seqStrength: r0 };
  }

  return { isSeq: false, seqStrength: 0 };
}

/**
 * Evaluates a 3-card Teen Patti hand according to official rules.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (!cards || cards.length !== 3) {
    return {
      tier: 'High Card',
      tierScore: 1,
      tieBreaker: 0,
      name: 'Invalid Hand',
      cards: cards || [],
    };
  }

  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const r0 = sorted[0].rank;
  const r1 = sorted[1].rank;
  const r2 = sorted[2].rank;

  const isFlush = sorted[0].suit === sorted[1].suit && sorted[1].suit === sorted[2].suit;
  const seqInfo = checkSequenceRanks([r0, r1, r2]);

  // 1. Trail / Set / Three of a Kind (All 3 ranks equal)
  if (r0 === r1 && r1 === r2) {
    const tierScore = 6;
    const tieBreaker = 6000000 + r0 * 1000;
    return {
      tier: 'Trail',
      tierScore,
      tieBreaker,
      name: `Trail of ${getRankLabel(r0)}'s`,
      cards: sorted,
    };
  }

  // 2. Pure Sequence / Straight Flush (Sequence + Flush)
  if (isFlush && seqInfo.isSeq) {
    const tierScore = 5;
    const tieBreaker = 5000000 + Math.floor(seqInfo.seqStrength * 1000);
    const seqName =
      seqInfo.seqStrength === 13.5
        ? 'A-2-3'
        : `${getRankLabel(r0)}-${getRankLabel(r1)}-${getRankLabel(r2)}`;
    return {
      tier: 'Pure Sequence',
      tierScore,
      tieBreaker,
      name: `Pure Sequence (${seqName})`,
      cards: sorted,
    };
  }

  // 3. Sequence / Straight (Consecutive ranks, different suits)
  if (seqInfo.isSeq) {
    const tierScore = 4;
    const tieBreaker = 4000000 + Math.floor(seqInfo.seqStrength * 1000);
    const seqName =
      seqInfo.seqStrength === 13.5
        ? 'A-2-3'
        : `${getRankLabel(r0)}-${getRankLabel(r1)}-${getRankLabel(r2)}`;
    return {
      tier: 'Sequence',
      tierScore,
      tieBreaker,
      name: `Sequence (${seqName})`,
      cards: sorted,
    };
  }

  // 4. Color / Flush (All same suit, not in sequence)
  if (isFlush) {
    const tierScore = 3;
    const tieBreaker = 3000000 + r0 * 10000 + r1 * 100 + r2;
    return {
      tier: 'Color',
      tierScore,
      tieBreaker,
      name: `Color (${getRankLabel(r0)} High)`,
      cards: sorted,
    };
  }

  // 5. Pair (Two cards of equal rank)
  if (r0 === r1 || r1 === r2 || r0 === r2) {
    const tierScore = 2;
    let pairRank = r0;
    let kicker = r2;

    if (r1 === r2) {
      pairRank = r1;
      kicker = r0;
    } else if (r0 === r2) {
      pairRank = r0;
      kicker = r1;
    }

    const tieBreaker = 2000000 + pairRank * 1000 + kicker;
    return {
      tier: 'Pair',
      tierScore,
      tieBreaker,
      name: `Pair of ${getRankLabel(pairRank)}'s (${getRankLabel(kicker)} kicker)`,
      cards: sorted,
    };
  }

  // 6. High Card
  const tierScore = 1;
  const tieBreaker = 1000000 + r0 * 10000 + r1 * 100 + r2;
  return {
    tier: 'High Card',
    tierScore,
    tieBreaker,
    name: `High Card ${getRankLabel(r0)} (${getRankLabel(r1)}, ${getRankLabel(r2)})`,
    cards: sorted,
  };
}

/**
 * Compares two hands.
 * Returns:
 *  1 if handA wins
 * -1 if handB wins
 *  0 if exact tie
 */
export function compareHands(handA: Card[], handB: Card[]): number {
  const evalA = evaluateHand(handA);
  const evalB = evaluateHand(handB);

  if (evalA.tieBreaker > evalB.tieBreaker) return 1;
  if (evalA.tieBreaker < evalB.tieBreaker) return -1;
  return 0;
}

/**
 * Calculates betting amounts for a player.
 * Blind player: bet is currentStake or 2 * currentStake
 * Seen player (Chaal): bet is 2 * currentStake or 4 * currentStake
 */
export function getBettingLimits(currentStake: number, isSeen: boolean) {
  if (!isSeen) {
    return {
      minBet: currentStake,
      maxBet: currentStake * 2,
      label: 'Blind',
    };
  } else {
    return {
      minBet: currentStake * 2,
      maxBet: currentStake * 4,
      label: 'Chaal',
    };
  }
}

/**
 * Updates current stake after a player action.
 * If player was blind, the new currentStake = betAmount.
 * If player was seen, the new currentStake = betAmount / 2.
 */
export function updateCurrentStake(currentStake: number, betAmount: number, isSeen: boolean): number {
  if (!isSeen) {
    return Math.max(currentStake, betAmount);
  } else {
    return Math.max(currentStake, Math.floor(betAmount / 2));
  }
}
