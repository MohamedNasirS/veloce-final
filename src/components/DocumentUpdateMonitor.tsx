import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { FileText, User, Clock, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface DocumentUpdateEvent {
    type: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        company: string;
        role: string;
    };
    updatedFields: string[];
    message: string;
    timestamp: string;
}

interface UserStatusChangeEvent {
    type: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        company: string;
        role: string;
    };
    newStatus: string;
    reason: string;
    message: string;
    timestamp: string;
}

const DocumentUpdateMonitor: React.FC = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [documentEvents, setDocumentEvents] = useState<DocumentUpdateEvent[]>([]);
    const [statusEvents, setStatusEvents] = useState<UserStatusChangeEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
                transports: ['websocket'],
                upgrade: true,
            });

            newSocket.on('connect', () => {
                console.log('DocumentUpdateMonitor: Connected to WebSocket');
                setIsConnected(true);

                // Authenticate as admin
                newSocket.emit('authenticate', {
                    userId: user.id,
                    userRole: user.role,
                });
            });

            newSocket.on('disconnect', () => {
                console.log('DocumentUpdateMonitor: Disconnected from WebSocket');
                setIsConnected(false);
            });

            // Listen for document update events
            newSocket.on('documentUpdated', (data: DocumentUpdateEvent) => {
                console.log('Document updated event received:', data);
                setDocumentEvents(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 events
            });

            // Listen for user status changes due to document updates
            newSocket.on('userStatusChangedDocuments', (data: UserStatusChangeEvent) => {
                console.log('User status changed due to documents:', data);
                setStatusEvents(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 events
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]);

    const getDocumentLabel = (field: string) => {
        const labels = {
            gstCertificatePath: 'GST Certificate',
            panCardPath: 'PAN Card',
            bankDocumentPath: 'Bank Document',
            authorizedSignatoryPath: 'Authorized Signatory',
            companyRegistrationPath: 'Company Registration'
        };
        return labels[field] || field;
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'waste_generator':
                return <Building2 className="h-4 w-4 text-blue-600" />;
            case 'recycler':
                return <FileText className="h-4 w-4 text-green-600" />;
            case 'aggregator':
                return <FileText className="h-4 w-4 text-purple-600" />;
            default:
                return <User className="h-4 w-4 text-gray-600" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
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

    const getStatusBadgeColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-orange-100 text-orange-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const clearEvents = () => {
        setDocumentEvents([]);
        setStatusEvents([]);
    };

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Document Update Monitor
                    </h2>
                    <p className="text-gray-600 mt-1">Real-time monitoring of vendor document uploads and updates</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearEvents}>
                        Clear Events
                    </Button>
                </div>
            </div>

            {/* Document Updates */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Recent Document Updates
                    </CardTitle>
                    <CardDescription>
                        Live feed of vendor document uploads and modifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documentEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No document updates yet. Waiting for vendor activity...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documentEvents.map((event, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {getRoleIcon(event.user.role)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{event.user.name}</span>
                                                    <Badge variant="secondary" className={getRoleBadgeColor(event.user.role)}>
                                                        {event.user.role.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{event.user.company}</p>
                                                <p className="text-sm text-gray-800 mb-2">{event.message}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {event.updatedFields.map((field) => (
                                                        <Badge key={field} variant="outline" className="text-xs">
                                                            {getDocumentLabel(field)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status Changes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Status Changes Due to Document Updates
                    </CardTitle>
                    <CardDescription>
                        User status changes triggered by document modifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {statusEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No status changes yet. Waiting for document-triggered status updates...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {statusEvents.map((event, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {event.newStatus.toLowerCase() === 'pending' ? (
                                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                            ) : event.newStatus.toLowerCase() === 'approved' ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{event.user.name}</span>
                                                    <Badge variant="secondary" className={getRoleBadgeColor(event.user.role)}>
                                                        {event.user.role.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge variant="secondary" className={getStatusBadgeColor(event.newStatus)}>
                                                        {event.newStatus}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{event.user.company}</p>
                                                <p className="text-sm text-gray-800 mb-1">{event.message}</p>
                                                <p className="text-xs text-gray-500">{event.reason}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DocumentUpdateMonitor;