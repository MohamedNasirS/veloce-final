import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
  winnerId?: string;
  winner?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

interface BidWithGatePass extends WasteBid {
  gatePassPath?: string | null;
}

const GatePassList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bids, setBids] = useState<BidWithGatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      console.error('No user logged in, redirecting to login');
      toast({
        title: 'Unauthorized',
        description: 'Please log in to view gate passes.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (user.role !== 'waste_generator') {
      console.error(`User role ${user.role} is not waste_generator`);
      toast({
        title: 'Unauthorized',
        description: 'Only waste generators can view gate passes.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    if (user?.id) {
      fetchClosedBidsWithWinners();
    }
  }, [user, navigate, toast]);

  const fetchClosedBidsWithWinners = async () => {
    try {
      console.log(`Fetching closed bids for creator ${user?.id}, token: ${user?.token}`);
      const response = await axios.get(`http://localhost:3001/api/bids/creator/${user?.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user?.token}` : undefined,
        },
      });
      console.log('Raw API response (closed bids):', response.data);

      // Filter only closed bids with winners
      const closedBidsWithWinners = response.data.filter((bid: WasteBid) => 
        bid.status === 'CLOSED' && bid.winnerId && bid.winner
      );

      // Fetch gate pass status for each bid
      const bidsWithDetails = await Promise.all(
        closedBidsWithWinners.map(async (bid: BidWithGatePass) => {
          try {
            console.log(`Fetching gate pass for bid ${bid.id}`);
            const gatePassResponse = await axios.get(
              `http://localhost:3001/api/bids/${bid.id}/gate-pass?userId=${user?.id}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': user?.token ? `Bearer ${user?.token}` : undefined,
                },
              }
            );
            return { ...bid, gatePassPath: gatePassResponse.data.gatePassPath };
          } catch (error: any) {
            console.error(`Error fetching gate pass for bid ${bid.id}:`, {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
            });
            return { ...bid, gatePassPath: null };
          }
        })
      );

      setBids(bidsWithDetails);
      console.log('Fetched closed bids with winners and gate pass status:', bidsWithDetails);

      if (bidsWithDetails.length === 0) {
        console.log('No closed bids with winners found for this user');
        toast({
          title: 'No Closed Bids',
          description: 'No closed bids with winners found. Please select winners for closed bids.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error fetching closed bids:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast({
        title: 'Error',
        description: error.response?.status === 404
          ? 'No bids found for this user. Please create or close bids with winners.'
          : `Failed to fetch closed bids: ${error.response?.data?.message || error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = bids.filter(bid => {
    switch (filter) {
      case 'all':
        return true;
      case 'pending':
        return !bid.gatePassPath;
      case 'completed':
        return bid.gatePassPath;
      default:
        return true;
    }
  });

  const stats = {
    total: bids.length,
    pending: bids.filter(bid => !bid.gatePassPath).length,
    completed: bids.filter(bid => bid.gatePassPath).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading gate passes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gate Pass Management</h1>
        <Link to="/dashboard/waste_generator">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            <CardDescription>Closed Bids with Winners</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pending}</CardTitle>
            <CardDescription>Pending Gate Passes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{stats.completed}</CardTitle>
            <CardDescription>Completed Gate Passes</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gate Pass Management</CardTitle>
              <CardDescription>Manage gate passes for closed bids with selected winners</CardDescription>
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
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{bid.lotName || 'Unnamed Lot'}</h3>
                    <Badge
                      variant="secondary"
                      className={bid.gatePassPath ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {bid.gatePassPath ? '✅ Gate Pass Uploaded' : '⏳ Gate Pass Pending'}
                    </Badge>
                  </div>
                  
                  {/* Bid Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Waste Type:</span> {bid.wasteType}
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {bid.location}
                    </div>
                    <div>
                      <span className="font-medium">Final Amount:</span> ₹{(bid.currentPrice || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Winner Details */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Winner Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Name:</span> {bid.winner?.name || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Company:</span> {bid.winner?.company || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Email:</span> {bid.winner?.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Link to={`/dashboard/waste_generator/gate-passes/${bid.id}`}>
                    <Button variant="outline" size="sm">
                      {bid.gatePassPath ? 'View Gate Pass' : 'Upload Gate Pass'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {filteredBids.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {filter === 'all' && '📋'}
                  {filter === 'pending' && '⏳'}
                  {filter === 'completed' && '✅'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' && 'No closed bids with winners found'}
                  {filter === 'pending' && 'No pending gate passes'}
                  {filter === 'completed' && 'No completed gate passes'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'all' && 'Closed bids with selected winners will appear here. Select winners from the main dashboard first.'}
                  {filter === 'pending' && 'All gate passes have been uploaded.'}
                  {filter === 'completed' && 'Upload gate passes to see them here.'}
                </p>
                {filter === 'all' && (
                  <Link to="/dashboard/waste_generator">
                    <Button>Go to Dashboard</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GatePassList;