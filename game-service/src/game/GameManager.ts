// src/game/GameManager.ts
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  TypedSocket
} from '../types/socket.types';
import type {
  WaitingPlayer,
  JoinMatchResult,
  MatchData,
  PlayerInMatch,
  CreateMatchOptions
} from '../types/game-manager.types';
import { PongGame } from './PongGame';
import { matchRepository } from '../repositories/match.repository';
import { generateMatchId } from '../utils/id-generator';

export class GameManager {
  private activeGames: Map<string, PongGame>;
  private playerToGame: Map<string, string>; // socketId → matchId
  private waitingPlayers: Map<string, WaitingPlayer>; // userId → player data
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ) {
    this.activeGames = new Map();
    this.playerToGame = new Map();
    this.waitingPlayers = new Map();
    this.io = io;
  }

  /**
   * Crear una nueva partida
   */
  async createMatch(
    userId: string, 
    username: string,
    options: CreateMatchOptions
  ): Promise<MatchData> {
    const matchId = generateMatchId();
    
    const match: MatchData = {
      matchId,
      status: 'waiting',
      players: [],
      mode: options.mode,
      tournamentId: options.tournamentId,
      createdBy: userId,
      createdAt: Date.now()
    };

    // Guardar en DB
    await matchRepository.create({
      matchId: match.matchId,
      status: match.status,
      mode: match.mode,
      tournamentId: match.tournamentId,
      createdBy: match.createdBy,
      createdAt: new Date(match.createdAt)
    });

    return match;
  }

  /**
   * Unir jugador a una partida
   */
  async joinMatch(
    socket: TypedSocket, 
    matchId: string, 
    userId: string
  ): Promise<JoinMatchResult> {
    // Validar que la partida existe y acepta jugadores
    const matchFromDb = await matchRepository.findById(matchId);

    if (!matchFromDb) {
      throw new Error('Match not found');
    }

    if (matchFromDb.status !== 'waiting' && matchFromDb.status !== 'in_progress') {
      throw new Error('Match is not accepting players');
    }

    // Obtener jugadores actuales de la partida activa o crear nueva lista
    let match: MatchData;
    const existingGame = this.activeGames.get(matchId);

    if (existingGame) {
      match = {
        matchId: matchFromDb.matchId,
        status: matchFromDb.status as 'waiting' | 'in_progress' | 'finished',
        players: existingGame.getPlayers(),
        mode: matchFromDb.mode,
        tournamentId: matchFromDb.tournamentId || undefined,
        createdBy: matchFromDb.createdBy,
        createdAt: matchFromDb.createdAt.getTime()
      };
    } else {
      match = {
        matchId: matchFromDb.matchId,
        status: matchFromDb.status as 'waiting' | 'in_progress' | 'finished',
        players: [],
        mode: matchFromDb.mode,
        tournamentId: matchFromDb.tournamentId || undefined,
        createdBy: matchFromDb.createdBy,
        createdAt: matchFromDb.createdAt.getTime()
      };
    }

    // Verificar si el jugador ya está en la partida (reconexión)
    const existingPlayer = match.players.find(p => p.userId === userId);
    if (existingPlayer) {
      // Reconexión
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      this.playerToGame.set(socket.id, matchId);

      if (existingGame) {
        existingGame.handlePlayerReconnect(socket, userId);
      }

      return { side: existingPlayer.side, match, game: existingGame };
    }

    // Verificar si hay espacio
    if (match.players.length >= 2) {
      throw new Error('Match is full');
    }

    // Determinar lado del jugador
    const side: 'left' | 'right' = match.players.length === 0 ? 'left' : 'right';

    // Crear nuevo jugador
    const newPlayer: PlayerInMatch = {
      userId,
      username: socket.data.username,
      socketId: socket.id,
      side,
      connected: true
    };

    // Agregar jugador
    match.players.push(newPlayer);

    // El socket se une a una room con el matchId
    socket.join(matchId);

    // Registrar el mapeo socket → match
    this.playerToGame.set(socket.id, matchId);

    // Notificar a todos en la partida que un jugador se unió
    this.io.to(matchId).emit('player-joined', {
      playerId: newPlayer.userId,
      username: newPlayer.username,
      side: newPlayer.side
    });

    // Si hay 2 jugadores, iniciar el juego
    let game: PongGame | undefined;
    
    if (match.players.length === 2) {
      game = new PongGame(match, this.io);
      this.activeGames.set(matchId, game);
      
      // Actualizar estado en DB
      await matchRepository.update(matchId, { status: 'in_progress' });
      
      // Enviar configuración del juego a ambos jugadores
      game.sendGameConfig();
      
      // Esperar a que ambos jugadores estén listos antes de comenzar
      // (esto se manejará cuando ambos emitan 'player-ready')
    }

    return { side, match, game };
  }

  /**
   * Obtener partida por ID de socket
   */
  getGameForPlayer(socketId: string): PongGame | undefined {
    const matchId = this.playerToGame.get(socketId);
    
    if (!matchId) {
      return undefined;
    }
    
    return this.activeGames.get(matchId);
  }

  /**
   * Obtener partida por matchId
   */
  getGame(matchId: string): PongGame | undefined {
    return this.activeGames.get(matchId);
  }

  /**
   * Manejar desconexión de jugador
   */
  async handleDisconnect(socketId: string): Promise<void> {
    const game = this.getGameForPlayer(socketId);

    if (!game) {
      // Remover de jugadores en espera si existe
      this.waitingPlayers.forEach((player, userId) => {
        if (player.socketId === socketId) {
          this.waitingPlayers.delete(userId);
        }
      });
      return;
    }

    const matchId = this.playerToGame.get(socketId);
    
    if (!matchId) {
      return;
    }

    // Marcar jugador como desconectado
    game.handlePlayerDisconnect(socketId);

    // Esperar 30 segundos para reconexión
    setTimeout(async () => {
      const currentGame = this.activeGames.get(matchId);
      
      if (!currentGame) {
        return; // El juego ya terminó
      }

      if (!currentGame.isPlayerReconnected(socketId)) {
        // El jugador no se reconectó, terminar juego
        await currentGame.forfeit(socketId);
        await this.cleanupGame(matchId);
      }
    }, 30000);
  }

  /**
   * Manejar reconexión de jugador
   */
  async handleReconnect(
    socket: TypedSocket, 
    matchId: string, 
    userId: string
  ): Promise<void> {
    const game = this.activeGames.get(matchId);

    if (!game) {
      throw new Error('Match not found or already finished');
    }

    // Actualizar mapeo
    this.playerToGame.set(socket.id, matchId);

    // Socket se une a la room
    socket.join(matchId);

    // El juego maneja la reconexión
    game.handlePlayerReconnect(socket, userId);
  }

  /**
   * Limpiar partida finalizada
   */
  async cleanupGame(matchId: string): Promise<void> {
    const game = this.activeGames.get(matchId);

    if (!game) {
      return;
    }

    // Detener el game loop
    game.stop();

    // Remover referencias de mapeos
    const players = game.getPlayers();
    players.forEach(player => {
      this.playerToGame.delete(player.socketId);
    });

    // Remover el juego activo
    this.activeGames.delete(matchId);

    console.log(`Game ${matchId} cleaned up`);
  }

  /**
   * Obtener estadísticas de juegos activos
   */
  getStats(): {
    activeGames: number;
    connectedPlayers: number;
    waitingPlayers: number;
  } {
    return {
      activeGames: this.activeGames.size,
      connectedPlayers: this.playerToGame.size,
      waitingPlayers: this.waitingPlayers.size
    };
  }

  /**
   * Obtener lista de partidas activas
   */
  getActiveMatches(): string[] {
    return Array.from(this.activeGames.keys());
  }
}