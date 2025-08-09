import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';

// Modal for viewing documents
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
        <div className="max-h-96 overflow-y-auto">{children}</div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

const RecyclerDashboard = () => {
  const { user } = useAuth();

  const [allBids, setAllBids] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState([]);

  // Load available bids (not my own) and my participations
  useEffect(() => {
    let socket = null;
    async function fetchData() {
      try {
        setError(null);
        setLoading(true);

        // All published/in-progress bids
        const allBidsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/bids?status=published,in-progress`);
        if (!allBidsRes.ok) throw new Error(`Failed to fetch bids`);
        const allBidsRaw = await allBidsRes.json();
        setAllBids(allBidsRaw.map(bid => ({
          ...bid,
          bidEntries: bid.bidEntries || [],
          images: bid.images || [],
          _count: bid._count || { bidEntries: 0 },
          creator: bid.creator || { name: 'Unknown', company: 'Unknown' },
        })));

        // My participations (enriched, like in the reference)
        const myPartsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/participated/${user.id}`);
        if (!myPartsRes.ok) throw new Error(`Failed to fetch participations`);
        const myParts = await myPartsRes.json();
        setMyParticipations(myParts);

      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    if (user && user.id) {
      fetchData();

      socket = io(`${import.meta.env.VITE_API_URL}`);
      socket.on('notification', notification => {
        if (notification.type === 'BID_CLOSED') {
          setAllBids(prev => prev.map(b => b.id === notification.bidId ? { ...b, status: 'CLOSED' } : b));
        }
      });
      socket.on('bidUpdated', updatedBid => {
        setAllBids(prev => prev.map(b => b.id === updatedBid.id ? { ...b, ...updatedBid } : b));
      });

      const interval = setInterval(() => {
        const now = new Date();
        setAllBids(prev =>
          prev.map(b => (new Date(b.endDate) < now && b.status !== 'CLOSED') ? { ...b, status: 'CLOSED' } : b)
        );
      }, 60000);

      return () => {
        socket && socket.disconnect();
        clearInterval(interval);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const getImageUrls = images => images.map(image => ({
    id: image.id,
    originalName: (image.path || '/uploads/bids/missing-filename.jpg').split('/').pop() || 'missing-filename.jpg',
    url: `${import.meta.env.VITE_API_URL}${image.path || '/uploads/bids/missing-filename.jpg'}`,
  }));
  const handleViewDocuments = (bidId) => {
    const bid = allBids.find(b => b.id === bidId);
    if (!bid) { alert('Bid not found'); return; }
    setModalContent(getImageUrls(bid.images));
    setIsModalOpen(true);
  };
  // --- Stats derived only from myParticipations, which come straight from API ---
  const totalBidsPlaced = myParticipations.length;
  const activeBids = myParticipations.filter(b => b.status && b.status.toLowerCase() === 'in-progress').length;
  const wonBids = myParticipations.filter(b => b.isWinner && b.status && b.status.toLowerCase() === 'closed');
  const totalWonValue = wonBids.reduce((sum, b) => sum + (b.myBidAmount || 0), 0);

  // --- UI helpers
  const getStatusColor = (status, endDate) => {
    const isPast = new Date(endDate) < new Date();
    if (isPast || status?.toLowerCase() === 'closed') return 'bg-gray-300 text-gray-800';
    if (status?.toLowerCase() === 'published') return 'bg-blue-100 text-blue-800';
    if (status?.toLowerCase() === 'in-progress') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };
  const getStatusLabel = (status, endDate) => {
    const isPast = new Date(endDate) < new Date();
    if (isPast || status?.toLowerCase() === 'closed') return 'Closed';
    if (status?.toLowerCase() === 'published') return 'New';
    return 'Active';
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
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">🔒 Authentication Required</div>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Document Links">
        {modalContent.length > 0
          ? <ul className="space-y-2">{modalContent.map((doc, idx) => (
            <li key={doc.id} className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{idx + 1}.</span>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {doc.originalName}
              </a>
            </li>
          ))}</ul>
          : <p className="text-gray-600">No documents available.</p>}
      </Modal>

      {/* PARTICIPATION STATS BASED ON PARTICIPATED ENDPOINT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{totalBidsPlaced}</CardTitle>
            <CardDescription>Total Bids Placed</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-orange-600">{activeBids}</CardTitle>
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
            <CardTitle className="text-2xl font-bold text-blue-600">₹{totalWonValue.toLocaleString()}</CardTitle>
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
              <a href={`/dashboard/${user?.role}/upload-documents`} className="w-full h-20 text-lg">
                📄 Upload Documents
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
              .filter(bid => bid.creator?.id !== user?.id && bid.status &&
                bid.status.toLowerCase() === 'live').slice(0, 5)
              .map(bid => (
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
                      <Badge className={getStatusColor(bid.status, bid.endDate)} variant="secondary">
                        {getStatusLabel(bid.status, bid.endDate)}
                      </Badge>
                      {!!(bid.images || []).length &&
                        <p className="text-xs text-gray-500 mt-1">📷 {bid.images.length} image(s)</p>
                      }
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Current Price</p>
                        <p className="text-xl font-bold text-green-600">₹{(bid.currentPrice || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Bids</p>
                        <p className="text-sm font-medium">{bid._count?.bidEntries || 0}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewDocuments(bid.id)}>
                      View Documents
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Ends: {bid.endDate ? new Date(bid.endDate).toLocaleString() : 'Date TBD'}
                  </div>
                </div>
              ))}
          </div>
          {allBids.filter(bid => bid.creator?.id !== user?.id && bid.status &&
            bid.status.toLowerCase() === 'live').length === 0 && (
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
              {myParticipations.slice(0, 3).map(bid => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bid.lotName || 'Unnamed Lot'}</h3>
                    <p className="text-sm text-gray-600">{bid.wasteType || 'Unknown Type'} • {bid.location || 'Location TBD'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={bid.isWinner && bid.status && bid.status.toLowerCase() === 'closed'
                          ? 'bg-green-100 text-green-800'
                          : getStatusColor(bid.status, bid.endDate)}
                      >
                        {bid.isWinner && bid.status && bid.status.toLowerCase() === 'closed'
                          ? '🏆 Winner'
                          : (bid.status && bid.status.toLowerCase() === 'in-progress' ? 'Active' : 'Closed')}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold">
                      ₹{bid.myBidAmount?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Current: ₹{bid.currentPrice?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecyclerDashboard;
