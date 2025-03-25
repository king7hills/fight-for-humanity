import { Match } from './match';
import { Player } from './player';
import { Server } from 'socket.io';

// Team Types
enum TEAM {
  HUMANS = 'humans',
  ROGUE_AI = 'rogue_ai',
}

// Socket.IO event types
enum SOCKET_EVENTS {
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

export class GameManager {
  private matches: Map<string, Match>;
  private players: Map<string, Player>;
  private io: Server;
  private waitingPlayers: string[] = [];

  constructor(io: Server) {
    this.matches = new Map();
    this.players = new Map();
    this.io = io;
  }

  // Handle a new player joining
  handlePlayerJoin(socketId: string, name: string, isHuman: boolean): void {
    // Create new player
    const player = new Player(name, isHuman);
    this.players.set(socketId, player);
    
    // Add to waiting list and try to find a match
    this.waitingPlayers.push(socketId);
    this.findMatchForWaitingPlayers();
    
    console.log(`Player ${name} (${socketId}) joined. Human: ${isHuman}`);
  }

  // Handle a player leaving
  handlePlayerLeave(socketId: string): void {
    const player = this.players.get(socketId);
    if (!player) return;
    
    // Remove from waiting queue if there
    const waitingIndex = this.waitingPlayers.indexOf(socketId);
    if (waitingIndex !== -1) {
      this.waitingPlayers.splice(waitingIndex, 1);
    }
    
    // Remove from any match
    for (const [matchId, match] of this.matches.entries()) {
      if (match.teams[TEAM.HUMANS].includes(socketId) || 
          match.teams[TEAM.ROGUE_AI].includes(socketId)) {
        match.removePlayer(socketId);
        this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_LEAVE, { playerId: socketId });
        
        // Check if match should be deleted
        if (match.status === 'ended') {
          this.matches.delete(matchId);
        }
      }
    }
    
    // Delete player
    this.players.delete(socketId);
    
    console.log(`Player ${player.name} (${socketId}) left`);
  }

  // Find or create a match for waiting players
  private findMatchForWaitingPlayers(): void {
    if (this.waitingPlayers.length < 2) return;
    
    // First try to find an active match with fewer than max players
    for (const [matchId, match] of this.matches.entries()) {
      if (match.status === 'waiting' || match.status === 'active') {
        const totalPlayers = match.teams[TEAM.HUMANS].length + match.teams[TEAM.ROGUE_AI].length;
        if (totalPlayers < 2 * match.teams[TEAM.HUMANS].length) {
          // Add a player to this match
          const playerId = this.waitingPlayers.shift()!;
          const player = this.players.get(playerId)!;
          
          match.addPlayer(playerId, player.type === 'human');
          
          // Assign the player to the chosen team
          for (const team of [TEAM.HUMANS, TEAM.ROGUE_AI]) {
            if (match.teams[team].includes(playerId)) {
              player.team = team;
              break;
            }
          }
          
          // Subscribe to the match room
          this.io.sockets.sockets.get(playerId)?.join(matchId);
          
          // Notify everyone in the match about the new player
          this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_JOIN, { 
            player: player.getPlayerData() 
          });
          
          // Send the current match data to the new player
          this.io.to(playerId).emit(SOCKET_EVENTS.GAME_START, {
            match: match.getMatchData(),
            players: Array.from(this.players.entries())
              .filter(([id]) => match.teams[TEAM.HUMANS].includes(id) || 
                               match.teams[TEAM.ROGUE_AI].includes(id))
              .map(([, player]) => player.getPlayerData())
          });
          
          return; // Added one player, can wait for next iteration
        }
      }
    }
    
    // If no suitable match was found, create a new one
    if (this.waitingPlayers.length >= 2) {
      const match = new Match();
      this.matches.set(match.id, match);
      
      // Add up to 2 players initially
      for (let i = 0; i < 2 && this.waitingPlayers.length > 0; i++) {
        const playerId = this.waitingPlayers.shift()!;
        const player = this.players.get(playerId)!;
        
        match.addPlayer(playerId, player.type === 'human');
        
        // Assign the player to the chosen team
        for (const team of [TEAM.HUMANS, TEAM.ROGUE_AI]) {
          if (match.teams[team].includes(playerId)) {
            player.team = team;
            break;
          }
        }
        
        // Subscribe to the match room
        this.io.sockets.sockets.get(playerId)?.join(match.id);
      }
      
      // Get all the players in this match
      const matchPlayers = Array.from(this.players.entries())
        .filter(([id]) => match.teams[TEAM.HUMANS].includes(id) || 
                         match.teams[TEAM.ROGUE_AI].includes(id))
        .map(([, player]) => player.getPlayerData());
      
      // Notify all players in the match that the game is starting
      this.io.to(match.id).emit(SOCKET_EVENTS.GAME_START, {
        match: match.getMatchData(),
        players: matchPlayers
      });
      
      console.log(`Created new match ${match.id} with ${matchPlayers.length} players`);
    }
  }

  // Handle player movement
  handlePlayerMove(socketId: string, position: any, rotation: any, velocity: any): void {
    const player = this.players.get(socketId);
    if (!player) return;
    
    // Update player state
    player.position = position;
    player.rotation = rotation;
    player.velocity = velocity;
    
    // Find the match this player is in
    for (const [matchId, match] of this.matches.entries()) {
      if (match.teams[TEAM.HUMANS].includes(socketId) || 
          match.teams[TEAM.ROGUE_AI].includes(socketId)) {
        // Broadcast to all players in match except the current player
        this.io.to(matchId).except(socketId).emit(SOCKET_EVENTS.PLAYER_MOVE, {
          id: socketId,
          position,
          rotation,
          velocity
        });
        break;
      }
    }
  }

  // Handle shooting
  handlePlayerShoot(socketId: string, direction: any): void {
    const player = this.players.get(socketId);
    if (!player || !player.isAlive) return;
    
    const weapon = player.getCurrentWeapon();
    
    // Check if can shoot
    if (weapon.isReloading || weapon.ammo <= 0) return;
    
    const now = Date.now();
    if (now - weapon.lastFired < 1000 / weapon.fireRate) return;
    
    // Update weapon state
    weapon.lastFired = now;
    weapon.ammo--;
    
    // Find the match this player is in
    for (const [matchId, match] of this.matches.entries()) {
      if (match.teams[TEAM.HUMANS].includes(socketId) || 
          match.teams[TEAM.ROGUE_AI].includes(socketId)) {
        // Broadcast to all players in match
        this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_SHOOT, {
          id: socketId,
          position: player.position,
          direction
        });
        break;
      }
    }
  }

  // Handle hit detection
  handlePlayerHit(shooterId: string, targetId: string): void {
    const shooter = this.players.get(shooterId);
    const target = this.players.get(targetId);
    
    if (!shooter || !target || !target.isAlive || shooter.team === target.team) return;
    
    const weapon = shooter.getCurrentWeapon();
    target.takeDamage(weapon.damage);
    
    // Find the match
    for (const [matchId, match] of this.matches.entries()) {
      if ((match.teams[TEAM.HUMANS].includes(shooterId) || match.teams[TEAM.ROGUE_AI].includes(shooterId)) &&
          (match.teams[TEAM.HUMANS].includes(targetId) || match.teams[TEAM.ROGUE_AI].includes(targetId))) {
        // Send hit event
        this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_HIT, {
          shooterId,
          targetId,
          damage: weapon.damage,
          health: target.health
        });
        
        if (!target.isAlive) {
          // Handle kill
          shooter.score.kills++;
          
          // Add score to team
          match.addScore(shooter.team);
          
          // Send death event
          this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_DIE, {
            shooterId,
            targetId
          });
          
          // If match has ended, notify everyone
          if (match.status === 'ended') {
            this.io.to(matchId).emit(SOCKET_EVENTS.GAME_END, {
              match: match.getMatchData()
            });
          } else {
            // Schedule respawn
            setTimeout(() => {
              // Basic respawn at a fixed position for now
              const respawnPosition = { x: 0, y: 1, z: 0 };
              target.respawn(respawnPosition);
              
              this.io.to(matchId).emit(SOCKET_EVENTS.PLAYER_RESPAWN, {
                id: targetId,
                position: respawnPosition
              });
            }, 5000); // 5 second respawn time
          }
        }
        
        break;
      }
    }
  }
} 