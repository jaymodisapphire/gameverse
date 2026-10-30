import test from 'node:test';
import assert from 'node:assert/strict';

// Set up in-memory localStorage for Node testing environment
const memoryStorage = new Map<string, string>();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, val: string) => memoryStorage.set(key, String(val)),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

import {
  evaluateHand,
  compareHands,
  getBettingLimits,
  createDeck,
  shuffleDeck,
} from '../../src/lib/teen-patti/engine';
import { Card } from '../../src/lib/teen-patti/types';
import {
  getPlayerWallet,
  adminGrantChips,
  submitChipRequest,
  adminReviewRequest,
  getPlayerChipRequests,
  adminGetPendingRequests,
} from '../../src/lib/wallet/wallet-service';

test('--- Teen Patti Rules Engine & Hand Rankings ---', async (t) => {
  await t.test('1. Deck creation generates exactly 52 unique cards', () => {
    const deck = createDeck();
    assert.equal(deck.length, 52);

    const keys = new Set(deck.map((c) => `${c.rank}-${c.suit}`));
    assert.equal(keys.size, 52, 'All 52 cards must be distinct');

    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    for (const suit of suits) {
      assert.equal(deck.filter((c) => c.suit === suit).length, 13);
    }
  });

  await t.test('2. Hand Hierarchy: Trail (Trio) recognition and comparison', () => {
    const aceTrail: Card[] = [
      { suit: 'hearts', rank: 14 },
      { suit: 'diamonds', rank: 14 },
      { suit: 'spades', rank: 14 },
    ];
    const kingTrail: Card[] = [
      { suit: 'hearts', rank: 13 },
      { suit: 'clubs', rank: 13 },
      { suit: 'spades', rank: 13 },
    ];

    const evalA = evaluateHand(aceTrail);
    const evalK = evaluateHand(kingTrail);

    assert.equal(evalA.tier, 'Trail');
    assert.equal(evalA.tierScore, 6, 'Trail tier score must be 6 (highest)');
    assert.equal(evalK.tier, 'Trail');

    // Ace Trail beats King Trail
    assert.equal(compareHands(aceTrail, kingTrail), 1);
    assert.equal(compareHands(kingTrail, aceTrail), -1);
  });

  await t.test('3. Hand Hierarchy: Pure Sequence and A-2-3 special rule', () => {
    // A-K-Q of Hearts (highest pure sequence)
    const akq: Card[] = [
      { suit: 'hearts', rank: 14 },
      { suit: 'hearts', rank: 13 },
      { suit: 'hearts', rank: 12 },
    ];
    // A-2-3 of Hearts (second highest in Indian Teen Patti)
    const a23: Card[] = [
      { suit: 'hearts', rank: 14 },
      { suit: 'hearts', rank: 2 },
      { suit: 'hearts', rank: 3 },
    ];
    // K-Q-J of Hearts (third highest pure sequence)
    const kqj: Card[] = [
      { suit: 'hearts', rank: 13 },
      { suit: 'hearts', rank: 12 },
      { suit: 'hearts', rank: 11 },
    ];

    const evalAKQ = evaluateHand(akq);
    const evalA23 = evaluateHand(a23);
    const evalKQJ = evaluateHand(kqj);

    assert.equal(evalAKQ.tier, 'Pure Sequence');
    assert.equal(evalAKQ.tierScore, 5);
    assert.equal(evalA23.tier, 'Pure Sequence');
    assert.equal(evalKQJ.tier, 'Pure Sequence');

    // In Teen Patti: A-K-Q > A-2-3 > K-Q-J
    assert.equal(compareHands(akq, a23), 1, 'A-K-Q must beat A-2-3');
    assert.equal(compareHands(a23, kqj), 1, 'A-2-3 must beat K-Q-J in Teen Patti');
    assert.equal(compareHands(kqj, a23), -1, 'K-Q-J must lose to A-2-3');
  });

  await t.test('4. Hand Hierarchy: Sequence (Normal Run) cross-suit', () => {
    const seqAKQ: Card[] = [
      { suit: 'hearts', rank: 14 },
      { suit: 'spades', rank: 13 },
      { suit: 'clubs', rank: 12 },
    ];
    const seqA23: Card[] = [
      { suit: 'diamonds', rank: 14 },
      { suit: 'clubs', rank: 2 },
      { suit: 'hearts', rank: 3 },
    ];
    const seq432: Card[] = [
      { suit: 'spades', rank: 4 },
      { suit: 'hearts', rank: 3 },
      { suit: 'diamonds', rank: 2 },
    ];

    const evalSeq = evaluateHand(seqAKQ);
    assert.equal(evalSeq.tier, 'Sequence');
    assert.equal(evalSeq.tierScore, 4);
    assert.equal(compareHands(seqAKQ, seqA23), 1, 'A-K-Q off-suit beats A-2-3 off-suit');
    assert.equal(compareHands(seqA23, seq432), 1, 'A-2-3 off-suit beats 4-3-2');
  });

  await t.test('5. Hand Hierarchy: Color (Flush)', () => {
    const colorA: Card[] = [
      { suit: 'diamonds', rank: 14 },
      { suit: 'diamonds', rank: 10 },
      { suit: 'diamonds', rank: 4 },
    ];
    const colorK: Card[] = [
      { suit: 'hearts', rank: 13 },
      { suit: 'hearts', rank: 12 },
      { suit: 'hearts', rank: 9 },
    ];

    const evalColA = evaluateHand(colorA);
    assert.equal(evalColA.tier, 'Color');
    assert.equal(evalColA.tierScore, 3);
    assert.equal(compareHands(colorA, colorK), 1, 'Ace-high Color beats King-high Color');
  });

  await t.test('6. Hand Hierarchy: Pair and High Card', () => {
    const pair10: Card[] = [
      { suit: 'diamonds', rank: 10 },
      { suit: 'hearts', rank: 10 },
      { suit: 'spades', rank: 7 },
    ];
    const highCardAce: Card[] = [
      { suit: 'clubs', rank: 14 },
      { suit: 'hearts', rank: 9 },
      { suit: 'diamonds', rank: 4 },
    ];

    const evalPair = evaluateHand(pair10);
    const evalHigh = evaluateHand(highCardAce);

    assert.equal(evalPair.tier, 'Pair');
    assert.equal(evalPair.tierScore, 2);
    assert.equal(evalHigh.tier, 'High Card');
    assert.equal(evalHigh.tierScore, 1);

    // Pair beats High Card
    assert.equal(compareHands(pair10, highCardAce), 1, 'Pair must beat High Card');
  });

  await t.test('7. Betting calculations: Blind vs Seen (Chaal)', () => {
    const currentStake = 100;

    // Blind player bets 1x to 2x current stake
    const blindLimits = getBettingLimits(currentStake, false);
    assert.equal(blindLimits.minBet, 100);
    assert.equal(blindLimits.maxBet, 200);
    assert.equal(blindLimits.label, 'Blind');

    // Seen player bets 2x to 4x current stake
    const seenLimits = getBettingLimits(currentStake, true);
    assert.equal(seenLimits.minBet, 200);
    assert.equal(seenLimits.maxBet, 400);
    assert.equal(seenLimits.label, 'Chaal');
  });
});

test('--- Virtual Chip Wallet & 100,000 Starting Grant ---', async (t) => {
  const testUserId = `test-user-${Date.now()}`;

  await t.test('1. Every new player receives exactly 100,000 starting chips', async () => {
    const wallet = await getPlayerWallet(testUserId);
    assert.equal(wallet.userId, testUserId);
    assert.equal(wallet.balance, 100000, 'Starting balance must be exactly 100,000 virtual chips');
  });

  await t.test('2. Starting grant is idempotent: repeat calls retain 100,000 without duplicate credit', async () => {
    const secondCall = await getPlayerWallet(testUserId);
    assert.equal(secondCall.balance, 100000, 'Balance must remain 100,000 and not inflate');
  });
});

test('--- Admin Chip Grants & Chip Request Approvals ---', async (t) => {
  const adminPlayerId = `player-target-${Date.now()}`;
  const adminId = `admin-exec-${Date.now()}`;

  // Initialize target player's wallet with starting chips
  await getPlayerWallet(adminPlayerId);

  await t.test('1. Admin grant adds chips with reason and creates transaction', async () => {
    const grantAmount = 50000;
    const res = await adminGrantChips(adminId, adminPlayerId, grantAmount, 'VIP Welcome Bonus');
    assert.equal(res.success, true);
    assert.equal(res.newBalance, 150000, 'Balance should increase from 100,000 to 150,000');

    const wallet = await getPlayerWallet(adminPlayerId);
    assert.equal(wallet.balance, 150000);
  });

  await t.test('2. Admin grant rejects negative or zero amounts', async () => {
    const resNeg = await adminGrantChips(adminId, adminPlayerId, -1000, 'Invalid');
    assert.equal(resNeg.success, false);
    assert.ok(resNeg.error?.includes('between'));

    const resZero = await adminGrantChips(adminId, adminPlayerId, 0, 'Invalid');
    assert.equal(resZero.success, false);
    assert.ok(resZero.error?.includes('between'));
  });

  await t.test('3. Player can submit a chip request', async () => {
    const res = await submitChipRequest(adminPlayerId, 'TestPlayer', 25000, 'Low on chips for high roller table');
    assert.equal(res.success, true);
    assert.ok(res.request);
    assert.equal(res.request.requesterUserId, adminPlayerId);
    assert.equal(res.request.requestedAmount, 25000);
    assert.equal(res.request.status, 'pending');

    const playerRequests = await getPlayerChipRequests(adminPlayerId);
    assert.ok(playerRequests.some((r) => r.id === res.request!.id));
  });

  await t.test('4. Admin can approve a chip request with single credit guarantee', async () => {
    const subRes = await submitChipRequest(adminPlayerId, 'TestPlayer', 10000, 'Daily tournament reload');
    assert.equal(subRes.success, true);
    const reqId = subRes.request!.id;

    const startBalance = (await getPlayerWallet(adminPlayerId)).balance;

    const reviewRes = await adminReviewRequest(adminId, reqId, 'approve', 'Approved for tournament');
    assert.equal(reviewRes.success, true);
    assert.equal(reviewRes.newBalance, startBalance + 10000);

    const finalBalance = (await getPlayerWallet(adminPlayerId)).balance;
    assert.equal(finalBalance, startBalance + 10000, 'Player balance should increase by approved amount');

    // Attempting to approve or reject again must fail (prevent double credits)
    const doubleReview = await adminReviewRequest(adminId, reqId, 'approve', 'Double approve attempt');
    assert.equal(doubleReview.success, false);
    assert.ok(doubleReview.error?.includes('already'));
  });

  await t.test('5. Admin rejection updates status and does NOT credit wallet', async () => {
    const subRes = await submitChipRequest(adminPlayerId, 'TestPlayer', 500000, 'Excessive request');
    assert.equal(subRes.success, true);
    const reqId = subRes.request!.id;

    const startBalance = (await getPlayerWallet(adminPlayerId)).balance;

    const rejectRes = await adminReviewRequest(adminId, reqId, 'reject', 'Exceeds daily request limit');
    assert.equal(rejectRes.success, true);

    const finalBalance = (await getPlayerWallet(adminPlayerId)).balance;
    assert.equal(finalBalance, startBalance, 'Rejected request must NOT credit any chips');
  });
});


test('--- Teen Patti Side Show (Sideshow) Engine ---', async (t) => {
  const { requestSideShow, getPreviousActivePlayer } = await import('../../src/lib/teen-patti/table-manager');

  await t.test('1. Side Show compares hands and folds player with lower hand', () => {
    const mockTable: any = {
      id: 'test-table-1',
      roomCode: 'TP-TEST',
      tableName: 'Test Table',
      tableType: 'public',
      status: 'active',
      bootAmount: 1000,
      currentStake: 1000,
      pot: 6000,
      maxPlayers: 6,
      dealerSeat: 0,
      currentTurnSeat: 1,
      players: [
        {
          userId: 'player-0',
          username: 'Seat0',
          playerId: 'GV-000',
          avatarUrl: 'GV',
          seatNumber: 0,
          chips: 50000,
          currentBet: 2000,
          totalRoundContribution: 2000,
          state: 'seen',
          cards: [
            { suit: 'hearts', rank: 14 },
            { suit: 'diamonds', rank: 14 },
            { suit: 'spades', rank: 14 }, // Trail of Aces
          ],
        },
        {
          userId: 'player-1',
          username: 'Seat1',
          playerId: 'GV-001',
          avatarUrl: 'GV',
          seatNumber: 1,
          chips: 50000,
          currentBet: 2000,
          totalRoundContribution: 2000,
          state: 'seen',
          cards: [
            { suit: 'hearts', rank: 10 },
            { suit: 'diamonds', rank: 7 },
            { suit: 'spades', rank: 4 }, // High Card
          ],
        },
        {
          userId: 'player-2',
          username: 'Seat2',
          playerId: 'GV-002',
          avatarUrl: 'GV',
          seatNumber: 2,
          chips: 50000,
          currentBet: 2000,
          totalRoundContribution: 2000,
          state: 'seen',
          cards: [
            { suit: 'hearts', rank: 13 },
            { suit: 'diamonds', rank: 13 },
            { suit: 'spades', rank: 13 }, // Trail of Kings
          ],
        },
        null,
        null,
        null,
      ],
      roundCount: 1,
      dealer: { message: '', emotion: 'turn', isMuted: true, animationsEnabled: false },
    };

    const prevPlayer = getPreviousActivePlayer(mockTable, 1);
    assert.equal(prevPlayer?.userId, 'player-0');

    // Seat 1 (High card) asks side show against Seat 0 (Trail of Aces)
    const updated = requestSideShow(mockTable, 'player-1');
    assert.equal(updated.players[1]?.state, 'folded', 'Player 1 had weaker hand and should fold');
    assert.equal(updated.players[0]?.state, 'seen', 'Player 0 had stronger hand and remains active');
    assert.equal(updated.currentTurnSeat, 2, 'Turn must advance to Seat 2');
    assert.equal(updated.lastAction?.action, 'sideshow');
  });
});
