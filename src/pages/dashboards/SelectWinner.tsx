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
  bidderName?: string;
  rank?: number;
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
  const [selectedWinner, setSelectedWinner] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bidId) {
      fetchBidDetails();
    }
  }, [bidId]);

  const fetchBidDetails = async () => {
    try {
      // Fetch bid details from /bids/:id
      const bidResponse = await fetch(`http://localhost:3001/api/bids/${bidId}`);
      if (!bidResponse.ok) throw new Error('Failed to fetch bid details');
      const bidData = await bidResponse.json();

      // Fetch bidding history from /bids/:id/history
      const historyResponse = await fetch(`http://localhost:3001/api/bids/${bidId}/history`);
      if (!historyResponse.ok) throw new Error('Failed to fetch bidding history');
      const historyData = await historyResponse.json();

      // Combine bid details with history, adding ranks based on amount
      const sortedBids = historyData.bids
        .map((entry: BidEntry, index: number) => ({
          ...entry,
          bidderName: entry.userId ? `User ${entry.userId.slice(0, 8)}` : 'Base Price',
          rank: entry.userId ? index + 1 : undefined,
        }))
        .sort((a: BidEntry, b: BidEntry) => b.amount - a.amount);

      setBid({
        ...bidData,
        bids: sortedBids,
      });
    } catch (err) {
      setError('Bid or bidding history not found');
      console.error('Error fetching bid:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedWinner) return;

    try {
      // Update bid with winner (you may need a backend endpoint for this)
      const response = await fetch(`http://localhost:3001/api/bids/${bidId}/select-winner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: selectedWinner }),
      });
      if (!response.ok) throw new Error('Failed to select winner');

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
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to select winner. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !bid) {
    return <div>Bid not found</div>;
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
                  <span className="font-medium">Highest Bid:</span> ${bid.currentPrice.toLocaleString()}
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
                  {bid.bids
                    .filter((entry) => entry.userId) // Exclude base price
                    .map((bidEntry) => (
                      <TableRow key={bidEntry.userId} className={bidEntry.rank === 1 ? 'bg-green-50' : ''}>
                        <TableCell>
                          <RadioGroupItem value={bidEntry.userId!} id={bidEntry.userId!} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={bidEntry.userId!} className="font-medium">
                              {bidEntry.bidderName}
                            </Label>
                            {bidEntry.rank === 1 && (
                              <Badge className="bg-green-100 text-green-800">Current Winner</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">${bidEntry.amount.toLocaleString()}</TableCell>
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

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSelectWinner} disabled={!selectedWinner} className="w-full md:w-auto">
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