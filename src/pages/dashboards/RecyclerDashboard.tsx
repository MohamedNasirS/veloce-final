import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import BidDetail from '../BidDetail';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">{children}</div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

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
  endDate: string;
  creator: {
    id?: string;
    name: string;
    company: string;
  };
  images: Array<{
    id: string;
    bidId?: string;
    path?: string;
  }>;
  bidEntries: Array<{
    amount: number;
    bidderId: string;
    bidder: {
      name: string;
      company: string;
    };
  }>;
  _count: {
    bidEntries: number;
  };
}

const RecyclerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('RecyclerDashboard - Current user:', user);
  console.log('RecyclerDashboard - User authenticated:', !!user);

  const [allBids, setAllBids] = useState<WasteBid[]>([]);
  const [myParticipations, setMyParticipations] = useState<WasteBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ id: string; originalName: string; url: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchBids();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBids = async () => {
    try {
      setError(null);
      const allBidsResponse = await fetch('http://147.93.27.172:3001/api/bids?status=published,in-progress');
      if (!allBidsResponse.ok) {
        throw new Error(`HTTP error! status: ${allBidsResponse.status}`);
      }
      const allBidsData = await allBidsResponse.json();
      console.log('Raw API response:', allBidsData);
      const sanitizedBids = allBidsData.map((bid: any) => ({
        ...bid,
        bidEntries: bid.bidEntries || [],
        images: bid.images || [],
        _count: bid._count || { bidEntries: 0 },
        creator: bid.creator || { name: 'Unknown', company: 'Unknown' },
      }));
      console.log('Sanitized bids:', sanitizedBids);
      setAllBids(sanitizedBids);
      const participatedBids = sanitizedBids.filter((bid: WasteBid) =>
        bid.bidEntries &&
        bid.bidEntries.length > 0 &&
        bid.bidEntries.some(entry => entry.bidderId === user?.id)
      );
      setMyParticipations(participatedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (bidId: string, amount: number) => {
    try {
      const response = await fetch(`http://147.93.27.172:3001/api/bids/${bidId}/place-bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidderId: user?.id,
          amount,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bid');
      }
      alert('Bid placed successfully!');
      fetchBids();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to place bid');
    }
  };

  const getImageUrls = (images: WasteBid['images']) => {
    console.log('Images array:', images);
    return images.map(image => {
      const path = image.path || '/uploads/bids/missing-filename.jpg';
      console.log(`Processing image:`, image, `Path: ${path}`);
      return {
        id: image.id,
        originalName: path.split('/').pop() || 'missing-filename.jpg',
        url: `http://147.93.27.172:3001${path}`,
      };
    });
  };

  const handleViewDocuments = (bidId: string) => {
    const bid = allBids.find(b => b.id === bidId);
    if (!bid) {
      console.error('Bid not found:', bidId);
      alert('Bid not found');
      return;
    }
    const imageUrls = getImageUrls(bid.images);
    setModalContent(imageUrls);
    setIsModalOpen(true);
  };

  const myBidEntries = myParticipations.flatMap(bid =>
    (bid.bidEntries || []).filter(entry => entry.bidderId === user?.id)
  );
  const wonBids = myParticipations.filter(bid => {
    if (!bid.bidEntries || bid.bidEntries.length === 0) return false;
    const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
    return myBid && myBid.amount === bid.currentPrice;
  });
  const totalWonValue = wonBids.reduce((sum, bid) => sum + (bid.currentPrice || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isMyHighestBid = (bid: WasteBid) => {
    if (!bid.bidEntries || bid.bidEntries.length === 0) return false;
    const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
    return myBid && myBid.amount === bid.currentPrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => fetchBids()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-500 text лично-xl mb-4">🔒 Authentication Required</div>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Document Links"
      >
        {modalContent.length > 0 ? (
          <ul className="space-y-2">
            {modalContent.map((doc, index) => (
              <li key={doc.id} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{index + 1}.</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferre
r"
                  className="text-blue-600 hover:underline"
                >
                  {doc.originalName}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No documents available.</p>
        )}
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{myBidEntries.length}</CardTitle>
            <CardDescription>Total Bids Placed</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-orange-600">{myParticipations.length}</CardTitle>
            <CardDescription>Active Participations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{wonBids.length}</CardTitle>
            <CardDescription>Won Auctions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">${totalWonValue.toLocaleString()}</CardTitle>
            <CardDescription>Total Won Value</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Participate in auctions and manage your bids</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild>
              <a href="/live-bids" className="w-full h-20 text-lg">
                🔴 View Live Bids
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`/dashboard/${user?.role}/participated`} className="w-full h-20 text-lg">
                📊 My Participations
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`/dashboard/${user?.role}/upload-proof`} className="w-full h-20 text-lg">
                📸 Upload Documents
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Waste Bids</CardTitle>
          <CardDescription>Active auctions you can participate in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allBids
              .filter(bid => bid.creator?.id !== user?.id)
              .slice(0, 5)
              .map(bid => {
                const myBid = (bid.bidEntries || []).find(entry => entry.bidderId === user?.id);
                const isWinning = isMyHighestBid(bid);

                return (
                  <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                        <h3 className="font-semibold text-lg">{bid.lotName || 'Unnamed Lot'}</h3>
                        <p className="text-sm text-gray-600 mb-2">{bid.description || 'No description'}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span>📍 {bid.location || 'Location TBD'}</span>
                          <span>📦 {bid.quantity || 0} {bid.unit || 'units'}</span>
                          <span>🏭 {bid.creator?.company || 'Unknown Company'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(bid.status)} variant="secondary">
                          {bid.status === 'published' ? 'New' : 'Active'}
                        </Badge>
                        {(bid.images || []).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">📷 {bid.images.length} image(s)</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-xl font-bold text-green-600">${(bid.currentPrice || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Bids</p>
                          <p className="text-sm font-medium">{bid._count?.bidEntries || 0}</p>
                        </div>
                        {myBid && (
                          <div>
                            <p className="text-xs text-gray-500">My Bid</p>
                            <p
                              className={`text-sm font-medium ${isWinning ? 'text-green-600' : 'text-orange-600'}`}
                            >
                              ${myBid.amount.toLocaleString()}
                              {isWinning && ' 🏆'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocuments(bid.id)}
                        >
                          View Documents
                        </Button>
                        {bid.status !== 'closed' && new Date(bid.endDate) > new Date() && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const amount = prompt(`Enter your bid amount (current: ${bid.currentPrice || 0}):`);
                              if (amount && parseFloat(amount) > (bid.currentPrice || 0)) {
                                placeBid(bid.id, parseFloat(amount));
                              }
                            }}
                          >
                            Place Bid
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Ends: {bid.endDate ? new Date(bid.endDate).toLocaleString() : 'Date TBD'}
                    </div>
                  </div>
                );
              })}
          </div>

          {allBids.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active bids</h3>
              <p className="text-gray-500">Check back later for new waste auctions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {myParticipations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Participations</CardTitle>
            <CardDescription>Auctions where you have placed bids</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myParticipations.slice(0, 3).map(bid => {
                const myBid = (bid.bidEntries || []).find(entry => entry.bidderId === user?.id);
                const isWinning = isMyHighestBid(bid);

                return (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{bid.lotName || 'Unnamed Lot'}</h3>
                      <p className="text-sm text-gray-600">
                        {bid.wasteType || 'Unknown Type'} • {bid.location || 'Location TBD'}
                      </p>
                      <p className="text-sm text-gray-500">{bid.creator?.company || 'Unknown Company'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={isWinning ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {isWinning ? '🏆 Winning' : '📊 Bidding'}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">${myBid?.amount?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-gray-500">
                        Current: ${(bid.currentPrice || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecyclerDashboard;