import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`);
      const filtered = res.data.filter((u: any) => u.role !== 'admin');
      setUsers(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch users.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  // WebSocket connection and real-time updates
  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);

      // Authenticate with the WebSocket server
      newSocket.emit('authenticate', {
        userId: user.id,
        userRole: user.role,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for real-time user events
    newSocket.on('userRegistered', (data) => {
      console.log('User registered:', data);

      // Add new user to the list if not admin
      if (data.role !== 'admin') {
        setUsers(prevUsers => {
          // Check if user already exists to avoid duplicates
          const userExists = prevUsers.some(u => u.id === data.id);
          if (!userExists) {
            return [data, ...prevUsers];
          }
          return prevUsers;
        });

        toast({
          title: 'New User Registered',
          description: `${data.name} from ${data.company} has registered as ${data.role.replace('_', ' ')}.`,
        });
      }
    });

    newSocket.on('userApproved', (data) => {
      console.log('User approved:', data);

      // Update user status in the list
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === data.id
            ? { ...u, status: data.status, updatedAt: data.approvedAt }
            : u
        )
      );

      toast({
        title: 'User Approved',
        description: `${data.name} has been approved.`,
      });
    });

    newSocket.on('userRejected', (data) => {
      console.log('User rejected:', data);

      // Update user status in the list
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === data.id
            ? { ...u, status: data.status, updatedAt: data.rejectedAt }
            : u
        )
      );

      toast({
        title: 'User Rejected',
        description: `${data.name} has been rejected. Reason: ${data.reason}`,
        variant: 'destructive',
      });
    });

    // Listen for user status changes from admin actions
    newSocket.on('userStatusChangedAdmin', (data) => {
      console.log('User status changed (admin view):', data);

      // Update user status in the list
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === data.user.id
            ? { ...u, status: data.newStatus, updatedAt: new Date().toISOString() }
            : u
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, toast]);

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
      const token = localStorage.getItem('token');

      if (newStatus === 'approved') {
        // Use the new user approval endpoint that emits WebSocket events
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/${userId}/approve`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (newStatus === 'rejected') {
        // Use the new user rejection endpoint that emits WebSocket events
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/${userId}/reject`, {
          reason: 'Status changed by admin'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // For other status changes, use the old endpoint
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/status`, {
          status: newStatus,
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Manually refresh for non-WebSocket status changes
        await fetchUsers();
      }

      // Note: No need to refresh users list for approve/reject as WebSocket will handle it
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

      // Refresh the users data from the server to ensure we have the latest state
      await fetchUsers();

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
            response = await axios.delete(`http://localhost:3001/api/admin/users/${userId}`);
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
        // Refresh the users data from the server to ensure we have the latest state
        await fetchUsers();
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user registrations, roles, and account status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
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
                      <div className="flex gap-2 mt-1">
                        <Badge className={`${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getStatusColor(user.status ? user.status.toLowerCase() : 'pending')}`}>
                          {user.status ? user.status.toLowerCase() : 'pending'}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
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
                      value={user.status ? user.status.toLowerCase() : 'pending'}
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