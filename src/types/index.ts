
export interface User {
  id: string;
  email: string;
  role: 'waste_generator' | 'recycler' | 'aggregator' | 'admin';
  name: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Bid {
  id: string;
  lotName: string;
  description: string;
  wasteType: string;
  quantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  currentPrice: number;
  status: 'draft' | 'published' | 'in-progress' | 'closed';
  createdBy: string;
  location: string;
  bids: BidEntry[];
}

export interface BidEntry {
  id: string;
  bidId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
  rank: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}
