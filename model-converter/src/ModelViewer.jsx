import React, {useEffect, useRef} from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function ModelViewer({scene3DData = null, autoDemo=true}){
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const floorPlanObjectsRef = useRef([])

  useEffect(()=>{
    const mount = mountRef.current
    if(!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x061322)
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 60, 160)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 40
    controls.maxDistance = 400
    controlsRef.current = controls

    // lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
    hemi.position.set(0, 200, 0)
    scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(100, 200, 100)
    dir.castShadow = true
    scene.add(dir)

    // ground
    const groundGeo = new THREE.PlaneGeometry(500, 500)
    const groundMat = new THREE.MeshStandardMaterial({color:0x071522, roughness:0.9, metalness:0})
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI/2
    ground.position.y = -1
    ground.receiveShadow = true
    scene.add(ground)

    // sample blocks representing rooms (only if no scene3DData)
    if (!scene3DData) {
      const mat = new THREE.MeshStandardMaterial({color:0x9b8bff, roughness:0.4, metalness:0.1})
      const mat2 = new THREE.MeshStandardMaterial({color:0x00d4ff, roughness:0.45, metalness:0.05})

      const box1 = new THREE.Mesh(new THREE.BoxGeometry(60, 36, 40), mat)
      box1.position.set(-50, 18, 0)
      box1.castShadow = true
      scene.add(box1)

      const box2 = new THREE.Mesh(new THREE.BoxGeometry(46, 36, 34), mat2)
      box2.position.set(10, 18, -10)
      box2.castShadow = true
      scene.add(box2)

      const box3 = new THREE.Mesh(new THREE.BoxGeometry(40, 36, 46), mat)
      box3.position.set(60, 18, 10)
      box3.castShadow = true
      scene.add(box3)
    }

    // subtle animation for demo
    let frameId
    function animate(){
      frameId = requestAnimationFrame(animate)
      // keep rendering to support OrbitControls damping; no auto-animations
      controls.update()
      renderer.render(scene, camera)
    }

    function handleResize(){
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)
    animate()

    return ()=>{
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  },[scene3DData])

  // Add floor plan objects when scene3DData changes
  useEffect(() => {
    if (!scene3DData || !sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove previous floor plan objects
    floorPlanObjectsRef.current.forEach(mesh => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });

    // Add new floor plan objects
    const newMeshes = [];
    scene3DData.forEach(objData => {
      // Create new geometry and material from serializable data
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
      mesh.userData.isFloorPlanObject = true;
      
      scene.add(mesh);
      newMeshes.push(mesh);
    });

    floorPlanObjectsRef.current = newMeshes;

    // Auto-adjust camera to fit the scene
    if (newMeshes.length > 0 && cameraRef.current && controlsRef.current) {
      const box = new THREE.Box3();
      newMeshes.forEach(mesh => box.expandByObject(mesh));
      
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;

      cameraRef.current.position.set(center.x, distance * 0.6, center.z + distance);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

  }, [scene3DData]);

  return (
    <div className="model-viewer" ref={mountRef} style={{width:'100%',height:'420px',borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)'}} />
  )
}
