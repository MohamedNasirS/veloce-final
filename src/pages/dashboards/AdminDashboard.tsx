import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import DocumentUpdateMonitor from '../../components/DocumentUpdateMonitor';
import VendorSuccessRateCard from '../../components/VendorSuccessRateCard';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingBids, setPendingBids] = useState<any[]>([]);
  const [closedBids, setClosedBids] = useState<any[]>([]);

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bidsRes, usersRes, pendingBidsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/bids`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/bids/pending`),
        ]);
        setBids(bidsRes.data);
        setUsers(usersRes.data);
        setPendingBids(pendingBidsRes.data);
        setClosedBids(bidsRes.data.filter((bid: any) => bid.status === 'CLOSED' && !bid.winnerId));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // 🚀 ENHANCED WebSocket connection using custom hook
  const { isConnected } = useWebSocket({
    autoConnect: user?.role === 'admin',
    onNewBidCreated: (event) => {
      console.log('[AdminDashboard] 🆕 IMMEDIATE: New bid created received:', event);

      const newBid = event.bid;

      // Update all bids list
      setBids(prev => {
        const existingBid = prev.find(bid => bid.id === newBid.id);
        if (existingBid) return prev;
        return [newBid, ...prev];
      });

      // If the new bid is pending, add it to pending bids
      if (newBid.status === 'PENDING') {
        setPendingBids(prev => {
          const existingBid = prev.find(bid => bid.id === newBid.id);
          if (existingBid) return prev;
          return [newBid, ...prev];
        });
      }

      console.log('[AdminDashboard] Dashboard statistics updated with new bid');
    },
    onBidStatusChanged: (event) => {
      console.log('[AdminDashboard] 📋 IMMEDIATE: Bid status changed received:', event);

      const { bid, oldStatus, newStatus } = event;

      // Update all bids list
      setBids(prev => prev.map(b =>
        b.id === bid.id ? { ...b, status: newStatus } : b
      ));

      // Update pending bids based on status change
      if (oldStatus === 'PENDING' && newStatus !== 'PENDING') {
        // Remove from pending bids
        setPendingBids(prev => prev.filter(b => b.id !== bid.id));
      } else if (oldStatus !== 'PENDING' && newStatus === 'PENDING') {
        // Add to pending bids
        setPendingBids(prev => {
          const existingBid = prev.find(b => b.id === bid.id);
          if (existingBid) return prev;
          return [bid, ...prev];
        });
      }

      // Update closed bids for winner selection
      if (newStatus === 'CLOSED' && !bid.winnerId) {
        setClosedBids(prev => {
          const existingBid = prev.find(b => b.id === bid.id);
          if (existingBid) return prev;
          return [bid, ...prev];
        });
      } else if (oldStatus === 'CLOSED' && newStatus !== 'CLOSED') {
        setClosedBids(prev => prev.filter(b => b.id !== bid.id));
      }

      console.log('[AdminDashboard] Dashboard statistics updated with status change');
    },
    onBidUpdated: (event) => {
      console.log('[AdminDashboard] 🔄 IMMEDIATE: Bid updated received:', event);

      setBids(prev => prev.map(b =>
        b.id === event.bid.id ? { ...b, ...event.bid } : b
      ));
    }
  });

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/dashboard/admin/users">
              <Button className="w-full h-20 text-lg">Manage Users</Button>
            </Link>
            <Link to="/dashboard/admin/bids">
              <Button variant="outline" className="w-full h-20 text-lg">Review Bids</Button>
            </Link>
            <Link to="/dashboard/admin/gate-passes">
              <Button variant="outline" className="w-full h-20 text-lg">Gate Passes</Button>
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

      {/* Closed Bids for Winner Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Closed Bids Awaiting Winner Selection</CardTitle>
          <CardDescription>Bids that need a winner to be selected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {closedBids.map((bid: any) => (
              <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold">{bid.lotName}</h3>
                  <p className="text-sm text-gray-600">{bid.creator?.company}</p>
                  <p className="text-sm text-gray-500">{bid.wasteType} • {bid.quantity} {bid.unit}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Closed</Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(bid.endDate).toLocaleString()}
                  </p>
                  <Link to={`/dashboard/admin/select-winner/${bid.id}`}>
                    <Button variant="outline" size="sm">Select Winner</Button>
                  </Link>
                </div>
              </div>
            ))}
            {closedBids.length === 0 && (
              <div className="text-center text-gray-500">No closed bids awaiting winner selection.</div>
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
                  <p className="text-lg font-semibold mt-1">₹{bid.currentPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendorSuccessRateCard showTopPerformers={true} limit={10} />
        <VendorSuccessRateCard showStats={true} />
      </div>

      {/* Document Update Monitor */}
      <DocumentUpdateMonitor />
    </div>
  );
};

export default AdminDashboard;