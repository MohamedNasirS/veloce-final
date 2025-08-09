import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useToast } from '../../hooks/use-toast';
import VendorSuccessRateCard from '../../components/VendorSuccessRateCard';
import axios from 'axios';

interface BidParticipant {
  id: string;
  userId: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface WasteBid {
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
  participants: BidParticipant[];
}

interface BidHistoryEntry {
  userId: string | null;
  amount: number;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const BiddingHistory: React.FC<{ bidId: string }> = ({ bidId }) => {
  const [bids, setBids] = useState<BidHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBiddingHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/history`);
        setBids(response.data.bids); // ✅ use directly
        setLoading(false);
      } catch (err) {
        setError('Failed to load bidding history');
        setLoading(false);
      }
    };
    fetchBiddingHistory();
  }, [bidId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">
        Bidding History for {bids[0]?.userName || 'Bid'}
      </h3>
      <table className="w-full border-collapse mt-2">
        <thead>
          <tr>
            <th className="border p-2 text-left">Bidder</th>
            <th className="border p-2 text-left">Amount (₹)</th>
            <th className="border p-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {bids
            .filter((bid) => bid.userId)
            .map((bid) => (
              <tr key={bid.userId || bid.timestamp}>
                <td className="border p-2">{bid.userName || 'Unknown'}</td>
                <td className="border p-2">{bid.amount.toFixed(2)}</td>
                <td className="border p-2">
                  {new Date(bid.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

const WasteGeneratorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<WasteBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  // 🚀 ENHANCED WebSocket connection for real-time bid updates
  const { isConnected } = useWebSocket({
    autoConnect: user?.role === 'waste_generator',
    onBidStatusChanged: (event) => {
      console.log('[WasteGeneratorDashboard] 📋 IMMEDIATE: Bid status changed received:', event);

      // Only update if it's the current user's bid
      if (event.bid.creatorId === user?.id) {
        setBids(prev => prev.map(bid =>
          bid.id === event.bid.id
            ? { ...bid, status: event.newStatus }
            : bid
        ));

        // Show toast notification for status change
        const statusEmoji = event.newStatus === 'APPROVED' ? '✅' :
          event.newStatus === 'REJECTED' ? '❌' :
            event.newStatus === 'LIVE' ? '🔴' : '📋';

        toast({
          title: `${statusEmoji} Bid ${event.newStatus}`,
          description: `Your bid "${event.bid.lotName}" has been ${event.newStatus.toLowerCase()}`,
          duration: 5000,
        });

        console.log('[WasteGeneratorDashboard] Updated bid status for user bid');
      }
    },
    onBidCreated: (event) => {
      console.log('[WasteGeneratorDashboard] ✨ IMMEDIATE: Bid created confirmation received:', event);

      // Add the newly created bid to the list if it's the current user's bid
      if (event.bid.creatorId === user?.id) {
        setBids(prev => {
          const existingBid = prev.find(bid => bid.id === event.bid.id);
          if (existingBid) return prev;
          return [event.bid, ...prev];
        });

        toast({
          title: '🎉 Bid Created Successfully!',
          description: `Your bid "${event.bid.lotName}" has been submitted for admin approval`,
          duration: 5000,
        });
      }
    },
    onBidUpdated: (event) => {
      console.log('[WasteGeneratorDashboard] 🔄 IMMEDIATE: Bid updated received:', event);

      // Update bid if it belongs to current user
      if (event.bid.creatorId === user?.id) {
        setBids(prev => prev.map(bid =>
          bid.id === event.bid.id ? { ...bid, ...event.bid } : bid
        ));
      }
    },
    onWinnerSelected: (event) => {
      console.log('[WasteGeneratorDashboard] 🏆 IMMEDIATE: Winner selected received:', event);

      // Update bid if it belongs to current user
      if (event.bid.creatorId === user?.id) {
        setBids(prev => prev.map(bid =>
          bid.id === event.bid.id
            ? { ...bid, winnerId: event.winner.id, winner: event.winner }
            : bid
        ));

        toast({
          title: '🏆 Winner Selected!',
          description: `${event.winner.name} has been selected as winner for "${event.bid.lotName}"`,
          duration: 5000,
        });

        console.log('[WasteGeneratorDashboard] Updated bid with winner information');
      }
    },
    onWinnerSelectedForMyBid: (event) => {
      console.log('[WasteGeneratorDashboard] 🎯 IMMEDIATE: Winner selected for my bid received:', event);

      // Update the specific bid with winner information
      setBids(prev => prev.map(bid =>
        bid.id === event.bid.id
          ? { ...bid, winnerId: event.winner.id, winner: event.winner }
          : bid
      ));

      // Show special notification for waste generator's own bid
      toast({
        title: '🎯 Winner Selected for Your Bid!',
        description: `${event.winner.name} from ${event.winner.company} has been selected as winner for "${event.bid.lotName}"`,
        duration: 7000,
      });

      console.log('[WasteGeneratorDashboard] Updated my bid with winner information');
    }
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserBids();
    }
  }, [user]);

  const fetchUserBids = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/creator/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setBids(data);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeBids = bids.filter((bid) => bid.status === 'APPROVED' || bid.status === 'LIVE');
  const closedBids = bids.filter((bid) => bid.status === 'CLOSED');
  const totalRevenue = closedBids.reduce((sum, bid) => sum + bid.currentPrice, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'LIVE':
        return 'bg-orange-100 text-orange-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'LIVE':
        return 'Active';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* WebSocket Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Waste Generator Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{bids.length}</CardTitle>
            <CardDescription>Total Bids</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-orange-600">{activeBids.length}</CardTitle>
            <CardDescription>Active Auctions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{closedBids.length}</CardTitle>
            <CardDescription>Completed</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</CardTitle>
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
        </Card>
        {/* Vendor Success Rate Card */}
        <VendorSuccessRateCard userId={user?.id} minimal={true} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your waste listings and auctions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/dashboard/waste_generator/create-bid">
              <Button className="w-full h-20 text-lg">➕ Create New Bid</Button>
            </Link>
            <Link to="/dashboard/waste_generator/my-bids">
              <Button variant="outline" className="w-full h-20 text-lg">📋 View My Bids</Button>
            </Link>
            <Link to="/dashboard/waste_generator/upload-documents">
              <Button variant="outline" className="w-full h-20 text-lg">📄 Upload Documents</Button>
            </Link>
            <Link to="/dashboard/waste_generator/gate-passes">
              <Button variant="outline" className="w-full h-20 text-lg">🎫 Gate Passes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bids</CardTitle>
          <CardDescription>Your latest waste listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bids.slice(0, 5).map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedBidId(bid.id === selectedBidId ? null : bid.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{bid.lotName}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">{bid.description}</p>
                  <p className="text-sm text-gray-500">
                    {bid.location} • {bid.quantity} {bid.unit}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="secondary" className={getStatusColor(bid.status)}>
                    {getStatusLabel(bid.status)}
                  </Badge>
                  <p className="text-lg font-semibold">₹{bid.currentPrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{bid.participants.length} bid(s)</p>
                  {bid.status === 'CLOSED' && (
                    <Link to={`/dashboard/waste_generator/select-winner/${bid.id}`}>
                      <Button variant="outline" size="sm">
                        Select Winner
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {selectedBidId && <BiddingHistory bidId={selectedBidId} />}
          </div>

          {bids.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
              <p className="text-gray-500 mb-4">Create your first waste listing to get started</p>
              <Link to="/dashboard/waste_generator/create-bid">
                <Button>Create Your First Bid</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteGeneratorDashboard;