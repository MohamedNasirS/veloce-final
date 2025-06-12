
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import FileUpload from '../../components/FileUpload';
import { useMockBids } from '../../hooks/useMockData';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

const UploadProof = () => {
  const { user } = useAuth();
  const { bids } = useMockBids();
  const { toast } = useToast();

  const [selectedBid, setSelectedBid] = useState('');
  const [proofData, setProofData] = useState({
    driverLicense: null as File | null,
    vehicleRegistration: null as File | null,
    weighbridgeSlip: null as File | null,
    transportPermit: null as File | null,
    notes: ''
  });

  const wonBids = bids.filter(bid => 
    bid.bids.some(b => b.bidderId === user?.id && b.rank === 1) && 
    bid.status === 'closed'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBid) {
      toast({
        title: "Error",
        description: "Please select a bid to upload documents for.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Documents Uploaded Successfully",
      description: "Your proof documents have been submitted for verification.",
    });
    console.log('Uploading proof documents:', { selectedBid, proofData });
  };

  const handleFileChange = (field: string, file: File | null) => {
    setProofData(prev => ({ ...prev, [field]: file }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Proof Documents</CardTitle>
          <CardDescription>
            Upload required documents for waste pickup and transport verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="bidSelection">Select Won Bid</Label>
              <Select value={selectedBid} onValueChange={setSelectedBid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bid you've won" />
                </SelectTrigger>
                <SelectContent>
                  {wonBids.map((bid) => (
                    <SelectItem key={bid.id} value={bid.id}>
                      {bid.lotName} - ${bid.currentPrice.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBid && (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Selected Bid Details</h3>
                  {(() => {
                    const bid = bids.find(b => b.id === selectedBid);
                    return bid ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Lot: {bid.lotName}</p>
                          <p>Type: {bid.wasteType}</p>
                        </div>
                        <div>
                          <p className="font-medium">Quantity: {bid.quantity} {bid.unit}</p>
                          <p>Location: {bid.location}</p>
                        </div>
                        <div>
                          <p className="font-medium">Winning Amount: ${bid.currentPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    label="Driver's License"
                    value={proofData.driverLicense}
                    onChange={(file) => handleFileChange('driverLicense', file)}
                    required
                    description="Upload a clear photo of the driver's license"
                  />

                  <FileUpload
                    label="Vehicle Registration"
                    value={proofData.vehicleRegistration}
                    onChange={(file) => handleFileChange('vehicleRegistration', file)}
                    required
                    description="Upload vehicle registration certificate"
                  />

                  <FileUpload
                    label="Weighbridge Slip"
                    value={proofData.weighbridgeSlip}
                    onChange={(file) => handleFileChange('weighbridgeSlip', file)}
                    description="Upload weighbridge slip (if available)"
                  />

                  <FileUpload
                    label="Transport Permit"
                    value={proofData.transportPermit}
                    onChange={(file) => handleFileChange('transportPermit', file)}
                    description="Upload transport permit or pollution certificate"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={proofData.notes}
                    onChange={(e) => setProofData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information or notes about the pickup..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="w-full md:w-auto">
                    Upload Documents
                  </Button>
                  <Button type="button" variant="outline" className="w-full md:w-auto">
                    Save as Draft
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadProof;
