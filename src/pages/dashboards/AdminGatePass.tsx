import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
    winnerId?: string;
    creatorId: string;
    gatePassPath?: string | null;
    gatePassUploadedBy?: string | null;
    gatePassUploadedAt?: string | null;
    creator: {
        id: string;
        name: string;
        email: string;
        company?: string;
    };
    winner: {
        id: string;
        name: string;
        email: string;
        company?: string;
    };
    gatePassUploader?: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
}

const AdminGatePass: React.FC = () => {
    const { bidId } = useParams<{ bidId?: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [bid, setBid] = useState<WasteBid | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            toast({
                title: 'Unauthorized',
                description: 'Please log in to manage gate passes.',
                variant: 'destructive',
            });
            navigate('/login');
            return;
        }

        if (user.role !== 'admin') {
            toast({
                title: 'Unauthorized',
                description: 'Only admins can access this page.',
                variant: 'destructive',
            });
            navigate('/dashboard');
            return;
        }

        if (bidId) {
            fetchBidDetails();
        }
    }, [bidId, user, navigate, toast]);

    const fetchBidDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/gate-passes/${bidId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            setBid(response.data.bid);
            console.log('Fetched admin gate pass details:', response.data);
        } catch (error: any) {
            console.error('Error fetching bid details:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch bid details.',
                variant: 'destructive',
            });
            navigate('/dashboard/admin/gate-passes');
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

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/gate-passes/${bidId}/upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Update the bid state with new gate pass info
            setBid(prev => prev ? {
                ...prev,
                gatePassPath: response.data.gatePassPath,
                gatePassUploadedBy: user!.id,
                gatePassUploadedAt: response.data.uploadedAt,
                gatePassUploader: {
                    id: user!.id,
                    name: user!.name,
                    email: user!.email,
                    role: user!.role,
                },
            } : null);

            toast({
                title: 'Success',
                description: 'Gate pass uploaded successfully by admin.',
            });
        } catch (error: any) {
            console.error('Error uploading gate pass:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to upload gate pass.',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleViewGatePass = () => {
        if (bid?.gatePassPath) {
            window.open(`${import.meta.env.VITE_API_URL}${bid.gatePassPath}`, '_blank');
        }
    };

    const handleDownloadGatePass = () => {
        if (bid?.gatePassPath && bid) {
            const fullUrl = `${import.meta.env.VITE_API_URL}${bid.gatePassPath}`;
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = `admin-gate-pass-${bid.lotName.replace(/[^a-zA-Z0-9]/g, '-')}-${bidId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
                <Button onClick={() => navigate('/dashboard/admin/gate-passes')}>
                    Back to Gate Passes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Gate Pass Management</h1>
                <Button variant="outline" onClick={() => navigate('/dashboard/admin/gate-passes')}>
                    Back to Gate Passes
                </Button>
            </div>

            {/* Admin Notice */}
            <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                    <CardTitle className="text-purple-900">Admin Privileges</CardTitle>
                    <CardDescription className="text-purple-700">
                        As an admin, you can upload and manage gate passes for any closed bid with a selected winner.
                        Changes made here will be reflected in the waste generator's dashboard as well.
                    </CardDescription>
                </CardHeader>
            </Card>

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
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className="bg-green-100 text-green-800">Closed</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Waste Generator Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Waste Generator Information</CardTitle>
                    <CardDescription>Details of the bid creator</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold text-gray-900">{bid.creator?.name || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold text-gray-900">{bid.creator?.email || 'N/A'}</p>
                            </div>
                            {bid.creator?.company && (
                                <div>
                                    <p className="text-sm text-gray-600">Company</p>
                                    <p className="font-semibold text-gray-900">{bid.creator.company}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Winner Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Winner Information</CardTitle>
                    <CardDescription>Details of the winning bidder</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Winner Name</p>
                                <p className="font-semibold text-blue-900">{bid.winner?.name || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold text-blue-900">{bid.winner?.email || 'N/A'}</p>
                            </div>
                            {bid.winner?.company && (
                                <div>
                                    <p className="text-sm text-gray-600">Company</p>
                                    <p className="font-semibold text-blue-900">{bid.winner.company}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Winning Amount</p>
                                <p className="font-semibold text-green-600">₹{(bid.currentPrice || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gate Pass Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Gate Pass Management</CardTitle>
                    <CardDescription>Upload and manage gate pass for the winner (Admin Access)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {bid.gatePassPath ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        ✅ Gate Pass Uploaded
                                    </Badge>
                                    {bid.gatePassUploader && (
                                        <Badge
                                            variant="secondary"
                                            className={bid.gatePassUploader.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }
                                        >
                                            {bid.gatePassUploader.role === 'admin' ? '👑 Admin Uploaded' : '🏭 WG Uploaded'}
                                        </Badge>
                                    )}
                                    <Button variant="outline" size="sm" onClick={handleViewGatePass}>
                                        View Gate Pass
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleDownloadGatePass}>
                                        Download
                                    </Button>
                                </div>

                                {/* Upload Info */}
                                {bid.gatePassUploader && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <h4 className="font-medium text-green-900 mb-2">Upload Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="font-medium text-green-800">Uploaded by:</span> {bid.gatePassUploader.name} ({bid.gatePassUploader.role})
                                            </div>
                                            <div>
                                                <span className="font-medium text-green-800">Uploaded at:</span> {bid.gatePassUploadedAt ? new Date(bid.gatePassUploadedAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Replace Gate Pass (PDF only) - Admin Override:
                                    </label>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleGatePassUpload}
                                        disabled={uploading}
                                        className="w-full max-w-md"
                                    />
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-purple-600 mt-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                            <span className="text-sm">Uploading as admin...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    ⏳ Gate Pass Pending
                                </Badge>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Gate Pass (PDF only) - Admin Upload:
                                    </label>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleGatePassUpload}
                                        disabled={uploading}
                                        className="w-full max-w-md"
                                    />
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-purple-600 mt-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                            <span className="text-sm">Uploading as admin...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> As an admin, you can upload gate passes for any closed bid.
                                        This will be visible to both the waste generator and the winner.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminGatePass;