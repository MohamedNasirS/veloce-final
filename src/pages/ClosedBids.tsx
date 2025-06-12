
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMockBids } from '../hooks/useMockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const ClosedBids = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();

  const closedBids = bids.filter(bid => bid.status === 'closed');

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Closed Bids</h1>
        <p className="text-gray-600">View results of completed auctions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auction Results ({closedBids.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Lot Name</th>
                  <th className="text-left p-3 font-semibold">End Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Final Price</th>
                  <th className="text-right p-3 font-semibold">My Bid</th>
                  <th className="text-center p-3 font-semibold">My Rank</th>
                  <th className="text-left p-3 font-semibold">Winner</th>
                </tr>
              </thead>
              <tbody>
                {closedBids.map((bid) => {
                  const myBid = getMyBid(bid.bids);
                  const myRank = getMyRank(bid.bids);
                  const winner = bid.bids.find(b => b.rank === 1);
                  
                  return (
                    <tr key={bid.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div>
                          <div className="font-semibold">{bid.lotName}</div>
                          <div className="text-sm text-gray-500">{bid.description}</div>
                          <div className="text-sm text-gray-500">{bid.location}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(bid.endDate).toLocaleDateString()}
                          <br />
                          <span className="text-gray-500">
                            {new Date(bid.endDate).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          Closed
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ${bid.currentPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {myBid ? `$${myBid.amount.toLocaleString()}` : (
                          <span className="text-gray-400">No bid</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${
                          myRank === 1 ? 'text-green-600' : 
                          myRank === 2 ? 'text-orange-600' : 
                          myRank === 3 ? 'text-yellow-600' : 
                          'text-gray-600'
                        }`}>
                          {myRank !== '-' ? `#${myRank}` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{winner?.bidderName}</div>
                          <div className="text-gray-500">${winner?.amount.toLocaleString()}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{closedBids.length}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {closedBids.filter(bid => getMyRank(bid.bids) === 1).length}
                </div>
                <div className="text-sm text-gray-600">Won Auctions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {closedBids.filter(bid => getMyBid(bid.bids)).length}
                </div>
                <div className="text-sm text-gray-600">Participated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${closedBids.reduce((sum, bid) => {
                    const myBid = getMyBid(bid.bids);
                    return sum + (myBid && myBid.rank === 1 ? myBid.amount : 0);
                  }, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Won Value</div>
              </div>
            </div>
          </div>
          
          {closedBids.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No closed auctions found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClosedBids;
