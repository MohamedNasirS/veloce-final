import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ❌ Removed inline cors, now handled globally via adapter
@WebSocketGateway()
export class BidGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('BidGateway');

  // Track user sessions: userId -> Set of socket IDs
  private userSessions: Map<string, Set<string>> = new Map();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from all user sessions
    for (const [userId, socketIds] of this.userSessions.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  // Handle user authentication and session tracking
  @SubscribeMessage('authenticate')
  handleAuthenticate(client: Socket, payload: { userId: string }) {
    const { userId } = payload;
    this.logger.log(`User ${userId} authenticated with socket ${client.id}`);

    // Add socket to user's session
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(client.id);

    // Store userId in socket data for easy access
    client.data.userId = userId;
  }

  emitBidUpdate(bid: any) {
    this.logger.log(`Emitting 'bidUpdated' for bid ID: ${bid.id}`);
    this.server.emit('bidUpdated', bid);
  }

  emitNewBidLive(bid: any) {
    const notification = {
      id: `live-${bid.id}-${Date.now()}`,
      type: 'BID_LIVE',
      message: `Auction for "${bid.lotName}" is now live!`,
      bidId: bid.id,
      timestamp: new Date().toISOString(),
    };
    this.logger.log(`Emitting 'notification' for new live bid: ${bid.id}`);
    this.server.emit('notification', notification);
  }

  emitBidClosed(bid: any) {
    const notification = {
      id: `closed-${bid.id}-${Date.now()}`,
      type: 'BID_CLOSED',
      message: `Auction for "${bid.lotName}" has closed.`,
      bidId: bid.id,
      timestamp: new Date().toISOString(),
    };
    this.logger.log(`Emitting 'notification' for closed bid: ${bid.id}`);
    this.server.emit('notification', notification);
  }

  // Emit user status change to specific user
  emitUserStatusChange(userId: string, newStatus: string) {
    const userSocketIds = this.userSessions.get(userId);

    if (!userSocketIds || userSocketIds.size === 0) {
      this.logger.log(`No active sessions found for user ${userId}`);
      return;
    }

    const statusChangeEvent = {
      type: 'USER_STATUS_CHANGED',
      status: newStatus,
      message: `Your account status has been changed to ${newStatus.toLowerCase()}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[IMMEDIATE] Emitting status change to ${userSocketIds.size} socket(s) for user ${userId}: ${newStatus}`);

    // Send to all user's connected sockets with immediate delivery
    let successCount = 0;
    userSocketIds.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        this.logger.log(`[IMMEDIATE] Sending to socket ${socketId} (connected: true)`);
        socket.emit('userStatusChanged', statusChangeEvent);
        successCount++;
      } else {
        this.logger.warn(`[IMMEDIATE] Socket ${socketId} not found or disconnected, removing from session`);
        userSocketIds.delete(socketId);
      }
    });

    this.logger.log(`[IMMEDIATE] Successfully sent status change to ${successCount} socket(s) for user ${userId}`);

    // Clean up empty sessions
    if (userSocketIds.size === 0) {
      this.userSessions.delete(userId);
    }
  }

  // Get active user sessions for debugging
  getActiveSessions(): { userId: string; socketCount: number }[] {
    return Array.from(this.userSessions.entries()).map(([userId, socketIds]) => ({
      userId,
      socketCount: socketIds.size,
    }));
  }
}
