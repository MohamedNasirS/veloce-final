
import React, { useState } from 'react';
import { useMockBids } from '../../hooks/useMockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';

const AdminWinnerSelection = () => {
  const { bids, setBids } = useMockBids();
  const [selectedWinners, setSelectedWinners] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const completedBids = bids.filter(bid => bid.status === 'closed');

  const handleWinnerSelection = (bidId: string, winnerId: string) => {
    setSelectedWinners(prev => ({ ...prev, [bidId]: winnerId }));
  };

  const confirmWinnerSelection = (bidId: string) => {
    const winnerId = selectedWinners[bidId];
    if (!winnerId) return;

    const winnerBid = bids.find(bid => bid.id === bidId)?.bids.find(b => b.bidderId === winnerId);
    if (!winnerBid) return;

    setBids(prevBids => 
      prevBids.map(bid => 
        bid.id === bidId 
          ? { 
              ...bid, 
              bids: bid.bids.map(b => ({ 
                ...b, 
                rank: b.bidderId === winnerId ? 1 : b.rank > 1 ? b.rank : b.rank + 1 
              }))
            }
          : bid
      )
    );

    toast({
      title: "Winner Selected",
      description: `${winnerBid.bidderName} has been selected as the winner for ${bids.find(b => b.id === bidId)?.lotName}`,
    });
  };

  const getCurrentWinner = (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    return bid?.bids.find(b => b.rank === 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Winner Selection Management</CardTitle>
          <CardDescription>
            Select and manage winners for completed auctions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Name</TableHead>
                <TableHead>Current Winner</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Select Winner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedBids.map((bid) => {
                const currentWinner = getCurrentWinner(bid.id);
                return (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{bid.lotName}</p>
                        <p className="text-sm text-gray-600">{bid.wasteType} - {bid.quantity} {bid.unit}</p>
                        <p className="text-sm text-gray-500">{bid.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentWinner ? (
                        <div>
                          <p className="font-medium">{currentWinner.bidderName}</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Winner
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          No Winner
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-lg">${bid.currentPrice.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{bid.bids.length} bids</Badge>
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
                          {bid.bids
                            .sort((a, b) => b.amount - a.amount)
                            .map((bidEntry) => (
                              <SelectItem key={bidEntry.id} value={bidEntry.bidderId}>
                                {bidEntry.bidderName} - ${bidEntry.amount.toLocaleString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmWinnerSelection(bid.id)}
                          disabled={!selectedWinners[bid.id]}
                        >
                          Confirm Winner
                        </Button>
                        {currentWinner && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWinnerSelection(bid.id, currentWinner.bidderId)}
                          >
                            Edit Winner
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bid Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {completedBids.slice(0, 2).map((bid) => (
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
                    <p className="font-medium">${bid.basePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Final Price:</p>
                    <p className="font-medium text-green-600">${bid.currentPrice.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">All Bids:</h4>
                  <div className="space-y-2">
                    {bid.bids
                      .sort((a, b) => a.rank - b.rank)
                      .map((bidEntry) => (
                        <div key={bidEntry.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{bidEntry.bidderName}</p>
                            <p className="text-sm text-gray-600">Rank #{bidEntry.rank}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${bidEntry.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(bidEntry.timestamp).toLocaleString()}
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
    </div>
  );
};

export default AdminWinnerSelection;
