import {
  TeenPattiTableState,
  TablePlayer,
  TableType,
  Card,
} from './types';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  evaluateHand,
  compareHands,
  getBettingLimits,
  updateCurrentStake,
} from './engine';

const TABLE_STORAGE_PREFIX = 'gameverse_tp_table_';

const PUBLIC_PRESETS: Partial<TeenPattiTableState>[] = [
  {
    id: 'tp-novice-1',
    roomCode: 'TP-1001',
    tableName: 'Cyber Lounge (1K Boot)',
    bootAmount: 1000,
    tableType: 'public',
  },
  {
    id: 'tp-pro-1',
    roomCode: 'TP-5001',
    tableName: 'Neon High-Rollers (5K Boot)',
    bootAmount: 5000,
    tableType: 'public',
  },
  {
    id: 'tp-master-1',
    roomCode: 'TP-2501',
    tableName: 'Valkyrie Arena (25K Boot)',
    bootAmount: 25000,
    tableType: 'public',
  },
  {
    id: 'tp-legend-1',
    roomCode: 'TP-9901',
    tableName: 'Apex Cyber Syndicate (100K Boot)',
    bootAmount: 100000,
    tableType: 'public',
  },
];

/**
 * Initializes or retrieves a table state
 */
export function getOrCreateTable(tableIdOrCode: string): TeenPattiTableState {
  const isCode = tableIdOrCode.toUpperCase().startsWith('TP-');
  const storageKey = isCode
    ? `${TABLE_STORAGE_PREFIX}code_${tableIdOrCode.toUpperCase()}`
    : `${TABLE_STORAGE_PREFIX}${tableIdOrCode}`;

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  // Check presets
  const preset = PUBLIC_PRESETS.find(
    (p) => p.id === tableIdOrCode || p.roomCode?.toUpperCase() === tableIdOrCode.toUpperCase()
  );

  const initialTable: TeenPattiTableState = {
    id: preset?.id || (isCode ? `tp-${tableIdOrCode.toLowerCase()}` : tableIdOrCode),
    roomCode: preset?.roomCode || (isCode ? tableIdOrCode.toUpperCase() : `TP-${Math.floor(1000 + Math.random() * 9000)}`),
    tableName: preset?.tableName || 'Private Cyber Table',
    tableType: preset?.tableType || 'private',
    status: 'waiting',
    bootAmount: preset?.bootAmount || 1000,
    currentStake: preset?.bootAmount || 1000,
    pot: 0,
    maxPlayers: 6,
    dealerSeat: 0,
    currentTurnSeat: 0,
    players: [null, null, null, null, null, null],
    roundCount: 0,
    dealer: {
      message: 'Welcome to the High Stakes GAMEVERSE Table! Take a seat to play.',
      emotion: 'idle',
      isMuted: false,
      animationsEnabled: true,
    },
  };

  saveTableState(initialTable);
  return initialTable;
}

export function saveTableState(table: TeenPattiTableState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${TABLE_STORAGE_PREFIX}${table.id}`, JSON.stringify(table));
    localStorage.setItem(`${TABLE_STORAGE_PREFIX}code_${table.roomCode.toUpperCase()}`, JSON.stringify(table));
  }
}

/**
 * Creates a private table
 */
export function createPrivateTable(
  tableName: string,
  bootAmount: number,
  hostUser: { id: string; username: string; playerId: string; avatarUrl: string }
): TeenPattiTableState {
  const roomCode = `TP-${Math.floor(1000 + Math.random() * 9000)}`;
  const tableId = `tp-priv-${Date.now()}`;

  const table: TeenPattiTableState = {
    id: tableId,
    roomCode,
    tableName: tableName.trim() || 'Private VIP Suite',
    tableType: 'private',
    status: 'waiting',
    bootAmount,
    currentStake: bootAmount,
    pot: 0,
    maxPlayers: 6,
    dealerSeat: 0,
    currentTurnSeat: 0,
    players: [null, null, null, null, null, null],
    roundCount: 0,
    dealer: {
      message: `Table created! Share code ${roomCode} with friends to join.`,
      emotion: 'idle',
      isMuted: false,
      animationsEnabled: true,
    },
  };

  // Host takes seat 0
  table.players[0] = {
    userId: hostUser.id,
    username: hostUser.username,
    playerId: hostUser.playerId,
    avatarUrl: hostUser.avatarUrl || 'GV',
    seatNumber: 0,
    chips: 100000,
    currentBet: 0,
    totalRoundContribution: 0,
    state: 'blind',
  };

  saveTableState(table);
  return table;
}

/**
 * Player joins an empty seat
 */
export function joinTableSeat(
  table: TeenPattiTableState,
  seatIndex: number,
  user: { id: string; username: string; playerId: string; avatarUrl: string },
  userChips: number
): TeenPattiTableState {
  if (seatIndex < 0 || seatIndex >= 6) return table;

  // Check if player is already seated
  const existingSeat = table.players.findIndex((p) => p && p.userId === user.id);
  if (existingSeat !== -1) return table;

  const updated = { ...table, players: [...table.players] };
  updated.players[seatIndex] = {
    userId: user.id,
    username: user.username,
    playerId: user.playerId,
    avatarUrl: user.avatarUrl || 'GV',
    seatNumber: seatIndex,
    chips: userChips,
    currentBet: 0,
    totalRoundContribution: 0,
    state: 'blind',
  };

  updated.dealer = {
    ...updated.dealer,
    message: `${user.username} took seat #${seatIndex + 1}.`,
    emotion: 'idle',
  };

  saveTableState(updated);
  return updated;
}

/**
 * Adds an AI bot to an empty seat for solo/testing play
 */
export function addAIBot(table: TeenPattiTableState): TeenPattiTableState {
  const emptySeat = table.players.findIndex((p) => p === null);
  if (emptySeat === -1) return table;

  const botNames = ['CyberValkyrie', 'MatrixGhost', 'NeonSpecter', 'ViperX', 'PhantomRogue'];
  const name = botNames[emptySeat % botNames.length];
  const botId = `bot-${Date.now()}-${emptySeat}`;

  const updated = { ...table, players: [...table.players] };
  updated.players[emptySeat] = {
    userId: botId,
    username: `${name} (AI)`,
    playerId: `GV-${Math.floor(100000 + Math.random() * 900000)}`,
    avatarUrl: ['SK', 'NB', 'VR', 'CW'][emptySeat % 4],
    seatNumber: emptySeat,
    chips: 150000,
    currentBet: 0,
    totalRoundContribution: 0,
    state: 'blind',
    isAI: true,
  };

  updated.dealer = {
    ...updated.dealer,
    message: `${name} (AI) joined seat #${emptySeat + 1}.`,
    emotion: 'idle',
  };

  saveTableState(updated);
  return updated;
}

/**
 * Starts a new Teen Patti round
 */
export function startNewRound(table: TeenPattiTableState): TeenPattiTableState {
  const seatedPlayers = table.players.filter((p): p is TablePlayer => p !== null);
  if (seatedPlayers.length < 2) {
    table.dealer.message = 'Need at least 2 players to deal cards.';
    saveTableState(table);
    return table;
  }

  const updated: TeenPattiTableState = {
    ...table,
    status: 'active',
    pot: 0,
    currentStake: table.bootAmount,
    roundCount: table.roundCount + 1,
    winnerResult: undefined,
    players: [...table.players],
  };

  // Create & shuffle fresh deck
  let deck = shuffleDeck(createDeck());

  // Collect boot and deal cards to each seated player
  for (let i = 0; i < 6; i++) {
    const p = updated.players[i];
    if (p) {
      const boot = Math.min(p.chips, updated.bootAmount);
      const { dealt, remaining } = dealCards(deck, 3);
      deck = remaining;

      updated.players[i] = {
        ...p,
        chips: p.chips - boot,
        currentBet: boot,
        totalRoundContribution: boot,
        state: 'blind',
        cards: dealt,
      };

      updated.pot += boot;
    }
  }

  // Next dealer seat
  updated.dealerSeat = (updated.dealerSeat + 1) % 6;

  // First turn goes to next seated active player after dealer
  let turnSeat = (updated.dealerSeat + 1) % 6;
  while (!updated.players[turnSeat]) {
    turnSeat = (turnSeat + 1) % 6;
  }
  updated.currentTurnSeat = turnSeat;

  updated.dealer = {
    ...updated.dealer,
    message: `Boot collected. Dealing cards. It is ${updated.players[turnSeat]?.username}'s turn!`,
    emotion: 'dealing',
  };

  saveTableState(updated);
  return updated;
}

/**
 * Player views their cards (Blind -> Seen)
 */
export function seePlayerCards(table: TeenPattiTableState, userId: string): TeenPattiTableState {
  const seatIndex = table.players.findIndex((p) => p && p.userId === userId);
  if (seatIndex === -1) return table;

  const player = table.players[seatIndex];
  if (!player || player.state !== 'blind') return table;

  const updated = { ...table, players: [...table.players] };
  updated.players[seatIndex] = {
    ...player,
    state: 'seen',
  };

  updated.dealer = {
    ...updated.dealer,
    message: `${player.username} has seen their cards (Chaal mode active).`,
    emotion: 'idle',
  };

  saveTableState(updated);
  return updated;
}

/**
 * Player places a bet (Blind / Chaal / Raise)
 */
export function placeBet(
  table: TeenPattiTableState,
  userId: string,
  amount: number
): TeenPattiTableState {
  const seatIndex = table.players.findIndex((p) => p && p.userId === userId);
  if (seatIndex === -1 || seatIndex !== table.currentTurnSeat) return table;

  const player = table.players[seatIndex];
  if (!player || player.state === 'folded') return table;

  const actualBet = Math.min(player.chips, amount);
  if (actualBet <= 0) return table;

  const isSeen = player.state === 'seen';
  const newStake = updateCurrentStake(table.currentStake, actualBet, isSeen);

  const updated: TeenPattiTableState = {
    ...table,
    pot: table.pot + actualBet,
    currentStake: newStake,
    players: [...table.players],
    lastAction: {
      userId,
      action: isSeen ? 'chaal' : 'blind',
      amount: actualBet,
      description: `${player.username} placed ${actualBet.toLocaleString()} chips (${isSeen ? 'Chaal' : 'Blind'})`,
    },
  };

  updated.players[seatIndex] = {
    ...player,
    chips: player.chips - actualBet,
    currentBet: actualBet,
    totalRoundContribution: player.totalRoundContribution + actualBet,
  };

  // Advance turn to next active player
  let nextSeat = (seatIndex + 1) % 6;
  while (!updated.players[nextSeat] || updated.players[nextSeat]?.state === 'folded') {
    nextSeat = (nextSeat + 1) % 6;
  }
  updated.currentTurnSeat = nextSeat;

  updated.dealer = {
    ...updated.dealer,
    message: `${player.username} placed ${actualBet.toLocaleString()} chips. Turn: ${updated.players[nextSeat]?.username}`,
    emotion: 'turn',
  };

  saveTableState(updated);
  return updated;
}

/**
 * Player folds (Pack)
 */
export function foldPlayer(table: TeenPattiTableState, userId: string): TeenPattiTableState {
  const seatIndex = table.players.findIndex((p) => p && p.userId === userId);
  if (seatIndex === -1) return table;

  const player = table.players[seatIndex];
  if (!player || player.state === 'folded') return table;

  const updated: TeenPattiTableState = {
    ...table,
    players: [...table.players],
    lastAction: {
      userId,
      action: 'pack',
      description: `${player.username} folded (Packed).`,
    },
  };

  updated.players[seatIndex] = {
    ...player,
    state: 'folded',
  };

  // Check how many active players remain
  const activePlayers = updated.players.filter((p): p is TablePlayer => p !== null && p.state !== 'folded');

  if (activePlayers.length === 1) {
    // Only one player left! They win the entire pot automatically
    const winner = activePlayers[0];
    const winnerSeat = updated.players.findIndex((p) => p && p.userId === winner.userId);

    updated.status = 'settled';
    updated.players[winnerSeat] = {
      ...winner,
      chips: winner.chips + updated.pot,
    };

    updated.winnerResult = {
      winnerUserId: winner.userId,
      winnerName: winner.username,
      potAmount: updated.pot,
      handName: 'Last Standing Player',
      winningCards: winner.cards,
    };

    updated.dealer = {
      ...updated.dealer,
      message: `Everyone folded! ${winner.username} takes the entire pot of ${updated.pot.toLocaleString()} chips!`,
      emotion: 'winner',
    };

    saveTableState(updated);
    return updated;
  }

  // If it was the folded player's turn, advance turn
  if (table.currentTurnSeat === seatIndex) {
    let nextSeat = (seatIndex + 1) % 6;
    while (!updated.players[nextSeat] || updated.players[nextSeat]?.state === 'folded') {
      nextSeat = (nextSeat + 1) % 6;
    }
    updated.currentTurnSeat = nextSeat;
    updated.dealer = {
      ...updated.dealer,
      message: `${player.username} packed. It is now ${updated.players[nextSeat]?.username}'s turn.`,
      emotion: 'turn',
    };
  }

  saveTableState(updated);
  return updated;
}

/**
 * Triggers Showdown between remaining 2 players
 */
export function triggerShowdown(table: TeenPattiTableState, userId: string): TeenPattiTableState {
  const activePlayers = table.players.filter((p): p is TablePlayer => p !== null && p.state !== 'folded');
  if (activePlayers.length !== 2) return table;

  const [p1, p2] = activePlayers;
  if (!p1.cards || !p2.cards) return table;

  const cmp = compareHands(p1.cards, p2.cards);
  const eval1 = evaluateHand(p1.cards);
  const eval2 = evaluateHand(p2.cards);

  let winner = p1;
  let winningEval = eval1;

  if (cmp < 0) {
    winner = p2;
    winningEval = eval2;
  }

  const updated: TeenPattiTableState = {
    ...table,
    status: 'settled',
    players: [...table.players],
  };

  const winnerSeat = updated.players.findIndex((p) => p && p.userId === winner.userId);
  if (winnerSeat !== -1) {
    const wPlayer = updated.players[winnerSeat]!;
    updated.players[winnerSeat] = {
      ...wPlayer,
      chips: wPlayer.chips + updated.pot,
    };
  }

  updated.winnerResult = {
    winnerUserId: winner.userId,
    winnerName: winner.username,
    potAmount: updated.pot,
    handName: winningEval.name,
    winningCards: winner.cards,
  };

  updated.dealer = {
    ...updated.dealer,
    message: `Showdown! ${winner.username} wins with ${winningEval.name} taking ${updated.pot.toLocaleString()} chips!`,
    emotion: 'winner',
  };

  saveTableState(updated);
  return updated;
}


/**
 * Returns the previous active, non-folded player in table order
 */
export function getPreviousActivePlayer(
  table: TeenPattiTableState,
  currentSeat: number
): TablePlayer | null {
  let prevSeat = (currentSeat - 1 + 6) % 6;
  let count = 0;
  while (count < 6) {
    const p = table.players[prevSeat];
    if (p && p.state !== 'folded') {
      return p;
    }
    prevSeat = (prevSeat - 1 + 6) % 6;
    count++;
  }
  return null;
}

/**
 * Request a Side Show (Back Show / Compromise) from the previous active player.
 */
export function requestSideShow(table: TeenPattiTableState, userId: string): TeenPattiTableState {
  const seatIndex = table.players.findIndex((p) => p && p.userId === userId);
  if (seatIndex === -1 || seatIndex !== table.currentTurnSeat) return table;

  const player = table.players[seatIndex];
  if (!player || player.state !== 'seen' || !player.cards) return table;

  const prevPlayer = getPreviousActivePlayer(table, seatIndex);
  if (!prevPlayer || prevPlayer.state !== 'seen' || !prevPlayer.cards) return table;

  const betCost = Math.min(player.chips, table.currentStake * 2);

  const updated: TeenPattiTableState = {
    ...table,
    pot: table.pot + betCost,
    players: [...table.players],
  };

  updated.players[seatIndex] = {
    ...player,
    chips: player.chips - betCost,
    currentBet: betCost,
    totalRoundContribution: player.totalRoundContribution + betCost,
  };

  // Compare hands
  const cmp = compareHands(player.cards, prevPlayer.cards);
  const prevSeat = table.players.findIndex((p) => p && p.userId === prevPlayer.userId);

  let loserSeat = seatIndex;
  let winnerSeat = prevSeat;

  if (cmp >= 0) {
    loserSeat = prevSeat;
    winnerSeat = seatIndex;
  }

  const loserPlayer = updated.players[loserSeat]!;
  const winnerPlayer = updated.players[winnerSeat]!;

  updated.players[loserSeat] = {
    ...loserPlayer,
    state: 'folded',
  };

  updated.lastAction = {
    userId,
    action: 'sideshow',
    amount: betCost,
    description: `Side Show! ${winnerPlayer.username} had the better hand. ${loserPlayer.username} packed!`,
  };

  // Check how many active players remain
  const activeRemaining = updated.players.filter((p): p is TablePlayer => p !== null && p.state !== 'folded');

  if (activeRemaining.length === 1) {
    const roundWinner = activeRemaining[0];
    const rwSeat = updated.players.findIndex((p) => p && p.userId === roundWinner.userId);

    updated.status = 'settled';
    updated.players[rwSeat] = {
      ...roundWinner,
      chips: roundWinner.chips + updated.pot,
    };

    updated.winnerResult = {
      winnerUserId: roundWinner.userId,
      winnerName: roundWinner.username,
      potAmount: updated.pot,
      handName: 'Side Show Victor',
      winningCards: roundWinner.cards,
    };

    updated.dealer = {
      ...updated.dealer,
      message: `Sideshow decided the game! ${roundWinner.username} wins the entire pot of ${updated.pot.toLocaleString()} chips!`,
      emotion: 'winner',
    };

    saveTableState(updated);
    return updated;
  }

  // Advance turn to next active player
  let nextSeat = (seatIndex + 1) % 6;
  while (!updated.players[nextSeat] || updated.players[nextSeat]?.state === 'folded') {
    nextSeat = (nextSeat + 1) % 6;
  }
  updated.currentTurnSeat = nextSeat;

  updated.dealer = {
    ...updated.dealer,
    message: `Sideshow complete! ${winnerPlayer.username} prevailed. ${loserPlayer.username} packed! Turn: ${updated.players[nextSeat]?.username}`,
    emotion: 'turn',
  };

  saveTableState(updated);
  return updated;
}
