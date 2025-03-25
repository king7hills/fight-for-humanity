import React, { useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import Level from './rendering/Level';
import Player from './entities/Player.tsx';
import OtherPlayer from './entities/OtherPlayer';
import HUD from './ui/HUD';
import socketManager, { GameState } from './network/socketManager';
import { AssaultRifle } from './entities/Weapon';

interface GameSceneProps {
  playerName: string;
  isHuman: boolean;
}

// Scene objects container component to share the scene with Player component
const SceneSetup: React.FC<{
  gameState: GameState | null;
  onHealthChange: (health: number) => void;
  onScoreChange: (score: number) => void;
  onWeaponStateChange: (ammo: number, isReloading: boolean) => void;
}> = ({
  gameState,
  onHealthChange,
  onScoreChange,
  onWeaponStateChange,
}) => {
  const { scene } = useThree();
  const myPlayerId = socketManager.getSocketId();

  // Render other players from game state
  return (
    <>
      <Player 
        position={[0, 2, 0]} 
        onHealthChange={onHealthChange}
        onScoreChange={onScoreChange}
        onWeaponStateChange={onWeaponStateChange}
        scene={scene}
      />
      
      {/* Render other players */}
      {gameState && Object.entries(gameState.players)
        .filter(([id]) => id !== myPlayerId) // Filter out the current player
        .map(([id, playerData]) => (
          <OtherPlayer
            key={id}
            id={id}
            position={playerData.position}
            rotation={playerData.rotation}
            team={playerData.team}
            isAlive={playerData.isAlive}
          />
        ))}
    </>
  );
};

// Main game component
const GameScene: React.FC<GameSceneProps> = ({ playerName, isHuman }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Player state
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  
  // Weapon state
  const [currentAmmo, setCurrentAmmo] = useState(AssaultRifle.magazineSize);
  const [maxAmmo] = useState(AssaultRifle.magazineSize);
  const [isReloading, setIsReloading] = useState(false);
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Connect to server and set up event listeners
  useEffect(() => {
    const connectToServer = async () => {
      try {
        await socketManager.connect();
        setIsConnected(true);
        
        // Join the game
        socketManager.joinGame(playerName, isHuman);
      } catch (error) {
        console.error('Failed to connect to server:', error);
        setLoadingError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    connectToServer();
    
    // Update game state when received from server
    const unsubscribeGameState = socketManager.on('gameStateUpdate', (state: unknown) => {
      setGameState(state as GameState);
    });
    
    // Handle connection errors
    const unsubscribeDisconnect = socketManager.on('disconnect', (reason: unknown) => {
      console.error('Disconnected from server:', reason);
      setLoadingError(`Disconnected: ${reason as string}`);
      setIsConnected(false);
    });
    
    return () => {
      unsubscribeGameState();
      unsubscribeDisconnect();
      socketManager.disconnect();
    };
  }, [playerName, isHuman]);
  
  // Handle player health changes
  const handleHealthChange = (newHealth: number) => {
    setHealth(newHealth);
  };
  
  // Handle player score changes
  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  // Handle weapon state changes
  const handleWeaponStateChange = (ammo: number, reloading: boolean) => {
    setCurrentAmmo(ammo);
    setIsReloading(reloading);
  };

  // Error boundary for Three.js canvas
  const handleCanvasError = useCallback((event: ErrorEvent) => {
    console.error('Canvas error:', event.error);
    setLoadingError(`Rendering error: ${event.error?.message || 'Unknown error'}`);
  }, []);

  useEffect(() => {
    window.addEventListener('error', handleCanvasError);
    return () => window.removeEventListener('error', handleCanvasError);
  }, [handleCanvasError]);
  
  return (
    <div className="game-scene" style={{ width: '100vw', height: '100vh' }}>
      {loadingError ? (
        <div className="error-screen" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'red',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2>Error Loading Game</h2>
          <p>{loadingError}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 75 }}>
            <ambientLight intensity={0.3} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[2048, 2048]} 
            />
            <Physics 
              gravity={[0, -30, 0]}
              defaultContactMaterial={{
                friction: 0.1,
                restitution: 0.1,
                contactEquationStiffness: 1e6,
                contactEquationRelaxation: 3
              }}
            >
              {isConnected && (
                <SceneSetup
                  gameState={gameState}
                  onHealthChange={handleHealthChange}
                  onScoreChange={handleScoreChange}
                  onWeaponStateChange={handleWeaponStateChange}
                />
              )}
              <Level />
            </Physics>
            <Sky />
            <PointerLockControls
              onLock={() => setIsLocked(true)} 
              onUnlock={() => setIsLocked(false)} 
            />
          </Canvas>
          
          {isLocked && isConnected && (
            <HUD 
              health={health}
              ammo={currentAmmo}
              maxAmmo={maxAmmo}
              score={score}
              isReloading={isReloading}
              teamScore={gameState?.teams && {
                human: gameState.teams.human.score,
                ai: gameState.teams.ai.score
              }}
              matchTime={gameState?.matchTime}
            />
          )}
          
          {!isLocked && (
            <div className="pointer-lock-prompt" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}>
              <div className="prompt-box" style={{
                padding: '20px',
                backgroundColor: '#222',
                borderRadius: '5px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h2>Click to Play</h2>
                <p>Click anywhere to enter the game</p>
                <p><small>Press ESC to exit game controls</small></p>
                {!isConnected && <p style={{ color: 'red' }}>Connecting to server...</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameScene; 