# 🎮 Servidor de Juego Pong - Multijugador en Tiempo Real

Sistema de juego multijugador basado en el clásico Pong de 1972, con arquitectura de microservicios, servidor autoritativo y soporte para clientes web y CLI mediante WebSockets.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API REST](#api-rest)
- [WebSocket Events](#websocket-events)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Desarrollo](#desarrollo)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- **Servidor Autoritativo**: Toda la lógica del juego se ejecuta en el servidor (prevención de trampas)
- **Multijugador en Tiempo Real**: Partidas 1v1 con sincronización a 60 FPS
- **Acceso Multi-Plataforma**: Clientes web (navegador) y CLI (terminal) usando el mismo protocolo
- **Sistema de Torneos**: Brackets de eliminación simple/doble
- **Reconexión Automática**: Los jugadores pueden reconectarse si pierden la conexión
- **Estadísticas**: Tracking de victorias, derrotas, puntos y historial de partidas

### 🎲 Mecánicas de Juego

- Física determinista con colisiones realistas
- Velocidad incremental de la pelota
- Ángulo de rebote basado en el punto de impacto
- Sistema de puntuación configurable
- Cuenta regresiva antes del inicio
- Detección de desconexiones con tiempo de espera

---

## 🏗️ Arquitectura

### Diagrama General

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Fastify)                 │
│               REST API + WebSocket (Socket.io)           │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐  ┌───▼────┐  ┌────▼─────┐
    │   Auth    │  │Matches │  │  Users   │
    │  Service  │  │Service │  │ Service  │
    │   (API)   │  │  (API) │  │  (API)   │
    └───────────┘  └────┬───┘  └──────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼─────────────────────────────▼───┐
    │    Game Server (Socket.io)           │
    │  • GameManager (orquestador)         │
    │  • PongGame (motor de física)        │
    │  • Estado del juego en memoria       │
    │  • Game loop autoritativo (60 FPS)   │
    └──────────────┬───────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼─────┐      ┌─────▼──────┐
    │  Redis   │      │PostgreSQL  │
    │(Sesiones)│      │ (Partidas, │
    │(Pub/Sub) │      │ Usuarios,  │
    │          │      │ Torneos)   │
    └──────────┘      └────────────┘
```

### Flujo de Comunicación

```
Cliente Web/CLI
      │
      │ 1. POST /api/auth/login (REST)
      │ ← JWT Token
      │
      │ 2. WebSocket connect (auth: token)
      ├──────────────────────────────────────► Fastify + Socket.io
      │                                                │
      │ 3. emit('join-match', {matchId})              │
      │                                         ┌──────▼─────┐
      │                                         │GameManager │
      │                                         └──────┬─────┘
      │                                         ┌──────▼─────┐
      │ 4. on('game-state', {...}) 60/seg       │ PongGame   │
      │ ◄──────────────────────────────────────┤ (Game Loop)│
      │                                         └────────────┘
      │ 5. emit('paddle-move', {direction})
      ├──────────────────────────────────────►
      │
      │ 6. on('game-end', {winner})
      │ ◄──────────────────────────────────────
```

### Patrones de Diseño

- **REST API**: Arquitectura en capas (Controller → Service → Repository)
- **Game Server**: Event-driven con estado en memoria para máximo rendimiento
- **Servidor Autoritativo**: El cliente solo envía inputs, el servidor calcula todo
- **Thin Clients**: Los clientes solo renderizan, no tienen lógica de juego

---

## 🛠️ Stack Tecnológico

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Fastify 4.x (alto rendimiento)
- **WebSocket**: Socket.io 4.x (comunicación bidireccional)
- **Lenguaje**: TypeScript 5.x (tipado estático)
- **Base de Datos**: PostgreSQL (datos persistentes)
- **Cache**: Redis (sesiones, pub/sub)
- **Autenticación**: JWT (JSON Web Tokens)

### Cliente Web

- HTML5 Canvas (renderizado gráfico)
- Socket.io Client (WebSocket)
- JavaScript/TypeScript

### Cliente CLI

- Node.js con Socket.io Client
- Blessed/Ink (UI de terminal)
- Renderizado ASCII

---

## 📦 Requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0 (opcional pero recomendado)
- npm o yarn

---

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/pong-server.git
cd pong-server

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar variables de entorno
nano .env
```

### Dependencias Principales

```json
{
  "dependencies": {
    "fastify": "^4.25.2",
    "@fastify/cors": "^9.0.1",
    "@fastify/jwt": "^8.0.0",
    "fastify-socket.io": "^5.0.0",
    "socket.io": "^4.6.1",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  }
}
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```bash
# Servidor
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# JWT
JWT_SECRET=tu-clave-secreta-super-segura-cambiar-en-produccion

# Base de Datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/pong_db

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Configuración del Juego
GAME_TICK_RATE=60
MAX_PLAYERS_PER_MATCH=2
```

### Configuración de Base de Datos

```bash
# Crear base de datos
createdb pong_db

# Ejecutar migraciones (ejemplo)
npm run migrate

# O manualmente:
psql pong_db < migrations/001_initial_schema.sql
```

---

## ▶️ Ejecución

### Desarrollo (con hot-reload)

```bash
npm run dev
```

### Compilar TypeScript

```bash
npm run build
```

### Producción

```bash
npm start
```

### Verificar Tipos

```bash
npm run type-check
```

### El servidor estará disponible en:

- **API REST**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`
- **Health Check**: `http://localhost:3000/health`

---

## 🌐 API REST

### Autenticación

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "player1",
    "email": "player1@example.com"
  }
}
```

#### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newplayer",
  "email": "newplayer@example.com",
  "password": "securepassword"
}

Response 201:
{
  "message": "User created successfully",
  "userId": "uuid"
}
```

### Partidas (Matches)

#### Crear Partida

```http
POST /api/matches
Authorization: Bearer {token}
Content-Type: application/json

{
  "mode": "casual",
  "tournamentId": null
}

Response 201:
{
  "matchId": "match_abc123",
  "status": "waiting",
  "createdBy": "user_id",
  "createdAt": "2025-01-15T10:30:00Z",
  "wsUrl": "ws://localhost:3000"
}
```

#### Listar Partidas Disponibles

```http
GET /api/matches?status=waiting&mode=casual
Authorization: Bearer {token}

Response 200:
{
  "matches": [
    {
      "matchId": "match_abc123",
      "status": "waiting",
      "players": 1,
      "mode": "casual",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### Obtener Detalles de Partida

```http
GET /api/matches/{matchId}
Authorization: Bearer {token}

Response 200:
{
  "matchId": "match_abc123",
  "status": "in_progress",
  "players": [
    {
      "userId": "user_1",
      "username": "player1",
      "side": "left"
    },
    {
      "userId": "user_2",
      "username": "player2",
      "side": "right"
    }
  ],
  "score": { "left": 5, "right": 3 },
  "startedAt": "2025-01-15T10:35:00Z"
}
```

#### Unirse a Partida

```http
POST /api/matches/{matchId}/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_2"
}

Response 200:
{
  "success": true,
  "matchId": "match_abc123",
  "side": "right",
  "wsUrl": "ws://localhost:3000"
}
```

### Usuarios

#### Obtener Historial de Partidas

```http
GET /api/users/{userId}/matches?limit=10&offset=0
Authorization: Bearer {token}

Response 200:
{
  "matches": [
    {
      "matchId": "match_xyz",
      "opponent": {
        "userId": "user_3",
        "username": "opponent1"
      },
      "result": "win",
      "score": { "player1": 11, "player2": 7 },
      "playedAt": "2025-01-15T09:00:00Z"
    }
  ],
  "total": 50,
  "page": 1
}
```

#### Obtener Estadísticas

```http
GET /api/users/{userId}/stats
Authorization: Bearer {token}

Response 200:
{
  "totalMatches": 50,
  "wins": 32,
  "losses": 18,
  "winRate": 64.00,
  "totalPoints": 550,
  "averagePointsPerMatch": 11.0
}
```

---

## 🔌 WebSocket Events

### Cliente → Servidor

#### join-match

Conectar a una partida existente.

```typescript
socket.emit('join-match', {
  matchId: "match_abc123",
  token: "jwt_token",
  userId: "user_id"
}, (response) => {
  console.log(response); // { success: true, side: "left" }
});
```

#### player-ready

Marcar al jugador como listo para comenzar.

```typescript
socket.emit('player-ready');
```

#### paddle-move

Enviar input de movimiento de paleta.

```typescript
socket.emit('paddle-move', {
  direction: "up" | "down" | "stop",
  timestamp: Date.now()
});
```

#### leave-match

Abandonar la partida voluntariamente.

```typescript
socket.emit('leave-match');
```

#### reconnect-match

Reconectar a una partida después de desconexión.

```typescript
socket.emit('reconnect-match', {
  matchId: "match_abc123",
  userId: "user_id",
  token: "jwt_token"
});
```

### Servidor → Cliente

#### game-config

Configuración del juego al conectarse.

```typescript
socket.on('game-config', (config) => {
  // {
  //   canvasWidth: 800,
  //   canvasHeight: 600,
  //   paddleHeight: 100,
  //   paddleWidth: 10,
  //   ballRadius: 8,
  //   maxScore: 11
  // }
});
```

#### player-joined

Notificación cuando un jugador se une.

```typescript
socket.on('player-joined', (data) => {
  // {
  //   playerId: "user_2",
  //   username: "player2",
  //   side: "right"
  // }
});
```

#### game-start

Inicio del juego con cuenta regresiva.

```typescript
socket.on('game-start', (data) => {
  // { countdown: 3 }
  // El juego comenzará en 3 segundos
});
```

#### game-state

Estado del juego en tiempo real (60 veces por segundo).

```typescript
socket.on('game-state', (state) => {
  // {
  //   timestamp: 1234567890,
  //   ball: { x: 400, y: 300, vx: 5, vy: -3 },
  //   paddles: {
  //     left: { y: 250 },
  //     right: { y: 180 }
  //   },
  //   score: { left: 5, right: 3 }
  // }
  
  renderGame(state);
});
```

#### point-scored

Notificación cuando se anota un punto.

```typescript
socket.on('point-scored', (data) => {
  // {
  //   scorer: "left",
  //   score: { left: 6, right: 3 }
  // }
});
```

#### game-end

Fin de la partida.

```typescript
socket.on('game-end', (data) => {
  // {
  //   winner: "left",
  //   finalScore: { left: 11, right: 8 },
  //   reason: "score_limit",
  //   matchSummary: {
  //     duration: 180,
  //     totalHits: 45,
  //     longestRally: 12
  //   }
  // }
});
```

#### opponent-disconnected

El oponente se desconectó.

```typescript
socket.on('opponent-disconnected', (data) => {
  // {
  //   playerId: "user_2",
  //   waitingForReconnect: true,
  //   timeout: 30
  // }
  // Esperando reconexión por 30 segundos
});
```

#### opponent-reconnected

El oponente se reconectó.

```typescript
socket.on('opponent-reconnected', (data) => {
  // { playerId: "user_2" }
});
```

#### error

Error durante el juego.

```typescript
socket.on('error', (error) => {
  // {
  //   code: "JOIN_MATCH_ERROR",
  //   message: "Match is full"
  // }
});
```

---

## 📁 Estructura del Proyecto

```
src/
├── config/                      # Configuración
│   ├── game.config.ts          # Configuración del juego
│   └── server.config.ts        # Configuración del servidor
│
├── types/                       # Tipos TypeScript
│   ├── game.types.ts           # Tipos del motor de juego
│   ├── socket.types.ts         # Tipos de Socket.io
│   └── match.types.ts          # Tipos de partidas
│
├── game/                        # Motor del juego
│   ├── GameManager.ts          # Gestor de partidas activas
│   ├── PongGame.ts             # Lógica del juego Pong
│   └── Physics.ts              # Cálculos de física
│
├── socket/                      # WebSocket handlers
│   ├── socket.handler.ts       # Configuración de Socket.io
│   └── events.ts               # Definición de eventos
│
├── api/                         # REST API
│   ├── routes/                 # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── match.routes.ts
│   │   └── user.routes.ts
│   └── controllers/            # Controladores
│       ├── auth.controller.ts
│       ├── match.controller.ts
│       └── user.controller.ts
│
├── repositories/                # Acceso a datos
│   ├── match.repository.ts
│   └── user.repository.ts
│
├── middleware/                  # Middlewares
│   ├── auth.middleware.ts
│   └── error.middleware.ts
│
├── utils/                       # Utilidades
│   ├── auth.ts                 # Funciones de autenticación
│   └── logger.ts               # Logger
│
├── app.ts                       # Configuración de Fastify
└── server.ts                    # Punto de entrada
```

---

## 👨‍💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Verificar tipos sin compilar
npm run type-check

# Linting
npm run lint

# Tests (si están configurados)
npm test
```

### Extensiones Recomendadas (VSCode)

- ESLint
- Prettier
- TypeScript Vue Plugin
- REST Client

### Convenciones de Código

- **Nombres de archivos**: kebab-case (auth.controller.ts)
- **Nombres de clases**: PascalCase (GameManager)
- **Nombres de funciones**: camelCase (handlePaddleInput)
- **Constantes**: UPPER_SNAKE_CASE (MAX_SCORE)
- **Interfaces**: PascalCase con prefijo I opcional (GameState o IGameState)

---

## 📝 Notas Importantes

### Servidor Autoritativo

El servidor es la **única fuente de verdad**. Los clientes:
- ✅ Solo envían inputs (direcciones de movimiento)
- ❌ NO calculan física ni colisiones
- ❌ NO deciden puntuaciones
- ✅ Solo renderizan el estado recibido del servidor

### Rendimiento

- Game loop a 60 FPS (16.67ms por tick)
- Estado del juego enviado 60 veces por segundo
- Física calculada en el servidor (sin overhead de red)
- Clientes ligeros (solo renderizado)

### Seguridad

- Autenticación JWT en REST API y WebSocket
- Validación de todos los inputs en el servidor
- Rate limiting (recomendado para producción)
- Sanitización de datos de usuario

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📧 Contacto

Para preguntas o sugerencias, contacta a través de GitHub Issues.

---

**¡Disfruta jugando Pong! 🏓**