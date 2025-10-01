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

// CORS handled globally via adapter - allowing all 147.93.27.172 origins
@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow all 147.93.27.172 origins (any port)
      if (!origin || origin.startsWith('http://147.93.27.172')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for development
      }
    },
    credentials: true,
  },
})
export class BidGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('BidGateway');

  // Enhanced session tracking with role-based channels
  private userSessions: Map<string, Set<string>> = new Map();
  private adminSockets: Set<string> = new Set();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socket IDs
  private socketToUser: Map<string, { userId: string; userRole: string }> = new Map();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Enhanced cleanup for role-based tracking
    const userInfo = this.socketToUser.get(client.id);
    if (userInfo) {
      const { userId, userRole } = userInfo;

      // Remove from admin sockets if admin
      if (userRole === 'admin') {
        this.adminSockets.delete(client.id);
      }

      // Remove from user sockets
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }

      // Remove from socket mapping
      this.socketToUser.delete(client.id);
    }

    // Remove client from all user sessions
    for (const [userId, socketIds] of this.userSessions.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  // Enhanced user authentication and session tracking
  @SubscribeMessage('authenticate')
  handleAuthenticate(client: Socket, payload: { userId: string; userRole?: string }) {
    const { userId, userRole } = payload;
    this.logger.log(`🔐 User ${userId} (${userRole}) authenticated with socket ${client.id}`);

    // Enhanced session tracking
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(client.id);

    // Role-based socket tracking
    if (userRole === 'admin') {
      this.adminSockets.add(client.id);
      this.logger.log(`👑 Admin socket added: ${client.id} (Total admin sockets: ${this.adminSockets.size})`);
    }

    // User-specific socket tracking
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Socket to user mapping
    this.socketToUser.set(client.id, { userId, userRole: userRole || 'user' });

    // Store in socket data for easy access
    client.data.userId = userId;
    client.data.userRole = userRole;

    // Join role-based rooms for efficient broadcasting
    if (userRole === 'admin') {
      client.join('admins');
    }
    client.join(`user_${userId}`);
    client.join(userRole || 'users');

    this.logger.log(`✅ Authentication complete for ${userId}. Rooms: [${userRole}, user_${userId}]`);
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

  // Emit new bid creation to admin users
  emitNewBidCreated(bid: any) {
    const newBidEvent = {
      type: 'NEW_BID_CREATED',
      bid: bid,
      message: `New bid "${bid.lotName}" created by ${bid.creator?.company || 'Unknown'}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[IMMEDIATE] Emitting new bid created: ${bid.id} - ${bid.lotName}`);

    // Send to all admin users
    this.emitToAdminUsers('newBidCreated', newBidEvent);
  }

  // Emit bid status change to admin users
  emitBidStatusChanged(bid: any, oldStatus: string, newStatus: string) {
    const statusChangeEvent = {
      type: 'BID_STATUS_CHANGED',
      bid: bid,
      oldStatus: oldStatus,
      newStatus: newStatus,
      message: `Bid "${bid.lotName}" status changed from ${oldStatus} to ${newStatus}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[IMMEDIATE] Emitting bid status change: ${bid.id} - ${oldStatus} → ${newStatus}`);

    // Send to all admin users
    this.emitToAdminUsers('bidStatusChanged', statusChangeEvent);
  }

  // 🚀 ENHANCED: Immediate bid creation notification to ALL relevant users
  emitNewBidCreatedToAll(bid: any) {
    const newBidEvent = {
      type: 'NEW_BID_CREATED',
      bid: bid,
      message: `New bid "${bid.lotName}" created by ${bid.creator?.company || 'Unknown'}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting new bid to ALL users: ${bid.id} - ${bid.lotName}`);

    // Method 1: Emit to admin room (most efficient)
    this.server.to('admins').emit('newBidCreated', newBidEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent to admin room`);

    // Method 2: Emit to specific bid creator
    if (bid.creatorId) {
      this.server.to(`user_${bid.creatorId}`).emit('bidCreated', newBidEvent);
      this.logger.log(`📡 [IMMEDIATE] Sent to bid creator: ${bid.creatorId}`);
    }

    // Method 3: Fallback - direct socket emission to ensure delivery
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('newBidCreated', newBidEvent);
        adminCount++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] New bid broadcasted to ${adminCount} admin sockets + creator`);
  }

  // 🚀 ENHANCED: Immediate bid status change to ALL relevant users
  emitBidStatusChangedToAll(bid: any, oldStatus: string, newStatus: string) {
    const statusChangeEvent = {
      type: 'BID_STATUS_CHANGED',
      bid: bid,
      oldStatus: oldStatus,
      newStatus: newStatus,
      message: `Bid "${bid.lotName}" status changed from ${oldStatus} to ${newStatus}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting status change to ALL users: ${bid.id} - ${oldStatus} → ${newStatus}`);

    // Method 1: Emit to admin room
    this.server.to('admins').emit('bidStatusChanged', statusChangeEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent status change to admin room`);

    // Method 2: Emit to bid creator (multiple approaches for reliability)
    if (bid.creatorId) {
      // Approach A: Room-based emission
      this.server.to(`user_${bid.creatorId}`).emit('bidStatusChanged', statusChangeEvent);
      this.logger.log(`📡 [IMMEDIATE] Sent status change to bid creator room: user_${bid.creatorId}`);

      // Approach B: Direct socket emission to creator
      const creatorSockets = this.userSockets.get(bid.creatorId);
      if (creatorSockets) {
        creatorSockets.forEach(socketId => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket && socket.connected) {
            socket.emit('bidStatusChanged', statusChangeEvent);
            this.logger.log(`📡 [IMMEDIATE] Direct emit to creator socket: ${socketId}`);
          }
        });
      }
    }

    // Method 3: Emit to all waste generators (they need to see bid approvals)
    this.server.to('waste_generator').emit('bidStatusChanged', statusChangeEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent status change to all waste generators`);

    // Method 4: Fallback - direct socket emission
    let totalNotified = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('bidStatusChanged', statusChangeEvent);
        totalNotified++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] Status change broadcasted to ${totalNotified} admin sockets + creator + waste generators`);
  }

  // 🚀 NEW: Document update notifications for real-time admin updates
  emitDocumentUpdated(userId: string, userInfo: any, updatedFields: string[]) {
    const documentUpdateEvent = {
      type: 'DOCUMENT_UPDATED',
      userId: userId,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        company: userInfo.company,
        role: userInfo.role,
      },
      updatedFields: updatedFields,
      message: `${userInfo.name} (${userInfo.company}) updated ${updatedFields.length} document(s)`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting document update to admins: User ${userId} updated ${updatedFields.join(', ')}`);

    // Method 1: Emit to admin room (most efficient)
    this.server.to('admins').emit('documentUpdated', documentUpdateEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent document update to admin room`);

    // Method 2: Fallback - direct socket emission to ensure delivery
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('documentUpdated', documentUpdateEvent);
        adminCount++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] Document update broadcasted to ${adminCount} admin sockets`);
  }

  // 🚀 NEW: User status change due to document update
  emitUserStatusChangedDueToDocuments(userId: string, userInfo: any, newStatus: string, reason: string) {
    const statusChangeEvent = {
      type: 'USER_STATUS_CHANGED_DOCUMENTS',
      userId: userId,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        company: userInfo.company,
        role: userInfo.role,
      },
      newStatus: newStatus,
      reason: reason,
      message: `${userInfo.name}'s status changed to ${newStatus} due to document updates`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting user status change due to documents: User ${userId} → ${newStatus}`);

    // Send to admins
    this.server.to('admins').emit('userStatusChangedDocuments', statusChangeEvent);

    // Send to the specific user
    this.server.to(`user_${userId}`).emit('userStatusChanged', {
      type: 'USER_STATUS_CHANGED',
      status: newStatus,
      message: `Your account status has been changed to ${newStatus.toLowerCase()} due to document updates`,
      timestamp: new Date().toISOString(),
    });

    // Fallback direct emission to admins
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('userStatusChangedDocuments', statusChangeEvent);
        adminCount++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] User status change due to documents broadcasted to ${adminCount} admin sockets + user`);
  }

  // 🚀 ENHANCED: Real-time bid updates for live bidding
  emitBidUpdateToAll(bid: any) {
    const bidUpdateEvent = {
      type: 'BID_UPDATED',
      bid: bid,
      message: `Bid "${bid.lotName}" has been updated`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting bid update to ALL users: ${bid.id}`);

    // Broadcast to all connected users
    this.server.emit('bidUpdated', bidUpdateEvent);
    this.logger.log(`✅ [IMMEDIATE] Bid update broadcasted to all connected users`);
  }

  // 🆕 NEW: Real-time user registration notification to admin users
  emitNewUserRegistered(user: any) {
    const newUserEvent = {
      type: 'NEW_USER_REGISTERED',
      user: user,
      message: `New user "${user.name}" from ${user.company} has registered`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting new user registration to admins: ${user.id} - ${user.name} (${user.company})`);

    // Method 1: Emit to admin room (most efficient)
    this.server.to('admins').emit('newUserRegistered', newUserEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent to admin room`);

    // Method 2: Fallback - direct socket emission to ensure delivery
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('newUserRegistered', newUserEvent);
        adminCount++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] New user registration broadcasted to ${adminCount} admin sockets`);
  }

  // 🆕 NEW: Real-time user status change notification to admin users
  emitUserStatusChangedToAdmins(user: any, oldStatus: string, newStatus: string) {
    const userStatusEvent = {
      type: 'USER_STATUS_CHANGED_ADMIN',
      user: user,
      oldStatus: oldStatus,
      newStatus: newStatus,
      message: `User "${user.name}" status changed from ${oldStatus} to ${newStatus}`,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting user status change to admins: ${user.id} - ${oldStatus} → ${newStatus}`);

    // Method 1: Emit to admin room
    this.server.to('admins').emit('userStatusChangedAdmin', userStatusEvent);
    this.logger.log(`📡 [IMMEDIATE] Sent user status change to admin room`);

    // Method 2: Fallback - direct socket emission
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit('userStatusChangedAdmin', userStatusEvent);
        adminCount++;
      }
    });

    this.logger.log(`✅ [IMMEDIATE] User status change broadcasted to ${adminCount} admin sockets`);
  }

  // 🆕 NEW: Real-time user registration notification
  emitUserRegistered(user: any) {
    const userRegisteredEvent = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting user registered event: ${user.id} - ${user.name}`);

    // Emit to all connected clients
    this.server.emit('userRegistered', userRegisteredEvent);
    this.logger.log(`✅ [IMMEDIATE] User registered event broadcasted to all clients`);
  }

  // 🆕 NEW: Real-time user approval notification
  emitUserApproved(user: any) {
    const userApprovedEvent = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      status: user.status,
      approvedBy: user.approvedBy,
      approvedAt: user.approvedAt,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting user approved event: ${user.id} - ${user.name}`);

    // Emit to all connected clients
    this.server.emit('userApproved', userApprovedEvent);

    // Also emit to the specific user
    this.emitUserStatusChange(user.id, 'APPROVED');

    this.logger.log(`✅ [IMMEDIATE] User approved event broadcasted to all clients`);
  }

  // 🆕 NEW: Real-time user rejection notification
  emitUserRejected(user: any) {
    const userRejectedEvent = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      status: user.status,
      rejectedBy: user.rejectedBy,
      rejectedAt: user.rejectedAt,
      reason: user.reason,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting user rejected event: ${user.id} - ${user.name}`);

    // Emit to all connected clients
    this.server.emit('userRejected', userRejectedEvent);

    // Also emit to the specific user
    this.emitUserStatusChange(user.id, 'REJECTED');

    this.logger.log(`✅ [IMMEDIATE] User rejected event broadcasted to all clients`);
  }

  // 🆕 NEW: Real-time winner selection notification
  emitWinnerSelected(bid: any, winner: any, selectedBy: any) {
    const winnerSelectedEvent = {
      type: 'WINNER_SELECTED',
      bid: {
        id: bid.id,
        lotName: bid.lotName,
        wasteType: bid.wasteType,
        quantity: bid.quantity,
        unit: bid.unit,
        currentPrice: bid.currentPrice,
        creatorId: bid.creatorId,
      },
      winner: {
        id: winner.id,
        name: winner.name,
        email: winner.email,
        company: winner.company,
      },
      selectedBy: {
        id: selectedBy.id,
        name: selectedBy.name,
        role: selectedBy.role,
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`🚀 [IMMEDIATE] Broadcasting winner selected event: ${bid.id} - Winner: ${winner.name}`);

    // Emit to all connected clients
    this.server.emit('winnerSelected', winnerSelectedEvent);

    // Emit to specific users
    this.server.to(`user_${bid.creatorId}`).emit('winnerSelectedForMyBid', winnerSelectedEvent);
    this.server.to(`user_${winner.id}`).emit('wonBid', winnerSelectedEvent);
    this.server.to('admins').emit('winnerSelectedAdmin', winnerSelectedEvent);

    this.logger.log(`✅ [IMMEDIATE] Winner selected event broadcasted to all relevant parties`);
  }

  // Helper method to emit events to all admin users (LEGACY - keeping for compatibility)
  private emitToAdminUsers(eventName: string, eventData: any) {
    // Use the new enhanced room-based method
    this.server.to('admins').emit(eventName, eventData);
    this.logger.log(`📡 [LEGACY] Sent ${eventName} to admin room`);

    // Fallback for direct socket emission
    let adminCount = 0;
    this.adminSockets.forEach(socketId => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        socket.emit(eventName, eventData);
        adminCount++;
      }
    });
    this.logger.log(`✅ [LEGACY] Sent ${eventName} to ${adminCount} admin sockets`);
  }

  // Get active user sessions for debugging
  getActiveSessions(): { userId: string; socketCount: number }[] {
    return Array.from(this.userSessions.entries()).map(([userId, socketIds]) => ({
      userId,
      socketCount: socketIds.size,
    }));
  }
}
