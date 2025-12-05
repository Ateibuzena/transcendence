// src/types/game-manager.types.ts
import { PongGame } from '../game/PongGame';

export interface WaitingPlayer {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: number;
}

export interface JoinMatchResult {
  side: 'left' | 'right';
  match: MatchData;
  game?: PongGame;
}

export interface MatchData {
  matchId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  players: PlayerInMatch[];
  mode: string;
  tournamentId?: string;
  createdBy: string;
  createdAt: number;
}

export interface PlayerInMatch {
  userId: string;
  username: string;
  socketId: string;
  side: 'left' | 'right';
  connected: boolean;
}

export interface CreateMatchOptions {
  mode: 'casual' | 'ranked' | 'tournament' | 'custom';
  tournamentId?: string;
  customSettings?: {
    maxScore?: number;
    ballSpeed?: number;
    paddleHeight?: number;
  };
}