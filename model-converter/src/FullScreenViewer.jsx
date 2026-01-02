import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { parseFloorPlanData } from './api';
import { build3DScene } from './builder3D';
import './FullScreenViewer.css';

function FullScreenViewer() {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showControls, setShowControls] = useState(true);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // Get raw API data from navigation state and rebuild everything
  const rawApiData = location.state?.rawApiData;
  const parsedData = rawApiData ? parseFloorPlanData(rawApiData) : null;
  const scene3DData = parsedData ? build3DScene(parsedData) : null;

  useEffect(() => {
    if (!rawApiData || !scene3DData) {
      // If no data, redirect back
      navigate('/');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.tabIndex = 0; // Make canvas focusable
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Focus the canvas immediately
    renderer.domElement.focus();

    console.log('Canvas element:', renderer.domElement, 'Parent:', mountRef.current);

    // Orbit controls - must be created after canvas is in DOM
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 1.5; // Allow viewing from below slightly
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    
    // Add event listeners to verify mouse events are reaching the canvas
    renderer.domElement.addEventListener('mousedown', (e) => {
      console.log('Canvas mousedown:', e.button, 'Position:', e.clientX, e.clientY);
    });
    renderer.domElement.addEventListener('wheel', (e) => {
      console.log('Canvas wheel event:', e.deltaY);
    });
    
    controlsRef.current = controls;
    
    // Connect controls immediately
    controls.connect();
    
    console.log('OrbitControls initialized', { 
      enabled: controls.enabled, 
      enableRotate: controls.enableRotate, 
      enableZoom: controls.enableZoom, 
      enablePan: controls.enablePan,
      domElement: controls.domElement
    });
    
    // Test if controls are responding
    controls.addEventListener('change', () => {
      console.log('OrbitControls change event fired!');
    });

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add rim light
    const rimLight = new THREE.DirectionalLight(0x4a9eff, 0.3);
    rimLight.position.set(-100, 50, -100);
    scene.add(rimLight);

    // Ground plane with grid
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f1e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    ground.name = 'ground'; // Name it for filtering
    scene.add(ground);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(1000, 100, 0x2a2a4e, 0x1a1a2e);
    gridHelper.position.y = -0.4;
    gridHelper.name = 'gridHelper'; // Name it for filtering
    scene.add(gridHelper);

    // Add 3D objects from scene data
    if (scene3DData && scene3DData.length > 0) {
      const box = new THREE.Box3();
      
      scene3DData.forEach((objData) => {
        // Create new geometry and material instances
        const geometry = new THREE.BoxGeometry(
          objData.geometry.parameters.width,
          objData.geometry.parameters.height,
          objData.geometry.parameters.depth
        );
        const material = new THREE.MeshStandardMaterial({
          color: objData.material.color,
          roughness: objData.material.roughness || 0.7,
          metalness: objData.material.metalness || 0.1,
          transparent: objData.material.transparent || false,
          opacity: objData.material.opacity || 1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        
        // Expand bounding box
        box.expandByObject(mesh);
      });

      // Auto-adjust camera to fit all objects
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;

      camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.8, center.z + cameraZ * 0.5);
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    } else {
      camera.position.set(100, 100, 100);
      camera.lookAt(0, 0, 0);
    }

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Hide controls after 3 seconds of inactivity
    let controlsTimeout;
    const resetControlsTimeout = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('keydown', resetControlsTimeout);
    resetControlsTimeout();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('keydown', resetControlsTimeout);
      clearTimeout(controlsTimeout);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [scene3DData, navigate, rawApiData]);

  const handleExit = () => {
    console.log('Exit button clicked');
    // Pass the data back to home page to preserve the 3D model
    navigate('/', { state: { rawApiData, scene3DData } });
  };

  const handleResetView = () => {
    console.log('Reset View clicked', { controls: !!controlsRef.current, camera: !!cameraRef.current, scene: !!sceneRef.current });
    if (controlsRef.current && cameraRef.current && sceneRef.current) {
      // Get all meshes in the scene (excluding ground and helpers)
      const meshes = [];
      sceneRef.current.traverse((obj) => {
        if (obj.isMesh && obj.name !== 'ground') {
          meshes.push(obj);
        }
      });

      if (meshes.length > 0) {
        const box = new THREE.Box3();
        meshes.forEach(mesh => box.expandByObject(mesh));
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5;

        cameraRef.current.position.set(
          center.x + cameraZ * 0.5,
          center.y + cameraZ * 0.8,
          center.z + cameraZ * 0.5
        );
        cameraRef.current.lookAt(center);
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  };

  const handleTopView = () => {
    console.log('Top View clicked', { controls: !!controlsRef.current, camera: !!cameraRef.current, scene: !!sceneRef.current });
    if (controlsRef.current && cameraRef.current && sceneRef.current) {
      // Get all meshes in the scene (excluding ground and helpers)
      const meshes = [];
      sceneRef.current.traverse((obj) => {
        if (obj.isMesh && obj.name !== 'ground') {
          meshes.push(obj);
        }
      });

      if (meshes.length > 0) {
        const box = new THREE.Box3();
        meshes.forEach(mesh => box.expandByObject(mesh));
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z);

        cameraRef.current.position.set(center.x, maxDim * 1.5, center.z);
        cameraRef.current.lookAt(center);
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  };

  if (!rawApiData) {
    return null;
  }

  return (
    <div className="fullscreen-viewer">
      <div ref={mountRef} className="viewer-canvas" />
      
      <div className={`viewer-controls ${showControls ? 'visible' : 'hidden'}`}>
        <button className="control-btn exit-btn" onClick={handleExit} title="Exit Full Screen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Exit
        </button>

        <div className="view-controls">
          <button className="control-btn" onClick={handleResetView} title="Reset View">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Reset
          </button>

          <button className="control-btn" onClick={handleTopView} title="Top View">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Top View
          </button>
        </div>
      </div>

      <div className={`viewer-help ${showControls ? 'visible' : 'hidden'}`}>
        <div className="help-item">🖱️ Left Click + Drag: Rotate</div>
        <div className="help-item">🖱️ Right Click + Drag: Pan</div>
        <div className="help-item">🖱️ Scroll: Zoom</div>
      </div>
    </div>
  );
}

export default FullScreenViewer;
