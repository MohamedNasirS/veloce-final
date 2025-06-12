
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { useMockBids } from '../../hooks/useMockData';
import { useToast } from '../../hooks/use-toast';

const SelectVenue = () => {
  const { bidId } = useParams();
  const { bids } = useMockBids();
  const { toast } = useToast();

  const [venueData, setVenueData] = useState({
    pickupDate: '',
    pickupTime: '',
    venue: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    specialInstructions: '',
    paymentMethod: '',
    paymentTerms: ''
  });

  const bid = bids.find(b => b.id === bidId);
  const winner = bid?.bids.find(b => b.rank === 1);

  if (!bid || !winner) {
    return <div>Bid or winner not found</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Venue & Payment Details Saved",
      description: "The winner has been notified about pickup details and payment terms.",
    });
    console.log('Venue and payment data:', venueData);
  };

  const handleChange = (field: string, value: string) => {
    setVenueData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Venue & Payment Details</CardTitle>
          <CardDescription>Configure pickup location and payment terms for the winning bidder</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Winner Info */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Selected Winner</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Bidder: {winner.bidderName}</p>
                <p>Winning Amount: <span className="font-semibold text-green-600">${winner.amount.toLocaleString()}</span></p>
              </div>
              <div>
                <p className="font-medium">Lot: {bid.lotName}</p>
                <p>Quantity: {bid.quantity} {bid.unit}</p>
              </div>
              <div>
                <p className="font-medium">Waste Type: {bid.wasteType}</p>
                <Badge className="bg-green-100 text-green-800">Winner Selected</Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pickup Details */}
            <div>
              <h3 className="font-semibold mb-4">Pickup Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupDate">Pickup Date</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={venueData.pickupDate}
                    onChange={(e) => handleChange('pickupDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTime">Pickup Time</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={venueData.pickupTime}
                    onChange={(e) => handleChange('pickupTime', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue/Location Name</Label>
                  <Input
                    id="venue"
                    value={venueData.venue}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    placeholder="e.g., Main Warehouse"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={venueData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="Contact person name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={venueData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="address">Complete Address</Label>
                <Textarea
                  id="address"
                  value={venueData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter complete pickup address with landmarks"
                  rows={3}
                  required
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={venueData.specialInstructions}
                  onChange={(e) => handleChange('specialInstructions', e.target.value)}
                  placeholder="Any special instructions for pickup (loading requirements, safety measures, etc.)"
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-semibold mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={venueData.paymentMethod} onValueChange={(value) => handleChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="digital-wallet">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={venueData.paymentTerms} onValueChange={(value) => handleChange('paymentTerms', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (On Pickup)</SelectItem>
                      <SelectItem value="7-days">7 Days</SelectItem>
                      <SelectItem value="15-days">15 Days</SelectItem>
                      <SelectItem value="30-days">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="w-full md:w-auto">
                Confirm Venue & Payment Details
              </Button>
              <Button type="button" variant="outline" className="w-full md:w-auto">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectVenue;
