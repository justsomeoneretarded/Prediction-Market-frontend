export type Status = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'AWAITING_RESOLUTION' | 'DISPUTED' | 'RESOLVED' | 'CANCELLED';

export interface Market {
  id: string;
  slug: string;
  question: string;
  questionAm: string | null;
  description: string;
  category: string;
  type: string;
  yesLabel: string;
  noLabel: string;
  imageEmoji: string | null;
  isDemo: boolean;
  featured: boolean;
  opensAt: string;
  closesAt: string;
  resolvesAt: string;
  status: Status;
  tradingHalted: boolean;
  haltReason: string | null;
  yesPrice: string;
  noPrice: string;
  volume: string;
  tradesCount: number;
  liquidityB: string;
  initialProbability: string;
  feeBps: number;
  subsidy: string;
  maxTradeAmount: string;
  yesShares: string;
  noShares: string;
  resolutionRules: string;
  sourcePrimary: string;
  sourceBackup: string | null;
  cancellationRules: string;
  cancellationPolicy: string;
  disputeHours: number;
  resolvedOutcome: 'YES' | 'NO' | 'CANCELLED' | null;
  resolvedAt: string | null;
  createdAt: string;
  fixture: { homeTeam: string; awayTeam: string; kickoffAt: string; status: string; league: string } | null;
}

export interface Liquidity {
  liquidityB: string;
  subsidy: string;
  maxLossBound: string;
  riskBudget: string;
  escrow: string | null;
  traderNetCash: string | null;
  payoutIfYes: string;
  payoutIfNo: string;
  operatorPnlIfYes: string | null;
  operatorPnlIfNo: string | null;
  currentExposure: string | null;
  reserveCoverage: string | null;
}

export interface TradeRow {
  id: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  shares: string;
  amount: string;
  avgPrice: string;
  yesPriceAfter?: string;
  username?: string;
  createdAt: string;
}

export interface Proposal {
  id: string;
  outcome: 'YES' | 'NO' | 'CANCELLED';
  status: string;
  source: string;
  evidenceUrl: string;
  evidenceNotes: string;
  disputeEndsAt: string | null;
  createdAt: string;
  disputes: { id: string; status: string; reason: string; createdAt: string }[];
}

export interface MarketDetail extends Market {
  liquidity: Liquidity;
  recentTrades: TradeRow[];
  related: Market[];
  proposal: Proposal | null;
  now: string;
}

export interface Me {
  user: { id: string; email: string; username: string; displayName: string; roles: string[]; locale: 'en' | 'am'; totpEnabled: boolean; twoFactorVerified: boolean } | null;
  balances?: { available: string; reserved: string };
  unreadNotifications?: number;
  requires2fa?: boolean;
}

export interface Quote {
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  shares: string;
  amount: string;
  fee: string;
  total: string;
  avgPrice: string;
  yesPriceBefore: string;
  yesPriceAfter: string;
  priceImpact: string;
  maxPayout: string;
  feeBps: number;
  warnings: string[];
}

export interface PositionView {
  marketId: string;
  slug: string;
  question: string;
  questionAm: string | null;
  status: Status;
  resolvedOutcome: string | null;
  yesShares: string;
  noShares: string;
  yesAvgPrice: string | null;
  noAvgPrice: string | null;
  yesPrice: string;
  costBasis: string;
  value: string;
  unrealizedPnl: string;
  realizedPnl: string;
  settledPayout: string | null;
  payoutIfYes: string;
  payoutIfNo: string;
}

export interface Portfolio {
  cash: { available: string; reserved: string };
  positionsValue: string;
  portfolioValue: string;
  unrealizedPnl: string;
  realizedPnl: string;
  openPositions: PositionView[];
  closedPositions: PositionView[];
}
