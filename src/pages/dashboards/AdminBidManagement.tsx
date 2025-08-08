import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Eye, Check, Clock, X, Plus } from 'lucide-react';

const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'LIVE', 'CLOSED', 'CANCELLED'];

const AdminBidManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  // Fetch initial bids
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/bids`)
      .then(res => setBids(res.data))
      .catch(err => console.error('Failed to load all bids', err));
  }, []);

  // 🚀 ENHANCED WebSocket connection using custom hook
  const { isConnected, connectionError } = useWebSocket({
    autoConnect: user?.role === 'admin',
    onNewBidCreated: (event) => {
      console.log('[AdminBidManagement] 🆕 IMMEDIATE: New bid created received:', event);

      setBids(prev => {
        // Check if bid already exists to avoid duplicates
        const existingBid = prev.find(bid => bid.id === event.bid.id);
        if (existingBid) {
          console.log('[AdminBidManagement] Bid already exists, skipping duplicate');
          return prev;
        }

        console.log('[AdminBidManagement] Adding new bid to list:', event.bid.lotName);
        // Add new bid to the beginning of the list
        return [event.bid, ...prev];
      });

      // Show toast notification with new bid icon
      toast({
        title: '🆕 New Bid Created!',
        description: `"${event.bid.lotName}" by ${event.bid.creator?.company}`,
      });
    },
    onBidStatusChanged: (event) => {
      console.log('[AdminBidManagement] 📋 IMMEDIATE: Bid status changed received:', event);
      console.log('[AdminBidManagement] Updating bid:', event.bid.id, 'from', event.oldStatus, 'to', event.newStatus);

      setBids(prev => {
        const updatedBids = prev.map(bid =>
          bid.id === event.bid.id
            ? { ...bid, status: event.newStatus }
            : bid
        );

        console.log('[AdminBidManagement] Bid list updated');
        return updatedBids;
      });

      // Show toast notification for status change
      toast({
        title: `📋 Bid ${event.newStatus}`,
        description: `"${event.bid.lotName}" status changed to ${event.newStatus}`,
      });
    },
    onBidUpdated: (event) => {
      console.log('[AdminBidManagement] 🔄 IMMEDIATE: Bid updated received:', event);

      setBids(prev => prev.map(bid =>
        bid.id === event.bid.id ? { ...bid, ...event.bid } : bid
      ));
    }
  });

  const handleApprove = async (bidId: string) => {
    try {
      console.log('[AdminBidManagement] Approving bid:', bidId);
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/approve`);
      // ✅ Don't update local state - WebSocket will handle the real-time update
      console.log('[AdminBidManagement] Bid approval request sent, waiting for WebSocket update');
    } catch (error) {
      console.error('[AdminBidManagement] Approval failed:', error);
      toast({ title: 'Approval failed', variant: 'destructive' });
    }
  };

  const handleCancel = async (bidId: string) => {
    try {
      console.log('[AdminBidManagement] Cancelling bid:', bidId);
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/bids/${bidId}/cancel`);
      // ✅ Don't update local state - WebSocket will handle the real-time update
      console.log('[AdminBidManagement] Bid cancellation request sent, waiting for WebSocket update');
    } catch (error) {
      console.error('[AdminBidManagement] Cancellation failed:', error);
      toast({ title: 'Cancellation failed', variant: 'destructive' });
    }
  };

  const filteredBids = filter === 'ALL' ? bids : bids.filter(bid => bid.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'LIVE': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-300 text-gray-800';
      case 'CANCELLED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bid Management
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
              </span>
              {connectionError && (
                <span className="text-xs text-red-600">({connectionError})</span>
              )}
            </div>
          </CardTitle>
          <CardDescription>Filter and manage bids based on their status - Real-time updates enabled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {statusOptions.map(status => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map(bid => (
                <TableRow key={bid.id}>
                  <TableCell>{bid.lotName}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bid.status)}>
                      <Clock className="w-3 h-3 mr-1" />
                      {bid.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{bid.wasteType} – {bid.quantity} {bid.unit}</TableCell>
                  <TableCell>{bid.location}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {bid.images.map((img: any) => (
                        <img
                          key={img.id}
                          src={`${import.meta.env.VITE_API_URL}${img.path}`}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{bid.lotName}</DialogTitle>
                            <DialogDescription>{bid.description}</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div><b>Company:</b> {bid.creator?.company}</div>
                            <div><b>Location:</b> {bid.location}</div>
                            <div><b>Quantity:</b> {bid.quantity} {bid.unit}</div>
                            <div><b>Base Price:</b> ${bid.basePrice}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {bid.images.map((img: any) => (
                              <img
                                key={img.id}
                                src={`${import.meta.env.VITE_API_URL}${img.path}`}
                                className="w-full rounded"
                              />
                            ))}
                          </div>

                          {bid.status === 'PENDING' && (
                            <div className="flex gap-2 mt-6">
                              <Button onClick={() => handleApprove(bid.id)} className="flex-1">
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button onClick={() => handleCancel(bid.id)} variant="destructive" className="flex-1">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBids.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              No bids for status: {filter}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBidManagement;
