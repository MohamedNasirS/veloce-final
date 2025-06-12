
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';

const AdminUsers = () => {
  const { toast } = useToast();
  const [users] = useState([
    { id: '1', name: 'John Smith', email: 'generator@waste.com', role: 'waste-generator', company: 'Green Industries Inc.', status: 'approved', registeredDate: '2024-01-15' },
    { id: '2', name: 'Sarah Johnson', email: 'recycler@eco.com', role: 'recycler', company: 'EcoRecycle Ltd.', status: 'approved', registeredDate: '2024-01-20' },
    { id: '3', name: 'Mike Wilson', email: 'aggregator@aggregate.com', role: 'aggregator', company: 'Waste Aggregators Co.', status: 'pending', registeredDate: '2024-02-01' },
    { id: '4', name: 'Alice Brown', email: 'alice@newrecycler.com', role: 'recycler', company: 'New Recycler Co.', status: 'pending', registeredDate: '2024-02-05' },
    { id: '5', name: 'Bob Green', email: 'bob@rejected.com', role: 'waste-generator', company: 'Rejected Industries', status: 'rejected', registeredDate: '2024-01-10' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'waste-generator': return 'bg-blue-100 text-blue-800';
      case 'recycler': return 'bg-green-100 text-green-800';
      case 'aggregator': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    toast({
      title: "User Status Updated",
      description: `User status has been changed to ${newStatus}.`,
    });
    console.log(`Updating user ${userId} status to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user registrations and account status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(user.registeredDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select 
                        defaultValue={user.status}
                        onValueChange={(value) => handleStatusChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline">
                        View Documents
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{users.length}</CardTitle>
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.status === 'pending').length}
            </CardTitle>
            <CardDescription>Pending Approval</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'approved').length}
            </CardTitle>
            <CardDescription>Approved Users</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'rejected').length}
            </CardTitle>
            <CardDescription>Rejected Users</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
