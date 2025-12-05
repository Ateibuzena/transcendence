export interface PongGameConfig {
  canvas: {
    width: number;
    height: number;
  };
  paddle: {
    width: number;
    height: number;
    speed: number;
    edgeOffset: number;
  };
  ball: {
    radius: number;
    initialSpeed: number;
    speedIncrease: number;
    maxSpeed: number;
    resetDelay: number;
  };
  physics: {
    maxBounceAngle: number;
    paddleBounceFactor: number;
  };
  game: {
    maxScore: number;
    tickRate: number;
    countdownSeconds: number;
    reconnectTimeout: number;
  };
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Paddle {
  y: number;
  vy: number;
}

export interface GameScore {
  left: number;
  right: number;
}

export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

export type PlayerSide = 'left' | 'right';

export type PaddleDirection = 'up' | 'down' | 'stop';

export interface PongGameState {
  ball: Ball;
  paddles: {
    left: Paddle;
    right: Paddle;
  };
  score: GameScore;
  status: GameStatus;
  lastUpdate: number;
  startedAt?: number;
  totalHits?: number;
  longestRally?: number;
  currentRally?: number;
}

export interface MatchSummary {
  duration: number;
  totalHits: number;
  longestRally: number;
}

export interface GameEndReason {
  type: 'score_limit' | 'opponent_disconnect' | 'forfeit';
}