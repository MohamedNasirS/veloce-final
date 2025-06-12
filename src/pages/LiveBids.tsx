
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMockBids, useCountdown } from '../hooks/useMockData';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const timeLeft = useCountdown(endDate);
  return (
    <span className="text-red-600 font-bold">{timeLeft}</span>
  );
};

const LiveBids = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  const activeBids = bids.filter(bid => bid.status === 'in-progress');

  const handleBidClick = (bidId: string) => {
    if (user?.role === 'recycler' || user?.role === 'aggregator') {
      setSelectedBid(bidId);
    }
  };

  const getMyBid = (bidEntry: any[]) => {
    if (!user) return null;
    return bidEntry.find(bid => bid.bidderId === user.id);
  };

  const getMyRank = (bidEntry: any[]) => {
    if (!user) return '-';
    const myBid = bidEntry.find(bid => bid.bidderId === user.id);
    return myBid ? myBid.rank : '-';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Bidding</h1>
        <p className="text-gray-600">Active auctions available for bidding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Auctions ({activeBids.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Lot Name</th>
                  <th className="text-left p-3 font-semibold">Start/End Date</th>
                  <th className="text-left p-3 font-semibold">Remaining Time</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Current Amount</th>
                  <th className="text-right p-3 font-semibold">My Bid</th>
                  <th className="text-center p-3 font-semibold">My Rank</th>
                  <th className="text-center p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeBids.map((bid) => {
                  const myBid = getMyBid(bid.bids);
                  const myRank = getMyRank(bid.bids);
                  
                  return (
                    <tr key={bid.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div>
                          <button
                            onClick={() => handleBidClick(bid.id)}
                            className="font-semibold text-blue-600 hover:text-blue-800 text-left"
                          >
                            {bid.lotName}
                          </button>
                          <div className="text-sm text-gray-500">{bid.description}</div>
                          <div className="text-sm text-gray-500">{bid.location}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Start: {new Date(bid.startDate).toLocaleDateString()}</div>
                          <div>End: {new Date(bid.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <CountdownTimer endDate={bid.endDate} />
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Auction in progress
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ${bid.currentPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {myBid ? `$${myBid.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${myRank === 1 ? 'text-green-600' : myRank === 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {myRank}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {(user?.role === 'recycler' || user?.role === 'aggregator') && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleBidClick(bid.id)}
                          >
                            Bid
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {activeBids.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active auctions at the moment. Check back later!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bidding Modal/Form would go here */}
      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Place Bid</h3>
            <p className="text-gray-600 mb-4">
              Enter your bid amount for {bids.find(b => b.id === selectedBid)?.lotName}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Highest Bid: ${bids.find(b => b.id === selectedBid)?.currentPrice.toLocaleString()}
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Enter your bid amount"
                  min={bids.find(b => b.id === selectedBid)?.currentPrice}
                />
              </div>
              <div className="flex space-x-3">
                <Button className="flex-1">Submit Bid</Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedBid(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBids;
