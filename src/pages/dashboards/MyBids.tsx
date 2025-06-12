
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useMockBids } from '../../hooks/useMockData';
import { useAuth } from '../../contexts/AuthContext';

const MyBids = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  
  const myBids = bids.filter(bid => bid.createdBy === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasWinner = (bid: any) => {
    return bid.bids.some((b: any) => b.rank === 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Bids</CardTitle>
          <CardDescription>Manage your waste listings and view bidding activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Name</TableHead>
                <TableHead>Waste Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{bid.lotName}</p>
                      <p className="text-sm text-gray-600">{bid.location}</p>
                    </div>
                  </TableCell>
                  <TableCell>{bid.wasteType}</TableCell>
                  <TableCell>{bid.quantity} {bid.unit}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bid.status)}>
                      {bid.status === 'in-progress' ? 'Active' : 
                       bid.status === 'closed' ? 'Closed' : 
                       bid.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">${bid.currentPrice.toLocaleString()}</TableCell>
                  <TableCell>{bid.bids.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {bid.status === 'closed' && hasWinner(bid) && (
                        <Link to={`/dashboard/waste-generator/select-venue/${bid.id}`}>
                          <Button size="sm" variant="default">
                            Select Venue
                          </Button>
                        </Link>
                      )}
                      {bid.status === 'closed' && (
                        <Link to={`/dashboard/waste-generator/gate-passes/${bid.id}`}>
                          <Button size="sm" variant="outline">
                            Gate Pass
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
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

export default MyBids;
