import React, { useRef } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface OtherPlayerProps {
  id: string;
  position: Vector3;
  rotation: Vector3;
  team: 'human' | 'ai';
  isAlive: boolean;
}

const OtherPlayer: React.FC<OtherPlayerProps> = ({
  id,
  position,
  rotation,
  team,
  isAlive
}) => {
  const groupRef = useRef<Group>(null);
  
  // Get team-specific colors
  const isHuman = team === 'human';
  const primaryColor = isHuman ? '#3366ff' : '#ff3333';  // Blue for humans, red for AI
  const secondaryColor = isHuman ? '#1a4db8' : '#b32020'; // Darker variant
  const highlightColor = isHuman ? '#99ccff' : '#ffcccc'; // Lighter variant
  
  // Update player position and rotation
  useFrame(() => {
    if (!groupRef.current || !isAlive) return;
    
    groupRef.current.position.copy(position);
    groupRef.current.rotation.set(0, rotation.y, 0); // Only rotate around Y axis
  });
  
  if (!isAlive) return null;
  
  return (
    <group 
      ref={groupRef} 
      position={[position.x, position.y, position.z]}
      userData={{ type: 'player', id, team }}
    >
      {/* Body - slightly taller capsule for torso */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={isHuman ? '#e0c8a0' : secondaryColor} roughness={0.6} />
      </mesh>
      
      {/* Left arm */}
      <mesh castShadow position={[-0.35, 0.65, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>
      
      {/* Right arm */}
      <mesh castShadow position={[0.35, 0.65, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>
      
      {/* Left leg */}
      <mesh castShadow position={[-0.15, -0.25, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} />
      </mesh>
      
      {/* Right leg */}
      <mesh castShadow position={[0.15, -0.25, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} />
      </mesh>
      
      {/* Visor/eyes for AI or face detail for humans */}
      {isHuman ? (
        <mesh castShadow position={[0, 1.5, 0.15]}>
          <boxGeometry args={[0.3, 0.05, 0.1]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.3} />
        </mesh>
      ) : (
        <mesh castShadow position={[0, 1.5, 0.15]}>
          <boxGeometry args={[0.4, 0.08, 0.1]} />
          <meshStandardMaterial color={highlightColor} emissive={highlightColor} emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
      )}
      
      {/* Additional details based on team */}
      {isHuman ? (
        // Human backpack
        <mesh castShadow position={[0, 0.65, -0.25]}>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} />
        </mesh>
      ) : (
        // AI shoulder plates
        <>
          <mesh castShadow position={[-0.3, 0.95, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.3]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0.3, 0.95, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.3]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.5} />
          </mesh>
        </>
      )}
      
      {/* Weapon */}
      <mesh castShadow position={[0.4, 0.6, 0.3]} rotation={[0, -Math.PI / 8, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.5]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>
    </group>
  );
};

export default OtherPlayer; 