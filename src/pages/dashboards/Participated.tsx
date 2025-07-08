import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '../../components/ui/dialog';

interface Bid {
  id: string;
  lotName: string;
  wasteType: string;
  quantity: number;
  unit: string;
  location: string;
  currentPrice: number;
  status: string;
  myBidAmount: number;
  myRank: number;
  isWinner: boolean;
  gatePassPath?: string;
}

const Participated = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://147.93.27.172/api/bids/participated/${user.id}`)
        .then(res => res.json())
        .then(async (data: Bid[]) => {
          const enriched = await Promise.all(
            data.map(async (bid) => {
              if (bid.isWinner && bid.status.toLowerCase() === 'closed') {
                try {
                  const res = await fetch(`http://147.93.27.172/api/bids/${bid.id}/gate-pass?userId=${user.id}`);
                  if (res.ok) {
                    const { gatePassPath } = await res.json();
                    return { ...bid, gatePassPath };
                  }
                } catch (err) {
                  console.warn(`Gate pass fetch failed for bid ${bid.id}`);
                }
              }
              return bid;
            })
          );
          setBids(enriched);
        })
        .catch(() =>
          toast({
            title: 'Failed to load bids',
            description: 'Could not fetch participations.',
            variant: 'destructive',
          })
        );
    }
  }, [user]);

  const getRankColor = (rank: number, isWinner: boolean) => {
    if (isWinner) return 'bg-green-100 text-green-800';
    switch (rank) {
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadGatePass = (gatePassPath: string) => {
    const fullUrl = `http://147.93.27.172${gatePassPath}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-bold">My Participations</CardTitle>
          <CardDescription>Track all auctions you've participated in with detailed insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Type & Qty</TableHead>
                <TableHead>My Bid</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => (
                <TableRow key={bid.id} className="align-top">
                  <TableCell>
                    <div className="font-semibold text-gray-800">{bid.lotName}</div>
                    <div className="text-xs text-gray-500">{bid.location}</div>
                  </TableCell>
                  <TableCell>
                    <div>{bid.wasteType}</div>
                    <div className="text-xs text-gray-500">{bid.quantity} {bid.unit}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    ₹{bid.myBidAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRankColor(bid.myRank, bid.isWinner)}>
                      {bid.isWinner ? 'Winner' : `#${bid.myRank}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bid.status)}>
                      {bid.status.toLowerCase() === 'in-progress' ? 'Active' : 'Closed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{bid.currentPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedBid(bid)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {selectedBid && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold">Bid Details – {selectedBid.lotName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 text-sm text-gray-700">
                              <p><strong>📍 Location:</strong> {selectedBid.location}</p>
                              <p><strong>♻ Waste Type:</strong> {selectedBid.wasteType}</p>
                              <p><strong>📦 Quantity:</strong> {selectedBid.quantity} {selectedBid.unit}</p>
                              <p><strong>💰 My Bid:</strong> ₹{selectedBid.myBidAmount.toLocaleString()}</p>
                              <p><strong>🏅 Rank:</strong>
                                <Badge className={getRankColor(selectedBid.myRank, selectedBid.isWinner)}>
                                  {selectedBid.isWinner ? 'Winner' : `#${selectedBid.myRank}`}
                                </Badge>
                              </p>
                              <p><strong>📊 Status:</strong>
                                <Badge className={getStatusColor(selectedBid.status)}>
                                  {selectedBid.status.toLowerCase() === 'in-progress' ? 'Active' : 'Closed'}
                                </Badge>
                              </p>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                    {bid.isWinner && bid.status.toLowerCase() === 'closed' && bid.gatePassPath && (
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleDownloadGatePass(bid.gatePassPath!)}
                      >
                        📄 View Gate Pass
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Participated;
