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

// src/types/match.types.ts

// export interface PlayerInMatch {
//   userId: string;
//   username: string;
//   isReady: boolean;
//   team?: string;
// }

// export interface Match {
//   matchId: string;
//   status: 'waiting' | 'in_progress' | 'finished';
//   players: PlayerInMatch[];
//   mode: string;
//   tournamentId?: string;
//   createdBy: string;
//   createdAt: number; // timestamp in milliseconds
// }

// export interface MatchCreateInput {
//   matchId: string;
//   status: 'waiting' | 'in_progress' | 'finished';
//   mode: string;
//   tournamentId?: string;
//   createdBy: string;
//   createdAt: Date;
// }

// export interface MatchUpdateInput {
//   status?: 'waiting' | 'in_progress' | 'finished';
//   mode?: string;
//   tournamentId?: string;
// }

// export interface MatchDbRow {
//   match_id: string;
//   status: string;
//   mode: string;
//   tournament_id: string | null;
//   created_by: string;
//   created_at: Date;
//   updated_at: Date;
// }

// export interface PlayerDbRow {
//   match_id: string;
//   user_id: string;
//   username: string;
//   is_ready: boolean;
//   team: string | null;
//   joined_at: Date;
// }