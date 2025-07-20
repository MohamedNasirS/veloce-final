import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useCountdown } from '../hooks/useMockData';
import { useToast } from '../hooks/use-toast';
import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_URL}`);

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const timeLeft = useCountdown(endDate);
  return <span className="text-red-600 font-bold">{timeLeft}</span>;
};

const LiveBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [selectedBid, setSelectedBid] = useState<any | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLiveBids = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchLiveBids();

const handleBidUpdated = (updatedBid: any) => {
  setBids(prev => {
    // If bid is now CLOSED → remove it
    if (updatedBid.status === 'CLOSED') {
      return prev.filter(b => b.id !== updatedBid.id);
    }

    // If bid is already LIVE in list → update it
    const exists = prev.find(b => b.id === updatedBid.id);
    if (exists) {
      return prev.map(b => (b.id === updatedBid.id ? updatedBid : b));
    }

    // If it's a new LIVE bid → add it
    if (updatedBid.status === 'LIVE') {
      return [...prev, updatedBid];
    }

    return prev;
  });
};


    socket.on('bidUpdated', handleBidUpdated);

    return () => {
      socket.off('bidUpdated', handleBidUpdated);
    };
  }, []);

  const handleBidSubmit = async () => {
    if (!selectedBid || !bidAmount || !user) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const updatedBid = await axios.get(`${import.meta.env.VITE_API_URL}/api/bids/${selectedBid.id}`);
      if (amount <= updatedBid.data.currentPrice) {
        toast({
          title: 'Error',
          description: 'Bid too low.',
          variant: 'destructive',
        });
        return;
      }

      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/bids/${selectedBid.id}/bid`, {
        userId: user.id,
        amount,
      });

      setSelectedBid(null);
      setBidAmount('');
      toast({
        title: 'Success',
        description: response.data.message || 'Bid placed.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to place bid.',
        variant: 'destructive',
      });
    }
  };

  const getMyBidAmount = (bid: any) => {
    const my = bid.participants?.find((p: any) => p.userId === user?.id);
    return my ? `₹${my.amount.toLocaleString()}` : '-';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Live Auctions</h1>
          <p className="text-sm text-gray-500">Place your bid on active lots.</p>
        </div>
        <Button onClick={fetchLiveBids} variant="outline" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Bids ({bids.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3">Lot</th>
                  <th>Schedule</th>
                  <th>Time Left</th>
                  <th>Status</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Your Bid</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.id} className="border-b">
                    <td className="p-3">
                      <div className="font-semibold text-blue-600">{bid.lotName}</div>
                      <div className="text-xs text-gray-500">{bid.description}</div>
                    </td>
                    <td className="text-sm text-gray-600">
                      <div>{new Date(bid.startDate).toLocaleString()}</div>
                      <div>{new Date(bid.endDate).toLocaleString()}</div>
                    </td>
                    <td><CountdownTimer endDate={bid.endDate} /></td>
                    <td>
                      <Badge className="bg-green-100 text-green-700">LIVE</Badge>
                    </td>
                    <td className="text-right font-bold">₹{bid.currentPrice.toLocaleString()}</td>
                    <td className="text-right">{getMyBidAmount(bid)}</td>
                    <td className="text-center">
                      {(user?.role === 'recycler' || user?.role === 'aggregator') && (
                        <Button size="sm" onClick={() => setSelectedBid(bid)}>Bid</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-4">Place Bid for {selectedBid.lotName}</h2>
            <div className="mb-2 text-sm text-gray-600">
              Current Highest Bid: ₹{selectedBid.currentPrice.toLocaleString()}
            </div>
            <input
              type="number"
              value={bidAmount}
              min={selectedBid.currentPrice + 1}
              step="1"
              onChange={e => setBidAmount(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder="Enter your bid amount"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleBidSubmit}>Submit</Button>
              <Button variant="outline" onClick={() => setSelectedBid(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBids;
