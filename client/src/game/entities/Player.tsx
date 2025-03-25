import React, { useRef, useEffect, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useKeyboardControls } from '../../utils/useKeyboardControls';
import Weapon, { AssaultRifle, WeaponStats } from './Weapon';
import socketManager from '../network/socketManager';
import soundManager from '../SoundManager';
import * as THREE from 'three';

// Define type for event callbacks
type EventCallback = (...args: unknown[]) => void;

interface PlayerProps {
  position: [number, number, number];
  onPositionChange?: (position: Vector3) => void;
  onShoot?: (direction: Vector3) => void;
  onHealthChange?: (health: number) => void;
  onScoreChange?: (score: number) => void;
  onWeaponStateChange?: (ammo: number, isReloading: boolean) => void;
  scene?: THREE.Scene; // Add scene prop for hit detection
}

// Increased speed values for more responsive movement
const SPEED = 8; // Increased from 5
const SPRINT_MULTIPLIER = 1.6;
const JUMP_FORCE = 10; // Increased jump force for higher jumps
const SPRINT_COOLDOWN = 3000; // 3 seconds in ms
const MAX_HEALTH = 100;

const Player: React.FC<PlayerProps> = ({ 
  position, 
  onPositionChange, 
  onShoot,
  onHealthChange,
  onScoreChange,
  onWeaponStateChange,
  scene
}) => {
  const { camera } = useThree();
  
  // Player movement state
  const velocity = useRef(new Vector3());
  const playerPosition = useRef(new Vector3(...position));
  const isJumping = useRef(false);
  const lastJumpTime = useRef(0); // Track time of last jump to prevent spam
  const canSprint = useRef(true);
  const isSprinting = useRef(false);
  const sprintCooldownTimer = useRef<number | null>(null);
  const directionRef = useRef(new Vector3());
  const sidewaysRef = useRef(new Vector3());
  const wasOnGround = useRef(true); // New ref to track ground state
  
  // Player state
  const [health, setHealth] = useState(MAX_HEALTH);
  const [isAlive, setIsAlive] = useState(true);
  const [score, setScore] = useState(0);
  const [showHitEffect, setShowHitEffect] = useState(false);
  
  // Weapon state
  const [currentWeapon] = useState<WeaponStats>(AssaultRifle);
  
  // Get keyboard and mouse controls
  const { forward, backward, left, right, jump, sprint, shoot, aim, reload } = useKeyboardControls();
  
  // Physics
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5], // radius
    material: {
      friction: 0.2, // Reduced friction for smoother movement
      restitution: 0.0, // No bounce
    },
    fixedRotation: true,
    linearDamping: 0.1, // Reduced for less drag
    onCollide: (e) => {
      // Check if contact is with something below us
      // This is critical for detecting the ground
      const contactNormal = e.contact.ni;
      
      console.log('Collision detected:', {
        contactNormal,
        contactPoint: e.contact.bi.position,
        playerY: playerPosition.current.y,
        contactType: e.body.userData?.type || 'unknown',
        isJumping: isJumping.current,
        wasOnGround: wasOnGround.current
      });
      
      // Better ground detection logic:
      // 1. If contacting with an object tagged as ground
      // 2. OR normal points significantly upward
      // 3. OR contact point is below player
      const isGroundContact = 
        (e.body.userData?.type === 'ground') || // Explicit ground object
        contactNormal[1] > 0.1 || // Lower threshold for normal pointing up
        e.contact.bi.position.y < playerPosition.current.y - 0.2; // Contact is below player
      
      if (isGroundContact) {
        console.log('Ground contact detected');
        // Only play landing sound if we were jumping
        if (isJumping.current) {
          console.log('Landing from jump');
          soundManager.playSound('land', Math.min(0.5 + Math.abs(velocity.current.y * 0.05), 1));
        }
      
        isJumping.current = false;
        wasOnGround.current = true;
      }
    },
  }));
  
  // Reset jump state on component mount
  useEffect(() => {
    console.log('Component mounted, resetting jump state');
    isJumping.current = false;
    wasOnGround.current = true; // Ensure we start on the ground
    
    // Force the initial position with a slight raise to prevent falling through ground
    api.position.set(position[0], position[1] + 0.1, position[2]);
    
    // Ground detection interval - backup method to detect ground
    const groundDetectionInterval = setInterval(() => {
      // Check player position - if y is very low, assume we're on ground
      api.position.subscribe((p) => {
        if (p[1] < 0.6) { // If close to ground level
          if (isJumping.current) {
            console.log('Ground detected by position y:', p[1]);
            isJumping.current = false;
            wasOnGround.current = true;
          }
        }
      })();
      
      // Also check velocity for near-zero vertical speed
      api.velocity.subscribe((v) => {
        if (Math.abs(v[1]) < 0.1 && isJumping.current) {
          console.log('Ground detected via velocity check');
          isJumping.current = false;
          wasOnGround.current = true;
        }
      })();
    }, 200); // Check more frequently
    
    return () => clearInterval(groundDetectionInterval);
  }, [api.velocity, api.position, position]);
  
  // Update HUD when health changes
  useEffect(() => {
    if (onHealthChange) {
      onHealthChange(health);
    }
  }, [health, onHealthChange]);
  
  // Update HUD when score changes
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(score);
    }
  }, [score, onScoreChange]);
  
  // Socket event handlers
  useEffect(() => {
    // Handle being hit
    const onPlayerHit = (data: unknown) => {
      const { health: newHealth } = data as { 
        damage: number, 
        health: number, 
        attackerId: string 
      };
      setHealth(newHealth);
      
      // Show hit effect
      setShowHitEffect(true);
      setTimeout(() => setShowHitEffect(false), 200);
      
      // Play hit sound
      soundManager.playSound('hurt');
    };
    
    // Handle player death
    const onPlayerDie = () => {
      setIsAlive(false);
      // Play death sound
      soundManager.playSound('death');
      // Display death screen or animation
    };
    
    // Handle score update
    const onScoreUpdate = (data: unknown) => {
      const { newScore } = data as { newScore: number };
      setScore(newScore);
    };
    
    // Handle player respawn
    const onPlayerRespawn = (data: unknown) => {
      const { position: newPosition } = data as { position: { x: number, y: number, z: number } };
      console.log('Player respawn event received:', newPosition);
      
      // Update player position
      api.position.set(newPosition.x, newPosition.y, newPosition.z);
      playerPosition.current.set(newPosition.x, newPosition.y, newPosition.z);
      
      // Reset physics state
      api.velocity.set(0, 0, 0);
      velocity.current.set(0, 0, 0);
      isJumping.current = false;
      wasOnGround.current = true;
    };
    
    // Subscribe to events
    const unsubscribeHit = socketManager.on('playerHit', onPlayerHit as EventCallback);
    const unsubscribeDie = socketManager.on('playerDie', onPlayerDie);
    const unsubscribeScore = socketManager.on('scoreUpdate', onScoreUpdate as EventCallback);
    const unsubscribeRespawn = socketManager.on('playerRespawn', onPlayerRespawn as EventCallback);
    
    return () => {
      unsubscribeHit();
      unsubscribeDie();
      unsubscribeScore();
      unsubscribeRespawn();
    };
  }, [api.position, api.velocity]);
  
  // Subscribe to physics body position changes
  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      playerPosition.current.set(p[0], p[1], p[2]);
      camera.position.copy(playerPosition.current).add(new Vector3(0, 1.6, 0)); // Place camera at head level
      
      // Send position update to server
      socketManager.sendMovement(
        playerPosition.current,
        new Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z),
        velocity.current
      );
      
      if (onPositionChange) {
        onPositionChange(playerPosition.current);
      }
    });
    
    // Footstep sound timer
    let lastFootstepTime = 0;
    const footstepInterval = 400; // ms between footsteps
    
    // Handle footstep sounds
    const footstepHandler = api.velocity.subscribe((v) => {
      const horizontalSpeed = Math.sqrt(v[0] * v[0] + v[2] * v[2]);
      const now = Date.now();
      
      // Play footstep sounds if moving and not jumping
      if (horizontalSpeed > 1 && !isJumping.current && now - lastFootstepTime > footstepInterval) {
        soundManager.playSound('footstep', 0.5, isSprinting.current ? 1.2 : 1.0);
        lastFootstepTime = now;
      }
    });

    // Debug physics state
    const velocityDebugger = api.velocity.subscribe((v) => {
      if (Math.abs(v[1]) > 0.1) {  // Only log significant vertical movement
        console.log('Current velocity:', {
          x: v[0],
          y: v[1],
          z: v[2],
          isJumping: isJumping.current
        });
      }
    });

    return () => {
      unsubscribe();
      footstepHandler();
      velocityDebugger();
    };
  }, [api.position, api.velocity, camera, onPositionChange]);
  
  // Handle sprint mechanics
  useEffect(() => {
    // Log for debugging
    console.log('Sprint key state:', sprint, 'canSprint:', canSprint.current);
    
    if (sprint && canSprint.current) {
      isSprinting.current = true;
      console.log('Sprinting activated');
    } else {
      isSprinting.current = false;
      
      // If we released sprint key, make sure we can sprint again when timer is done
      if (!sprint && sprintCooldownTimer.current) {
        console.log('Sprint released, waiting for cooldown');
      }
    }
    
    return () => {
      if (sprintCooldownTimer.current) {
        clearTimeout(sprintCooldownTimer.current);
      }
    };
  }, [sprint]);
  
  // Handle death and respawn
  useEffect(() => {
    if (!isAlive) {
      // Respawn after a delay
      const respawnTimer = setTimeout(() => {
        socketManager.requestRespawn();
        setIsAlive(true);
        setHealth(MAX_HEALTH);
      }, 3000); // 3 second respawn delay
      
      return () => clearTimeout(respawnTimer);
    }
  }, [isAlive]);
  
  // Debounce function to limit how often we can shoot to the server
  const lastShootTime = useRef(0);
  
  // Handle weapon shooting
  const handleShoot = (_hitPosition: Vector3 | null, direction: Vector3) => {
    if (!isAlive) return; // Dead players can't shoot
    
    // Store current position to prevent position reset
    const currentPos = playerPosition.current.clone();
    
    // Debounce shooting events to the server
    const now = Date.now();
    if (now - lastShootTime.current > 100) { // Allow shooting every 100ms
      lastShootTime.current = now;
      
      // Send shoot event to server
      socketManager.sendShoot(direction);
    }
    
    if (onShoot) {
      onShoot(direction);
    }
    
    // Use setTimeout to restore position if it gets reset
    setTimeout(() => {
      // Check if position changed dramatically (indicating a reset)
      if (playerPosition.current.distanceTo(currentPos) > 1) {
        console.log('Position reset detected, restoring position');
        api.position.set(currentPos.x, currentPos.y, currentPos.z);
      }
    }, 50);
    
    // Check if we hit another player using the scene
    if (scene) {
      // Use the player's head position (camera) as starting point for raycasting
      const startPosition = playerPosition.current.clone().add(new Vector3(0, 1.6, 0));
      
      const raycaster = new THREE.Raycaster(startPosition, direction.clone().normalize(), 0, currentWeapon.range);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Debug the raycaster
      console.log('Raycasting from position:', startPosition, 'in direction:', direction);
      
      // Check if we hit a player
      const playerHit = intersects.find(hit => {
        // Check the userData to see if this is a player mesh
        if (hit.object.userData && hit.object.userData.type === 'player') {
          // Make sure we're not hitting ourselves
          const hitId = hit.object.userData.id;
          const myId = socketManager.getSocketId();
          console.log('Hit check:', { hitId, myId, isSelf: hitId === myId });
          return hitId !== myId;
        }
        return false;
      });
      
      if (playerHit && playerHit.object.userData.id) {
        // We hit another player, send hit event to server
        console.log('Player hit:', playerHit.object.userData.id);
        socketManager.sendHit(playerHit.object.userData.id);
      }
    }
  };

  // Track reload state
  const lastPosition = useRef(new Vector3());
  
  // Store position before reload
  useEffect(() => {
    if (reload) {
      // Store current position when starting to reload
      lastPosition.current.copy(playerPosition.current);
      console.log('Reload started, saving position', lastPosition.current);
    }
  }, [reload]);
  
  // Position recovery after reload
  useEffect(() => {
    if (!reload && lastPosition.current.lengthSq() > 0) {
      // Check if position changed dramatically during reload
      if (playerPosition.current.distanceTo(lastPosition.current) > 1) {
        console.log('Position changed during reload, restoring to', lastPosition.current);
        // Small delay to ensure this happens after any reset
        setTimeout(() => {
          api.position.set(lastPosition.current.x, lastPosition.current.y, lastPosition.current.z);
        }, 50);
      }
    }
  }, [reload, api.position]);

  // Handle weapon state updates
  const handleWeaponStateUpdate = (ammo: number, isReloading: boolean) => {
    if (onWeaponStateChange) {
      onWeaponStateChange(ammo, isReloading);
    }
  };
  
  // Update player movement
  useFrame(() => {
    if (!isAlive) return; // Dead players can't move
    
    // Get current time for rate limiting
    const now = Date.now();
    
    // Debug logging for jump state
    if (jump) {
      console.log('Jump key pressed, isJumping:', isJumping.current, 'time since last jump:', now - lastJumpTime.current);
    }
    
    // Calculate forward/backward direction based on camera
    const direction = directionRef.current;
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    // Calculate sideways direction
    const sideways = sidewaysRef.current.set(-direction.z, 0, direction.x);
    
    // Reset velocity
    velocity.current.set(0, 0, 0);
    
    // Apply movement based on input
    if (forward) velocity.current.add(direction.clone().multiplyScalar(1));
    if (backward) velocity.current.add(direction.clone().multiplyScalar(-0.8)); // Slightly slower backward movement
    if (left) velocity.current.add(sideways.clone().multiplyScalar(-0.9)); // Slightly slower strafe
    if (right) velocity.current.add(sideways.clone().multiplyScalar(0.9)); // Slightly slower strafe
    
    // Normalize movement vector if moving diagonally
    if (velocity.current.lengthSq() > 0) {
      velocity.current.normalize();
      
      // Apply sprint multiplier if sprinting
      if (isSprinting.current && canSprint.current) {
        velocity.current.multiplyScalar(SPEED * SPRINT_MULTIPLIER);
      } else {
        velocity.current.multiplyScalar(SPEED);
      }
    }
    
    // Apply movement - simplified approach for better reliability
    if (jump && !isJumping.current && wasOnGround.current && (now - lastJumpTime.current > 250)) {
      // Jump case
      console.log('Applying jump');
      isJumping.current = true;
      wasOnGround.current = false;
      lastJumpTime.current = now;
      
      // Direct application of jump force - stronger jump
      api.velocity.set(
        velocity.current.x,
        JUMP_FORCE,
        velocity.current.z
      );
      
      // Apply a stronger upward impulse for more responsive jumping
      api.applyImpulse([0, JUMP_FORCE * 0.7, 0], [0, 0, 0]);
      
      soundManager.playSound('jump');
    } 
    else {
      // Normal movement case - preserve vertical velocity to work with gravity
      let currentPhysicsY = 0;
      api.velocity.subscribe(v => {
        currentPhysicsY = v[1];
        
        // Apply a higher downward force when falling to make it faster
        if (currentPhysicsY < 0 && isJumping.current) {
          // Apply additional downward force when falling - scaled by current velocity
          // More force the longer you fall
          const fallFactor = Math.min(Math.abs(currentPhysicsY) * 0.5, 5);
          api.applyForce([0, -25 * fallFactor, 0], [0, 0, 0]);
        }
      })();
      
      api.velocity.set(
        velocity.current.x,
        currentPhysicsY, // Keep current vertical velocity
        velocity.current.z
      );
    }
    
    // Handle sprint cooldown logic
    if (isSprinting.current && canSprint.current && sprintCooldownTimer.current === null) {
      sprintCooldownTimer.current = window.setTimeout(() => {
        canSprint.current = false;
        
        // Reset sprint ability after cooldown
        sprintCooldownTimer.current = window.setTimeout(() => {
          canSprint.current = true;
          sprintCooldownTimer.current = null;
        }, SPRINT_COOLDOWN);
      }, 1000); // Start cooldown after 1 second of sprinting
    }
  });
  
  if (!isAlive) {
    // Render death view - maybe just a camera without a player model
    return null;
  }
  
  return (
    <>
      {/* Hit effect overlay - shows a red flash when hit */}
      {showHitEffect && (
        <mesh position={[0, 0, -1]} scale={[3, 3, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="red" transparent opacity={0.3} depthTest={false} />
        </mesh>
      )}
      
      {/* Player mesh - first-person representation */}
      {/* This is the physics collider, the visual representation isn't seen in first-person */}
      <mesh ref={ref} castShadow visible={false}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* First-person weapon */}
      <Weapon 
        position={camera.position}
        rotation={new Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z)}
        isAiming={aim}
        isShooting={shoot}
        isReloading={reload}
        stats={currentWeapon}
        onShoot={handleShoot}
        onStateChange={handleWeaponStateUpdate}
      />
    </>
  );
};

export default Player; 