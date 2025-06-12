
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Eye, Check, X, Clock, ImageIcon } from 'lucide-react';

const AdminBidManagement = () => {
  const { toast } = useToast();
  
  // Mock pending bids data
  const [pendingBids, setPendingBids] = useState([
    {
      id: 'bid-001',
      lotName: 'Industrial Plastic Waste Lot #1',
      wasteType: 'Plastic',
      quantity: 500,
      unit: 'tons',
      location: 'Mumbai, Maharashtra',
      basePrice: 25000,
      createdBy: 'ABC Manufacturing',
      submittedAt: '2024-01-15T10:30:00Z',
      status: 'pending',
      description: 'High-quality plastic waste from manufacturing process. Clean and sorted.',
      images: ['plastic-waste-1.jpg', 'plastic-waste-2.jpg']
    },
    {
      id: 'bid-002',
      lotName: 'Electronic Waste Collection',
      wasteType: 'Electronic',
      quantity: 200,
      unit: 'pieces',
      location: 'Delhi, NCR',
      basePrice: 15000,
      createdBy: 'TechCorp Solutions',
      submittedAt: '2024-01-14T14:20:00Z',
      status: 'pending',
      description: 'Old computers, monitors, and electronic components. Functional condition.',
      images: ['e-waste-1.jpg']
    },
    {
      id: 'bid-003',
      lotName: 'Paper Waste Bulk Lot',
      wasteType: 'Paper',
      quantity: 1000,
      unit: 'kg',
      location: 'Bangalore, Karnataka',
      basePrice: 8000,
      createdBy: 'Print Media House',
      submittedAt: '2024-01-13T09:15:00Z',
      status: 'pending',
      description: 'Clean paper waste from printing operations. Mixed paper types.',
      images: ['paper-waste-1.jpg', 'paper-waste-2.jpg', 'paper-waste-3.jpg']
    }
  ]);

  const handleApprove = (bidId: string) => {
    setPendingBids(prev => prev.filter(bid => bid.id !== bidId));
    toast({
      title: "Bid Approved",
      description: "The bid has been approved and published for auction.",
    });
  };

  const handleDecline = (bidId: string) => {
    setPendingBids(prev => prev.filter(bid => bid.id !== bidId));
    toast({
      title: "Bid Declined",
      description: "The bid has been declined and the user has been notified.",
      variant: "destructive"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bid Management</CardTitle>
          <CardDescription>Review and approve waste listings submitted by generators</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Details</TableHead>
                <TableHead>Type & Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{bid.lotName}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(bid.submittedAt).toLocaleDateString()}
                      </p>
                      {bid.images.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          {bid.images.length} image(s)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{bid.wasteType}</p>
                      <p className="text-sm text-gray-600">{bid.quantity} {bid.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell>{bid.location}</TableCell>
                  <TableCell className="font-semibold">${bid.basePrice.toLocaleString()}</TableCell>
                  <TableCell>{bid.createdBy}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bid.status)}>
                      <Clock className="w-3 h-3 mr-1" />
                      {bid.status}
                    </Badge>
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
                            <DialogTitle>Bid Details - {bid.lotName}</DialogTitle>
                            <DialogDescription>Review the complete bid information</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium">Waste Type:</p>
                                <p className="text-gray-600">{bid.wasteType}</p>
                              </div>
                              <div>
                                <p className="font-medium">Quantity:</p>
                                <p className="text-gray-600">{bid.quantity} {bid.unit}</p>
                              </div>
                              <div>
                                <p className="font-medium">Location:</p>
                                <p className="text-gray-600">{bid.location}</p>
                              </div>
                              <div>
                                <p className="font-medium">Base Price:</p>
                                <p className="text-gray-600">${bid.basePrice.toLocaleString()}</p>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium mb-2">Description:</p>
                              <p className="text-gray-600">{bid.description}</p>
                            </div>
                            {bid.images.length > 0 && (
                              <div>
                                <p className="font-medium mb-2">Images:</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {bid.images.map((image, index) => (
                                    <div key={index} className="bg-gray-100 rounded-lg p-4 text-center">
                                      <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                      <p className="text-xs text-gray-600">{image}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button 
                                onClick={() => handleApprove(bid.id)} 
                                className="flex-1"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve Bid
                              </Button>
                              <Button 
                                onClick={() => handleDecline(bid.id)} 
                                variant="destructive" 
                                className="flex-1"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Decline Bid
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(bid.id)}
                        disabled={bid.status !== 'pending'}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDecline(bid.id)}
                        disabled={bid.status !== 'pending'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {pendingBids.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending bids to review</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBidManagement;
