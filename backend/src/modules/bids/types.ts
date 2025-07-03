export interface BidHistory {
  bidId: string;
  bids: Array<{
    userId: string | null;
    userName: string | null;
    amount: number;
    timestamp: string;
  }>;
  winnerId?: string;
  gatePassPath?: string;
}

export interface WasteBid {
  id: string;
  lotName: string;
  description: string;
  wasteType: string;
  quantity: number;
  unit: string;
  location: string;
  basePrice: number;
  currentPrice: number;
  status: string;
  endDate: string;
  creator: {
    id?: string;
    name: string;
    company: string;
  };
  winner?: {
    id: string;
    name: string;
    company: string;
  };
  gatePassPath?: string | null;
  images: Array<{
    id: string;
    bidId?: string;
    path?: string;
  }>;
  bidEntries: Array<{
    amount: number;
    bidderId: string;
    bidder: {
      name: string;
      company: string;
    };
  }>;
  _count: {
    bidEntries: number;
  };
}