// src/config/game.config.ts
export const gameConfig = {
  canvas: {
    width: 800,
    height: 600
  },
  
  paddle: {
    width: 10,
    height: 100,
    speed: 8,
    edgeOffset: 10
  },
  
  ball: {
    radius: 8,
    initialSpeed: 5,
    speedIncrease: 1.05,
    maxSpeed: 15,
    resetDelay: 2000
  },
  
  physics: {
    maxBounceAngle: Math.PI / 3,
    paddleBounceFactor: 1.2
  },
  
  game: {
    maxScore: 11,
    tickRate: parseInt(process.env.GAME_TICK_RATE || '60', 10),
    countdownSeconds: 3,
    reconnectTimeout: 30000
  }
} as const;

export type GameConfig = typeof gameConfig;