import { v4 as uuidv4 } from 'uuid';

// Team Types
enum TEAM {
  HUMANS = 'humans',
  ROGUE_AI = 'rogue_ai',
}

// Game Constants
const GAME_CONSTANTS = {
  // Game Settings
  MAX_PLAYERS_PER_TEAM: 8,
  MIN_PLAYERS_PER_TEAM: 1,
  BASE_KILLS_TO_WIN: 10,
};

// Match interface
export interface MatchType {
  id: string;
  teams: {
    [TEAM.HUMANS]: string[];
    [TEAM.ROGUE_AI]: string[];
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

export class Match {
  id: string;
  teams: {
    [TEAM.HUMANS]: string[];
    [TEAM.ROGUE_AI]: string[];
  };
  scores: {
    [TEAM.HUMANS]: number;
    [TEAM.ROGUE_AI]: number;
  };
  killsToWin: number;
  startTime: number;
  endTime: number | null;
  status: 'waiting' | 'active' | 'ended';

  constructor() {
    this.id = uuidv4();
    this.teams = {
      [TEAM.HUMANS]: [],
      [TEAM.ROGUE_AI]: [],
    };
    this.scores = {
      [TEAM.HUMANS]: 0,
      [TEAM.ROGUE_AI]: 0,
    };
    this.killsToWin = GAME_CONSTANTS.BASE_KILLS_TO_WIN;
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'waiting';
  }

  addPlayer(playerId: string, isHuman: boolean): void {
    // Determine which team to add player to
    // For simplicity, just balance teams
    const humanCount = this.teams[TEAM.HUMANS].length;
    const rogueAICount = this.teams[TEAM.ROGUE_AI].length;

    // If player is human, they can join either team
    // If player is AI, they can only join the rogue AI team
    let team = TEAM.HUMANS;
    
    if (!isHuman) {
      team = TEAM.ROGUE_AI;
    } else if (humanCount > rogueAICount) {
      team = TEAM.ROGUE_AI;
    }

    this.teams[team].push(playerId);
    
    // Update kills to win based on team sizes
    const maxTeamSize = Math.max(
      this.teams[TEAM.HUMANS].length, 
      this.teams[TEAM.ROGUE_AI].length
    );
    this.killsToWin = GAME_CONSTANTS.BASE_KILLS_TO_WIN * maxTeamSize;

    // If we have at least one player on each team, start the match
    if (this.teams[TEAM.HUMANS].length >= GAME_CONSTANTS.MIN_PLAYERS_PER_TEAM &&
        this.teams[TEAM.ROGUE_AI].length >= GAME_CONSTANTS.MIN_PLAYERS_PER_TEAM &&
        this.status === 'waiting') {
      this.status = 'active';
    }
  }

  removePlayer(playerId: string): void {
    // Remove player from team
    for (const team of [TEAM.HUMANS, TEAM.ROGUE_AI]) {
      const index = this.teams[team].indexOf(playerId);
      if (index !== -1) {
        this.teams[team].splice(index, 1);
      }
    }

    // Check if match should end (team is empty)
    if (this.teams[TEAM.HUMANS].length === 0 || this.teams[TEAM.ROGUE_AI].length === 0) {
      this.endMatch();
    }
  }

  addScore(team: TEAM): void {
    this.scores[team]++;
    
    // Check win condition
    if (this.scores[team] >= this.killsToWin) {
      this.endMatch();
    }
  }

  endMatch(): void {
    this.status = 'ended';
    this.endTime = Date.now();
  }

  getMatchData(): MatchType {
    return {
      id: this.id,
      teams: this.teams,
      scores: this.scores,
      killsToWin: this.killsToWin,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
    };
  }
} 