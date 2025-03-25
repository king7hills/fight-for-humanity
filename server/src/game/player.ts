import { v4 as uuidv4 } from 'uuid';

// Team Types
enum TEAM {
  HUMANS = 'humans',
  ROGUE_AI = 'rogue_ai',
}

// Player Types
enum PLAYER_TYPE {
  HUMAN = 'human',
  FRIENDLY_AI = 'friendly_ai',
  ROGUE_AI = 'rogue_ai',
}

// Weapon Types
enum WEAPON_TYPE {
  ASSAULT_RIFLE = 'assault_rifle',
  SHOTGUN = 'shotgun',
  SNIPER_RIFLE = 'sniper_rifle',
  PISTOL = 'pistol',
  SMG = 'smg',
}

// Game Constants
const GAME_CONSTANTS = {
  PLAYER_HEALTH: 100,
};

// Type definitions
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Weapon {
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

interface PlayerType {
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

export class Player {
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

  constructor(name: string, isHuman: boolean = true, team: TEAM = TEAM.HUMANS) {
    this.id = uuidv4();
    this.name = name;
    this.type = isHuman ? PLAYER_TYPE.HUMAN : PLAYER_TYPE.ROGUE_AI;
    this.team = team;
    this.health = GAME_CONSTANTS.PLAYER_HEALTH;
    this.position = { x: 0, y: 1, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isAlive = true;
    this.isSprinting = false;
    this.sprintCooldown = 0;
    this.crouching = false;
    
    // Default weapons
    this.weapons = [
      this.createWeapon(WEAPON_TYPE.ASSAULT_RIFLE),
      this.createWeapon(WEAPON_TYPE.PISTOL),
    ];
    this.currentWeaponIndex = 0;
    
    this.score = {
      kills: 0,
      deaths: 0,
      assists: 0,
    };
  }

  createWeapon(type: WEAPON_TYPE): Weapon {
    const weapons = {
      [WEAPON_TYPE.ASSAULT_RIFLE]: {
        type: WEAPON_TYPE.ASSAULT_RIFLE,
        ammo: 30,
        reserveAmmo: 90,
        maxAmmo: 30,
        maxReserveAmmo: 90,
        damage: 20,
        fireRate: 10,
        reloadTime: 2,
        isReloading: false,
        lastFired: 0,
      },
      [WEAPON_TYPE.PISTOL]: {
        type: WEAPON_TYPE.PISTOL,
        ammo: 12,
        reserveAmmo: 36,
        maxAmmo: 12,
        maxReserveAmmo: 36,
        damage: 15,
        fireRate: 5,
        reloadTime: 1.5,
        isReloading: false,
        lastFired: 0,
      },
      [WEAPON_TYPE.SHOTGUN]: {
        type: WEAPON_TYPE.SHOTGUN,
        ammo: 8,
        reserveAmmo: 32,
        maxAmmo: 8,
        maxReserveAmmo: 32,
        damage: 80,
        fireRate: 1,
        reloadTime: 3,
        isReloading: false,
        lastFired: 0,
      },
      [WEAPON_TYPE.SNIPER_RIFLE]: {
        type: WEAPON_TYPE.SNIPER_RIFLE,
        ammo: 5,
        reserveAmmo: 20,
        maxAmmo: 5,
        maxReserveAmmo: 20,
        damage: 80,
        fireRate: 1,
        reloadTime: 3,
        isReloading: false,
        lastFired: 0,
      },
      [WEAPON_TYPE.SMG]: {
        type: WEAPON_TYPE.SMG,
        ammo: 25,
        reserveAmmo: 75,
        maxAmmo: 25,
        maxReserveAmmo: 75,
        damage: 15,
        fireRate: 15,
        reloadTime: 1.8,
        isReloading: false,
        lastFired: 0,
      },
    };

    return weapons[type];
  }

  takeDamage(amount: number): void {
    if (!this.isAlive) return;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die(): void {
    this.isAlive = false;
    this.score.deaths++;
  }

  respawn(position: Vector3): void {
    this.health = GAME_CONSTANTS.PLAYER_HEALTH;
    this.position = position;
    this.isAlive = true;
    this.isSprinting = false;
    this.sprintCooldown = 0;
    this.crouching = false;
    
    // Refill ammo
    this.weapons.forEach(weapon => {
      weapon.ammo = weapon.maxAmmo;
      weapon.reserveAmmo = weapon.maxReserveAmmo;
      weapon.isReloading = false;
    });
  }

  getCurrentWeapon(): Weapon {
    return this.weapons[this.currentWeaponIndex];
  }

  switchWeapon(index: number): void {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIndex = index;
    }
  }

  reload(): void {
    const weapon = this.getCurrentWeapon();
    if (weapon.isReloading || weapon.ammo === weapon.maxAmmo || weapon.reserveAmmo === 0) {
      return;
    }
    
    weapon.isReloading = true;
    // This would be handled asynchronously with setTimeout server-side
  }

  getPlayerData(): PlayerType {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      team: this.team,
      health: this.health,
      position: this.position,
      rotation: this.rotation,
      velocity: this.velocity,
      isAlive: this.isAlive,
      isSprinting: this.isSprinting,
      sprintCooldown: this.sprintCooldown,
      crouching: this.crouching,
      weapons: this.weapons,
      currentWeaponIndex: this.currentWeaponIndex,
      score: this.score,
    };
  }
} 