  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
  import { Button } from '../../components/ui/button';
  import { Badge } from '../../components/ui/badge';
  import { useAuth } from '../../contexts/AuthContext';

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
      name: string;
      company: string;
    };
    images: Array<{
      id: string;
      originalName: string;
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
    const [allBids, setAllBids] = useState<WasteBid[]>([]);
    const [myParticipations, setMyParticipations] = useState<WasteBid[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchBids();
    }, [user]);

    const fetchBids = async () => {
      try {
        // Fetch all active bids
        const allBidsResponse = await fetch('http://localhost:3001/api/bids?status=published,in-progress');
        const allBidsData = await allBidsResponse.json();
        setAllBids(allBidsData);

        // Filter bids where user has participated
        const participatedBids = allBidsData.filter((bid: WasteBid) =>
          bid.bidEntries.some(entry => entry.bidderId === user?.id)
        );
        setMyParticipations(participatedBids);
      } catch (error) {
        console.error('Error fetching bids:', error);
      } finally {
        setLoading(false);
      }
    };

    const placeBid = async (bidId: string, amount: number) => {
      try {
        const response = await fetch(`http://localhost:3001/api/bids/${bidId}/place-bid`, {
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
        fetchBids(); // Refresh data
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to place bid');
      }
    };

    const myBidEntries = myParticipations.flatMap(bid => 
      bid.bidEntries.filter(entry => entry.bidderId === user?.id)
    );
    const wonBids = myParticipations.filter(bid => {
      const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
      return myBid && myBid.amount === bid.currentPrice;
    });
    const totalWonValue = wonBids.reduce((sum, bid) => sum + bid.currentPrice, 0);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'published': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-orange-100 text-orange-800';
        case 'closed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const isMyHighestBid = (bid: WasteBid) => {
      const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
      return myBid && myBid.amount === bid.currentPrice;
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Participate in auctions and manage your bids</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/live-bids">
                <Button className="w-full h-20 text-lg">
                  🔴 View Live Bids
                </Button>
              </Link>
              <Link to={`/dashboard/${user?.role}/participated`}>
                <Button variant="outline" className="w-full h-20 text-lg">
                  📊 My Participations
                </Button>
              </Link>
              <Link to={`/dashboard/${user?.role}/upload-proof`}>
                <Button variant="outline" className="w-full h-20 text-lg">
                  📸 Upload Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Available Bids */}
        <Card>
          <CardHeader>
            <CardTitle>Available Waste Bids</CardTitle>
            <CardDescription>Active auctions you can participate in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allBids.filter(bid => bid.creator.id !== user?.id).slice(0, 5).map((bid) => {
                const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
                const isWinning = isMyHighestBid(bid);
              
                return (
                  <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{bid.lotName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{bid.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span>📍 {bid.location}</span>
                          <span>📦 {bid.quantity} {bid.unit}</span>
                          <span>🏭 {bid.creator.company}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(bid.status)} variant="secondary">
                          {bid.status === 'published' ? 'New' : 'Active'}
                        </Badge>
                        {bid.images.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">📷 {bid.images.length} image(s)</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-xl font-bold text-green-600">${bid.currentPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Bids</p>
                          <p className="text-sm font-medium">{bid._count.bidEntries}</p>
                        </div>
                        {myBid && (
                          <div>
                            <p className="text-xs text-gray-500">My Bid</p>
                            <p className={`text-sm font-medium ${isWinning ? 'text-green-600' : 'text-orange-600'}`}>
                              ${myBid.amount.toLocaleString()}
                              {isWinning && ' 🏆'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={`/bid/${bid.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {bid.status !== 'closed' && new Date(bid.endDate) > new Date() && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              const amount = prompt(`Enter your bid amount (current: $${bid.currentPrice}):`);
                              if (amount && parseFloat(amount) > bid.currentPrice) {
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
                      Ends: {new Date(bid.endDate).toLocaleString()}
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

        {/* My Participations */}
        {myParticipations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Participations</CardTitle>
              <CardDescription>Auctions where you have placed bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myParticipations.slice(0, 3).map((bid) => {
                  const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
                  const isWinning = isMyHighestBid(bid);
                  
                  return (
                    <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold">{bid.lotName}</h3>
                        <p className="text-sm text-gray-600">{bid.wasteType} • {bid.location}</p>
                        <p className="text-sm text-gray-500">{bid.creator.company}</p>
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
                        <p className="text-lg font-semibold">${myBid?.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          Current: ${bid.currentPrice.toLocaleString()}
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
