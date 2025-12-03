class MatchRepository {
  /**
   * Crear nueva partida
   */
  async create(matchData) {
    return await db.matches.create({
      match_id: matchData.matchId,
      status: matchData.status,
      mode: matchData.mode,
      tournament_id: matchData.tournamentId,
      created_by: matchData.createdBy,
      created_at: matchData.createdAt
    });
  }

  /**
   * Buscar partida por ID
   */
  async findById(matchId) {
    return await db.matches.findOne({
      where: { match_id: matchId },
      include: ['players']
    });
  }

  /**
   * Listar partidas disponibles
   */
  async findAvailable(filters) {
    return await db.matches.findAll({
      where: {
        status: filters.status || 'waiting',
        mode: filters.mode
      },
      include: ['players'],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Actualizar resultado de partida
   */
  async update(matchId, data) {
    return await db.matches.update(data, {
      where: { match_id: matchId }
    });
  }

  /**
   * Obtener historial de un usuario
   */
  async findByUserId(userId, limit = 10, offset = 0) {
    return await db.matches.findAll({
      where: {
        [Op.or]: [
          { winner_id: userId },
          { loser_id: userId }
        ],
        status: 'finished'
      },
      include: ['winner', 'loser'],
      order: [['finished_at', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Obtener estadísticas de un usuario
   */
  async getUserStats(userId) {
    const wins = await db.matches.count({
      where: { winner_id: userId, status: 'finished' }
    });
    
    const losses = await db.matches.count({
      where: { loser_id: userId, status: 'finished' }
    });
    
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    
    return {
      totalMatches,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100
    };
  }
}