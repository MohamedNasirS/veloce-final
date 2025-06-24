<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { RefreshCw } from 'lucide-react';

const MyBids = () => {
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyBids = () => {
    if (!user?.id) return;
    setLoading(true);
    axios
      .get(`http://localhost:3001/api/bids/creator/${user.id}`)
      .then(res => setMyBids(res.data))
      .catch(err => console.error('Failed to fetch my bids', err))
      .finally(() => setLoading(false));
=======
  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
  import { Button } from '../../components/ui/button';
  import { Badge } from '../../components/ui/badge';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
  import { useAuth } from '../../contexts/AuthContext';

  interface BidImage {
    id: string;
    originalName: string;
    relativePath: string;
  }

  interface BidEntry {
    id: string;
    amount: number;
    bidder: {
      name: string;
      company: string;
    };
  }

  interface WasteBid {
    id: string;
    lotName: string;
    description: string;
    wasteType: string;
    quantity: number;
    unit: string;
    location: string;
    basePrice: number;
    currentPrice: number;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    images: BidImage[];
    bidEntries: BidEntry[];
    _count: {
      bidEntries: number;
    };
  }

  const MyBids = () => {
    const { user } = useAuth();
    const [bids, setBids] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      if (user?.id) {
        fetchMyBids();
      }
    }, [user]);

    const fetchMyBids = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching bids for user:', user?.id); // Debug log
        
        const response = await fetch(`http://localhost:3001/api/bids/user/${user?.id}`);
        
        if (!response.ok) {

          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch bids: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched bids:', data); // Debug log
        setBids(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bids');
      } finally {
        setLoading(false);
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'published': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-orange-100 text-orange-800';
        case 'closed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'published': return 'Published';
        case 'in-progress': return 'Active';
        case 'closed': return 'Closed';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    };

    const hasWinner = (bid: WasteBid) => {
      return bid.bidEntries.some(entry => entry.amount === bid.currentPrice);
    };

    const closeBid = async (bidId: string) => {
      try {
        const response = await fetch(`http://localhost:3001/api/bids/${bidId}/close`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user?.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to close bid');
        }

        // Refresh bids
        fetchMyBids();
        alert('Bid closed successfully!');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to close bid');
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bids...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">

          <p className="font-semibold">Error loading bids:</p>
          <p>{error}</p>
          <Button 
            onClick={fetchMyBids} 
            className="mt-2"
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl">My Bids</CardTitle>
                <CardDescription className="mt-1">Manage your waste listings and view bidding activity</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Total Listings:</span>
                  <Badge variant="secondary">{bids.length}</Badge>
                </div>
                <Link to="/dashboard/waste-generator/create-bid">
                  <Button>Create New Bid</Button>
                </Link>
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
                    <TableHead className="min-w-[150px]">Timing</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm leading-tight">{bid.lotName}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{bid.description}</p>
                          <p className="text-xs text-gray-500">{bid.location}</p>
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
                          {getStatusLabel(bid.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Base: ${bid.basePrice.toLocaleString()}</p>
                          <p className="font-semibold text-sm">${bid.currentPrice.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{bid._count.bidEntries} bid(s)</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            Start: {new Date(bid.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            End: {new Date(bid.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link to={`/bid/${bid.id}`}>
                            <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7">
                              View Details
                            </Button>
                          </Link>
                          
                          {bid.status === 'in-progress' && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="text-xs px-2 py-1 h-7"
                              onClick={() => closeBid(bid.id)}

        >
                              Close Bid
                            </Button>
                          )}
                          
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          
            {bids.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
                <p className="text-gray-500 mb-4">Start by creating your first waste listing.</p>
                <Link to="/dashboard/waste-generator/create-bid">
                  <Button>Create Your First Bid</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
>>>>>>> 24844d5f1965f1d807783db52e2a984b0e8a3ebb
  };

  useEffect(() => {
    fetchMyBids();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'LIVE': return 'bg-green-100 text-green-800 animate-pulse';
      case 'CLOSED': return 'bg-gray-500 text-white';
      case 'CANCELLED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">My Bids</CardTitle>
              <CardDescription>Manage and track your submitted auction listings</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total Listings:</span>
              <Badge variant="secondary">{myBids.length}</Badge>
              <Button variant="outline" size="sm" onClick={fetchMyBids} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBids.map(bid => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <p className="font-medium">{bid.lotName}</p>
                      <p className="text-xs text-muted-foreground">{bid.location}</p>
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(bid.status)}>
                        {bid.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div><b>Base:</b> ${bid.basePrice}</div>
                        <div><b>Now:</b> ${bid.currentPrice}</div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-gray-700">
                      <div><b>Start:</b> {new Date(bid.startDate).toLocaleString()}</div>
                      <div><b>End:</b> {new Date(bid.endDate).toLocaleString()}</div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {bid.participants?.length || 0} bid(s)
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        {bid.images?.map((img: any) => (
                          <img
                            key={img.id}
                            src={`http://localhost:3001${img.path}`}
                            alt="Bid image"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {myBids.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              You haven't posted any bids yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBids;
