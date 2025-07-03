export interface BidHistory {
  bidId: string;
  bids: Array<{
    userId: string | null;
    userName: string | null;
    amount: number;
    timestamp: string;
  }>;
  winnerId?: string;
}