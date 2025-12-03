// src/types/match.types.ts
export interface Match {
  matchId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  mode: 'casual' | 'ranked' | 'tournament';
  players: number;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  winnerId?: string;
  loserId?: string;
  finalScore?: {
    left: number;
    right: number;
  };
}

export interface CreateMatchDto {
  mode: 'casual' | 'ranked' | 'tournament';
  tournamentId?: string;
}

export interface JoinMatchDto {
  userId: string;
  token: string;
}