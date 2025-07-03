import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { WasteBid } from '../../types';

interface BidWithGatePass extends WasteBid {
  gatePassPath?: string | null;
}

const GatePassList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<BidWithGatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchClosedBids();
    }
  }, [user]);

  const fetchClosedBids = async () => {
    try {
      const response = await fetch(`http://localhost:3001/bids/creator/${user?.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const closedBids = data.filter((bid: WasteBid) => bid.status === 'CLOSED' && bid.winnerId);
      const bidsWithGatePass = await Promise.all(
        closedBids.map(async (bid: BidWithGatePass) => {
          try {
            const gatePassResponse = await fetch(`http://localhost:3001/bids/${bid.id}/gate-pass?userId=${user?.id}`);
            if (gatePassResponse.ok) {
              const { gatePassPath } = await gatePassResponse.json();
              return { ...bid, gatePassPath };
            }
          } catch (error) {
            console.error(`Error fetching gate pass for bid ${bid.id}:`, error);
          }
          return { ...bid, gatePassPath: null };
        })
      );
      setBids(bidsWithGatePass);
      console.log('Fetched closed bids with winners and gate pass status:', bidsWithGatePass);
    } catch (error) {
      console.error('Error fetching closed bids:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch closed bids.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return filter === 'pending' && !bid.gatePassPath;
  });

  const stats = {
    total: bids.length,
    pending: bids.filter(bid => !bid.gatePassPath).length,
    uploaded: bids.filter(bid => bid.gatePassPath).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading closed bids...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Closed Bids</h1>
        <Link to="/dashboard/waste_generator">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            <CardDescription>Closed Bids with Winners</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pending}</CardTitle>
            <CardDescription>Pending Gate Passes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{stats.uploaded}</CardTitle>
            <CardDescription>Uploaded Gate Passes</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Closed Bid Management</CardTitle>
            <div className="flex gap-2">
              {['all', 'pending'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{bid.lotName || 'Unnamed Lot'}</h3>
                    <Badge
                      variant="secondary"
                      className={bid.gatePassPath ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {bid.gatePassPath ? 'Gate Pass Uploaded' : 'Gate Pass Pending'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Winner:</span> {bid.winner?.name || 'Not selected'}
                    </div>
                    <div>
                      <span className="font-medium">Company:</span> {bid.winner?.company || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {bid.winner?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ₹{(bid.currentPrice || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/dashboard/waste_generator/gate-passes/${bid.id}`}>
                    <Button variant="outline" size="sm">
                      Manage Gate Pass
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {filteredBids.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No closed bids with winners found' : 'No pending gate passes'}
                </h3>
                <p className="text-gray-500 mb-4">
                  Closed bids with selected winners will appear here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GatePassList;