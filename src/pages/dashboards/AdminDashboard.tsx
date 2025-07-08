import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import axios from 'axios';

const AdminDashboard = () => {
  const [bids, setBids] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingBids, setPendingBids] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://147.93.27.172:3001/api/bids').then(res => setBids(res.data)).catch(console.error);
    axios.get('http://147.93.27.172:3001/api/users').then(res => setUsers(res.data)).catch(console.error);
    axios.get('http://147.93.27.172:3001/api/bids/pending').then(res => setPendingBids(res.data)).catch(console.error);
  }, []);

  const totalUsers = users.length;
  const totalBids = bids.length;
  const activeBids = bids.filter(bid => bid.status === 'LIVE').length;
  const pendingApprovals = pendingBids.length;

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
              <Button className="w-full h-20 text-lg">👥 Manage Users</Button>
            </Link>
            <Link to="/dashboard/admin/bids">
              <Button variant="outline" className="w-full h-20 text-lg">📋 Review Bids</Button>
            </Link>
            <Link to="/dashboard/admin/logs">
              <Button variant="outline" className="w-full h-20 text-lg">📜 Audit Logs</Button>
            </Link>
            <Link to="/dashboard/admin/documents">
              <Button variant="outline" className="w-full h-20 text-lg">📁 Documents</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Bids</CardTitle>
          <CardDescription>Items requiring administrative review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingBids.map((bid: any) => (
              <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold">{bid.lotName}</h3>
                  <p className="text-sm text-gray-600">{bid.creator?.company}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(bid.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {pendingBids.length === 0 && (
              <div className="text-center text-gray-500">No pending bids found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
                  <p className="text-sm text-gray-600">{bid.participants?.length || 0} bids received</p>
                  <p className="text-sm text-gray-500">{bid.location}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="secondary" 
                    className={
                      bid.status === 'LIVE' ? 'bg-green-100 text-green-800' :
                      bid.status === 'CLOSED' ? 'bg-gray-300 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {bid.status}
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
