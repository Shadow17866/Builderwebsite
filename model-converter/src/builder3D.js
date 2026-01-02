// 3D Builder utility - converts floor plan data to 3D objects
import * as THREE from 'three';

const SCALE_FACTOR = 0.5; // Scale down for better viewing
const WALL_HEIGHT = 36;
const WALL_THICKNESS = 2;
const DOOR_HEIGHT = 28;
const WINDOW_HEIGHT = 12;

export function build3DScene(floorPlanData) {
  const { objects, imageWidth, imageHeight } = floorPlanData;
  
  const scene3DObjects = [];
  
  // Center offset to place model at origin
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;

  objects.forEach((obj) => {
    const { type, bounds, width, height } = obj;
    
    // Calculate center position
    const centerPosX = ((bounds.x1 + bounds.x2) / 2 - centerX) * SCALE_FACTOR;
    const centerPosZ = ((bounds.y1 + bounds.y2) / 2 - centerY) * SCALE_FACTOR;
    
    const scaledWidth = width * SCALE_FACTOR;
    const scaledDepth = height * SCALE_FACTOR;

    let mesh = null;

    if (type === 'wall') {
      // Determine if wall is horizontal or vertical
      const isHorizontal = width > height;
      
      const wallWidth = isHorizontal ? scaledWidth : WALL_THICKNESS;
      const wallDepth = isHorizontal ? WALL_THICKNESS : scaledDepth;
      
      const geometry = new THREE.BoxGeometry(wallWidth, WALL_HEIGHT, wallDepth);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.7, 
        metalness: 0.1 
      });
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerPosX, WALL_HEIGHT / 2, centerPosZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
    } else if (type === 'door') {
      const isHorizontal = width > height;
      const doorWidth = isHorizontal ? Math.min(scaledWidth, 15) : WALL_THICKNESS;
      const doorDepth = isHorizontal ? WALL_THICKNESS : Math.min(scaledDepth, 15);
      
      const geometry = new THREE.BoxGeometry(doorWidth, DOOR_HEIGHT, doorDepth);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, 
        roughness: 0.5, 
        metalness: 0.2 
      });
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerPosX, DOOR_HEIGHT / 2, centerPosZ);
      mesh.castShadow = true;
      
    } else if (type === 'window') {
      const isHorizontal = width > height;
      const windowWidth = isHorizontal ? Math.min(scaledWidth, 12) : WALL_THICKNESS;
      const windowDepth = isHorizontal ? WALL_THICKNESS : Math.min(scaledDepth, 12);
      
      const geometry = new THREE.BoxGeometry(windowWidth, WINDOW_HEIGHT, windowDepth);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x87CEEB, 
        roughness: 0.1, 
        metalness: 0.8,
        transparent: true,
        opacity: 0.6
      });
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerPosX, WALL_HEIGHT * 0.6, centerPosZ);
      mesh.castShadow = true;
    }

    if (mesh) {
      // Store serializable data instead of mesh objects
      scene3DObjects.push({
        type,
        position: { x: centerPosX, y: mesh.position.y, z: centerPosZ },
        geometry: {
          type: 'BoxGeometry',
          parameters: {
            width: mesh.geometry.parameters.width,
            height: mesh.geometry.parameters.height,
            depth: mesh.geometry.parameters.depth
          }
        },
        material: {
          color: mesh.material.color.getHex(),
          roughness: mesh.material.roughness,
          metalness: mesh.material.metalness,
          transparent: mesh.material.transparent || false,
          opacity: mesh.material.opacity || 1
        }
      });
    }
  });

  return scene3DObjects;
}

export function clearScene(scene) {
  const objectsToRemove = [];
  
  scene.traverse((object) => {
    if (object.isMesh && object.userData.isFloorPlanObject) {
      objectsToRemove.push(object);
    }
  });
  
  objectsToRemove.forEach((object) => {
    scene.remove(object);
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
}
