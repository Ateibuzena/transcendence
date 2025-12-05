// src/repositories/match.repository.ts
import { Pool } from 'pg';
import type { 
  Match, 
  MatchCreateInput, 
  MatchUpdateInput,
  MatchDbRow,
  PlayerDbRow,
  PlayerInMatch
} from '../types/match.types';

export class MatchRepository {
  constructor(private pool: Pool) {}

  private mapDbRowToMatch(matchRow: MatchDbRow, playerRows: PlayerDbRow[]): Match {
    return {
      matchId: matchRow.match_id,
      status: matchRow.status as 'waiting' | 'in_progress' | 'finished',
      mode: matchRow.mode,
      tournamentId: matchRow.tournament_id || undefined,
      createdBy: matchRow.created_by,
      createdAt: matchRow.created_at.getTime(),
      players: playerRows.map(p => ({
        userId: p.user_id,
        username: p.username,
        isReady: p.is_ready,
        team: p.team || undefined
      }))
    };
  }

  async create(input: MatchCreateInput): Promise<Match> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const insertMatchQuery = `
        INSERT INTO matches (match_id, status, mode, tournament_id, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query<MatchDbRow>(insertMatchQuery, [
        input.matchId,
        input.status,
        input.mode,
        input.tournamentId || null,
        input.createdBy,
        input.createdAt
      ]);

      await client.query('COMMIT');

      return this.mapDbRowToMatch(result.rows[0], []);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(matchId: string): Promise<Match | null> {
    const matchQuery = 'SELECT * FROM matches WHERE match_id = $1';
    const playersQuery = 'SELECT * FROM players_in_match WHERE match_id = $1';

    const [matchResult, playersResult] = await Promise.all([
      this.pool.query<MatchDbRow>(matchQuery, [matchId]),
      this.pool.query<PlayerDbRow>(playersQuery, [matchId])
    ]);

    if (matchResult.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToMatch(matchResult.rows[0], playersResult.rows);
  }

  async findAll(filters?: { status?: string; tournamentId?: string }): Promise<Match[]> {
    let query = 'SELECT * FROM matches WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.tournamentId) {
      query += ` AND tournament_id = $${paramCount}`;
      params.push(filters.tournamentId);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const matchResult = await this.pool.query<MatchDbRow>(query, params);
    
    if (matchResult.rows.length === 0) {
      return [];
    }

    const matchIds = matchResult.rows.map(m => m.match_id);
    const playersQuery = 'SELECT * FROM players_in_match WHERE match_id = ANY($1)';
    const playersResult = await this.pool.query<PlayerDbRow>(playersQuery, [matchIds]);

    return matchResult.rows.map(matchRow => {
      const players = playersResult.rows.filter(p => p.match_id === matchRow.match_id);
      return this.mapDbRowToMatch(matchRow, players);
    });
  }

  async update(matchId: string, input: MatchUpdateInput): Promise<Match | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (input.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(input.status);
      paramCount++;
    }

    if (input.mode !== undefined) {
      updates.push(`mode = $${paramCount}`);
      params.push(input.mode);
      paramCount++;
    }

    if (input.tournamentId !== undefined) {
      updates.push(`tournament_id = $${paramCount}`);
      params.push(input.tournamentId);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(matchId);
    }

    params.push(matchId);
    const query = `
      UPDATE matches 
      SET ${updates.join(', ')}
      WHERE match_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query<MatchDbRow>(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(matchId);
  }

  async delete(matchId: string): Promise<boolean> {
    const query = 'DELETE FROM matches WHERE match_id = $1';
    const result = await this.pool.query(query, [matchId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addPlayer(matchId: string, player: PlayerInMatch): Promise<void> {
    const query = `
      INSERT INTO players_in_match (match_id, user_id, username, is_ready, team)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (match_id, user_id) 
      DO UPDATE SET username = $3, is_ready = $4, team = $5
    `;

    await this.pool.query(query, [
      matchId,
      player.userId,
      player.username,
      player.isReady,
      player.team || null
    ]);
  }

  async removePlayer(matchId: string, userId: string): Promise<void> {
    const query = 'DELETE FROM players_in_match WHERE match_id = $1 AND user_id = $2';
    await this.pool.query(query, [matchId, userId]);
  }

  async updatePlayerReady(matchId: string, userId: string, isReady: boolean): Promise<void> {
    const query = `
      UPDATE players_in_match 
      SET is_ready = $3 
      WHERE match_id = $1 AND user_id = $2
    `;
    await this.pool.query(query, [matchId, userId, isReady]);
  }
}