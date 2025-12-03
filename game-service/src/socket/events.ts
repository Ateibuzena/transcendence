

// 1. Jugador unido a la partida
socket.on('player-joined', {
  playerId: string,
  username: string,
  side: "left" | "right"
})

// 2. Ambos jugadores listos, inicio del juego
socket.on('game-start', {
  countdown: 3  // Cuenta regresiva en segundos
})

// 3. Estado del juego (60 veces por segundo)
socket.on('game-state', {
  timestamp: number,
  ball: {
    x: number,
    y: number,
    vx: number,  // Velocidad X
    vy: number   // Velocidad Y
  },
  paddles: {
    left: { y: number },
    right: { y: number }
  },
  score: {
    left: number,
    right: number
  }
})

// 4. Punto anotado
socket.on('point-scored', {
  scorer: "left" | "right",
  score: {
    left: number,
    right: number
  }
})

// 5. Fin del juego
socket.on('game-end', {
  winner: "left" | "right",
  finalScore: {
    left: number,
    right: number
  },
  reason: "score_limit" | "opponent_disconnect" | "forfeit",
  matchSummary: {
    duration: number,  // segundos
    totalHits: number,
    longestRally: number
  }
})

// 6. Oponente desconectado
socket.on('opponent-disconnected', {
  playerId: string,
  waitingForReconnect: boolean,
  timeout: 30  // segundos para reconectar
})

// 7. Oponente reconectado
socket.on('opponent-reconnected', {
  playerId: string
})

// 8. Error
socket.on('error', {
  code: string,
  message: string
})