import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ❌ Removed inline cors, now handled globally via adapter
@WebSocketGateway()
export class BidGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('BidGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
}
