class PongGame {
  constructor(matchData) {
    this.matchId = matchData.matchId;
    this.players = matchData.players;
    
    // Configuración del juego
    this.config = {
      canvasWidth: 800,
      canvasHeight: 600,
      paddleWidth: 10,
      paddleHeight: 100,
      paddleSpeed: 8,
      ballRadius: 8,
      ballSpeed: 5,
      maxScore: 11  // Primer jugador en llegar a 11 gana
    };
    
    // Estado inicial
    this.state = {
      ball: {
        x: this.config.canvasWidth / 2,
        y: this.config.canvasHeight / 2,
        vx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
        vy: this.config.ballSpeed * (Math.random() - 0.5) * 2,
        radius: this.config.ballRadius
      },
      paddles: {
        left: { 
          y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2,
          vy: 0  // Velocidad actual
        },
        right: { 
          y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2,
          vy: 0
        }
      },
      score: { left: 0, right: 0 },
      status: 'waiting',  // waiting, countdown, playing, paused, finished
      lastUpdate: Date.now()
    };
    
    this.gameLoop = null;
    this.tickRate = 60;  // 60 FPS
  }

  /**
   * Iniciar el juego
   */
  start() {
    this.state.status = 'countdown';
    
    // Cuenta regresiva de 3 segundos
    this.broadcast('game-start', { countdown: 3 });
    
    setTimeout(() => {
      this.state.status = 'playing';
      this.startGameLoop();
    }, 3000);
  }

  /**
   * Loop principal del juego
   */
  startGameLoop() {
    this.gameLoop = setInterval(() => {
      this.update();
      this.broadcastState();
    }, 1000 / this.tickRate);
  }

  /**
   * Actualizar física del juego
   */
  update() {
    const deltaTime = 1 / this.tickRate;
    
    // Actualizar posición de la pelota
    this.state.ball.x += this.state.ball.vx;
    this.state.ball.y += this.state.ball.vy;
    
    // Actualizar paletas
    this.updatePaddles(deltaTime);
    
    // Detectar colisiones
    this.checkCollisions();
    
    // Detectar puntos
    this.checkScoring();
    
    this.state.lastUpdate = Date.now();
  }

  /**
   * Actualizar posición de paletas
   */
  updatePaddles(deltaTime) {
    ['left', 'right'].forEach(side => {
      const paddle = this.state.paddles[side];
      paddle.y += paddle.vy;
      
      // Limitar a los bordes de la pantalla
      paddle.y = Math.max(0, Math.min(
        this.config.canvasHeight - this.config.paddleHeight,
        paddle.y
      ));
    });
  }

  /**
   * Detectar colisiones
   */
  checkCollisions() {
    const ball = this.state.ball;
    
    // Colisión con paredes superior/inferior
    if (ball.y - ball.radius <= 0 || 
        ball.y + ball.radius >= this.config.canvasHeight) {
      ball.vy *= -1;
      ball.y = Math.max(ball.radius, 
                        Math.min(this.config.canvasHeight - ball.radius, ball.y));
    }
    
    // Colisión con paleta izquierda
    if (ball.x - ball.radius <= this.config.paddleWidth) {
      const paddle = this.state.paddles.left;
      
      if (ball.y >= paddle.y && 
          ball.y <= paddle.y + this.config.paddleHeight) {
        this.handlePaddleCollision('left');
      }
    }
    
    // Colisión con paleta derecha
    if (ball.x + ball.radius >= this.config.canvasWidth - this.config.paddleWidth) {
      const paddle = this.state.paddles.right;
      
      if (ball.y >= paddle.y && 
          ball.y <= paddle.y + this.config.paddleHeight) {
        this.handlePaddleCollision('right');
      }
    }
  }

  /**
   * Manejar colisión con paleta
   */
  handlePaddleCollision(side) {
    const ball = this.state.ball;
    const paddle = this.state.paddles[side];
    
    // Invertir dirección horizontal
    ball.vx *= -1;
    
    // Calcular ángulo basado en dónde golpeó la paleta
    const hitPos = (ball.y - paddle.y) / this.config.paddleHeight;
    const angle = (hitPos - 0.5) * Math.PI / 3;  // Máximo 60 grados
    
    // Ajustar velocidad vertical
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    ball.vy = speed * Math.sin(angle);
    
    // Aumentar velocidad ligeramente (max 150%)
    const speedMultiplier = Math.min(1.5, 1 + 0.05);
    ball.vx *= speedMultiplier;
    ball.vy *= speedMultiplier;
    
    // Corregir posición para evitar stuck
    if (side === 'left') {
      ball.x = this.config.paddleWidth + ball.radius;
    } else {
      ball.x = this.config.canvasWidth - this.config.paddleWidth - ball.radius;
    }
  }

  /**
   * Detectar puntos
   */
  checkScoring() {
    const ball = this.state.ball;
    
    // Punto para el jugador derecho
    if (ball.x - ball.radius <= 0) {
      this.scorePoint('right');
    }
    
    // Punto para el jugador izquierdo
    if (ball.x + ball.radius >= this.config.canvasWidth) {
      this.scorePoint('left');
    }
  }

  /**
   * Anotar punto
   */
  scorePoint(scorer) {
    this.state.score[scorer]++;
    
    // Notificar a los jugadores
    this.broadcast('point-scored', {
      scorer,
      score: this.state.score
    });
    
    // Verificar si hay ganador
    if (this.state.score[scorer] >= this.config.maxScore) {
      this.endGame(scorer);
    } else {
      // Resetear pelota
      this.resetBall();
    }
  }

  /**
   * Resetear pelota al centro
   */
  resetBall() {
    this.state.ball = {
      x: this.config.canvasWidth / 2,
      y: this.config.canvasHeight / 2,
      vx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      vy: this.config.ballSpeed * (Math.random() - 0.5) * 2,
      radius: this.config.ballRadius
    };
  }

  /**
   * Manejar input del jugador
   */
  handlePaddleInput(socketId, direction) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return;
    
    const paddle = this.state.paddles[player.side];
    
    switch(direction) {
      case 'up':
        paddle.vy = -this.config.paddleSpeed;
        break;
      case 'down':
        paddle.vy = this.config.paddleSpeed;
        break;
      case 'stop':
        paddle.vy = 0;
        break;
    }
  }

  /**
   * Broadcast del estado actual a todos los jugadores
   */
  broadcastState() {
    const stateData = {
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
      score: this.state.score
    };
    
    this.broadcast('game-state', stateData);
  }

  /**
   * Enviar evento a todos los jugadores
   */
  broadcast(event, data) {
    this.players.forEach(player => {
      if (player.socket && player.socket.connected) {
        player.socket.emit(event, data);
      }
    });
  }

  /**
   * Finalizar juego
   */
  async endGame(winner) {
    clearInterval(this.gameLoop);
    this.state.status = 'finished';
    
    const matchSummary = {
      duration: Math.floor((Date.now() - this.state.startedAt) / 1000),
      totalHits: this.state.totalHits || 0,
      longestRally: this.state.longestRally || 0
    };
    
    // Notificar a los jugadores
    this.broadcast('game-end', {
      winner,
      finalScore: this.state.score,
      reason: 'score_limit',
      matchSummary
    });
    
    // Guardar resultado en DB
    await this.saveMatchResult(winner, matchSummary);
  }

  /**
   * Guardar resultado en base de datos
   */
  async saveMatchResult(winner, summary) {
    const winnerPlayer = this.players.find(p => p.side === winner);
    const loserPlayer = this.players.find(p => p.side !== winner);
    
    await matchRepository.update(this.matchId, {
      status: 'finished',
      winnerId: winnerPlayer.userId,
      loserId: loserPlayer.userId,
      finalScore: this.state.score,
      duration: summary.duration,
      finishedAt: Date.now()
    });
  }

  /**
   * Detener el juego
   */
  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  /**
   * Manejar desconexión de jugador
   */
  handlePlayerDisconnect(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    
    if (player) {
      player.connected = false;
      
      // Pausar el juego
      this.stop();
      this.state.status = 'paused';
      
      // Notificar al otro jugador
      this.broadcast('opponent-disconnected', {
        playerId: player.userId,
        waitingForReconnect: true,
        timeout: 30
      });
    }
  }

  /**
   * Manejar reconexión de jugador
   */
  handlePlayerReconnect(socketId, newSocket) {
    const player = this.players.find(p => p.socketId === socketId);
    
    if (player) {
      player.socket = newSocket;
      player.socketId = newSocket.id;
      player.connected = true;
      
      // Reanudar el juego
      if (this.state.status === 'paused') {
        this.state.status = 'playing';
        this.startGameLoop();
      }
      
      // Notificar a ambos jugadores
      this.broadcast('opponent-reconnected', {
        playerId: player.userId
      });
      
      // Enviar estado actual al jugador reconectado
      newSocket.emit('game-state', this.state);
    }
  }

  /**
   * Forfeit (rendirse/abandonar)
   */
  async forfeit(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    
    if (player) {
      const winner = player.side === 'left' ? 'right' : 'left';
      
      this.broadcast('game-end', {
        winner,
        finalScore: this.state.score,
        reason: 'opponent_disconnect'
      });
      
      await this.saveMatchResult(winner, {
        duration: Math.floor((Date.now() - this.state.startedAt) / 1000),
        totalHits: 0,
        longestRally: 0
      });
      
      this.stop();
    }
  }
}