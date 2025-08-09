import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketHookOptions {
    onNewBidCreated?: (event: any) => void;
    onBidStatusChanged?: (event: any) => void;
    onBidUpdated?: (event: any) => void;
    onBidCreated?: (event: any) => void; // For bid creators
    onWinnerSelected?: (event: any) => void; // For general winner selection
    onWinnerSelectedForMyBid?: (event: any) => void; // For waste generator's own bids
    onWonBid?: (event: any) => void; // For winners
    autoConnect?: boolean;
}

export const useWebSocket = (options: WebSocketHookOptions = {}) => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id || !options.autoConnect) return;

        console.log(`🚀 [useWebSocket] Setting up WebSocket for user: ${user.id} (${user.role})`);

        // Create socket connection
        const socket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
            withCredentials: true,
            autoConnect: true,
            forceNew: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
            console.log(`✅ [useWebSocket] Connected: ${socket.id} for user ${user.id} (${user.role})`);
            setIsConnected(true);
            setConnectionError(null);

            // Authenticate immediately
            socket.emit('authenticate', { userId: user.id, userRole: user.role });
            console.log(`🔐 [useWebSocket] Authentication sent for ${user.role}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 [useWebSocket] Disconnected: ${reason}`);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error(`❌ [useWebSocket] Connection error:`, error);
            setConnectionError(error.message);
            setIsConnected(false);
        });

        // Event handlers
        if (options.onNewBidCreated) {
            socket.on('newBidCreated', (event) => {
                console.log(`🆕 [useWebSocket] New bid created event received:`, event);
                options.onNewBidCreated!(event);
            });
        }

        if (options.onBidStatusChanged) {
            socket.on('bidStatusChanged', (event) => {
                console.log(`📋 [useWebSocket] Bid status changed event received:`, event);
                options.onBidStatusChanged!(event);
            });
        }

        if (options.onBidUpdated) {
            socket.on('bidUpdated', (event) => {
                console.log(`🔄 [useWebSocket] Bid updated event received:`, event);
                options.onBidUpdated!(event);
            });
        }

        if (options.onBidCreated) {
            socket.on('bidCreated', (event) => {
                console.log(`✨ [useWebSocket] Bid created event received:`, event);
                options.onBidCreated!(event);
            });
        }

        if (options.onWinnerSelected) {
            socket.on('winnerSelected', (event) => {
                console.log(`🏆 [useWebSocket] Winner selected event received:`, event);
                options.onWinnerSelected!(event);
            });
        }

        if (options.onWinnerSelectedForMyBid) {
            socket.on('winnerSelectedForMyBid', (event) => {
                console.log(`🎯 [useWebSocket] Winner selected for my bid event received:`, event);
                options.onWinnerSelectedForMyBid!(event);
            });
        }

        if (options.onWonBid) {
            socket.on('wonBid', (event) => {
                console.log(`🎉 [useWebSocket] Won bid event received:`, event);
                options.onWonBid!(event);
            });
        }

        // Debug: Listen to all events
        socket.onAny((eventName, ...args) => {
            if (!['connect', 'disconnect', 'connect_error'].includes(eventName)) {
                console.log(`📨 [useWebSocket] Event: ${eventName}`, args);
            }
        });

        // Cleanup
        return () => {
            console.log(`🧹 [useWebSocket] Cleaning up WebSocket connection`);
            socket.off();
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [user?.id, user?.role, options.autoConnect]);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
    };
};