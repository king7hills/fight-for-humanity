class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private musicTracks: Map<string, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 1.0;
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private placeholderCreated: boolean = false;

  constructor() {
    this.createPlaceholders(); // Always create placeholders as a fallback
    this.loadSounds();
  }

  private loadSounds(): void {
    try {
      console.log('Loading game sounds...');
      
      // Weapon sounds
      this.loadSound('shoot', './sounds/weapon_shoot.mp3');
      this.loadSound('reload', './sounds/weapon_reload.mp3');
      this.loadSound('empty', './sounds/weapon_empty.mp3');
      
      // Player sounds
      this.loadSound('jump', './sounds/player_jump.mp3');
      this.loadSound('land', './sounds/player_land.mp3');
      this.loadSound('footstep', './sounds/player_footstep.mp3');
      this.loadSound('hurt', './sounds/player_hurt.mp3');
      this.loadSound('death', './sounds/player_death.mp3');
      
      // Game sounds
      this.loadSound('spawn', './sounds/player_spawn.mp3');
      this.loadSound('hit_marker', './sounds/hit_marker.mp3');
      this.loadSound('headshot', './sounds/headshot.mp3');
      
      // UI sounds
      this.loadSound('button_click', './sounds/ui_button.mp3');
      this.loadSound('menu_navigate', './sounds/ui_navigate.mp3');
      
      // Music
      this.loadMusic('menu', './sounds/music_menu.mp3');
      this.loadMusic('gameplay', './sounds/music_gameplay.mp3');
      this.loadMusic('intense', './sounds/music_intense.mp3');
      
      // Loading complete
    } catch (error) {
      console.warn('Error loading sounds:', error);
      // Still proceed with game even if there's an error loading sounds
    }
  }

  private createPlaceholders(): void {
    if (this.placeholderCreated) return;
    
    console.log('Creating sound placeholders');
    // Create a 0.1 second blank audio context as placeholder
    try {
      // Create empty audio placeholders
      const soundTypes = [
        'shoot', 'reload', 'empty', 'jump', 'land', 'footstep', 
        'hurt', 'death', 'spawn', 'hit_marker', 'headshot',
        'button_click', 'menu_navigate'
      ];
      
      soundTypes.forEach(type => {
        const audio = new Audio();
        // Empty audio data URI
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.sounds.set(type, audio);
      });
      
      // Music placeholders
      ['menu', 'gameplay', 'intense'].forEach(type => {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        audio.loop = true;
        this.musicTracks.set(type, audio);
      });
      
      this.placeholderCreated = true;
      console.log('Placeholder sounds created');
    } catch (error) {
      console.error('Failed to create placeholder sounds:', error);
      // Error handled, continue with placeholder
    }
  }

  private loadSound(id: string, path: string): void {
    try {
      const audio = new Audio();
      audio.src = path;
      audio.preload = 'auto';
      
      // Add error handling
      audio.addEventListener('error', (e) => {
        console.warn(`Error loading sound '${id}' from ${path}:`, e);
        // Create a placeholder for failed sounds
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      });
      
      this.sounds.set(id, audio);
    } catch (error) {
      console.warn(`Exception while loading sound '${id}':`, error);
      // Placeholder will be used
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      this.sounds.set(id, audio);
    }
  }

  private loadMusic(id: string, path: string): void {
    try {
      const audio = new Audio();
      audio.src = path;
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.musicVolume * this.masterVolume;
      
      // Add error handling
      audio.addEventListener('error', (e) => {
        console.warn(`Error loading music '${id}' from ${path}:`, e);
        // Create a placeholder for failed music
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      });
      
      this.musicTracks.set(id, audio);
    } catch (error) {
      console.warn(`Exception while loading music '${id}':`, error);
      // Create a placeholder
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      audio.loop = true;
      this.musicTracks.set(id, audio);
    }
  }

  playSound(id: string, volume: number = 1.0, pitch: number = 1.0): void {
    if (!this.soundEnabled) return;
    
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound '${id}' not found`);
      return;
    }

    try {
      // Create a clone to allow overlapping playback
      const soundClone = sound.cloneNode(true) as HTMLAudioElement;
      soundClone.volume = volume * this.soundVolume * this.masterVolume;
      soundClone.playbackRate = pitch;
      
      soundClone.play().catch(err => {
        // This is normal for browsers that require user interaction before playing audio
        console.warn(`Error playing sound '${id}':`, err);
      });
    } catch (error) {
      // Don't crash if sound playback fails
      console.warn(`Failed to play sound '${id}':`, error);
    }
  }

  playSoundWithDistance(id: string, distance: number, maxDistance: number = 50): void {
    // Calculate volume based on distance
    const volume = Math.max(0, 1 - (distance / maxDistance));
    if (volume > 0) {
      this.playSound(id, volume);
    }
  }

  playMusic(id: string): void {
    if (!this.musicEnabled) return;
    
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    
    const music = this.musicTracks.get(id);
    if (!music) {
      console.warn(`Music track '${id}' not found`);
      return;
    }
    
    this.currentMusic = music;
    music.volume = this.musicVolume * this.masterVolume;
    music.play().catch(err => {
      console.warn(`Error playing music '${id}':`, err);
    });
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  toggleSound(enabled?: boolean): boolean {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleMusic(enabled?: boolean): boolean {
    this.musicEnabled = enabled !== undefined ? enabled : !this.musicEnabled;
    
    if (!this.musicEnabled && this.currentMusic) {
      this.currentMusic.pause();
    } else if (this.musicEnabled && this.currentMusic) {
      this.currentMusic.play().catch(console.error);
    }
    
    return this.musicEnabled;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update current music volume if playing
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume * this.masterVolume;
    }
  }

  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update current music volume if playing
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume * this.masterVolume;
    }
  }
}

// Create a singleton instance
const soundManager = new SoundManager();
export default soundManager; 