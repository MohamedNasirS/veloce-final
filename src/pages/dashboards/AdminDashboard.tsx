
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useMockBids } from '../../hooks/useMockData';

const AdminDashboard = () => {
  const { bids } = useMockBids();
  
  const totalBids = bids.length;
  const activeBids = bids.filter(bid => bid.status === 'in-progress').length;
  const pendingApprovals = 3; // Mock data
  const totalUsers = 25; // Mock data

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
              { type: 'User Registration', name: 'ABC Recycling Corp.', time: '2 hours ago' },
              { type: 'Bid Approval', name: 'Plastic Waste Lot B2', time: '4 hours ago' },
              { type: 'Document Verification', name: 'Gate Pass #GP001', time: '1 day ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.type}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Pending
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest platform events and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bids.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold">{bid.lotName}</h3>
                  <p className="text-sm text-gray-600">{bid.bids.length} bids received</p>
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
