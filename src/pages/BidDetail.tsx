import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';

interface BidImage {
  id: string;
  originalName: string;
  relativePath: string;
}

interface BidEntry {
  id: string;
  amount: number;
  message?: string;
  createdAt: string;
  bidder: {
    id: string;
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
  address: string;
  basePrice: number;
  currentPrice: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    company: string;
  };
  images: BidImage[];
  bidEntries: BidEntry[];
  _count: {
    bidEntries: number;
  };
}

const BidDetail = () => {
  const { bidId } = useParams<{ bidId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [bid, setBid] = useState<WasteBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (bidId) {
      fetchBidDetail();
    }
  }, [bidId]);

  const fetchBidDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bid details');
      }

      const data = await response.json();
      setBid(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bid details');
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= (bid?.currentPrice || 0)) {
      alert('Bid amount must be higher than current price');
      return;
    }

    try {
      setPlacingBid(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/place-bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidderId: user?.id,
          amount: parseFloat(bidAmount),
          message: bidMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bid');
      }

      alert('Bid placed successfully!');
      setBidAmount('');
      setBidMessage('');
      fetchBidDetail(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const closeBid = async () => {
    if (!confirm('Are you sure you want to close this bid?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close bid');
      }

      alert('Bid closed successfully!');
      fetchBidDetail(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close bid');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Published';
      case 'in-progress': return 'Active';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const isOwner = bid?.creator.id === user?.id;
  const canBid = !isOwner && bid?.status !== 'closed' && new Date(bid?.endDate || '') > new Date();
  const myBid = bid?.bidEntries.find(entry => entry.bidder.id === user?.id);
  const isWinning = myBid && myBid.amount === bid?.currentPrice;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bid details...</p>
        </div>
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error || 'Bid not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Badge className={getStatusColor(bid.status)} variant="secondary">
          {getStatusLabel(bid.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{bid.lotName}</CardTitle>
              <CardDescription>
                Listed by {bid.creator.company} • {new Date(bid.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{bid.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Waste Type</p>
                  <p className="font-medium">{bid.wasteType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium">{bid.quantity} {bid.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{bid.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="font-medium">${bid.basePrice.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Full Address</p>
                <p className="font-medium">{bid.address}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Auction Start</p>
                  <p className="font-medium">{new Date(bid.startDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Auction End</p>
                  <p className="font-medium">{new Date(bid.endDate).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {bid.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bid.images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/api/bids/images/${image.id}`}
                        alt={image.originalName}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => setSelectedImage(`${import.meta.env.VITE_API_URL}/api/bids/images/${image.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bidding History */}
          <Card>
            <CardHeader>
              <CardTitle>Bidding History ({bid._count.bidEntries})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bid.bidEntries
                  .sort((a, b) => b.amount - a.amount)
                  .map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.bidder.company}</p>
                          {index === 0 && <Badge className="bg-green-100 text-green-800">Highest</Badge>}
                          {entry.bidder.id === user?.id && <Badge className="bg-blue-100 text-blue-800">You</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{entry.bidder.name}</p>
                        {entry.message && (
                          <p className="text-sm text-gray-500 mt-1">"{entry.message}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${entry.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                
                {bid.bidEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No bids placed yet. Be the first to bid!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Price */}
          <Card>
            <CardHeader>
              <CardTitle>Current Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  ${bid.currentPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {bid._count.bidEntries} bid(s) received
                </p>
                {myBid && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Your bid: ${myBid.amount.toLocaleString()}
                      {isWinning && ' 🏆'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Remaining */}
          <Card>
            <CardHeader>
              <CardTitle>Time Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {new Date(bid.endDate) > new Date() ? (
                  <div>
                    <p className="text-lg font-semibold">
                      {Math.ceil((new Date(bid.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                    <p className="text-sm text-gray-500">
                      Ends: {new Date(bid.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-red-600">Auction Ended</p>
                    <p className="text-sm text-gray-500">
                      Ended: {new Date(bid.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Place Bid */}
          {canBid && (
            <Card>
              <CardHeader>
                <CardTitle>Place Your Bid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum: ${bid.currentPrice + 1}`}
                    min={bid.currentPrice + 1}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be higher than ${bid.currentPrice.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="bidMessage">Message (Optional)</Label>
                  <Textarea
                    id="bidMessage"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Add a message with your bid..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={placeBid} 
                  disabled={placingBid || !bidAmount}
                  className="w-full"
                >
                  {placingBid ? 'Placing Bid...' : 'Place Bid'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Bid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bid.status === 'in-progress' && (
                  <Button 
                    onClick={closeBid}
                    variant="outline"
                    className="w-full"
                  >
                    Close Auction
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/waste-generator/my-bids`)}
                >
                  View All My Bids
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{bid.creator.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium">{bid.creator.name}</p>
                </div>
                {!isOwner && (
                  <Button variant="outline" className="w-full mt-3">
                    Contact Seller
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidDetail;