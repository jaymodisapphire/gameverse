export type TransactionType =
  | 'starting_grant'
  | 'admin_grant'
  | 'approved_request'
  | 'game_buyin'
  | 'game_payout'
  | 'refund';

export type ChipRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PlayerWallet {
  id?: string;
  userId: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChipTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: TransactionType;
  referenceId?: string;
  idempotencyKey?: string;
  performedBy?: string;
  reason?: string;
  createdAt: string;
}

export interface ChipRequest {
  id: string;
  requesterUserId: string;
  requesterUsername?: string;
  requestedAmount: number;
  status: ChipRequestStatus;
  requestMessage?: string;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlayerView {
  userId: string;
  username: string;
  playerId: string;
  avatarUrl?: string;
  email?: string;
  balance: number;
  level: number;
  totalGames: number;
  isAdmin: boolean;
  createdAt: string;
}
