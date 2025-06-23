import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';

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
    id: string;
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

const LiveBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<WasteBid[]>([]);
  const [filteredBids, setFilteredBids] = useState<WasteBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('endDate');

  useEffect(() => {
    fetchLiveBids();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveBids, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortBids();
  }, [bids, searchTerm, wasteTypeFilter, locationFilter, sortBy]);

  const fetchLiveBids = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bids?status=published,in-progress');
      if (response.ok) {
        const data = await response.json();
        setBids(data);
      }
    } catch (error) {
      console.error('Error fetching live bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBids = () => {
    let filtered = bids.filter(bid => {
      // Exclude own bids
      if (bid.creator.id === user?.id) return false;
      
      // Search filter
      if (searchTerm && !bid.lotName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !bid.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !bid.wasteType.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Waste type filter
      if (wasteTypeFilter !== 'all' && bid.wasteType !== wasteTypeFilter) {
        return false;
      }
      
      // Location filter
      if (locationFilter !== 'all' && bid.location !== locationFilter) {
        return false;
      }
      
      return true;
    });

    // Sort bids
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'endDate':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'bids':
          return b._count.bidEntries - a._count.bidEntries;
        case 'newest':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        default:
          return 0;
      }
    });

    setFilteredBids(filtered);
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
      fetchLiveBids(); // Refresh data
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to place bid');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  const isMyHighestBid = (bid: WasteBid) => {
    const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
    return myBid && myBid.amount === bid.currentPrice;
  };

  const uniqueWasteTypes = Array.from(new Set(bids.map(bid => bid.wasteType)));
  const uniqueLocations = Array.from(new Set(bids.map(bid => bid.location)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔴 Live Bids</h1>
          <p className="text-gray-600 mt-1">Active waste auctions you can participate in</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Auto-refreshing</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Search bids..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Waste Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueWasteTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="endDate">Ending Soon</SelectItem>
                  <SelectItem value="price">Highest Price</SelectItem>
                  <SelectItem value="bids">Most Bids</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
                            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="endDate">Ending Soon</SelectItem>
                  <SelectItem value="price">Highest Price</SelectItem>
                  <SelectItem value="bids">Most Bids</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setWasteTypeFilter('all');
                  setLocationFilter('all');
                  setSortBy('endDate');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{filteredBids.length}</CardTitle>
            <CardDescription>Active Auctions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {filteredBids.filter(bid => bid.bidEntries.some(entry => entry.bidderId === user?.id)).length}
            </CardTitle>
            <CardDescription>My Participations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {filteredBids.filter(bid => getTimeRemaining(bid.endDate).includes('h')).length}
            </CardTitle>
            <CardDescription>Ending Today</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              ${filteredBids.reduce((sum, bid) => sum + bid.currentPrice, 0).toLocaleString()}
            </CardTitle>
            <CardDescription>Total Value</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Bids Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBids.map((bid) => {
          const myBid = bid.bidEntries.find(entry => entry.bidderId === user?.id);
          const isWinning = isMyHighestBid(bid);
          const timeRemaining = getTimeRemaining(bid.endDate);
          const isEndingSoon = timeRemaining.includes('h') || timeRemaining === 'Ending soon';
          
          return (
            <Card key={bid.id} className={`hover:shadow-lg transition-shadow ${isEndingSoon ? 'ring-2 ring-orange-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{bid.lotName}</CardTitle>
                    <CardDescription className="line-clamp-2">{bid.description}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(bid.status)} variant="secondary">
                      {bid.status === 'published' ? 'New' : 'Active'}
                    </Badge>
                    {isEndingSoon && (
                      <Badge className="bg-red-100 text-red-800" variant="secondary">
                        🔥 Hot
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Bid Image */}
                {bid.images.length > 0 && (
                  <div className="relative">
                    <img
                      src={`http://localhost:3001/api/bids/images/${bid.images[0].id}`}
                      alt={bid.lotName}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {bid.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        +{bid.images.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {/* Bid Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{bid.wasteType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{bid.quantity} {bid.unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{bid.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium line-clamp-1">{bid.creator.company}</p>
                  </div>
                </div>

                {/* Current Price */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${bid.currentPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Bids</p>
                      <p className="text-lg font-semibold">{bid._count.bidEntries}</p>
                    </div>
                  </div>
                  
                  {myBid && (
                    <div className="mt-2 pt-2 border-t">
                      <p className={`text-sm ${isWinning ? 'text-green-600' : 'text-orange-600'}`}>
                        Your bid: ${myBid.amount.toLocaleString()}
                        {isWinning ? ' 🏆 Winning!' : ' 📊 Outbid'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Remaining */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Time Left</p>
                    <p className={`font-medium ${isEndingSoon ? 'text-red-600' : 'text-gray-900'}`}>
                      {timeRemaining}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="font-medium">${bid.basePrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/bid/${bid.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  
                  {timeRemaining !== 'Ended' && (
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        const amount = prompt(`Enter your bid amount (current: $${bid.currentPrice}):`);
                        if (amount && parseFloat(amount) > bid.currentPrice) {
                          placeBid(bid.id, parseFloat(amount));
                        } else if (amount) {
                          alert('Bid amount must be higher than current price');
                        }
                      }}
                    >
                      {myBid ? 'Increase Bid' : 'Place Bid'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBids.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No active bids found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || wasteTypeFilter !== 'all' || locationFilter !== 'all' 
                ? 'Try adjusting your filters to see more results'
                : 'Check back later for new waste auctions'
              }
            </p>
            {(searchTerm || wasteTypeFilter !== 'all' || locationFilter !== 'all') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setWasteTypeFilter('all');
                  setLocationFilter('all');
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        <p>🔄 Page auto-refreshes every 30 seconds to show latest bids</p>
      </div>
    </div>
  );
};

export default LiveBids;


