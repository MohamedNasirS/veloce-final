
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useMockBids } from '../../hooks/useMockData';
import { useAuth } from '../../contexts/AuthContext';

const WasteGeneratorDashboard = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  
  const myBids = bids.filter(bid => bid.createdBy === user?.id);
  const activeBids = myBids.filter(bid => bid.status === 'in-progress');
  const closedBids = myBids.filter(bid => bid.status === 'closed');
  const totalRevenue = closedBids.reduce((sum, bid) => sum + bid.currentPrice, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{myBids.length}</CardTitle>
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
            <CardTitle className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</CardTitle>
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your waste listings and auctions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/dashboard/waste-generator/create-bid">
              <Button className="w-full h-20 text-lg">
                ➕ Create New Bid
              </Button>
            </Link>
            <Link to="/dashboard/waste-generator/my-bids">
              <Button variant="outline" className="w-full h-20 text-lg">
                📋 View My Bids
              </Button>
            </Link>
            <Link to="/dashboard/waste-generator/gate-passes">
              <Button variant="outline" className="w-full h-20 text-lg">
                🎫 Gate Passes
              </Button>
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
          <div className="space-y-4">
            {myBids.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold">{bid.lotName}</h3>
                  <p className="text-sm text-gray-600">{bid.description}</p>
                  <p className="text-sm text-gray-500">{bid.location}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="secondary" 
                    className={
                      bid.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                      bid.status === 'closed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {bid.status === 'in-progress' ? 'Active' : 
                     bid.status === 'closed' ? 'Closed' : 
                     bid.status}
                  </Badge>
                  <p className="text-lg font-semibold mt-1">${bid.currentPrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{bid.bids.length} bid(s)</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteGeneratorDashboard;
