import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Bid {
  id: string;
  lotName: string;
  wasteType: string;
  quantity: number;
  unit: string;
  basePrice: number;
  currentPrice: number;
  startDate: string;
  endDate: string;
  creatorId: string;
  status: string;
  images: { path: string }[];
  winnerId?: string;
}

interface BidHistory {
  bidId: string;
  bids: Array<{
    userId: string | null;
    userName: string | null;
    amount: number;
    timestamp: string;
  }>;
  winnerId?: string;
}

export default function SelectWinner() {
  const { bidId } = useParams<{ bidId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [bid, setBid] = useState<Bid | null>(null);
  const [biddingHistory, setBiddingHistory] = useState<BidHistory | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = async () => {
    if (!bidId) {
      setError('No bid ID provided');
      toast({
        title: 'Error',
        description: 'No bid ID provided',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [bidResponse, historyResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/history`),
      ]);

      setBid(bidResponse.data);
      setBiddingHistory(historyResponse.data);
      setSelectedWinner(historyResponse.data.winnerId || null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load bid or bidding history';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setupWebSocket();
  }, [bidId, toast, user]);

  const setupWebSocket = () => {
    if (!user) return;

    const newSocket = io('http://147.93.27.172:3001', {
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

      // Update the bidding history if it's for this bid
      if (data.bid.id === bidId) {
        setBiddingHistory(prev => prev ? {
          ...prev,
          winnerId: data.winner.id
        } : null);

        toast({
          title: 'Winner Selected!',
          description: `${data.winner.name} has been selected as the winner.`,
        });

        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard/waste_generator');
        }, 2000);
      }
    });

    // Listen for winner selection events specific to waste generator's bids
    newSocket.on('winnerSelectedForMyBid', (data) => {
      console.log('Winner selected for my bid event received:', data);

      if (data.bid.id === bidId) {
        setBiddingHistory(prev => prev ? {
          ...prev,
          winnerId: data.winner.id
        } : null);

        toast({
          title: 'Winner Selected for Your Bid!',
          description: `${data.winner.name} has been selected as the winner for "${data.bid.lotName}".`,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  };

  const handleSelectWinner = async () => {
    if (!bidId || !selectedWinner) {
      toast({
        title: 'Error',
        description: 'Please select a winner',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/select-winner`, {
        winnerId: selectedWinner,
        selectedById: user?.id, // Pass the current user ID for tracking
      });
      toast({
        title: 'Success',
        description: 'Winner selected successfully',
        variant: 'default',
      });
      navigate('/dashboard/waste_generator');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to select winner',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !bid || !biddingHistory) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'No bid data available'}</p>
            </div>
            <Button onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Select Winner for {bid.lotName}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Real-time Connected' : 'Disconnected'}
                </span>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(bid.status)}`}>
                {bid.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Bid Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Waste Type:</span> {bid.wasteType}</p>
                <p><span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}</p>
                <p><span className="font-medium">Base Price:</span> ₹{bid.basePrice.toLocaleString()}</p>
                <p><span className="font-medium">Current Price:</span> ₹{bid.currentPrice.toLocaleString()}</p>
                <p><span className="font-medium">Start Date:</span> {format(new Date(bid.startDate), 'MMM dd, yyyy HH:mm')}</p>
                <p><span className="font-medium">End Date:</span> {format(new Date(bid.endDate), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-3">Images</h3>
              <div className="grid grid-cols-2 gap-2">
                {bid.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${import.meta.env.VITE_API_URL}${image.path}`}
                    alt={`Bid Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Bidding History</h2>
          {biddingHistory.bids.length === 0 ? (
            <p className="text-gray-500">No bids available</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bidder Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {biddingHistory.bids
                    .filter(bid => bid.userId !== null)
                    .sort((a, b) => b.amount - a.amount)
                    .map((bid, index) => (
                      <TableRow key={index} className={selectedWinner === bid.userId ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">{bid.userName || 'Unknown'}</TableCell>
                        <TableCell>₹{bid.amount.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(bid.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <RadioGroup
                            value={selectedWinner}
                            onValueChange={setSelectedWinner}
                            disabled={!!biddingHistory.winnerId}
                            className="flex items-center gap-2"
                          >
                            <RadioGroupItem value={bid.userId!} id={`bidder-${index}`} />
                            <Label htmlFor={`bidder-${index}`}>
                              {biddingHistory.winnerId === bid.userId ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" /> Winner
                                </span>
                              ) : (
                                'Select'
                              )}
                            </Label>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/waste_generator')}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedWinner || !!biddingHistory.winnerId}
              className="bg-primary hover:bg-primary-dark"
            >
              Confirm Winner
            </Button>
          </div>

          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Winner Selection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to select this bidder as the winner? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSelectWinner}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}