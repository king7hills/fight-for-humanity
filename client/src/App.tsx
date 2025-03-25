import { useState } from 'react'
import './App.css'
import GameScene from './game/GameScene'

function App() {
  const [gameState, setGameState] = useState<'menu' | 'matchmaking' | 'playing'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [isHuman, setIsHuman] = useState(true);

  const handleStartGame = () => {
    if (playerName.trim() === '') {
      alert('Please enter your name');
      return;
    }
    setGameState('matchmaking');
    // In a real implementation, we would connect to the server here
    // For now, let's simulate matchmaking with a timeout
    setTimeout(() => setGameState('playing'), 3000);
  };

  return (
    <div className="app-container">
      {gameState === 'menu' && (
        <div className="menu">
          <h1>Fight For Humanity</h1>
          <div className="form-group">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isHuman}
                onChange={() => setIsHuman(!isHuman)}
              />
              I am human
            </label>
          </div>
          <button onClick={handleStartGame}>Play</button>
        </div>
      )}

      {gameState === 'matchmaking' && (
        <div className="matchmaking">
          <h2>Finding Match...</h2>
          <div className="loading-spinner"></div>
        </div>
      )}

      {gameState === 'playing' && (
        <GameScene playerName={playerName} isHuman={isHuman} />
      )}
    </div>
  )
}

export default App
