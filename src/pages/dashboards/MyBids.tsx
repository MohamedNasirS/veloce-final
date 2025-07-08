import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { RefreshCw } from 'lucide-react';

const MyBids = () => {
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyBids = () => {
    if (!user?.id) return;
    setLoading(true);
    axios
      .get(`http://147.93.27.172/api/bids/creator/${user.id}`)
      .then(res => setMyBids(res.data))
      .catch(err => console.error('Failed to fetch my bids', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyBids();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'LIVE': return 'bg-green-100 text-green-800 animate-pulse';
      case 'CLOSED': return 'bg-gray-500 text-white';
      case 'CANCELLED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">My Bids</CardTitle>
              <CardDescription>Manage and track your submitted auction listings</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total Listings:</span>
              <Badge variant="secondary">{myBids.length}</Badge>
              <Button variant="outline" size="sm" onClick={fetchMyBids} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBids.map(bid => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <p className="font-medium">{bid.lotName}</p>
                      <p className="text-xs text-muted-foreground">{bid.location}</p>
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(bid.status)}>
                        {bid.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div><b>Base:</b> ${bid.basePrice}</div>
                        <div><b>Now:</b> ${bid.currentPrice}</div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-gray-700">
                      <div><b>Start:</b> {new Date(bid.startDate).toLocaleString()}</div>
                      <div><b>End:</b> {new Date(bid.endDate).toLocaleString()}</div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {bid.participants?.length || 0} bid(s)
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        {bid.images?.map((img: any) => (
                          <img
                            key={img.id}
                            src={`http://147.93.27.172${img.path}`}
                            alt="Bid image"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {myBids.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              You haven't posted any bids yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBids;
