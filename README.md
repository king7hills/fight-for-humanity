# Fight For Humanity

A multiplayer first-person shooter game where humans and sympathetic AI join forces to battle against rogue AI determined to destroy humanity.

## Description

Fight For Humanity is a browser-based multiplayer FPS game built with modern web technologies. Players can choose to play as either human warriors or sympathetic AI robots, teaming up against rogue AI forces.

The game features:
- Team-based gameplay (humans + friendly AI vs rogue AI)
- First-person shooter mechanics
- Multiple weapon classes
- Sprinting and movement mechanics
- Full hit detection and damage system
- Realistic physics
- Real-time multiplayer capabilities
- Sound effects for weapons, movement, and combat

## Tech Stack

- **Frontend**: React, Three.js, React Three Fiber
- **Backend**: Node.js, Express, Socket.IO
- **Physics**: Cannon.js
- **Networking**: Socket.IO
- **Build Tools**: Vite, TypeScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fight-for-humanity.git
cd fight-for-humanity
```

2. Install dependencies for client, server, and root project:
```bash
npm run install-all
```

## Development

Run both the client and server in development mode:
```bash
npm run dev
```

Run only the client:
```bash
npm run client
```

Run only the server:
```bash
npm run server
```

## Building for Production

Build both client and server:
```bash
npm run build
```

## Running in Production

After building, you can run the server which will serve the client files:
```bash
npm start
```

## Game Controls

- **WASD**: Movement
- **Mouse**: Look around
- **Left Mouse Button**: Shoot
- **Right Mouse Button**: Aim down sights
- **Shift**: Sprint
- **Space**: Jump
- **R**: Reload
- **1-4**: Switch weapons (coming soon)
- **ESC**: Exit pointer lock / game menu

## Game Mechanics

- Teams have a cap of 8v8, and the minimum for a team is 1v1
- Players have a limited sprint that restores after 3 seconds once depleted
- Players can jump, aim, walk, strafe, shoot, and reload
- Ammo is limited and must be managed carefully
- Hit detection uses raycasting to accurately detect collisions
- Players take damage when hit, with visual feedback
- The number of kills needed to win is proportional to the number of players

## Project Structure

```
fight-for-humanity/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── assets/         # Models, textures, sounds
│   │   ├── components/     # React components
│   │   ├── game/           # Game logic
│   │   │   ├── entities/   # Player, weapons, etc.
│   │   │   ├── physics/    # Collision detection, movement
│   │   │   ├── rendering/  # Three.js scene setup
│   │   │   └── network/    # Client-side network code
│   │   ├── ui/             # UI components
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── server/                 # Backend code
│   ├── src/
│   │   ├── game/           # Game state management
│   │   │   ├── match.js    # Match logic
│   │   │   ├── player.js   # Player data structures
│   │   │   └── teams.js    # Team management
│   │   ├── routes/         # API endpoints
│   │   ├── sockets/        # Socket.IO event handlers
│   │   └── db/             # Database models
│   └── config/             # Server configuration
└── shared/                 # Shared code between client and server
    ├── constants.js        # Game constants
    └── types.js            # Type definitions
```

## License

This project is licensed under the ISC License.

## Current Implementation Status

### Core Game Mechanics
- ✅ Basic player controller with first-person camera
- ✅ Movement mechanics (walk, sprint with cooldown, jump)
- ✅ Physics-based collision system
- ✅ Weapon system with shooting mechanics
- ✅ Ammo management and reloading
- ✅ Hit detection and damage calculation
- ✅ Visual feedback for taking damage
- ✅ Weapon muzzle flash effects
- ✅ Basic HUD showing health, ammo, and score
- ✅ Multiplayer with position synchronization and player rendering
- ✅ Team-based player representation (blue for humans, red for AI)
- ✅ Death handling with automatic respawn
- ✅ Score tracking and match state management
- ✅ Sound effects for weapons, hits, and movement
- ✅ Manual reloading with 'R' key

### Networking
- ✅ Real-time player position updates
- ✅ Shoot event synchronization
- ✅ Hit detection communication
- ✅ Health and damage synchronization
- ✅ Team score updates
- ✅ Match state broadcasts
- ✅ Hit confirmation and feedback

### Controls
- **WASD**: Movement
- **Space**: Jump
- **Shift**: Sprint (with cooldown)
- **Left Mouse Button**: Shoot
- **Right Mouse Button**: Aim
- **R**: Reload
- **ESC**: Exit pointer lock (pause game)

## Development

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npm run start
```

## Next Steps
- ⬜ Implement damage direction indicators
- ⬜ Add more weapon types and weapon switching
- ⬜ Create more detailed level geometry
- ⬜ Implement match time limit and game mode variations
- ⬜ Add particle effects for bullet impacts
- ⬜ Enhance character models with animations
- ⬜ Improve UI with death screens and match end screens