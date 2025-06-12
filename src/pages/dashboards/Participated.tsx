
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useMockBids } from '../../hooks/useMockData';
import { useAuth } from '../../contexts/AuthContext';

const Participated = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  
  const participatedBids = bids.filter(bid => 
    bid.bids.some(b => b.bidderId === user?.id)
  );

  const getMyBidForLot = (bid: any) => {
    return bid.bids.find((b: any) => b.bidderId === user?.id);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Participations</CardTitle>
          <CardDescription>Track all auctions you've participated in</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Name</TableHead>
                <TableHead>Waste Type</TableHead>
                <TableHead>My Bid Amount</TableHead>
                <TableHead>My Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participatedBids.map((bid) => {
                const myBid = getMyBidForLot(bid);
                return (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{bid.lotName}</p>
                        <p className="text-sm text-gray-600">{bid.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{bid.wasteType}</p>
                        <p className="text-sm text-gray-600">{bid.quantity} {bid.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${myBid?.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRankColor(myBid?.rank || 0)}>
                        {myBid?.rank === 1 ? 'Winner' : `Rank #${myBid?.rank}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bid.status)}>
                        {bid.status === 'in-progress' ? 'Active' : 'Closed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${bid.currentPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {myBid?.rank === 1 && bid.status === 'closed' && (
                          <Button size="sm" variant="default">
                            View Pickup Details
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Winner Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Winner Notifications</CardTitle>
          <CardDescription>Auctions where you've been selected as the winner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participatedBids
              .filter(bid => {
                const myBid = getMyBidForLot(bid);
                return myBid?.rank === 1 && bid.status === 'closed';
              })
              .map((bid) => {
                const myBid = getMyBidForLot(bid);
                return (
                  <div key={bid.id} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800">🎉 Congratulations! You won: {bid.lotName}</h3>
                        <p className="text-sm text-green-700">
                          Your winning bid: <span className="font-semibold">${myBid?.amount.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {bid.quantity} {bid.unit} of {bid.wasteType} • {bid.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          View Pickup Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Seller
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Participated;
