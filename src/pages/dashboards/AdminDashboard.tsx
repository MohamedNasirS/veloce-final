  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
  import { Button } from '../../components/ui/button';
  import { Badge } from '../../components/ui/badge';

  interface WasteBid {
    id: string;
    lotName: string;
    description: string;
    wasteType: string;
    quantity: number;
    unit: string;
    location: string;
    currentPrice: number;
    status: string;
    createdAt: string;
    creator: {
      name: string;
      company: string;
    };
    _count: {
      bidEntries: number;
    };
  }

  const AdminDashboard = () => {
    const [bids, setBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchAllBids();
    }, []);

    const fetchAllBids = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/bids');
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

    const totalBids = bids.length;
    const activeBids = bids.filter(bid => bid.status === 'in-progress' || bid.status === 'published').length;
    const closedBids = bids.filter(bid => bid.status === 'closed').length;
    const pendingApprovals = 3; // Mock data for now
    const totalUsers = 25; // Mock data for now

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
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{totalUsers}</CardTitle>
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-orange-600">{pendingApprovals}</CardTitle>
              <CardDescription>Pending Approvals</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">{totalBids}</CardTitle>
              <CardDescription>Total Bids</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">{activeBids}</CardTitle>
              <CardDescription>Active Auctions</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
            <CardDescription>Manage platform operations and oversight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/dashboard/admin/users">
                <Button className="w-full h-20 text-lg">
                  👥 Manage Users
                </Button>
              </Link>
              <Link to="/dashboard/admin/bids">
                <Button variant="outline" className="w-full h-20 text-lg">
                  📋 Review Bids
                </Button>
              </Link>
              <Link to="/dashboard/admin/logs">
                <Button variant="outline" className="w-full h-20 text-lg">
                  📜 Audit Logs
                </Button>
              </Link>
              <Link to="/dashboard/admin/documents">
                <Button variant="outline" className="w-full h-20 text-lg">
                  📁 Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bid Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Published:</span>
                  <span className="font-medium">{bids.filter(b => b.status === 'published').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="font-medium">{bids.filter(b => b.status === 'in-progress').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span className="font-medium">{closedBids}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waste Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(new Set(bids.map(b => b.wasteType))).slice(0, 5).map(type => (
                  <div key={type} className="flex justify-between">
                    <span className="text-sm">{type}:</span>
                    <span className="font-medium">{bids.filter(b => b.wasteType === type).length}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active Bids:</span>
                  <span className="font-medium">
                    ${bids.filter(b => b.status !== 'closed').reduce((sum, b) => sum + b.currentPrice, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium">
                    ${bids.filter(b => b.status === 'closed').reduce((sum, b) => sum + b.currentPrice, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent System Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest platform events and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bids.slice(0, 8).map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bid.lotName}</h3>
                    <p className="text-sm text-gray-600">{bid.wasteType} • {bid.quantity} {bid.unit}</p>
                    <p className="text-sm text-gray-500">
                      {bid.creator.company} • {bid.location} • {bid._count.bidEntries} bid(s)
                    </p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(bid.status)}
                    >
                      {getStatusLabel(bid.status)}
                    </Badge>
                    <p className="text-lg font-semibold mt-1">${bid.currentPrice.toLocaleString()}</p>
                    <div className="flex gap-1 mt-2">
                      <Link to={`/bid/${bid.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          
            {bids.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
                <p className="text-gray-500">System activity will appear here once users start creating bids</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Items requiring administrative review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock pending approvals */}
              {[
                { type: 'User Registration', name: 'ABC Recycling Corp.', time: '2 hours ago', id: '1' },
                { type: 'Bid Approval', name: 'Plastic Waste Lot B2', time: '4 hours ago', id: '2' },
                { type: 'Document Verification', name: 'Gate Pass #GP001', time: '1 day ago', id: '3' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Pending
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">{item.time}</p>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  export default AdminDashboard;
