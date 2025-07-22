import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend's domain
  },
})
export class BidGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('BidGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emits a general 'bidUpdated' event to all clients.
   * This is used to keep the live bid list in sync.
   * @param bid The updated bid object.
   */
  emitBidUpdate(bid: any) {
    this.logger.log(`Emitting 'bidUpdated' for bid ID: ${bid.id}`);
    this.server.emit('bidUpdated', bid);
  }

  /**
   * Emits a 'notification' event when a new bid goes live.
   * @param bid The bid that just went live.
   */
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

  /**
   * Emits a 'notification' event when a bid is closed.
   * @param bid The bid that has just closed.
   */
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
}