import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import {
    TrendingUp,
    TrendingDown,
    Award,
    Target,
    CheckCircle,
    Clock,
    Building2,
    Users,
    BarChart3,
    Zap
} from 'lucide-react';

interface VendorSuccessRate {
    userId: string;
    userName: string;
    userEmail: string;
    company: string;
    totalWonBids: number;
    completedPickups: number;
    successRate: number;
    totalBidsCreated: number;
    activeBids: number;
    totalRevenue: number;
    averageBidValue: number;
    lastActivityDate: string | null;
    status: string;
    role: string;
}

interface VendorSuccessRateCardProps {
    userId?: string; // If provided, shows specific user's rate
    showTopPerformers?: boolean; // If true, shows top performers list
    showStats?: boolean; // If true, shows overall statistics
    compact?: boolean; // If true, shows compact version
    minimal?: boolean; // If true, shows minimal stat card version (like other dashboard cards)
    limit?: number; // Number of top performers to show
}

const VendorSuccessRateCard: React.FC<VendorSuccessRateCardProps> = ({
    userId,
    showTopPerformers = false,
    showStats = false,
    compact = false,
    minimal = false,
    limit = 5
}) => {
    const { user } = useAuth();
    const [vendorData, setVendorData] = useState<VendorSuccessRate | null>(null);
    const [topPerformers, setTopPerformers] = useState<VendorSuccessRate[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [userId, showTopPerformers, showStats, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // Fetch specific user's success rate
            if (userId) {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/vendor-metrics/success-rate/${userId}`,
                    { headers }
                );
                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                }
            }

            // Fetch top performers
            if (showTopPerformers) {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/vendor-metrics/top-performers?limit=${limit}`,
                    { headers }
                );
                if (response.ok) {
                    const data = await response.json();
                    setTopPerformers(data);
                }
            }

            // Fetch overall stats
            if (showStats) {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/vendor-metrics/performance-stats`,
                    { headers }
                );
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            }

        } catch (err) {
            setError('Failed to load vendor success rate data');
            console.error('Error fetching vendor metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 80) return 'text-green-600';
        if (rate >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSuccessRateBadgeColor = (rate: number) => {
        if (rate >= 80) return 'bg-green-100 text-green-800';
        if (rate >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getPerformanceIcon = (rate: number) => {
        if (rate >= 80) return <Award className="h-4 w-4 text-green-600" />;
        if (rate >= 50) return <Target className="h-4 w-4 text-yellow-600" />;
        return <Clock className="h-4 w-4 text-red-600" />;
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'waste_generator':
                return <Building2 className="h-4 w-4 text-blue-600" />;
            case 'recycler':
                return <Zap className="h-4 w-4 text-green-600" />;
            case 'aggregator':
                return <Users className="h-4 w-4 text-purple-600" />;
            default:
                return <Users className="h-4 w-4 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <Card className={compact ? "p-4" : ""}>
                <CardContent className="flex items-center justify-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading success rates...</span>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={compact ? "p-4" : ""}>
                <CardContent className="flex items-center justify-center p-6 text-red-600">
                    <span>{error}</span>
                </CardContent>
            </Card>
        );
    }

    // Render minimal version (matches other stat cards)
    if (userId && vendorData && minimal) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className={`text-2xl font-bold ${getSuccessRateColor(vendorData.successRate)}`}>
                        {vendorData.successRate.toFixed(1)}%
                    </CardTitle>
                    <CardDescription>Success Rate</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Render specific user's success rate
    if (userId && vendorData) {
        return (
            <Card className={compact ? "p-4" : ""}>
                <CardHeader className={compact ? "pb-2" : ""}>
                    <CardTitle className="flex items-center gap-2">
                        {getPerformanceIcon(vendorData.successRate)}
                        {compact ? "Success Rate" : "Vendor Performance"}
                    </CardTitle>
                    {!compact && (
                        <CardDescription>
                            Performance metrics based on completed pickups vs won bids
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Main Success Rate Display */}
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${getSuccessRateColor(vendorData.successRate)}`}>
                                {vendorData.successRate.toFixed(1)}%
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                            <Progress
                                value={vendorData.successRate}
                                className="mt-2"
                            />
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-semibold text-lg">{vendorData.completedPickups}</div>
                                <div className="text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-lg">{vendorData.totalWonBids}</div>
                                <div className="text-gray-600">Won Bids</div>
                            </div>
                        </div>

                        {!compact && (
                            <>
                                {/* Additional Metrics */}
                                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                                    <div>
                                        <div className="font-medium">Total Revenue</div>
                                        <div className="text-green-600">₹{vendorData.totalRevenue.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Active Bids</div>
                                        <div className="text-blue-600">{vendorData.activeBids}</div>
                                    </div>
                                </div>

                                {/* Performance Badge */}
                                <div className="flex justify-center">
                                    <Badge className={getSuccessRateBadgeColor(vendorData.successRate)}>
                                        {vendorData.successRate >= 80 ? 'High Performer' :
                                            vendorData.successRate >= 50 ? 'Good Performer' : 'Needs Improvement'}
                                    </Badge>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Render top performers list
    if (showTopPerformers && topPerformers.length > 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Top Performing Vendors
                    </CardTitle>
                    <CardDescription>
                        Vendors with highest success rates based on completed pickups
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topPerformers.map((vendor, index) => (
                            <div key={vendor.userId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(vendor.role)}
                                        <div>
                                            <div className="font-semibold">{vendor.userName}</div>
                                            <div className="text-sm text-gray-600">{vendor.company}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-bold ${getSuccessRateColor(vendor.successRate)}`}>
                                        {vendor.successRate.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {vendor.completedPickups}/{vendor.totalWonBids} completed
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Render overall statistics
    if (showStats && stats) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Vendor Performance Statistics
                    </CardTitle>
                    <CardDescription>
                        Platform-wide vendor performance metrics and insights
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Key Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.totalVendors}</div>
                                <div className="text-sm text-gray-600">Total Vendors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.activeVendors}</div>
                                <div className="text-sm text-gray-600">Active Vendors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.averageSuccessRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">Avg Success Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{stats.totalCompletedPickups}</div>
                                <div className="text-sm text-gray-600">Total Pickups</div>
                            </div>
                        </div>

                        {/* Performance Distribution */}
                        <div>
                            <h4 className="font-semibold mb-3">Performance Distribution</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">High Performers (≥80%)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${stats.activeVendors > 0 ? (stats.performanceDistribution.high / stats.activeVendors) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">{stats.performanceDistribution.high}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Good Performers (50-79%)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full"
                                                style={{ width: `${stats.activeVendors > 0 ? (stats.performanceDistribution.medium / stats.activeVendors) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">{stats.performanceDistribution.medium}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Needs Improvement (&lt;50%)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full"
                                                style={{ width: `${stats.activeVendors > 0 ? (stats.performanceDistribution.low / stats.activeVendors) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">{stats.performanceDistribution.low}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="border-t pt-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</div>
                                <div className="text-sm text-gray-600">Total Platform Revenue</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
};

export default VendorSuccessRateCard;