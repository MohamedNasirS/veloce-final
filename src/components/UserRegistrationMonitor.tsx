import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UserEvent {
    id: string;
    name: string;
    email: string;
    company: string;
    role: string;
    status: string;
    createdAt?: string;
    approvedBy?: string;
    rejectedBy?: string;
    reason?: string;
    timestamp: string;
    eventType: 'registered' | 'approved' | 'rejected';
}

const UserRegistrationMonitor: React.FC = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to WebSocket server
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setIsConnected(false);
        });

        // Listen for user registration events
        newSocket.on('userRegistered', (data) => {
            console.log('User registered:', data);
            const event: UserEvent = {
                ...data,
                timestamp: new Date().toISOString(),
                eventType: 'registered',
            };
            setEvents(prev => [event, ...prev]);
        });

        // Listen for user approval events
        newSocket.on('userApproved', (data) => {
            console.log('User approved:', data);
            const event: UserEvent = {
                ...data,
                timestamp: new Date().toISOString(),
                eventType: 'approved',
            };
            setEvents(prev => [event, ...prev]);
        });

        // Listen for user rejection events
        newSocket.on('userRejected', (data) => {
            console.log('User rejected:', data);
            const event: UserEvent = {
                ...data,
                timestamp: new Date().toISOString(),
                eventType: 'rejected',
            };
            setEvents(prev => [event, ...prev]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const getEventColor = (eventType: string) => {
        switch (eventType) {
            case 'registered':
                return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'approved':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'rejected':
                return 'bg-red-100 border-red-300 text-red-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    User Registration Monitor
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                }`}
                        />
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <button
                        onClick={clearEvents}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                    >
                        Clear Events
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No events yet. Waiting for user registration activities...
                    </div>
                ) : (
                    events.map((event, index) => (
                        <div
                            key={`${event.id}-${event.timestamp}-${index}`}
                            className={`p-4 rounded-lg border-2 ${getEventColor(event.eventType)}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">
                                    User {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                                </h3>
                                <span className="text-xs opacity-75">
                                    {new Date(event.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>Name:</strong> {event.name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {event.email}
                                </div>
                                <div>
                                    <strong>Company:</strong> {event.company}
                                </div>
                                <div>
                                    <strong>Role:</strong> {event.role}
                                </div>
                                <div>
                                    <strong>Status:</strong> {event.status}
                                </div>
                                <div>
                                    <strong>User ID:</strong> {event.id}
                                </div>
                            </div>

                            {event.eventType === 'approved' && event.approvedBy && (
                                <div className="mt-2 text-sm">
                                    <strong>Approved by:</strong> {event.approvedBy}
                                </div>
                            )}

                            {event.eventType === 'rejected' && (
                                <div className="mt-2 text-sm">
                                    {event.rejectedBy && (
                                        <div><strong>Rejected by:</strong> {event.rejectedBy}</div>
                                    )}
                                    {event.reason && (
                                        <div><strong>Reason:</strong> {event.reason}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserRegistrationMonitor;