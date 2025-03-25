import React, { useState, useEffect } from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { TextureLoader, RepeatWrapping, Texture } from 'three';

interface BarricadeProps {
  position: [number, number, number];
  rotation: [number, number, number];
  texture?: Texture;
}

interface CrateProps {
  position: [number, number, number];
  size: [number, number, number];
  texture?: Texture;
}

interface WallProps {
  position: [number, number, number];
  args: [number, number, number];
  texture?: Texture;
}

const Barricade: React.FC<BarricadeProps> = ({ position, rotation, texture }) => {
  const [ref] = useBox(() => ({
    position,
    rotation,
    args: [3, 1.5, 0.3] as [number, number, number],
    type: 'Static',
  }));
  
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[3, 1.5, 0.3]} />
      <meshStandardMaterial map={texture} color="#666666" />
    </mesh>
  );
};

const Crate: React.FC<CrateProps> = ({ position, size, texture }) => {
  const [ref] = useBox(() => ({
    position,
    args: size,
    type: 'Static',
    mass: 1,
  }));
  
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial map={texture} color="#a88" />
    </mesh>
  );
};

const Wall: React.FC<WallProps> = ({ position, args, texture }) => {
  const [ref] = useBox(() => ({
    position,
    args,
    type: 'Static',
  }));
  
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial map={texture} color="#888" />
    </mesh>
  );
};

const Level: React.FC = () => {
  // Load textures with error handling
  const [, setTexturesLoaded] = useState(false);
  const [, setTextureLoadError] = useState(false);
  
  // Create fallback textures if loading fails
  const createFallbackTexture = (color: string = '#888888') => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      
      // Add some texture pattern
      ctx.fillStyle = color === '#888888' ? '#777777' : '#777777';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(i * 16, j * 16, 16, 16);
          }
        }
      }
    }
    
    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  };
  
  // Set up initial fallback textures
  const [floorTexture, setFloorTexture] = useState(createFallbackTexture('#555555'));
  const [wallTexture, setWallTexture] = useState(createFallbackTexture('#666666'));
  const [metalTexture, setMetalTexture] = useState(createFallbackTexture('#777777'));
  const [concreteTexture, setConcreteTexture] = useState(createFallbackTexture('#888888'));
  
  // Load real textures if available
  useEffect(() => {
    const textureLoader = new TextureLoader();
    const texturePaths = [
      '/textures/floor.jpg',
      '/textures/wall.jpg', 
      '/textures/metal.jpg',
      '/textures/concrete.jpg'
    ];
    
    const textureSetters = [
      setFloorTexture,
      setWallTexture,
      setMetalTexture,
      setConcreteTexture
    ];
    
    let loadedCount = 0;
    let errorCount = 0;
    
    texturePaths.forEach((path, index) => {
      textureLoader.load(
        path,
        (texture) => {
          texture.wrapS = texture.wrapT = RepeatWrapping;
          texture.repeat.set(10, 10);
          textureSetters[index](texture);
          loadedCount++;
          if (loadedCount + errorCount === texturePaths.length) {
            setTexturesLoaded(true);
          }
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture ${path}:`, error);
          errorCount++;
          if (loadedCount + errorCount === texturePaths.length) {
            setTexturesLoaded(true);
            if (errorCount > 0) {
              setTextureLoadError(true);
            }
          }
        }
      );
    });
  }, []);

  // Create a floor
  const [floorRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: {
      friction: 0.1,
      restitution: 0.0,
    },
    type: 'Static',
    args: [100, 100], // Make floor much larger
    userData: { type: 'ground' } // Add identifier for ground
  }));

  // Main boundary walls
  const [wallNorth] = useBox(() => ({
    position: [0, 2, -25] as [number, number, number],
    args: [50, 4, 1] as [number, number, number],
    type: 'Static',
  }));

  const [wallSouth] = useBox(() => ({
    position: [0, 2, 25] as [number, number, number],
    args: [50, 4, 1] as [number, number, number],
    type: 'Static',
  }));

  const [wallEast] = useBox(() => ({
    position: [25, 2, 0] as [number, number, number],
    args: [1, 4, 50] as [number, number, number],
    type: 'Static',
  }));

  const [wallWest] = useBox(() => ({
    position: [-25, 2, 0] as [number, number, number],
    args: [1, 4, 50] as [number, number, number],
    type: 'Static',
  }));

  // Create elevated platforms
  const [platformCenterRef] = useBox(() => ({
    position: [0, 1, 0] as [number, number, number],
    args: [8, 2, 8] as [number, number, number],
    type: 'Static',
  }));

  const [platformNorthRef] = useBox(() => ({
    position: [0, 1.5, -15] as [number, number, number],
    args: [10, 3, 5] as [number, number, number],
    type: 'Static',
  }));

  const [platformEastRef] = useBox(() => ({
    position: [15, 2, 0] as [number, number, number],
    args: [5, 4, 10] as [number, number, number],
    type: 'Static',
  }));

  // Create ramps
  const [rampNorthRef] = useBox(() => ({
    position: [0, 0.75, -6] as [number, number, number],
    rotation: [-Math.PI / 12, 0, 0] as [number, number, number],
    args: [4, 0.5, 8] as [number, number, number],
    type: 'Static',
  }));

  const [rampEastRef] = useBox(() => ({
    position: [6, 0.75, 0] as [number, number, number],
    rotation: [0, 0, Math.PI / 12] as [number, number, number],
    args: [8, 0.5, 4] as [number, number, number],
    type: 'Static',
  }));

  // Create small barricades for cover
  const barricades = [
    { position: [-10, 0.75, 8] as [number, number, number], rotation: [0, Math.PI / 6, 0] as [number, number, number] },
    { position: [10, 0.75, -8] as [number, number, number], rotation: [0, -Math.PI / 4, 0] as [number, number, number] },
    { position: [-8, 0.75, -12] as [number, number, number], rotation: [0, Math.PI / 3, 0] as [number, number, number] },
    { position: [12, 0.75, 14] as [number, number, number], rotation: [0, -Math.PI / 5, 0] as [number, number, number] },
  ];

  // Create crates that can be stacked
  const crates = [
    { position: [-5, 0.5, 5] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [-5, 1.5, 5] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [5, 0.5, -5] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [5, 1.5, -5] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [5, 2.5, -5] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [-10, 0.5, -10] as [number, number, number], size: [1.5, 1, 1.5] as [number, number, number] },
    { position: [10, 0.5, 10] as [number, number, number], size: [1.5, 1, 1.5] as [number, number, number] },
  ];

  // Create a bunker-like structure
  const [bunkerFloorRef] = useBox(() => ({
    position: [-15, 0.5, 15] as [number, number, number],
    args: [8, 1, 8] as [number, number, number],
    type: 'Static',
  }));

  const bunkerWalls = [
    { position: [-15, 1.5, 11.5] as [number, number, number], args: [8, 2, 1] as [number, number, number] },
    { position: [-15, 1.5, 18.5] as [number, number, number], args: [8, 2, 1] as [number, number, number] },
    { position: [-18.5, 1.5, 15] as [number, number, number], args: [1, 2, 8] as [number, number, number] },
    { position: [-11.5, 1.5, 15] as [number, number, number], args: [1, 2, 8] as [number, number, number] },
  ];

  // Create a trench section
  const [trenchFloorRef] = useBox(() => ({
    position: [15, -1, -15] as [number, number, number],
    args: [8, 1, 8] as [number, number, number],
    type: 'Static',
  }));

  const trenchWalls = [
    { position: [15, 0, -11.5] as [number, number, number], args: [8, 2, 1] as [number, number, number] },
    { position: [15, 0, -18.5] as [number, number, number], args: [8, 2, 1] as [number, number, number] },
    { position: [11.5, 0, -15] as [number, number, number], args: [1, 2, 8] as [number, number, number] },
    { position: [18.5, 0, -15] as [number, number, number], args: [1, 2, 8] as [number, number, number] },
  ];

  // Create ramps to access trench
  const [trenchRampRef] = useBox(() => ({
    position: [15, -0.5, -9] as [number, number, number],
    rotation: [Math.PI / 12, 0, 0] as [number, number, number],
    args: [4, 0.5, 5] as [number, number, number],
    type: 'Static',
  }));

  return (
    <>
      {/* Floor with texture */}
      <mesh ref={floorRef} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={floorTexture} color="#555555" />
      </mesh>

      {/* Main boundary walls */}
      <mesh ref={wallNorth} castShadow receiveShadow>
        <boxGeometry args={[50, 4, 1]} />
        <meshStandardMaterial map={wallTexture} color="#666666" />
      </mesh>
      
      <mesh ref={wallSouth} castShadow receiveShadow>
        <boxGeometry args={[50, 4, 1]} />
        <meshStandardMaterial map={wallTexture} color="#666666" />
      </mesh>
      
      <mesh ref={wallEast} castShadow receiveShadow>
        <boxGeometry args={[1, 4, 50]} />
        <meshStandardMaterial map={wallTexture} color="#666666" />
      </mesh>
      
      <mesh ref={wallWest} castShadow receiveShadow>
        <boxGeometry args={[1, 4, 50]} />
        <meshStandardMaterial map={wallTexture} color="#666666" />
      </mesh>

      {/* Elevated platforms */}
      <mesh ref={platformCenterRef} castShadow receiveShadow>
        <boxGeometry args={[8, 2, 8]} />
        <meshStandardMaterial map={concreteTexture} color="#888888" />
      </mesh>
      
      <mesh ref={platformNorthRef} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 5]} />
        <meshStandardMaterial map={concreteTexture} color="#888888" />
      </mesh>
      
      <mesh ref={platformEastRef} castShadow receiveShadow>
        <boxGeometry args={[5, 4, 10]} />
        <meshStandardMaterial map={concreteTexture} color="#888888" />
      </mesh>

      {/* Ramps */}
      <mesh ref={rampNorthRef} castShadow receiveShadow>
        <boxGeometry args={[4, 0.5, 8]} />
        <meshStandardMaterial map={metalTexture} color="#777777" />
      </mesh>
      
      <mesh ref={rampEastRef} castShadow receiveShadow>
        <boxGeometry args={[8, 0.5, 4]} />
        <meshStandardMaterial map={metalTexture} color="#777777" />
      </mesh>

      {/* Barricades */}
      {barricades.map((barricade, index) => (
        <Barricade 
          key={`barricade-${index}`} 
          position={barricade.position} 
          rotation={barricade.rotation}
          texture={metalTexture} 
        />
      ))}

      {/* Crates */}
      {crates.map((crate, index) => (
        <Crate 
          key={`crate-${index}`} 
          position={crate.position} 
          size={crate.size}
          texture={wallTexture}
        />
      ))}

      {/* Bunker structure */}
      <mesh ref={bunkerFloorRef} castShadow receiveShadow>
        <boxGeometry args={[8, 1, 8]} />
        <meshStandardMaterial map={concreteTexture} color="#888888" />
      </mesh>

      {/* Bunker walls */}
      {bunkerWalls.map((wall, index) => (
        <Wall
          key={`bunker-wall-${index}`}
          position={wall.position}
          args={wall.args}
          texture={concreteTexture}
        />
      ))}

      {/* Trench */}
      <mesh ref={trenchFloorRef} castShadow receiveShadow>
        <boxGeometry args={[8, 1, 8]} />
        <meshStandardMaterial map={concreteTexture} color="#777777" />
      </mesh>

      {/* Trench walls */}
      {trenchWalls.map((wall, index) => (
        <Wall
          key={`trench-wall-${index}`}
          position={wall.position}
          args={wall.args}
          texture={concreteTexture}
        />
      ))}

      {/* Trench ramp */}
      <mesh ref={trenchRampRef} castShadow receiveShadow>
        <boxGeometry args={[4, 0.5, 5]} />
        <meshStandardMaterial map={metalTexture} color="#777777" />
      </mesh>
    </>
  );
};

export default Level; 