// src/game/PongGame.ts
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  TypedSocket,
  GameStatePayload,
  PointScoredPayload,
  GameEndPayload,
  GameConfigPayload
} from '../types/socket.types';
import type { PlayerInMatch, MatchData } from '../types/game-manager.types';
import type {
  PongGameConfig,
  PongGameState,
  PaddleDirection,
  PlayerSide,
  MatchSummary
} from '../types/pong-game.types';
import { gameConfig } from '../config/game.config';
import { matchRepository } from '../repositories/match.repository';

export class PongGame {
  private matchId: string;
  private players: PlayerInMatch[];
  private config: PongGameConfig;
  private state: PongGameState;
  private gameLoop: NodeJS.Timeout | null;
  private tickRate: number;
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  constructor(
    matchData: MatchData,
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ) {
    this.matchId = matchData.matchId;
    this.players = matchData.players;
    this.io = io;

    // Configuración del juego (usando config centralizada)
    this.config = gameConfig;
    this.tickRate = gameConfig.game.tickRate;

    // Estado inicial
    this.state = {
      ball: {
        x: this.config.canvas.width / 2,
        y: this.config.canvas.height / 2,
        vx: this.config.ball.initialSpeed * (Math.random() > 0.5 ? 1 : -1),
        vy: this.config.ball.initialSpeed * (Math.random() - 0.5) * 2,
        radius: this.config.ball.radius
      },
      paddles: {
        left: {
          y: this.config.canvas.height / 2 - this.config.paddle.height / 2,
          vy: 0
        },
        right: {
          y: this.config.canvas.height / 2 - this.config.paddle.height / 2,
          vy: 0
        }
      },
      score: { left: 0, right: 0 },
      status: 'waiting',
      lastUpdate: Date.now(),
      totalHits: 0,
      longestRally: 0,
      currentRally: 0
    };

    this.gameLoop = null;
  }

  /**
   * Iniciar el juego
   */
  start(): void {
    this.state.status = 'countdown';
    this.state.startedAt = Date.now();

    // Cuenta regresiva de 3 segundos
    this.broadcast('game-start', { countdown: this.config.game.countdownSeconds });

    setTimeout(() => {
      this.state.status = 'playing';
      this.startGameLoop();
    }, this.config.game.countdownSeconds * 1000);
  }

  /**
   * Loop principal del juego
   */
  private startGameLoop(): void {
    this.gameLoop = setInterval(() => {
      this.update();
      this.broadcastState();
    }, 1000 / this.tickRate);
  }

  /**
   * Actualizar física del juego
   */
  private update(): void {
    if (this.state.status !== 'playing') {
      return;
    }

    // Actualizar posición de la pelota
    this.state.ball.x += this.state.ball.vx;
    this.state.ball.y += this.state.ball.vy;

    // Actualizar paletas
    this.updatePaddles();

    // Detectar colisiones
    this.checkCollisions();

    // Detectar puntos
    this.checkScoring();

    this.state.lastUpdate = Date.now();
  }

  /**
   * Actualizar posición de paletas
   */
  private updatePaddles(): void {
    const sides: PlayerSide[] = ['left', 'right'];
    
    sides.forEach(side => {
      const paddle = this.state.paddles[side];
      paddle.y += paddle.vy;

      // Limitar a los bordes de la pantalla
      paddle.y = Math.max(
        0,
        Math.min(this.config.canvas.height - this.config.paddle.height, paddle.y)
      );
    });
  }

  /**
   * Detectar colisiones
   */
  private checkCollisions(): void {
    const ball = this.state.ball;

    // Colisión con paredes superior/inferior
    if (
      ball.y - ball.radius <= 0 ||
      ball.y + ball.radius >= this.config.canvas.height
    ) {
      ball.vy *= -1;
      ball.y = Math.max(
        ball.radius,
        Math.min(this.config.canvas.height - ball.radius, ball.y)
      );
    }

    // Colisión con paleta izquierda
    if (ball.x - ball.radius <= this.config.paddle.width) {
      const paddle = this.state.paddles.left;

      if (ball.y >= paddle.y && ball.y <= paddle.y + this.config.paddle.height) {
        this.handlePaddleCollision('left');
      }
    }

    // Colisión con paleta derecha
    if (
      ball.x + ball.radius >=
      this.config.canvas.width - this.config.paddle.width
    ) {
      const paddle = this.state.paddles.right;

      if (ball.y >= paddle.y && ball.y <= paddle.y + this.config.paddle.height) {
        this.handlePaddleCollision('right');
      }
    }
  }

  /**
   * Manejar colisión con paleta
   */
  private handlePaddleCollision(side: PlayerSide): void {
    const ball = this.state.ball;
    const paddle = this.state.paddles[side];

    // Incrementar rally
    if (this.state.currentRally !== undefined) {
      this.state.currentRally++;
      this.state.totalHits = (this.state.totalHits || 0) + 1;

      if (this.state.currentRally > (this.state.longestRally || 0)) {
        this.state.longestRally = this.state.currentRally;
      }
    }

    // Invertir dirección horizontal
    ball.vx *= -1;

    // Calcular ángulo basado en dónde golpeó la paleta
    const hitPos = (ball.y - paddle.y) / this.config.paddle.height;
    const angle = (hitPos - 0.5) * this.config.physics.maxBounceAngle;

    // Ajustar velocidad vertical
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    ball.vy = speed * Math.sin(angle);

    // Aumentar velocidad ligeramente
    const speedMultiplier = Math.min(
      this.config.ball.maxSpeed / this.config.ball.initialSpeed,
      this.config.physics.paddleBounceFactor
    );
    ball.vx *= speedMultiplier;
    ball.vy *= speedMultiplier;

    // Corregir posición para evitar stuck
    if (side === 'left') {
      ball.x = this.config.paddle.width + ball.radius;
    } else {
      ball.x = this.config.canvas.width - this.config.paddle.width - ball.radius;
    }
  }

  /**
   * Detectar puntos
   */
  private checkScoring(): void {
    const ball = this.state.ball;

    // Punto para el jugador derecho
    if (ball.x - ball.radius <= 0) {
      this.scorePoint('right');
    }

    // Punto para el jugador izquierdo
    if (ball.x + ball.radius >= this.config.canvas.width) {
      this.scorePoint('left');
    }
  }

  /**
   * Anotar punto
   */
  private scorePoint(scorer: PlayerSide): void {
    this.state.score[scorer]++;

    // Resetear rally
    this.state.currentRally = 0;

    // Notificar a los jugadores
    const pointData: PointScoredPayload = {
      scorer,
      score: { ...this.state.score }
    };
    this.broadcast('point-scored', pointData);

    // Verificar si hay ganador
    if (this.state.score[scorer] >= this.config.game.maxScore) {
      this.endGame(scorer);
    } else {
      // Pausar brevemente antes de resetear
      this.stop();
      setTimeout(() => {
        this.resetBall();
        if (this.state.status === 'playing') {
          this.startGameLoop();
        }
      }, this.config.ball.resetDelay);
    }
  }

  /**
   * Resetear pelota al centro
   */
  private resetBall(): void {
    this.state.ball = {
      x: this.config.canvas.width / 2,
      y: this.config.canvas.height / 2,
      vx: this.config.ball.initialSpeed * (Math.random() > 0.5 ? 1 : -1),
      vy: this.config.ball.initialSpeed * (Math.random() - 0.5) * 2,
      radius: this.config.ball.radius
    };
  }

  /**
   * Manejar input del jugador
   */
  handlePaddleInput(socketId: string, direction: PaddleDirection): void {
    const player = this.players.find(p => p.socketId === socketId);
    
    if (!player) {
      return;
    }

    const paddle = this.state.paddles[player.side];

    switch (direction) {
      case 'up':
        paddle.vy = -this.config.paddle.speed;
        break;
      case 'down':
        paddle.vy = this.config.paddle.speed;
        break;
      case 'stop':
        paddle.vy = 0;
        break;
    }
  }

  /**
   * Broadcast del estado actual a todos los jugadores
   */
  private broadcastState(): void {
    const stateData: GameStatePayload = {
      timestamp: this.state.lastUpdate,
      ball: {
        x: Math.round(this.state.ball.x * 100) / 100,
        y: Math.round(this.state.ball.y * 100) / 100,
        vx: this.state.ball.vx,
        vy: this.state.ball.vy
      },
      paddles: {
        left: { y: Math.round(this.state.paddles.left.y) },
        right: { y: Math.round(this.state.paddles.right.y) }
      },
      score: { ...this.state.score }
    };

    this.broadcast('game-state', stateData);
  }

  /**
   * Enviar evento a todos los jugadores
   */
  private broadcast<K extends keyof ServerToClientEvents>(
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    this.io.to(this.matchId).emit(event, data as any);
  }

  /**
   * Finalizar juego
   */
  private async endGame(winner: PlayerSide): Promise<void> {
    this.stop();
    this.state.status = 'finished';

    const matchSummary: MatchSummary = {
      duration: this.state.startedAt
        ? Math.floor((Date.now() - this.state.startedAt) / 1000)
        : 0,
      totalHits: this.state.totalHits || 0,
      longestRally: this.state.longestRally || 0
    };

    // Notificar a los jugadores
    const endData: GameEndPayload = {
      winner,
      finalScore: { ...this.state.score },
      reason: 'score_limit',
      matchSummary
    };
    this.broadcast('game-end', endData);

    // Guardar resultado en DB
    await this.saveMatchResult(winner, matchSummary);
  }

  /**
   * Guardar resultado en base de datos
   */
  private async saveMatchResult(
    winner: PlayerSide,
    summary: MatchSummary
  ): Promise<void> {
    const winnerPlayer = this.players.find(p => p.side === winner);
    const loserPlayer = this.players.find(p => p.side !== winner);

    if (!winnerPlayer || !loserPlayer) {
      console.error('Cannot save match result: players not found');
      return;
    }

    await matchRepository.update(this.matchId, {
      status: 'finished',
      winnerId: winnerPlayer.userId,
      loserId: loserPlayer.userId,
      finalScore: this.state.score,
      duration: summary.duration,
      finishedAt: new Date()
    });
  }

  /**
   * Detener el juego
   */
  stop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  /**
   * Manejar desconexión de jugador
   */
  handlePlayerDisconnect(socketId: string): void {
    const player = this.players.find(p => p.socketId === socketId);

    if (!player) {
      return;
    }

    player.connected = false;

    // Pausar el juego
    this.stop();
    this.state.status = 'paused';

    // Notificar al otro jugador
    this.broadcast('opponent-disconnected', {
      playerId: player.userId,
      waitingForReconnect: true,
      timeout: this.config.game.reconnectTimeout / 1000
    });
  }

  /**
   * Manejar reconexión de jugador
   */
  handlePlayerReconnect(socket: TypedSocket, userId: string): void {
    const player = this.players.find(p => p.userId === userId);

    if (!player) {
      throw new Error('Player not found in this match');
    }

    // Actualizar socket ID y estado
    player.socketId = socket.id;
    player.connected = true;

    // Notificar a todos que el jugador se reconectó
    this.broadcast('opponent-reconnected', {
      playerId: player.userId
    });

    // Enviar estado actual del juego al jugador reconectado
    const currentState: GameStatePayload = {
      timestamp: this.state.lastUpdate,
      ball: {
        x: this.state.ball.x,
        y: this.state.ball.y,
        vx: this.state.ball.vx,
        vy: this.state.ball.vy
      },
      paddles: {
        left: { y: this.state.paddles.left.y },
        right: { y: this.state.paddles.right.y }
      },
      score: { ...this.state.score }
    };
    socket.emit('game-state', currentState);

    // Si el juego estaba pausado y ambos están conectados, reanudarlo
    if (this.state.status === 'paused') {
      const allConnected = this.players.every(p => p.connected);

      if (allConnected) {
        this.state.status = 'playing';
        this.startGameLoop();
      }
    }
  }

  /**
   * Forfeit (rendirse/abandonar)
   */
  async forfeit(socketId: string): Promise<void> {
    const player = this.players.find(p => p.socketId === socketId);

    if (!player) {
      return;
    }

    const winner: PlayerSide = player.side === 'left' ? 'right' : 'left';

    const endData: GameEndPayload = {
      winner,
      finalScore: { ...this.state.score },
      reason: 'opponent_disconnect',
      matchSummary: {
        duration: this.state.startedAt
          ? Math.floor((Date.now() - this.state.startedAt) / 1000)
          : 0,
        totalHits: this.state.totalHits || 0,
        longestRally: this.state.longestRally || 0
      }
    };

    this.broadcast('game-end', endData);

    await this.saveMatchResult(winner, endData.matchSummary);

    this.stop();
  }

  /**
   * Verificar si un jugador se reconectó
   */
  isPlayerReconnected(socketId: string): boolean {
    const player = this.players.find(p => p.socketId === socketId);
    return player ? player.connected : false;
  }

  /**
   * Obtener lista de jugadores
   */
  getPlayers(): PlayerInMatch[] {
    return this.players;
  }

  /**
   * Enviar configuración del juego a los clientes
   */
  sendGameConfig(): void {
    const config: GameConfigPayload = {
      canvasWidth: this.config.canvas.width,
      canvasHeight: this.config.canvas.height,
      paddleHeight: this.config.paddle.height,
      paddleWidth: this.config.paddle.width,
      ballRadius: this.config.ball.radius,
      maxScore: this.config.game.maxScore
    };

    this.players.forEach(player => {
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('game-config', config);
      }
    });
  }

  /**
   * Marcar jugador como listo
   */
  setPlayerReady(socketId: string): void {
    const player = this.players.find(p => p.socketId === socketId);

    if (!player) {
      throw new Error('Player not found');
    }

    // Verificar si ambos jugadores están conectados
    const allReady = this.players.every(p => p.connected);

    if (allReady && this.state.status === 'waiting') {
      this.start();
    }
  }

  /**
   * Obtener estado actual del juego
   */
  getState(): PongGameState {
    return { ...this.state };
  }

  /**
   * Obtener ID de la partida
   */
  getMatchId(): string {
    return this.matchId;
  }
}