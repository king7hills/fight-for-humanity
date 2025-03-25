import { TEAM, PLAYER_TYPE, WEAPON_TYPE, GRENADE_TYPE } from './constants';

// Vector3 type for positions and directions
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  type: PLAYER_TYPE;
  team: TEAM;
  health: number;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  isAlive: boolean;
  isSprinting: boolean;
  sprintCooldown: number;
  crouching: boolean;
  weapons: Weapon[];
  currentWeaponIndex: number;
  score: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

// Weapon interface
export interface Weapon {
  type: WEAPON_TYPE;
  ammo: number;
  reserveAmmo: number;
  maxAmmo: number;
  maxReserveAmmo: number;
  damage: number;
  fireRate: number; // shots per second
  reloadTime: number; // seconds
  isReloading: boolean;
  lastFired: number; // timestamp
}

// Grenade interface
export interface Grenade {
  type: GRENADE_TYPE;
  count: number;
  maxCount: number;
  damage: number;
  radius: number;
  throwForce: number;
}

// Match interface
export interface Match {
  id: string;
  teams: {
    [TEAM.HUMANS]: string[]; // Array of player IDs
    [TEAM.ROGUE_AI]: string[]; // Array of player IDs
  };
  scores: {
    [TEAM.HUMANS]: number;
    [TEAM.ROGUE_AI]: number;
  };
  killsToWin: number;
  startTime: number;
  endTime: number | null;
  status: 'waiting' | 'active' | 'ended';
}

// Game State interface
export interface GameState {
  matches: Record<string, Match>;
  players: Record<string, Player>;
  projectiles: any[]; // Will be defined later
  grenades: any[]; // Will be defined later
} 