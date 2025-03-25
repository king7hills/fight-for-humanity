import React from 'react';
import styled from 'styled-components';

interface HUDProps {
  health: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  isReloading?: boolean;
  teamScore?: {
    human: number;
    ai: number;
  };
  matchTime?: number;
}

const HUDContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
`;

const HealthBar = styled.div<{ $health: number }>`
  position: absolute;
  bottom: 30px;
  left: 30px;
  width: 200px;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${(props: { $health: number }) => props.$health}%;
    height: 100%;
    background: ${(props: { $health: number }) => {
      if (props.$health > 70) return '#4CAF50';
      if (props.$health > 30) return '#FFC107';
      return '#F44336';
    }};
    transition: width 0.3s ease, background 0.3s ease;
  }
`;

const AmmoCounter = styled.div`
  position: absolute;
  bottom: 30px;
  right: 30px;
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
`;

const ScoreDisplay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  font-family: 'Arial', sans-serif;
  font-size: 18px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
`;

const TeamScores = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
`;

const TeamScore = styled.div<{ $team: 'human' | 'ai' }>`
  padding: 5px 15px;
  margin: 0 10px;
  background: ${(props: { $team: 'human' | 'ai' }) => props.$team === 'human' ? 'rgba(0, 100, 255, 0.7)' : 'rgba(255, 50, 50, 0.7)'};
  border-radius: 5px;
`;

const MatchTimer = styled.div`
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: 'Arial', sans-serif;
  font-size: 18px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
`;

const ReloadingIndicator = styled.div`
  position: absolute;
  bottom: 70px;
  right: 30px;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  color: #FFC107;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
`;

const Crosshair = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: white;
  }
  
  &::before {
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    transform: translateY(-50%);
  }
  
  &::after {
    top: 0;
    left: 50%;
    width: 2px;
    height: 100%;
    transform: translateX(-50%);
  }
`;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const HUD: React.FC<HUDProps> = ({ 
  health, 
  ammo, 
  maxAmmo, 
  score, 
  isReloading = false, 
  teamScore, 
  matchTime
}) => {
  return (
    <HUDContainer>
      {/* Health */}
      <HealthBar $health={health} />
      
      {/* Ammo */}
      <AmmoCounter>
        {ammo} / {maxAmmo}
      </AmmoCounter>
      
      {/* Reloading indicator */}
      {isReloading && (
        <ReloadingIndicator>RELOADING</ReloadingIndicator>
      )}
      
      {/* Personal score */}
      <ScoreDisplay>
        Score: {score}
      </ScoreDisplay>
      
      {/* Team scores */}
      {teamScore && (
        <TeamScores>
          <TeamScore $team="human">HUMANS: {teamScore.human}</TeamScore>
          <TeamScore $team="ai">AI: {teamScore.ai}</TeamScore>
        </TeamScores>
      )}
      
      {/* Match timer */}
      {matchTime !== undefined && (
        <MatchTimer>{formatTime(matchTime)}</MatchTimer>
      )}
      
      {/* Crosshair */}
      <Crosshair />
    </HUDContainer>
  );
};

export default HUD; 