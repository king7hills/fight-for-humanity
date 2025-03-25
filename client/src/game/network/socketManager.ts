import { io, Socket } from 'socket.io-client';
import { Vector3 } from 'three';
import soundManager from '../SoundManager';

// Socket.IO event types (should match the server)
export enum SOCKET_EVENTS {
  PLAYER_JOIN = 'player:join',
  PLAYER_LEAVE = 'player:leave',
  PLAYER_MOVE = 'player:move',
  PLAYER_SHOOT = 'player:shoot',
  PLAYER_HIT = 'player:hit',
  PLAYER_DIE = 'player:die',
  PLAYER_RESPAWN = 'player:respawn',
  GAME_START = 'game:start',
  GAME_END = 'game:end',
  GAME_UPDATE = 'game:update',
  CHAT_MESSAGE = 'chat:message',
}

// Player data interface
export interface PlayerData {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  health: number;
  team: 'human' | 'ai';
  isAlive: boolean;
  score: number;
}

// Game state interface
export interface GameState {
  players: Record<string, PlayerData>;
  teams: {
    human: {
      score: number;
      players: string[];
    };
    ai: {
      score: number;
      players: string[];
    };
  };
  matchTime: number;
  isMatchActive: boolean;
}

// Define callback types
type EventCallback = (...args: unknown[]) => void;

class SocketManager {
  private socket: Socket | null = null;
  private gameState: GameState = {
    players: {},
    teams: {
      human: {
        score: 0,
        players: []
      },
      ai: {
        score: 0,
        players: []
      }
    },
    matchTime: 0,
    isMatchActive: false
  };
  private eventListeners: Record<string, EventCallback[]> = {};

  // Initialize socket connection
  connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Attempting to connect to server at ${serverUrl}`);
      
      try {
        this.socket = io(serverUrl, {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('Connected to server with ID:', this.socket?.id);
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err.message);
          reject(err);
        });

        this.socket.on('disconnect', (reason) => {
          console.warn('Disconnected from server:', reason);
        });

        this.socket.io.on('error', (err) => {
          console.error('Socket.IO error:', err);
        });

        this.socket.io.on('reconnect_attempt', (attempt) => {
          console.log(`Trying to reconnect... Attempt ${attempt}`);
        });

        this.socket.io.on('reconnect_failed', () => {
          console.error('Failed to reconnect to server after multiple attempts');
        });

        // Handle hit confirmation from server
        this.socket.on('hitConfirmed', (data: { targetId: string, isHeadshot: boolean }) => {
          // Play hit marker sound
          if (data.isHeadshot) {
            soundManager.playSound('headshot', 0.7);
          } else {
            soundManager.playSound('hit_marker', 0.6);
          }
          
          // Any additional hit confirmation logic can go here
          console.log('Hit confirmed on player:', data.targetId);
        });
      } catch (err) {
        console.error('Error initializing socket connection:', err);
        reject(err);
      }
    });
  }

  // Set up event listeners for socket events
  private setupEventListeners() {
    if (!this.socket) return;

    // Game state updates
    this.socket.on(SOCKET_EVENTS.GAME_UPDATE, (gameState: GameState) => {
      console.log('Received game state update:', gameState);
      this.gameState = gameState;
      this.emitEvent('gameStateUpdate', gameState);
    });

    // Player hit
    this.socket.on(SOCKET_EVENTS.PLAYER_HIT, ({ damage, health, attackerId }) => {
      console.log('Received player hit event:', { damage, health, attackerId });
      this.emitEvent('playerHit', { damage, health, attackerId });
    });

    // Player death
    this.socket.on(SOCKET_EVENTS.PLAYER_DIE, () => {
      console.log('Received player death event');
      this.emitEvent('playerDie');
    });
    
    // Player respawn
    this.socket.on(SOCKET_EVENTS.PLAYER_RESPAWN, (data) => {
      console.log('Received player respawn event:', data);
      this.emitEvent('playerRespawn', data);
    });

    // Game start/end
    this.socket.on(SOCKET_EVENTS.GAME_START, (data) => {
      console.log('Received game start event:', data);
      this.emitEvent('gameStart', data);
    });

    this.socket.on(SOCKET_EVENTS.GAME_END, (results) => {
      console.log('Received game end event:', results);
      this.emitEvent('gameEnd', results);
    });
  }

  // Join a game
  joinGame(name: string, isHuman: boolean) {
    if (!this.socket) {
      console.error('Cannot join game: Socket not connected');
      return;
    }
    console.log(`Joining game as ${name}, Human: ${isHuman}`);
    this.socket.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, isHuman });
  }

  // Send player movement
  sendMovement(position: Vector3, rotation: Vector3, velocity: Vector3) {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.PLAYER_MOVE, { position, rotation, velocity });
  }

  // Send player shoot
  sendShoot(direction: Vector3) {
    if (!this.socket) return;
    console.log('Sending shoot event with direction:', direction);
    this.socket.emit(SOCKET_EVENTS.PLAYER_SHOOT, { direction });
  }

  // Send player hit (when client-side hit detection is used)
  sendHit(targetId: string) {
    if (!this.socket) return;
    console.log('Sending hit event for target:', targetId);
    this.socket.emit(SOCKET_EVENTS.PLAYER_HIT, { targetId });
  }

  // Respawn request
  requestRespawn() {
    if (!this.socket) return;
    console.log('Sending respawn request');
    this.socket.emit(SOCKET_EVENTS.PLAYER_RESPAWN);
  }

  // Event subscription system
  on(event: string, callback: EventCallback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  private emitEvent(event: string, ...args: unknown[]) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => callback(...args));
  }

  // Get current game state
  getGameState(): GameState {
    return this.gameState;
  }

  // Disconnect
  disconnect() {
    if (!this.socket) return;
    console.log('Disconnecting from server');
    this.socket.disconnect();
    this.socket = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager; 