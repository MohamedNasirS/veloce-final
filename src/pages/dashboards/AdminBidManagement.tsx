import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
import { Eye, Check, Clock, X } from 'lucide-react';

const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'LIVE', 'CLOSED', 'CANCELLED'];

const AdminBidManagement = () => {
  const { toast } = useToast();
  const [bids, setBids] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    axios.get('http://147.93.27.172:3001/api/bids')
      .then(res => setBids(res.data))
      .catch(err => console.error('Failed to load all bids', err));
  }, []);

  const handleApprove = async (bidId: string) => {
    try {
      await axios.patch(`http://147.93.27.172:3001/api/bids/${bidId}/approve`);
      setBids(prev => prev.map(bid => bid.id === bidId ? { ...bid, status: 'APPROVED' } : bid));
      toast({ title: '✅ Bid Approved' });
    } catch {
      toast({ title: 'Approval failed', variant: 'destructive' });
    }
  };

  const handleCancel = async (bidId: string) => {
    try {
      await axios.patch(`http://147.93.27.172:3001/api/bids/${bidId}/cancel`);
      setBids(prev => prev.map(bid => bid.id === bidId ? { ...bid, status: 'CANCELLED' } : bid));
      toast({ title: '❌ Bid Cancelled', variant: 'destructive' });
    } catch {
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
          <CardTitle>Bid Management</CardTitle>
          <CardDescription>Filter and manage bids based on their status</CardDescription>
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
                          src={`http://147.93.27.172:3001${img.path}`}
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
                                src={`http://147.93.27.172:3001${img.path}`}
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
