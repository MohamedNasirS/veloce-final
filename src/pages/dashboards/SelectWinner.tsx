import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

interface BidEntry {
  userId: string | null;
  amount: number;
  timestamp: string;
  user?: { id: string; name: string; email: string }; // Optional user details from /users/:id
}

interface Bid {
  id: string;
  lotName: string;
  wasteType: string;
  quantity: number;
  unit: string;
  location: string;
  basePrice: number;
  currentPrice: number;
  status: string;
  bids: BidEntry[];
}

const SelectWinner = () => {
  const { bidId } = useParams<{ bidId: string }>();
  const [bid, setBid] = useState<Bid | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bidId) {
      console.log('Fetching details for bidId:', bidId); // Debug: Log bidId
      fetchBidDetails();
    } else {
      setError('Invalid bid ID');
      setLoading(false);
    }
  }, [bidId]);

  const fetchBidDetails = async () => {
    try {
      // Fetch bid details from /bids/:id
      const bidResponse = await fetch(`http://localhost:3001/api/bids/${bidId}`);
      if (!bidResponse.ok) {
        throw new Error(`Failed to fetch bid details: ${bidResponse.status} ${bidResponse.statusText}`);
      }
      const bidData = await bidResponse.json();
      console.log('Fetched bid details:', bidData); // Debug: Log bid response

      // Fetch bidding history from /bids/:id/history
      const historyResponse = await fetch(`http://localhost:3001/api/bids/${bidId}/history`);
      let historyData = { bids: [] };
      if (historyResponse.ok) {
        historyData = await historyResponse.json();
        console.log('Fetched bidding history:', historyData); // Debug: Log history response
      } else {
        console.warn(`Bidding history fetch failed: ${historyResponse.status} ${historyResponse.statusText}`);
      }

      // Handle empty or missing bidding history
      const bids = Array.isArray(historyData.bids) ? historyData.bids : [];
      if (bids.length === 0) {
        console.warn('No bidding history found for bid:', bidId);
      }

      // Fetch user details for each bid entry and add ranks
      const sortedBids = await Promise.all(
        bids
          .sort((a: BidEntry, b: BidEntry) => b.amount - a.amount)
          .map(async (entry: BidEntry, index: number) => {
            let bidderName = entry.userId ? `User ${entry.userId.slice(0, 8)}` : 'Base Price';
            if (entry.userId) {
              try {
                const userResponse = await fetch(`http://localhost:3001/api/users/${entry.userId}`);
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  bidderName = userData.name || `User ${entry.userId.slice(0, 8)}`;
                  entry.user = userData; // Attach user details
                } else {
                  console.warn(`Failed to fetch user ${entry.userId}: ${userResponse.status}`);
                }
              } catch (userErr) {
                console.warn(`Error fetching user ${entry.userId}:`, userErr);
              }
            }
            return {
              ...entry,
              bidderName,
              rank: entry.userId ? index + 1 : undefined,
            };
          })
      );

      setBid({
        ...bidData,
        bids: sortedBids,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load bid or bidding history');
      console.error('Error fetching bid details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedWinner) {
      toast({
        title: 'Error',
        description: 'Please select a bidder before confirming.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/bids/${bidId}/select-winner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: selectedWinner }),
      });
      if (!response.ok) {
        throw new Error(`Failed to select winner: ${response.status} ${response.statusText}`);
      }

      // Update local state
      setBid((prev) =>
        prev
          ? {
              ...prev,
              bids: prev.bids.map((entry) => ({
                ...entry,
                rank: entry.userId === selectedWinner ? 1 : entry.rank && entry.rank > 1 ? entry.rank : entry.rank + 1,
              })),
            }
          : prev
      );

      toast({
        title: 'Winner Selected',
        description: 'The winner has been selected successfully. You can now proceed with venue selection.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to select winner. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !bid) {
    return <div>{error || 'Bid not found'}</div>;
  }

  const currentWinner = bid.bids.find((b) => b.rank === 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Winner - {bid.lotName}</CardTitle>
          <CardDescription>Choose the winning bidder for your waste lot</CardDescription>
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
                  <span className="font-medium">Base Price:</span> ₹{bid.basePrice.toLocaleString()}
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
                  <span className="font-medium">Highest Bid:</span> ₹{bid.currentPrice.toLocaleString()}
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
            {bid.bids.length === 0 ? (
              <p className="text-gray-600">No bids available for this lot.</p>
            ) : (
              <RadioGroup value={selectedWinner} onValueChange={setSelectedWinner}>
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
                    {bid.bids.map((bidEntry) => (
                      <TableRow key={bidEntry.userId || bidEntry.timestamp} className={bidEntry.rank === 1 ? 'bg-green-50' : ''}>
                        <TableCell>
                          {bidEntry.userId && <RadioGroupItem value={bidEntry.userId} id={bidEntry.userId} />}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={bidEntry.userId || ''} className="font-medium">
                              {bidEntry.bidderName}
                            </Label>
                            {bidEntry.rank === 1 && (
                              <Badge className="bg-green-100 text-green-800">Current Winner</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">₹{bidEntry.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {bidEntry.rank && <Badge variant="outline">#{bidEntry.rank}</Badge>}
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
              <Button onClick={handleSelectWinner} disabled={!selectedWinner || bid.bids.length === 0} className="w-full md:w-auto">
                Confirm Winner Selection
              </Button>
              <Button variant="outline" className="w-full md:w-auto">
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