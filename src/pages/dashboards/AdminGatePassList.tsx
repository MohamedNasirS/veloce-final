import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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

interface GatePassStats {
    totalClosedBids: number;
    pendingGatePasses: number;
    completedGatePasses: number;
    adminUploaded: number;
    wasteGeneratorUploaded: number;
    completionRate: number;
}

const AdminGatePassList: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [bids, setBids] = useState<WasteBid[]>([]);
    const [stats, setStats] = useState<GatePassStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!user) {
            toast({
                title: 'Unauthorized',
                description: 'Please log in to view gate passes.',
                variant: 'destructive',
            });
            navigate('/login');
            return;
        }

        if (user.role !== 'admin') {
            toast({
                title: 'Unauthorized',
                description: 'Only admins can view this page.',
                variant: 'destructive',
            });
            navigate('/dashboard');
            return;
        }

        fetchGatePassData();
        fetchGatePassStats();
    }, [user, navigate, toast]);

    const fetchGatePassData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/gate-passes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            setBids(response.data.bids);
            console.log('Fetched admin gate pass data:', response.data);
        } catch (error: any) {
            console.error('Error fetching gate pass data:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch gate pass data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchGatePassStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/gate-passes/stats/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            setStats(response.data);
        } catch (error: any) {
            console.error('Error fetching gate pass stats:', error);
        }
    };

    const filteredBids = bids.filter(bid => {
        switch (filter) {
            case 'all':
                return true;
            case 'pending':
                return !bid.gatePassPath;
            case 'completed':
                return bid.gatePassPath;
            case 'admin-uploaded':
                return bid.gatePassPath && bid.gatePassUploader?.role === 'admin';
            case 'waste-generator-uploaded':
                return bid.gatePassPath && bid.gatePassUploader?.role === 'waste_generator';
            default:
                return true;
        }
    });

    const getUploaderBadge = (bid: WasteBid) => {
        if (!bid.gatePassPath) return null;

        if (bid.gatePassUploader?.role === 'admin') {
            return <Badge variant="secondary" className="bg-purple-100 text-purple-800 ml-2">Admin Uploaded</Badge>;
        } else if (bid.gatePassUploader?.role === 'waste_generator') {
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800 ml-2">WG Uploaded</Badge>;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading gate passes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Gate Pass Management</h1>
                <Link to="/dashboard/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold">{stats.totalClosedBids}</CardTitle>
                            <CardDescription>Total Closed Bids</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pendingGatePasses}</CardTitle>
                            <CardDescription>Pending Gate Passes</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-green-600">{stats.completedGatePasses}</CardTitle>
                            <CardDescription>Completed Gate Passes</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-blue-600">{stats.completionRate}%</CardTitle>
                            <CardDescription>Completion Rate</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Additional Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold text-purple-600">{stats.adminUploaded}</CardTitle>
                            <CardDescription>Gate Passes Uploaded by Admin</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold text-blue-600">{stats.wasteGeneratorUploaded}</CardTitle>
                            <CardDescription>Gate Passes Uploaded by Waste Generators</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Filter Tabs */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gate Pass Management</CardTitle>
                            <CardDescription>Manage gate passes for all closed bids with selected winners</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'admin-uploaded', label: 'Admin Uploaded' },
                                { key: 'waste-generator-uploaded', label: 'WG Uploaded' },
                            ].map((status) => (
                                <Button
                                    key={status.key}
                                    variant={filter === status.key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilter(status.key)}
                                >
                                    {status.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredBids.map((bid) => (
                            <div
                                key={bid.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="font-semibold text-lg">{bid.lotName || 'Unnamed Lot'}</h3>
                                        <Badge
                                            variant="secondary"
                                            className={bid.gatePassPath ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                        >
                                            {bid.gatePassPath ? '✅ Gate Pass Uploaded' : '⏳ Gate Pass Pending'}
                                        </Badge>
                                        {getUploaderBadge(bid)}
                                    </div>

                                    {/* Bid Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                                        <div>
                                            <span className="font-medium">Waste Type:</span> {bid.wasteType}
                                        </div>
                                        <div>
                                            <span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}
                                        </div>
                                        <div>
                                            <span className="font-medium">Location:</span> {bid.location}
                                        </div>
                                        <div>
                                            <span className="font-medium">Final Amount:</span> ₹{(bid.currentPrice || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Creator Details */}
                                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                        <h4 className="font-medium text-gray-900 mb-2">Waste Generator Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-800">Name:</span> {bid.creator?.name || 'Unknown'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-800">Company:</span> {bid.creator?.company || 'N/A'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-800">Email:</span> {bid.creator?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Winner Details */}
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Winner Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="font-medium text-blue-800">Name:</span> {bid.winner?.name || 'Unknown'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-blue-800">Company:</span> {bid.winner?.company || 'N/A'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-blue-800">Email:</span> {bid.winner?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Info */}
                                    {bid.gatePassPath && bid.gatePassUploader && (
                                        <div className="bg-green-50 p-3 rounded-lg mt-3">
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
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <Link to={`/dashboard/admin/gate-passes/${bid.id}`}>
                                        <Button variant="outline" size="sm">
                                            {bid.gatePassPath ? 'Manage Gate Pass' : 'Upload Gate Pass'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {filteredBids.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">
                                    {filter === 'all' && '📋'}
                                    {filter === 'pending' && '⏳'}
                                    {filter === 'completed' && '✅'}
                                    {filter === 'admin-uploaded' && '👑'}
                                    {filter === 'waste-generator-uploaded' && '🏭'}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {filter === 'all' && 'No closed bids with winners found'}
                                    {filter === 'pending' && 'No pending gate passes'}
                                    {filter === 'completed' && 'No completed gate passes'}
                                    {filter === 'admin-uploaded' && 'No admin uploaded gate passes'}
                                    {filter === 'waste-generator-uploaded' && 'No waste generator uploaded gate passes'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {filter === 'all' && 'Closed bids with selected winners will appear here.'}
                                    {filter === 'pending' && 'All gate passes have been uploaded.'}
                                    {filter === 'completed' && 'Upload gate passes to see them here.'}
                                    {filter === 'admin-uploaded' && 'Gate passes uploaded by admin will appear here.'}
                                    {filter === 'waste-generator-uploaded' && 'Gate passes uploaded by waste generators will appear here.'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminGatePassList;