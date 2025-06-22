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
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl">My Bids</CardTitle>
                <CardDescription className="mt-1">Manage your waste listings and view bidding activity</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Total Listings:</span>
                <Badge variant="secondary">{myBids.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Lot Details</TableHead>
                    <TableHead className="min-w-[120px]">Type & Quantity</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Price & Bids</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBids.map((bid) => (
                    <TableRow key={bid.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm leading-tight">{bid.lotName}</p>
                          <p className="text-xs text-gray-600">{bid.location}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{bid.wasteType}</p>
                          <p className="text-xs text-gray-600">{bid.quantity} {bid.unit}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={getStatusColor(bid.status)} variant="secondary">
                          {bid.status === 'in-progress' ? 'Active' : 
                         bid.status === 'closed' ? 'Closed' : 
                         bid.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">${bid.currentPrice.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{bid.bids.length} bids</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {bid.status === 'closed' && hasWinner(bid) && (
                            <Link to={`/dashboard/waste-generator/select-venue/${bid.id}`}>
                              <Button size="sm" variant="default" className="text-xs px-2 py-1 h-7">
                                Select Venue
                              </Button>
                            </Link>
                          )}
                          {bid.status === 'closed' && (
                            <Link to={`/dashboard/waste-generator/gate-passes/${bid.id}`}>
                              <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7">
                                Gate Pass
                              </Button>
                            </Link>
                          )}
                          <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          
            {myBids.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No bids found. Start by creating your first waste listing.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  export default MyBids;
