import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get('http://localhost:3001/api/admin/users')
      .then((res) => {
        // Filter out admin users
        const filtered = res.data.filter((u: any) => u.role !== 'admin');
        setUsers(filtered);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'waste_generator':
        return 'bg-blue-100 text-blue-800';
      case 'recycler':
        return 'bg-green-100 text-green-800';
      case 'aggregator':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:3001/api/admin/users/${userId}/status`, {
        status: newStatus,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isApproved: newStatus === 'approved' } : user
        )
      );
      toast({
        title: 'User Status Updated',
        description: `User status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Status update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDocuments = async (userId: string) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/admin/users/${userId}/documents`);
      setSelectedDocs(res.data.documents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    }
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
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.isApproved ? 'approved' : 'pending')}>
                      {user.isApproved ? 'approved' : 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        defaultValue={user.isApproved ? 'approved' : 'pending'}
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
                      <Button size="sm" variant="outline" onClick={() => handleViewDocuments(user.id)}>
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

      {/* Display selected documents */}
      {selectedDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5">
              {selectedDocs.map((doc, index) => (
                <li key={index}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
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
              {users.filter((u) => !u.isApproved).length}
            </CardTitle>
            <CardDescription>Pending Approval</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isApproved).length}
            </CardTitle>
            <CardDescription>Approved Users</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-red-600">0</CardTitle>
            <CardDescription>Rejected Users</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
