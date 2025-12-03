class GameManager {
  constructor() {
    this.activeGames = new Map();      // matchId → PongGame
    this.playerToGame = new Map();     // socketId → matchId
    this.waitingPlayers = new Map();   // userId → matchData
  }

  /**
   * Crear una nueva partida
   */
  createMatch(userId, options) {
    const matchId = generateMatchId();
    const match = {
      matchId,
      status: 'waiting',
      players: [],
      mode: options.mode,
      tournamentId: options.tournamentId,
      createdBy: userId,
      createdAt: Date.now()
    };
    
    // Guardar en DB
    await matchRepository.create(match);
    
    return match;
  }

  /**
   * Unir jugador a una partida
   */
  async joinMatch(socket, matchId, userId) {
    // Validar que la partida existe y acepta jugadores
    const match = await matchRepository.findById(matchId);
    
    if (match.players.length >= 2) {
      throw new Error('Match is full');
    }

    // Determinar lado del jugador
    const side = match.players.length === 0 ? 'left' : 'right';
    
    // Agregar jugador
    match.players.push({ userId, socketId: socket.id, side });
    
    // Si hay 2 jugadores, iniciar el juego
    if (match.players.length === 2) {
      const game = new PongGame(match);
      this.activeGames.set(matchId, game);
      this.playerToGame.set(socket.id, matchId);
    }
    
    return { side, match };
  }

  /**
   * Obtener partida por ID de socket
   */
  getGameForPlayer(socketId) {
    const matchId = this.playerToGame.get(socketId);
    return this.activeGames.get(matchId);
  }

  /**
   * Manejar desconexión
   */
  async handleDisconnect(socketId) {
    const game = this.getGameForPlayer(socketId);
    
    if (game) {
      game.handlePlayerDisconnect(socketId);
      
      // Esperar 30 segundos para reconexión
      setTimeout(() => {
        if (!game.isPlayerReconnected(socketId)) {
          game.forfeit(socketId);
          this.cleanupGame(game.matchId);
        }
      }, 30000);
    }
  }

  /**
   * Limpiar partida finalizada
   */
  cleanupGame(matchId) {
    const game = this.activeGames.get(matchId);
    
    if (game) {
      game.stop();
      
      // Remover referencias
      game.players.forEach(p => {
        this.playerToGame.delete(p.socketId);
      });
      
      this.activeGames.delete(matchId);
    }
  }
}