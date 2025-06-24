  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
  import { Button } from '../../components/ui/button';
  import { Badge } from '../../components/ui/badge';
  import { useAuth } from '../../contexts/AuthContext';

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
    _count: {
      bidEntries: number;
    };
  }

  const WasteGeneratorDashboard = () => {
    const { user } = useAuth();
    const [bids, setBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user?.id) {
        fetchUserBids();
      }
    }, [user]);

    const fetchUserBids = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/bids/user/${user?.id}`);
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

    const activeBids = bids.filter(bid => bid.status === 'in-progress' || bid.status === 'published');
    const closedBids = bids.filter(bid => bid.status === 'closed');
    const totalRevenue = closedBids.reduce((sum, bid) => sum + bid.currentPrice, 0);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'published': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-orange-100 text-orange-800';
        case 'closed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'published': return 'Published';
        case 'in-progress': return 'Active';
        case 'closed': return 'Closed';
        default: return status;
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              {bids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bid.lotName}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{bid.description}</p>
                    <p className="text-sm text-gray-500">{bid.location} • {bid.quantity} {bid.unit}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(bid.status)}
                    >
                      {getStatusLabel(bid.status)}
                    </Badge>
                    <p className="text-lg font-semibold mt-1">${bid.currentPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{bid._count.bidEntries} bid(s)</p>
                  </div>
                </div>
              ))}
            </div>
            
            {bids.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
                <p className="text-gray-500 mb-4">Create your first waste listing to get started</p>
                <Link to="/dashboard/waste-generator/create-bid">
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
