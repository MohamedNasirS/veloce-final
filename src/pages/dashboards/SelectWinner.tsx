import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import axios, { AxiosError } from 'axios';

// Define interfaces (based on useMockData.ts for compatibility)
interface BidEntry {
  id: string;
  bidId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
  rank: number;
}

interface Bid {
  id: string;
  lotName: string;
  description: string;
  wasteType: string;
  quantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  currentPrice: number;
  status: 'in-progress' | 'closed';
  createdBy: string;
  location: string;
  bids: BidEntry[];
}

interface AuthContextType {
  user: { id: string; role: string } | null;
}

interface Toast {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface ToastHook {
  toast: (options: Toast) => void;
}

// Custom hook to fetch bids from the database
const useFetchBids = (userId: string | undefined) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchBids = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Bid[]>('/api/bids', {
          params: {
            userId,
            status: 'in-progress',
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        setBids(response.data.filter((bid) => bid.bids.length > 0));
        setError(null);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setError(
          axiosError.response?.data?.message || 'Failed to fetch bids. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [userId]);

  return { bids, setBids, loading, error };
};

// Function to select a winner
const selectWinner = async (bidId: string, winnerId: string): Promise<void> => {
  try {
    await axios.post(
      `/api/bids/${bidId}/select-winner`,
      { winnerId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      }
    );
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(
      axiosError.response?.data?.message || 'Failed to select winner.'
    );
  }
};

const SelectWinner: React.FC = () => {
  const { bidId } = useParams<{ bidId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast() as ToastHook;
  const { user } = useContext(AuthContext) as AuthContextType;
  const { bids, setBids, loading, error } = useFetchBids(user?.id);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle unauthenticated user or non-waste-generator
  if (!user || user.role !== 'waste_generator') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            {user ? 'Only waste generators can select winners.' : 'Please log in to view and manage your bids.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={user ? '/dashboard' : '/login'}>{user ? 'Back to Dashboard' : 'Go to Login'}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle loading and error states
  if (loading) {
    return (
      <Card>
        <CardContent>
          <p>Loading bids...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={() => navigate('/dashboard/waste_generator/my-bids')}>
            Back to My Bids
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no bidId is provided, show a list of available bids
  if (!bidId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Winner</CardTitle>
            <CardDescription>Choose a bid to select its winner</CardDescription>
          </CardHeader>
          <CardContent>
            {bids.length === 0 && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">No Open Bids Available</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any open bids with participants to select winners from.
                </p>
                <Button asChild>
                  <Link to="/dashboard/waste_generator/my-bids">View All My Bids</Link>
                </Button>
              </div>
            )}
            {bids.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Name</TableHead>
                    <TableHead>Waste Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Total Bids</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium">{bid.lotName}</TableCell>
                      <TableCell>{bid.wasteType}</TableCell>
                      <TableCell>
                        {bid.quantity} {bid.unit}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${bid.currentPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bid.bids.length} bids</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/dashboard/waste_generator/select-winner/${bid.id}`)}
                        >
                          Select Winner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find the specific bid
  const bid = bids.find((b) => b.id === bidId && b.createdBy === user.id);

  if (!bid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid Not Found</CardTitle>
          <CardDescription>
            The requested bid could not be found or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard/waste_generator/select-winner')}>
            Back to Select Winner
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bid.status !== 'in-progress') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid Closed</CardTitle>
          <CardDescription>This bid is no longer open for winner selection.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard/waste_generator/select-winner')}>
            Back to Select Winner
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSelectWinner = async () => {
    if (!selectedWinner) {
      toast({
        title: 'Error',
        description: 'Please select a bidder.',
        variant: 'destructive',
      });
      return;
    }

    const currentWinner = bid.bids.find((b) => b.rank === 1);
    if (selectedWinner === currentWinner?.bidderId) {
      toast({
        title: 'No Change',
        description: 'This bidder is already the winner.',
      });
      return;
    }

    if (window.confirm('Are you sure you want to select this bidder as the winner?')) {
      setIsSubmitting(true);
      try {
        await selectWinner(bidId, selectedWinner);
        setBids((prevBids) =>
          prevBids.map((b) =>
            b.id === bidId
              ? {
                  ...b,
                  bids: b.bids.map((bidEntry) => ({
                    ...bidEntry,
                    rank:
                      bidEntry.bidderId === selectedWinner
                        ? 1
                        : bidEntry.rank === 1
                        ? bidEntry.rank + 1
                        : bidEntry.rank,
                  })),
                  status: 'closed',
                }
              : b
          )
        );
        toast({
          title: 'Winner Selected',
          description: 'The winner has been selected successfully. You can now proceed with venue selection.',
        });
        navigate('/dashboard/waste_generator/select-winner');
      } catch (error) {
        console.error('Error selecting winner:', error);
        toast({
          title: 'Error',
          description: 'Failed to select winner. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const sortedBids = [...bid.bids].sort((a, b) => b.amount - a.amount);
  const currentWinner = bid.bids.find((b) => b.rank === 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Winner - {bid.lotName}</CardTitle>
              <CardDescription>Choose the winning bidder for your waste lot</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/waste_generator/select-winner')}
            >
              ← Back to Bid List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Lot Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Type:</span> {bid.wasteType}
                </p>
                <p>
                  <span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}
                </p>
                <p>
                  <span className="font-medium">Location:</span> {bid.location}
                </p>
                <p>
                  <span className="font-medium">Base Price:</span> ${bid.basePrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge className="bg-green-100 text-green-800">{bid.status}</Badge>
                </p>
                <p>
                  <span className="font-medium">Total Bids:</span> {bid.bids.length}
                </p>
                <p>
                  <span className="font-medium">Highest Bid:</span> $
                  {bid.currentPrice.toLocaleString()}
                </p>
                {currentWinner && (
                  <p>
                    <span className="font-medium">Current Winner:</span> {currentWinner.bidderName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Select Winner from Bidders</h3>
            {sortedBids.length === 0 ? (
              <p className="text-gray-600">No bidders found for this bid.</p>
            ) : (
              <RadioGroup
                value={selectedWinner}
                onValueChange={setSelectedWinner}
                aria-label="Select winning bidder"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Bidder Name</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Current Rank</TableHead>
                      <TableHead>Bid Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBids.map((bidEntry) => (
                      <TableRow
                        key={bidEntry.id}
                        className={bidEntry.rank === 1 ? 'bg-green-50' : ''}
                      >
                        <TableCell>
                          <RadioGroupItem
                            value={bidEntry.bidderId}
                            id={bidEntry.bidderId}
                            aria-label={`Select ${bidEntry.bidderName} as winner`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={bidEntry.bidderId} className="font-medium">
                              {bidEntry.bidderName}
                            </Label>
                            {bidEntry.rank === 1 && (
                              <Badge className="bg-green-100 text-green-800">
                                Current Winner
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${bidEntry.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">#{bidEntry.rank}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(bidEntry.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </RadioGroup>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSelectWinner}
                disabled={!selectedWinner || sortedBids.length === 0 || isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Winner Selection'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/waste_generator/select-winner')}
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectWinner;