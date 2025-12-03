// src/types/socket.types.ts
import { Socket } from 'socket.io';

export interface ServerToClientEvents {
  'game-config': (config: GameConfigPayload) => void;
  'player-joined': (data: PlayerJoinedPayload) => void;
  'game-start': (data: GameStartPayload) => void;
  'game-state': (state: GameStatePayload) => void;
  'point-scored': (data: PointScoredPayload) => void;
  'game-end': (data: GameEndPayload) => void;
  'opponent-disconnected': (data: OpponentDisconnectedPayload) => void;
  'opponent-reconnected': (data: OpponentReconnectedPayload) => void;
  'error': (error: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  'join-match': (data: JoinMatchPayload, callback?: (response: JoinMatchResponse) => void) => void;
  'player-ready': () => void;
  'paddle-move': (data: PaddleMovePayload) => void;
  'leave-match': () => void;
  'reconnect-match': (data: ReconnectMatchPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
  matchId?: string;
}

export type TypedSocket = Socket
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Payloads
export interface GameConfigPayload {
  canvasWidth: number;
  canvasHeight: number;
  paddleHeight: number;
  paddleWidth: number;
  ballRadius: number;
  maxScore: number;
}

export interface PlayerJoinedPayload {
  playerId: string;
  username: string;
  side: 'left' | 'right';
}

export interface GameStartPayload {
  countdown: number;
}

export interface GameStatePayload {
  timestamp: number;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  paddles: {
    left: { y: number };
    right: { y: number };
  };
  score: {
    left: number;
    right: number;
  };
}

export interface PointScoredPayload {
  scorer: 'left' | 'right';
  score: {
    left: number;
    right: number;
  };
}

export interface GameEndPayload {
  winner: 'left' | 'right';
  finalScore: {
    left: number;
    right: number;
  };
  reason: 'score_limit' | 'opponent_disconnect' | 'forfeit';
  matchSummary: {
    duration: number;
    totalHits: number;
    longestRally: number;
  };
}

export interface OpponentDisconnectedPayload {
  playerId: string;
  waitingForReconnect: boolean;
  timeout: number;
}

export interface OpponentReconnectedPayload {
  playerId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface JoinMatchPayload {
  matchId: string;
  token: string;
  userId: string;
}

export interface JoinMatchResponse {
  success: boolean;
  side?: 'left' | 'right';
  error?: string;
}

export interface PaddleMovePayload {
  direction: 'up' | 'down' | 'stop';
  timestamp: number;
}

export interface ReconnectMatchPayload {
  matchId: string;
  userId: string;
  token: string;
}