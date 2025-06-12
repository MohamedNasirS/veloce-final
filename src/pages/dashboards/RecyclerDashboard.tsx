
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useMockBids } from '../../hooks/useMockData';
import { useAuth } from '../../contexts/AuthContext';

const RecyclerDashboard = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  
  const allBidEntries = bids.flatMap(bid => bid.bids);
  const myBids = allBidEntries.filter(bidEntry => bidEntry.bidderId === user?.id);
  const wonBids = myBids.filter(bid => bid.rank === 1);
  const activeBids = bids.filter(bid => 
    bid.status === 'in-progress' && 
    bid.bids.some(b => b.bidderId === user?.id)
  );
  
  const totalWonValue = wonBids.reduce((sum, bid) => sum + bid.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{myBids.length}</CardTitle>
            <CardDescription>Total Bids Placed</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-orange-600">{activeBids.length}</CardTitle>
            <CardDescription>Active Participations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{wonBids.length}</CardTitle>
            <CardDescription>Won Auctions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">${totalWonValue.toLocaleString()}</CardTitle>
            <CardDescription>Total Won Value</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Participate in auctions and manage your bids</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/live-bids">
              <Button className="w-full h-20 text-lg">
                🔴 View Live Bids
              </Button>
            </Link>
            <Link to={`/dashboard/${user?.role}/participated`}>
              <Button variant="outline" className="w-full h-20 text-lg">
                📊 My Participations
              </Button>
            </Link>
            <Link to={`/dashboard/${user?.role}/upload-proof`}>
              <Button variant="outline" className="w-full h-20 text-lg">
                📸 Upload Documents
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bid Activity</CardTitle>
          <CardDescription>Your latest auction participations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myBids.slice(0, 5).map((bidEntry) => {
              const bid = bids.find(b => b.id === bidEntry.bidId);
              if (!bid) return null;
              
              return (
                <div key={bidEntry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bid.lotName}</h3>
                    <p className="text-sm text-gray-600">{bid.description}</p>
                    <p className="text-sm text-gray-500">{bid.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={
                        bidEntry.rank === 1 ? 'bg-green-100 text-green-800' :
                        bidEntry.rank === 2 ? 'bg-orange-100 text-orange-800' :
                        bidEntry.rank === 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      Rank #{bidEntry.rank}
                    </Badge>
                    <p className="text-lg font-semibold mt-1">${bidEntry.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {bid.status === 'in-progress' ? 'Active' : 'Closed'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecyclerDashboard;
