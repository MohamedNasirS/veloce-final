import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
  const [bid, setBid] = useState<Bid | null>(null);
  const [biddingHistory, setBiddingHistory] = useState<BidHistory | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!bidId) {
        console.error('No bidId provided');
        toast({
          title: 'Error',
          description: 'No bid ID provided',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('Fetching details for bidId:', bidId);
      try {
        const [bidResponse, historyResponse] = await Promise.all([
          axios.get(`http://147.93.27.172/api/bids/${bidId}`),
          axios.get(`http://147.93.27.172/api/bids/${bidId}/history`),
        ]);

        setBid(bidResponse.data);
        setBiddingHistory(historyResponse.data);
        setSelectedWinner(historyResponse.data.winnerId || null);
        console.log('Fetched bidding history:', historyResponse.data);
      } catch (error: any) {
        console.error('Bidding history fetch failed:', {
          bidId,
          status: error.response?.status,
          statusText: error.response?.statusText,
          body: error.response?.data,
          headers: error.response?.headers,
        });
        toast({
          title: 'Error',
          description: 'Failed to load bid or bidding history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [bidId, toast]);

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
      await axios.patch(`http://147.93.27.172/api/bids/${bidId}/select-winner`, {
        winnerId: selectedWinner,
      });
      toast({
        title: 'Success',
        description: 'Winner selected successfully',
      });
      navigate('/dashboard/waste_generator');
    } catch (error: any) {
      console.error('Winner selection failed:', {
        bidId,
        winnerId: selectedWinner,
        status: error.response?.status,
        statusText: error.response?.statusText,
        body: error.response?.data,
      });
      toast({
        title: 'Error',
        description: 'Failed to select winner',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!bid || !biddingHistory) {
    return <div>No bid data available</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Winner for Bid: {bid.lotName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Bid Details</h2>
            <p>Waste Type: {bid.wasteType}</p>
            <p>Quantity: {bid.quantity} {bid.unit}</p>
            <p>Base Price: ₹{bid.basePrice}</p>
            <p>Current Price: ₹{bid.currentPrice}</p>
            <p>Start Date: {new Date(bid.startDate).toLocaleDateString()}</p>
            <p>End Date: {new Date(bid.endDate).toLocaleDateString()}</p>
            <div className="mt-2">
              <h3 className="text-md font-semibold">Images</h3>
              <div className="flex gap-2">
                {bid.images.map((image, index) => (
                  <img
                    key={index}
                    src={`http://147.93.27.172${image.path}`}
                    alt={`Bid Image ${index + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-2">Bidding History</h2>
          {biddingHistory.bids.length === 0 ? (
            <p>No bids available</p>
          ) : (
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
                  .filter(bid => bid.userId !== null) // Exclude initial null userId bid
                  .map((bid, index) => (
                    <TableRow key={index}>
                      <TableCell>{bid.userName || 'Unknown'}</TableCell>
                      <TableCell>₹{bid.amount}</TableCell>
                      <TableCell>{new Date(bid.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <RadioGroup
                          value={selectedWinner}
                          onValueChange={setSelectedWinner}
                          disabled={!!biddingHistory.winnerId}
                        >
                          <RadioGroupItem value={bid.userId!} id={`bidder-${index}`} />
                          <Label htmlFor={`bidder-${index}`}>Select</Label>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
          <Button
            className="mt-4"
            onClick={handleSelectWinner}
            disabled={!selectedWinner || !!biddingHistory.winnerId}
          >
            Confirm Winner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}