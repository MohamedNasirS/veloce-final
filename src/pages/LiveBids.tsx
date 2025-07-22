import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useCountdown } from '../hooks/useMockData';
import { useToast } from '../hooks/use-toast';
import { io, Socket } from 'socket.io-client';

// Define a type for our bid object for better type safety
interface Bid {
  id: string;
  lotName: string;
  description: string;
  endDate: string;
  startDate: string;
  status: string;
  currentPrice: number;
  participants: { userId: string; amount: number }[];
}

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const timeLeft = useCountdown(endDate);
  return <span className="text-red-600 font-bold">{timeLeft}</span>;
};

const LiveBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const socket: Socket = io(`${import.meta.env.VITE_API_URL}`);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server!');
    });

    const fetchLiveBids = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bids/approved`);
        const liveBids = res.data.filter((b: any) => b.status === 'LIVE');
        setBids(liveBids);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch live bids.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLiveBids();

    const handleBidUpdated = (updatedBid: Bid) => {
      console.log('Received bid update:', updatedBid);
      setBids(prevBids => {
        const existingBidIndex = prevBids.findIndex(b => b.id === updatedBid.id);

        if (updatedBid.status !== 'LIVE') {
          return prevBids.filter(b => b.id !== updatedBid.id);
        }

        if (existingBidIndex !== -1) {
          const newBids = [...prevBids];
          newBids[existingBidIndex] = updatedBid;
          return newBids;
        }
        
        return [...prevBids, updatedBid];
      });
    };

    socket.on('bidUpdated', handleBidUpdated);

    return () => {
      console.log('Disconnecting WebSocket.');
      socket.off('bidUpdated', handleBidUpdated);
      socket.disconnect();
    };
  }, [toast]);

  const handleBidSubmit = async () => {
    if (!selectedBid || !bidAmount || !user) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ title: 'Invalid Amount', description: 'Please enter a valid bid amount.', variant: 'destructive' });
        return;
    }

    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/bids/${selectedBid.id}/bid`, {
        userId: user.id,
        amount,
      });

      setSelectedBid(null);
      setBidAmount('');
      toast({
        title: 'Success',
        description: response.data.message || 'Bid placed successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error Placing Bid',
        description: err.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const getMyBidAmount = (bid: Bid) => {
    const myBid = bid.participants?.find((p) => p.userId === user?.id);
    return myBid ? `₹${myBid.amount.toLocaleString()}` : '—';
  };

  // --- NEW FUNCTION TO CALCULATE RANK ---
  const getMyRank = (bid: Bid) => {
    if (!user || !bid.participants || bid.participants.length === 0) {
      return '—';
    }

    const sortedParticipants = [...bid.participants].sort((a, b) => b.amount - a.amount);
    const myIndex = sortedParticipants.findIndex(p => p.userId === user.id);

    if (myIndex === -1) {
      return '—'; // User has not bid
    }

    const rank = myIndex + 1;
    const j = rank % 10, k = rank % 100;
    if (j === 1 && k !== 11) return `${rank}st`;
    if (j === 2 && k !== 12) return `${rank}nd`;
    if (j === 3 && k !== 13) return `${rank}rd`;
    return `${rank}th`;
  };
  // ------------------------------------

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Live Auctions</h1>
          <p className="text-sm text-gray-500">Place your bid on active lots. Updates are in real-time.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Bids ({bids.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <p>Loading live bids...</p>
            ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Lot Details</th>
                  <th className="text-left p-3 font-semibold">Time Left</th>
                  <th className="text-right p-3 font-semibold">Current Price</th>
                  <th className="text-right p-3 font-semibold">Your Bid</th>
                  {/* --- NEW RANK COLUMN HEADER --- */}
                  <th className="text-right p-3 font-semibold">Your Rank</th>
                  {/* ----------------------------- */}
                  <th className="text-center p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-semibold text-blue-600">{bid.lotName}</div>
                      <div className="text-xs text-gray-500">{bid.description}</div>
                    </td>
                    <td className="p-3">
                        <CountdownTimer endDate={bid.endDate} />
                    </td>
                    <td className="text-right p-3 font-bold">₹{bid.currentPrice.toLocaleString()}</td>
                    <td className="text-right p-3">{getMyBidAmount(bid)}</td>
                    {/* --- NEW RANK COLUMN CELL --- */}
                    <td className="text-right p-3 font-semibold">{getMyRank(bid)}</td>
                    {/* --------------------------- */}
                    <td className="text-center p-3">
                      {(user?.role === 'recycler' || user?.role === 'aggregator') && (
                        <Button size="sm" onClick={() => setSelectedBid(bid)}>Place Bid</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {!loading && bids.length === 0 && (
                <p className="text-center py-8 text-gray-500">There are no live bids at the moment.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-4">Place Bid for {selectedBid.lotName}</h2>
            <div className="mb-4 text-sm text-gray-600">
              Current Highest Bid: <span className="font-bold">₹{selectedBid.currentPrice.toLocaleString()}</span>
            </div>
            <input
              type="number"
              value={bidAmount}
              min={selectedBid.currentPrice + 1}
              step="1"
              onChange={e => setBidAmount(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder={`Enter amount higher than ₹${selectedBid.currentPrice.toLocaleString()}`}
            />
            <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setSelectedBid(null)}>Cancel</Button>
              <Button onClick={handleBidSubmit}>Submit Bid</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBids;