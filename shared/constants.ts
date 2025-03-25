// Game Constants
export const GAME_CONSTANTS = {
  // Game Settings
  MAX_PLAYERS_PER_TEAM: 8,
  MIN_PLAYERS_PER_TEAM: 1,
  BASE_KILLS_TO_WIN: 10,
  
  // Player Settings
  PLAYER_HEALTH: 100,
  PLAYER_SPEED: 10,
  PLAYER_SPRINT_SPEED: 15,
  PLAYER_SPRINT_DURATION: 3, // seconds
  PLAYER_SPRINT_COOLDOWN: 3, // seconds
  PLAYER_JUMP_FORCE: 7,
  GRAVITY: -20,
  
  // Weapon Settings
  RELOAD_TIME: 2, // seconds
  WEAPON_SWITCH_TIME: 0.5, // seconds
};

// Socket.IO Event Types
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

// Team Types
export enum TEAM {
  HUMANS = 'humans',
  ROGUE_AI = 'rogue_ai',
}

// Player Types
export enum PLAYER_TYPE {
  HUMAN = 'human',
  FRIENDLY_AI = 'friendly_ai',
  ROGUE_AI = 'rogue_ai',
}

// Weapon Types
export enum WEAPON_TYPE {
  ASSAULT_RIFLE = 'assault_rifle',
  SHOTGUN = 'shotgun',
  SNIPER_RIFLE = 'sniper_rifle',
  PISTOL = 'pistol',
  SMG = 'smg',
}

// Grenade Types
export enum GRENADE_TYPE {
  FRAG = 'frag',
  SMOKE = 'smoke',
  FLASHBANG = 'flashbang',
} 