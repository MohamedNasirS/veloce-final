import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/users`)
      .then((res) => {
        const filtered = res.data.filter((u: any) => u.role !== 'admin');
        setUsers(filtered);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch users.',
          variant: 'destructive',
        });
      });
  }, [toast]);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/status`, {
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/role`, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: 'User Role Updated',
        description: `User role has been changed to ${newRole.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Role update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log(`Attempting to delete user with ID: ${userId}`);
      
      // Try different approaches to handle CORS and routing issues
      let success = false;
      let response;
      
      // Approach 1: Use the environment variable (standard approach)
      try {
        console.log('Trying standard approach with environment variable');
        response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`);
        console.log('Standard approach successful:', response.data);
        success = true;
      } catch (error1) {
        console.error('Standard approach failed:', error1);
        
        // Approach 2: Direct URL to localhost (works in test script)
        try {
          console.log('Trying direct localhost URL');
          response = await axios.delete(`http://localhost:3001/api/admin/users/${userId}`);
          console.log('Direct localhost approach successful:', response.data);
          success = true;
        } catch (error2) {
          console.error('Direct localhost approach failed:', error2);
          
          // Approach 3: Use production URL
          try {
            console.log('Trying production URL');
            response = await axios.delete(`http://147.93.27.172:3001/api/admin/users/${userId}`);
            console.log('Production URL approach successful:', response.data);
            success = true;
          } catch (error3) {
            console.error('Production URL approach failed:', error3);
            
            // Approach 4: Use fetch instead of axios
            try {
              console.log('Trying fetch API');
              const fetchResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              if (fetchResponse.ok) {
                response = { data: await fetchResponse.json() };
                console.log('Fetch API approach successful:', response.data);
                success = true;
              } else {
                throw new Error(`Fetch API failed with status: ${fetchResponse.status}`);
              }
            } catch (error4) {
              console.error('Fetch API approach failed:', error4);
            }
          }
        }
      }
      
      if (success) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        toast({
          title: 'User Deleted',
          description: 'The user has been successfully deleted.',
        });
      } else {
        throw new Error('All deletion approaches failed');
      }
    } catch (error) {
      console.error('User deletion failed:', error);
      
      // Show more detailed error information
      let errorMessage = 'Failed to delete the user.';
      if (error.response) {
        errorMessage += ` Server responded with status ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage += ' No response received from server.';
      } else {
        errorMessage += ` ${error.message}`;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleViewDocuments = async (userId: string) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/documents`);
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
          <CardDescription>Manage user registrations, roles, and account status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead>Change Status</TableHead>
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
                      <Badge className={`mt-1 ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>
                     <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waste_generator">Waste Generator</SelectItem>
                          <SelectItem value="recycler">Recycler</SelectItem>
                          <SelectItem value="aggregator">Aggregator</SelectItem>
                        </SelectContent>
                      </Select>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDocuments(user.id)}>
                        Docs
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user
                              account and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
};

export default AdminUsers;