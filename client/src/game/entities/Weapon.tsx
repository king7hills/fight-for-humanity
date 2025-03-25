import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Raycaster } from 'three';
import * as THREE from 'three';
import soundManager from '../SoundManager';

interface WeaponProps {
  position: Vector3;
  rotation: Vector3;
  onShoot?: (hitPosition: Vector3 | null, direction: Vector3) => void;
  isAiming?: boolean;
  isShooting?: boolean;
  isReloading?: boolean;
  onStateChange?: (ammo: number, isReloading: boolean) => void;
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // rounds per minute
  reloadTime: number; // seconds
  magazineSize: number;
  spread: number; // degrees
  range: number; // max effective range in units
  type: 'primary' | 'secondary' | 'melee';
}

// Default weapon stats
export const AssaultRifle: WeaponStats = {
  name: 'Assault Rifle',
  damage: 25,
  fireRate: 600, // 600 RPM = 10 rounds per second
  reloadTime: 2.5,
  magazineSize: 30,
  spread: 2.0,
  range: 100,
  type: 'primary',
};

export const Pistol: WeaponStats = {
  name: 'Pistol',
  damage: 35,
  fireRate: 180, // 180 RPM = 3 rounds per second
  reloadTime: 1.8,
  magazineSize: 12,
  spread: 1.5,
  range: 50,
  type: 'secondary',
};

const Weapon: React.FC<WeaponProps & { stats: WeaponStats }> = ({ 
  position, 
  rotation, 
  onShoot, 
  isAiming = false, 
  isShooting = false,
  isReloading: reloadInput = false,
  stats,
  onStateChange
}) => {
  // Weapon state
  const [isReloading, setIsReloading] = useState(false);
  const [currentAmmo, setCurrentAmmo] = useState(stats.magazineSize);
  const [reserveAmmo, setReserveAmmo] = useState(stats.magazineSize * 3); // 3 extra magazines
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  
  // Refs for weapon handling
  const lastShotTime = useRef(0);
  const shotInterval = useRef(60000 / stats.fireRate); // Convert RPM to milliseconds between shots
  const raycaster = useRef(new Raycaster());
  const weaponRef = useRef<THREE.Mesh>(null);
  const muzzleFlashRef = useRef<THREE.Mesh>(null);
  
  // Weapon positioning constants
  const WEAPON_OFFSET = {
    x: 0.25, // Right offset
    y: -0.3, // Down offset
    z: -0.5, // Forward offset
  };
  const AIM_OFFSET = {
    x: 0.05,  // Less right offset when aiming
    y: -0.25, // Up slightly when aiming
    z: -0.4,  // Forward more when aiming
  };
  
  // Notify parent of weapon state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(currentAmmo, isReloading);
    }
  }, [currentAmmo, isReloading, onStateChange]);
  
  // Handle shooting
  useFrame(({ clock }) => {
    if (!weaponRef.current) return;
    
    // Calculate weapon position based on player position and view direction
    const cameraDirection = new Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
    
    // Calculate sideways direction for weapon offset
    const sideways = new Vector3(-cameraDirection.z, 0, cameraDirection.x).normalize();
    
    // Choose offsets based on aiming state
    const offsets = isAiming ? AIM_OFFSET : WEAPON_OFFSET;
    
    // Calculate new weapon position
    const weaponPosition = new Vector3(
      position.x + (sideways.x * offsets.x),
      position.y + offsets.y,
      position.z + (sideways.z * offsets.x) + offsets.z
    );
    
    // Apply smooth interpolation for weapon movement (makes it feel less rigid)
    if (weaponRef.current) {
      weaponRef.current.position.lerp(weaponPosition, 0.5);
      
      // Set rotation to match camera view
      weaponRef.current.rotation.set(
        rotation.x + (isAiming ? 0 : Math.sin(clock.getElapsedTime() * 2) * 0.01), // Slight weapon sway
        rotation.y,
        rotation.z + (isAiming ? 0 : Math.sin(clock.getElapsedTime() * 1.5) * 0.01) // Slight weapon sway
      );
    }
    
    // Update muzzle flash position
    if (muzzleFlashRef.current) {
      // Position in front of the weapon based on its current position
      if (weaponRef.current) {
        const forward = new Vector3(0, 0, -1).applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
        muzzleFlashRef.current.position.copy(weaponRef.current.position).add(forward.multiplyScalar(0.3));
        muzzleFlashRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
        muzzleFlashRef.current.visible = muzzleFlash;
      }
    }
    
    // Calculate if we can shoot based on fire rate
    const currentTime = clock.getElapsedTime() * 1000; // Convert to ms
    const canShoot = currentTime - lastShotTime.current > shotInterval.current;
    
    // Process shooting
    if (isShooting && canShoot && currentAmmo > 0 && !isReloading) {
      // Update last shot time
      lastShotTime.current = currentTime;
      
      // Reduce ammo
      setCurrentAmmo(curr => curr - 1);
      
      // Show muzzle flash
      setMuzzleFlash(true);
      setTimeout(() => setMuzzleFlash(false), 50); // Hide after 50ms
      
      // Play shooting sound
      soundManager.playSound('shoot', isAiming ? 0.7 : 0.8, 1.0);
      
      // Calculate bullet spread
      const spreadRadians = THREE.MathUtils.degToRad(isAiming ? stats.spread * 0.5 : stats.spread);
      
      // Create direction vector from rotation
      const direction = new Vector3(0, 0, -1);
      direction.applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z));
      
      // Apply spread
      direction.x += (Math.random() - 0.5) * spreadRadians;
      direction.y += (Math.random() - 0.5) * spreadRadians;
      direction.z += (Math.random() - 0.5) * spreadRadians;
      direction.normalize();
      
      // Set raycaster origin to position of camera/gun
      raycaster.current.set(position, direction);
      
      // Notify parent of shot for further processing (like hit detection)
      if (onShoot) {
        onShoot(null, direction);
      }
    } else if (isShooting && canShoot && currentAmmo === 0 && !isReloading) {
      // Play empty magazine click sound
      soundManager.playSound('empty', 0.5);
      // Update last shot time to prevent spam
      lastShotTime.current = currentTime;
    }
    
    // Auto-reload when empty
    if (currentAmmo === 0 && !isReloading && reserveAmmo > 0) {
      reload();
    }
  });
  
  // Handle manual reload
  useEffect(() => {
    if (reloadInput && !isReloading && currentAmmo < stats.magazineSize && reserveAmmo > 0) {
      reload();
    }
  }, [reloadInput, currentAmmo, reserveAmmo, stats.magazineSize]);
  
  // Reload function
  const reload = () => {
    if (isReloading || currentAmmo === stats.magazineSize || reserveAmmo === 0) return;
    
    setIsReloading(true);
    
    // Play reload sound
    soundManager.playSound('reload', 0.8);
    
    // Reload after specified time
    setTimeout(() => {
      const ammoNeeded = stats.magazineSize - currentAmmo;
      const ammoToAdd = Math.min(ammoNeeded, reserveAmmo);
      
      setCurrentAmmo(currentAmmo + ammoToAdd);
      setReserveAmmo(reserveAmmo - ammoToAdd);
      setIsReloading(false);
    }, stats.reloadTime * 1000);
  };
  
  return (
    <>
      {/* Weapon model */}
      <mesh ref={weaponRef}>
        <boxGeometry args={[0.08, 0.08, 0.5]} />
        <meshStandardMaterial color={isAiming ? "#444444" : "#555555"} />
        
        {/* Gun grip */}
        <mesh position={[0, -0.1, 0.1]}>
          <boxGeometry args={[0.06, 0.15, 0.08]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Iron sights */}
        <mesh position={[0, 0.04, -0.2]} scale={[0.03, 0.03, 0.03]}>
          <boxGeometry args={[1, 0.5, 1]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </mesh>
      
      {/* Muzzle flash */}
      <mesh ref={muzzleFlashRef} visible={false}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="orange" transparent opacity={0.8} />
      </mesh>
    </>
  );
};

export default Weapon; 