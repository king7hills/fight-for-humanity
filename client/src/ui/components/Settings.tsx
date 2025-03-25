import React, { useState, useEffect } from 'react';
import soundManager from '../../game/SoundManager';
import Button from './Button';

const Settings: React.FC = () => {
  const [masterVolume, setMasterVolume] = useState(100);
  const [soundVolume, setSoundVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(50);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Initialize state from SoundManager
  useEffect(() => {
    // Normalize volume from 0-1 to 0-100
    setMasterVolume(100);
    setSoundVolume(80);
    setMusicVolume(50);
    setSoundEnabled(true);
    setMusicEnabled(true);
  }, []);

  // Handle master volume change
  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setMasterVolume(value);
    soundManager.setMasterVolume(value / 100);
    
    // Play a test sound
    if (soundEnabled) {
      soundManager.playSound('menu_navigate', 0.5);
    }
  };

  // Handle sound volume change
  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSoundVolume(value);
    soundManager.setSoundVolume(value / 100);
    
    // Play a test sound
    if (soundEnabled) {
      soundManager.playSound('menu_navigate', 0.5);
    }
  };

  // Handle music volume change
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setMusicVolume(value);
    soundManager.setMusicVolume(value / 100);
  };

  // Toggle sound
  const toggleSound = () => {
    const newState = soundManager.toggleSound(!soundEnabled);
    setSoundEnabled(newState);
    
    // Play a test sound if we just enabled sound
    if (newState) {
      soundManager.playSound('button_click', 0.5);
    }
  };

  // Toggle music
  const toggleMusic = () => {
    const newState = soundManager.toggleMusic(!musicEnabled);
    setMusicEnabled(newState);
    
    // Play a test sound
    if (soundEnabled) {
      soundManager.playSound('button_click', 0.5);
    }
    
    // Play music if we just enabled it
    if (newState) {
      soundManager.playMusic('menu');
    }
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-md shadow-md w-80">
      <h2 className="text-xl font-bold mb-4">Audio Settings</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label htmlFor="master-volume">Master Volume</label>
          <span>{masterVolume}%</span>
        </div>
        <input
          id="master-volume"
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={handleMasterVolumeChange}
          className="w-full"
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label htmlFor="sound-volume">Sound Effects</label>
          <span>{soundVolume}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="sound-volume"
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={handleSoundVolumeChange}
            disabled={!soundEnabled}
            className="w-full"
          />
          <Button
            variant={soundEnabled ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleSound}
          >
            {soundEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label htmlFor="music-volume">Music</label>
          <span>{musicVolume}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="music-volume"
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={handleMusicVolumeChange}
            disabled={!musicEnabled}
            className="w-full"
          />
          <Button
            variant={musicEnabled ? 'primary' : 'secondary'}
            size="small"
            onClick={toggleMusic}
          >
            {musicEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button variant="primary" onClick={() => soundManager.playMusic('menu')}>
          Test Menu Music
        </Button>
      </div>
    </div>
  );
};

export default Settings; 