
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { useMockBids } from '../../hooks/useMockData';
import { useToast } from '../../hooks/use-toast';

const SelectWinner = () => {
  const { bidId } = useParams();
  const { bids, setBids } = useMockBids();
  const [selectedWinner, setSelectedWinner] = useState('');
  const { toast } = useToast();

  const bid = bids.find(b => b.id === bidId);

  if (!bid) {
    return <div>Bid not found</div>;
  }

  const handleSelectWinner = () => {
    if (!selectedWinner) return;

    setBids(prevBids => 
      prevBids.map(b => 
        b.id === bidId 
          ? { 
              ...b, 
              bids: b.bids.map(bidEntry => ({ 
                ...bidEntry, 
                rank: bidEntry.bidderId === selectedWinner ? 1 : bidEntry.rank > 1 ? bidEntry.rank : bidEntry.rank + 1 
              }))
            }
          : b
      )
    );

    toast({
      title: "Winner Selected",
      description: "The winner has been selected successfully. You can now proceed with venue selection.",
    });
  };

  const sortedBids = bid.bids.sort((a, b) => b.amount - a.amount);
  const currentWinner = bid.bids.find(b => b.rank === 1);

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
                <p><span className="font-medium">Type:</span> {bid.wasteType}</p>
                <p><span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}</p>
                <p><span className="font-medium">Location:</span> {bid.location}</p>
                <p><span className="font-medium">Base Price:</span> ${bid.basePrice.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Status:</span> <Badge className="bg-green-100 text-green-800">{bid.status}</Badge></p>
                <p><span className="font-medium">Total Bids:</span> {bid.bids.length}</p>
                <p><span className="font-medium">Highest Bid:</span> ${bid.currentPrice.toLocaleString()}</p>
                {currentWinner && (
                  <p><span className="font-medium">Current Winner:</span> {currentWinner.bidderName}</p>
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
                  {sortedBids.map((bidEntry) => (
                    <TableRow key={bidEntry.id} className={bidEntry.rank === 1 ? 'bg-green-50' : ''}>
                      <TableCell>
                        <RadioGroupItem value={bidEntry.bidderId} id={bidEntry.bidderId} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={bidEntry.bidderId} className="font-medium">
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
              <Button 
                onClick={handleSelectWinner}
                disabled={!selectedWinner}
                className="w-full md:w-auto"
              >
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
