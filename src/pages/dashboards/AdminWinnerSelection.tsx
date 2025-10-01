
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface BidParticipant {
  id: string;
  userId: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

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
  endDate: string;
  winnerId?: string | null;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  winner?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  } | null;
  participants: BidParticipant[];
  _count: {
    participants: number;
  };
}

interface WinnerSelectionStats {
  totalClosedBids: number;
  pendingWinnerSelection: number;
  completedWinnerSelection: number;
  adminSelected: number;
  wasteGeneratorSelected: number;
  completionRate: number;
}

const AdminWinnerSelection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<WasteBid[]>([]);
  const [stats, setStats] = useState<WinnerSelectionStats | null>(null);
  const [selectedWinners, setSelectedWinners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in to access winner selection.',
        variant: 'destructive',
      });
      return;
    }

    if (user.role !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can access winner selection.',
        variant: 'destructive',
      });
      return;
    }

    fetchWinnerSelectionData();
    fetchWinnerSelectionStats();
    setupWebSocket();
  }, [user, toast]);

  const setupWebSocket = () => {
    if (!user) return;

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server for winner selection');
      setIsConnected(true);

      newSocket.emit('authenticate', {
        userId: user.id,
        userRole: user.role,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for winner selection events
    newSocket.on('winnerSelected', (data) => {
      console.log('Winner selected event received:', data);

      // Update the bids list with the new winner
      setBids(prevBids =>
        prevBids.map(bid =>
          bid.id === data.bid.id
            ? { ...bid, winnerId: data.winner.id, winner: data.winner }
            : bid
        )
      );

      // Update stats
      fetchWinnerSelectionStats();

      toast({
        title: 'Winner Selected',
        description: `${data.winner.name} has been selected as winner for "${data.bid.lotName}"`,
      });
    });

    newSocket.on('winnerSelectedAdmin', (data) => {
      console.log('Admin winner selection event received:', data);

      // Update the bids list
      setBids(prevBids =>
        prevBids.map(bid =>
          bid.id === data.bid.id
            ? { ...bid, winnerId: data.winner.id, winner: data.winner }
            : bid
        )
      );

      // Update stats
      fetchWinnerSelectionStats();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  };

  const fetchWinnerSelectionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/winner-selection`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setBids(response.data.bids);
      console.log('Fetched winner selection data:', response.data);
    } catch (error: any) {
      console.error('Error fetching winner selection data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch winner selection data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWinnerSelectionStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/winner-selection/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching winner selection stats:', error);
    }
  };

  const handleWinnerSelection = (bidId: string, winnerId: string) => {
    setSelectedWinners(prev => ({ ...prev, [bidId]: winnerId }));
  };

  const confirmWinnerSelection = async (bidId: string) => {
    const winnerId = selectedWinners[bidId];
    if (!winnerId) {
      toast({
        title: 'Error',
        description: 'Please select a winner first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/winner-selection/bid/${bidId}/select-winner`,
        { winnerId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Remove from selected winners
      setSelectedWinners(prev => {
        const newState = { ...prev };
        delete newState[bidId];
        return newState;
      });

      toast({
        title: 'Success',
        description: 'Winner selected successfully!',
      });

      // Refresh data
      fetchWinnerSelectionData();
      fetchWinnerSelectionStats();
    } catch (error: any) {
      console.error('Error selecting winner:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to select winner.',
        variant: 'destructive',
      });
    }
  };

  const changeWinner = async (bidId: string) => {
    const winnerId = selectedWinners[bidId];
    if (!winnerId) {
      toast({
        title: 'Error',
        description: 'Please select a new winner first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/admin/winner-selection/bid/${bidId}/change-winner`,
        { winnerId, reason: 'Admin override' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Remove from selected winners
      setSelectedWinners(prev => {
        const newState = { ...prev };
        delete newState[bidId];
        return newState;
      });

      toast({
        title: 'Success',
        description: 'Winner changed successfully!',
      });

      // Refresh data
      fetchWinnerSelectionData();
      fetchWinnerSelectionStats();
    } catch (error: any) {
      console.error('Error changing winner:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change winner.',
        variant: 'destructive',
      });
    }
  };

  const filteredBids = bids.filter(bid => {
    switch (filter) {
      case 'all':
        return true;
      case 'pending':
        return !bid.winnerId;
      case 'completed':
        return bid.winnerId;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading winner selection data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Winner Selection Management</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real-time Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{stats.totalClosedBids}</CardTitle>
              <CardDescription>Total Closed Bids</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pendingWinnerSelection}</CardTitle>
              <CardDescription>Pending Selection</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">{stats.completedWinnerSelection}</CardTitle>
              <CardDescription>Completed Selection</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">{stats.adminSelected}</CardTitle>
              <CardDescription>Admin Selected</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">{stats.completionRate}%</CardTitle>
              <CardDescription>Completion Rate</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Winner Selection Management</CardTitle>
              <CardDescription>Select and manage winners for completed auctions</CardDescription>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'completed', label: 'Completed' },
              ].map((status) => (
                <Button
                  key={status.key}
                  variant={filter === status.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status.key)}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Details</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Current Winner</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Select Winner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{bid.lotName}</p>
                      <p className="text-sm text-gray-600">{bid.wasteType} - {bid.quantity} {bid.unit}</p>
                      <p className="text-sm text-gray-500">{bid.location}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{bid.creator.name}</p>
                      <p className="text-sm text-gray-600">{bid.creator.company}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bid.winner ? (
                      <div>
                        <p className="font-medium">{bid.winner.name}</p>
                        <p className="text-sm text-gray-600">{bid.winner.company}</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                          Winner Selected
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        No Winner Selected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-lg">₹{bid.currentPrice.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bid._count.participants} bids</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedWinners[bid.id] || ''}
                      onValueChange={(value) => handleWinnerSelection(bid.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select winner" />
                      </SelectTrigger>
                      <SelectContent>
                        {bid.participants
                          .sort((a, b) => b.amount - a.amount)
                          .map((participant) => (
                            <SelectItem key={participant.id} value={participant.userId}>
                              {participant.user.name} - ₹{participant.amount.toLocaleString()}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!bid.winner ? (
                        <Button
                          size="sm"
                          onClick={() => confirmWinnerSelection(bid.id)}
                          disabled={!selectedWinners[bid.id]}
                        >
                          Select Winner
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeWinner(bid.id)}
                          disabled={!selectedWinners[bid.id]}
                        >
                          Change Winner
                        </Button>
                      )}
                      <Link to={`/dashboard/waste_generator/select-winner/${bid.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBids.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {filter === 'all' && '📋'}
                {filter === 'pending' && '⏳'}
                {filter === 'completed' && '✅'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' && 'No closed bids found'}
                {filter === 'pending' && 'No pending winner selections'}
                {filter === 'completed' && 'No completed winner selections'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' && 'Closed bids will appear here when available.'}
                {filter === 'pending' && 'All winners have been selected.'}
                {filter === 'completed' && 'Select winners to see them here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bid Details */}
      {filteredBids.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBids.slice(0, 2).map((bid) => (
            <Card key={bid.id}>
              <CardHeader>
                <CardTitle className="text-lg">{bid.lotName}</CardTitle>
                <CardDescription>Bid details and participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Waste Type:</p>
                      <p className="font-medium">{bid.wasteType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Quantity:</p>
                      <p className="font-medium">{bid.quantity} {bid.unit}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Base Price:</p>
                      <p className="font-medium">₹{bid.basePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Price:</p>
                      <p className="font-medium text-green-600">₹{bid.currentPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Top Participants:</h4>
                    <div className="space-y-2">
                      {bid.participants
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 3)
                        .map((participant, index) => (
                          <div key={participant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{participant.user.name}</p>
                              <p className="text-sm text-gray-600">#{index + 1} Highest Bid</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{participant.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(participant.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWinnerSelection;
