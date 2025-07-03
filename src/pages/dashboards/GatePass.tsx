import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { WasteBid } from '../../types';

const GatePass: React.FC = () => {
  const { bidId } = useParams<{ bidId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bid, setBid] = useState<WasteBid | null>(null);
  const [gatePassPath, setGatePassPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bidId && user?.id) {
      fetchBidDetails();
      fetchGatePassStatus();
    }
  }, [bidId, user]);

  const fetchBidDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/bids/${bidId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'CLOSED') {
        toast({
          title: 'Invalid Bid',
          description: 'Gate passes can only be managed for closed bids.',
          variant: 'destructive',
        });
        navigate('/dashboard/waste_generator');
        return;
      }
      setBid(data);
    } catch (error) {
      console.error('Error fetching bid details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bid details.',
        variant: 'destructive',
      });
    }
  };

  const fetchGatePassStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3001/bids/${bidId}/gate-pass?userId=${user?.id}`);
      if (response.ok) {
        const { gatePassPath } = await response.json();
        setGatePassPath(gatePassPath);
      }
    } catch (error) {
      console.error('Error fetching gate pass status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGatePassUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File',
        description: 'Only PDF files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('gatePass', file);
    formData.append('userId', user!.id);

    try {
      const response = await fetch(`http://localhost:3001/bids/${bidId}/gate-pass`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload gate pass');
      }

      const result = await response.json();
      setGatePassPath(result.gatePassPath);
      toast({
        title: 'Success',
        description: 'Gate pass uploaded successfully.',
      });
      console.log('Gate pass uploaded:', { bidId, gatePassPath: result.gatePassPath });
    } catch (error: any) {
      console.error('Error uploading gate pass:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload gate pass.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleViewGatePass = () => {
    if (gatePassPath) {
      const fullUrl = `http://localhost:3001${gatePassPath}`;
      window.open(fullUrl, '_blank');
      console.log('Viewing gate pass:', { bidId, gatePassPath, fullUrl });
    }
  };

  const handleDownloadGatePass = () => {
    if (gatePassPath && bid) {
      const fullUrl = `http://localhost:3001${gatePassPath}`;
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `gate-pass-${bid.lotName.replace(/[^a-zA-Z0-9]/g, '-')}-${bidId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Downloading gate pass:', { bidId, gatePassPath, fullUrl });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">Bid Not Found</h2>
        <Button onClick={() => navigate('/dashboard/waste_generator')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gate Pass Management</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard/waste_generator')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Bid Information */}
      <Card>
        <CardHeader>
          <CardTitle>Bid Information</CardTitle>
          <CardDescription>Details of the closed waste lot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Lot Name</p>
              <p className="font-semibold">{bid.lotName || 'Unnamed Lot'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Waste Type</p>
              <p className="font-semibold">{bid.wasteType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-semibold">{bid.quantity} {bid.unit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-semibold">{bid.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Winning Amount</p>
              <p className="font-semibold text-green-600">₹{(bid.currentPrice || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Winner</p>
              <p className="font-semibold">{bid.winner?.name || 'Not selected'}</p>
              {bid.winner?.company && (
                <p className="text-sm text-gray-600">{bid.winner.company}</p>
              )}
              {bid.winner?.email && (
                <p className="text-sm text-gray-600">{bid.winner.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gate Pass Section */}
      <Card>
        <CardHeader>
          <CardTitle>Gate Pass Management</CardTitle>
          <CardDescription>Manage gate pass for the winning bidder</CardDescription>
        </CardHeader>
        <CardContent>
          {!bid.winner ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please select a winner first before managing a gate pass.</p>
              <Button onClick={() => navigate(`/dashboard/waste_generator/select-winner/${bid.id}`)}>
                Select Winner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {gatePassPath ? (
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✅ Gate Pass Uploaded
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewGatePass}
                  >
                    View Gate Pass
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadGatePass}
                  >
                    Download
                  </Button>
                  <div className="ml-4">
                    <label className="text-sm text-gray-600">
                      Replace Gate Pass (PDF only):
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={handleGatePassUpload}
                        disabled={uploading}
                        className="mt-1 w-auto"
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    ⏳ Gate Pass Pending
                  </Badge>
                  <div>
                    <label className="text-sm text-gray-600">
                      Upload Gate Pass (PDF only):
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={handleGatePassUpload}
                        disabled={uploading}
                        className="mt-1 w-auto"
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GatePass;