// src/types/game.types.ts
export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Paddle {
  y: number;
  vy: number;
}

export interface GameState {
  ball: Ball;
  paddles: {
    left: Paddle;
    right: Paddle;
  };
  score: {
    left: number;
    right: number;
  };
  status: GameStatus;
  lastUpdate: number;
}

export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

export type PlayerSide = 'left' | 'right';

export type PaddleDirection = 'up' | 'down' | 'stop';

export interface Player {
  userId: string;
  username: string;
  socketId: string;
  side: PlayerSide;
  connected: boolean;
}

export interface MatchData {
  matchId: string;
  players: Player[];
  mode: string;
  tournamentId?: string;
  createdBy: string;
  createdAt: number;
}