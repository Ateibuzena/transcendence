// src/socket/socket.handler.ts
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  TypedSocket
} from '../types/socket.types';
import { GameManager } from '../game/GameManager';
import { verifyToken } from '../utils/auth';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const gameManager = new GameManager(io);

  // Middleware de autenticación
  io.use(async (socket: TypedSocket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = await verifyToken(token);
      
      // Guardar datos del usuario en el socket
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: TypedSocket) => {
    console.log(`Cliente conectado: ${socket.id} (User: ${socket.data.username})`);

    // JOIN MATCH
    socket.on('join-match', async (data, callback) => {
      try {
        const result = await gameManager.joinMatch(socket, data.matchId, socket.data.userId);
        
        if (callback) {
          callback({ success: true, side: result.side });
        }
      } catch (error) {
        console.error('Error joining match:', error);
        
        if (callback) {
          callback({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
        
        socket.emit('error', {
          code: 'JOIN_MATCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to join match'
        });
      }
    });

    // PLAYER READY
    socket.on('player-ready', () => {
      try {
        const game = gameManager.getGameForPlayer(socket.id);
        if (game) {
          game.setPlayerReady(socket.id);
        }
      } catch (error) {
        console.error('Error setting player ready:', error);
      }
    });

    // PADDLE MOVE
    socket.on('paddle-move', (data) => {
      try {
        const game = gameManager.getGameForPlayer(socket.id);
        if (game) {
          game.handlePaddleInput(socket.id, data.direction);
        }
      } catch (error) {
        console.error('Error handling paddle move:', error);
      }
    });

    // LEAVE MATCH
    socket.on('leave-match', () => {
      try {
        gameManager.handleDisconnect(socket.id);
      } catch (error) {
        console.error('Error leaving match:', error);
      }
    });

    // RECONNECT MATCH
    socket.on('reconnect-match', async (data) => {
      try {
        await gameManager.handleReconnect(socket, data.matchId, data.userId);
      } catch (error) {
        console.error('Error reconnecting:', error);
        socket.emit('error', {
          code: 'RECONNECT_ERROR',
          message: 'Failed to reconnect to match'
        });
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      gameManager.handleDisconnect(socket.id);
    });
  });
}