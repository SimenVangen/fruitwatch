import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function ThreeDFarmView({ farms, selectedFarm, detections, onObjectClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [activePopup, setActivePopup] = useState(null);
  
  // Cyber color scheme
  const COLORS = useMemo(() => ({
    primary: 0x00FFFF,    // Neon cyan
    secondary: 0x0088FF,  // Electric blue
    accent: 0xFF00FF,     // Magenta
    grid: 0x0066FF,       // Deep blue grid
    background: 0x000011, // Dark blue-black
    tree: 0x00FF88,       // Neon green for trees
    path: 0x4444FF,       // Path color
    ripe: 0x00FF88,       // Green for ripe
    unripe: 0xFF4444,     // Red for unripe
  }), []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with dark cyber background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 15, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 20); // Better initial position

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 1);

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced controls for free movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.enablePan = true;

    // Cyber lighting
    const ambientLight = new THREE.AmbientLight(COLORS.primary, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(COLORS.primary, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add glowing point lights for cyber effect
    const pointLight1 = new THREE.PointLight(COLORS.primary, 0.6, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(COLORS.secondary, 0.4, 50);
    pointLight2.position.set(-10, 5, -10);
    scene.add(pointLight2);

    // Create cyber grid layout
    createCyberGrid(scene, COLORS);
    
    // Create data nodes based on detections - FIXED POSITIONING
    createDataNodes(scene, detections, COLORS);

    // Raycaster for object interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        // Look for detection data in the object or its parent
        let nodeData = object.userData.detectionData;
        if (!nodeData && object.parent) {
          nodeData = object.parent.userData.detectionData;
        }
        
        if (nodeData) {
          setActivePopup({
            position: { x: event.clientX, y: event.clientY },
            data: nodeData
          });
          if (onObjectClick) {
            onObjectClick(nodeData);
          }
        }
      } else {
        setActivePopup(null);
      }
    }

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop with cyber effects
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      controls.update();
      animateDataNodes(scene, time);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [detections, COLORS, onObjectClick]);

  const createCyberGrid = (scene, colors) => {
    // Main grid floor with Tron-style lines
    const gridSize = 40;
    const gridDivisions = 40;
    
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, colors.grid, colors.grid);
    gridHelper.position.y = -0.5;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create the tree pattern: 1--1--1--1--1--1--1--1
    const treePattern = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    
    // Create trees based on pattern
    treePattern.forEach((hasTree, index) => {
      if (hasTree) {
        const x = (index - treePattern.length / 2) * 1.5;
        createCyberTree(scene, x, 0, -12, colors.tree);
        createCyberTree(scene, x, 0, 12, colors.tree);
      }
    });

    // Create cyber paths on the sides
    createCyberPath(scene, -15, 0, 0, colors.path);
    createCyberPath(scene, 15, 0, 0, colors.path);
  };

  const createCyberTree = (scene, x, y, z, color) => {
    const treeGroup = new THREE.Group();

    // Cyber trunk - glowing cylinder
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      shininess: 100
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 1.5, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Cyber leaves - glowing sphere
    const leavesGeometry = new THREE.SphereGeometry(1, 8, 6);
    const leavesMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(0, 3.2, 0);
    leaves.castShadow = true;
    treeGroup.add(leaves);

    // Add wireframe for cyber look
    const wireframe = new THREE.WireframeGeometry(leavesGeometry);
    const line = new THREE.LineSegments(wireframe);
    line.position.set(0, 3.2, 0);
    line.material.color.set(COLORS.primary);
    treeGroup.add(line);

    treeGroup.position.set(x, y, z);
    scene.add(treeGroup);

    return treeGroup;
  };

  const createCyberPath = (scene, x, y, z, color) => {
    const pathGroup = new THREE.Group();

    // Path surface
    const pathGeometry = new THREE.PlaneGeometry(2, 40);
    const pathMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.3,
      shininess: 50
    });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    pathGroup.add(path);

    // Path edge lines
    const lineGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.1);
    const lineMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.primary,
      emissive: COLORS.primary,
      emissiveIntensity: 0.8
    });

    const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
    leftLine.position.set(0, 0.1, -1);
    pathGroup.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
    rightLine.position.set(0, 0.1, 1);
    pathGroup.add(rightLine);

    pathGroup.position.set(x, y, z);
    scene.add(pathGroup);
  };

  const createDataNodes = (scene, detections, colors) => {
    if (!detections || !detections.length) {
      console.log('No detections to display');
      return;
    }

    console.log(`Creating ${detections.length} data nodes`);

    // Clear existing data nodes
    scene.children = scene.children.filter(child => !child.userData?.isDataNode);

    // Create a more spread out grid for better visibility
    const gridSize = Math.ceil(Math.sqrt(detections.length));
    
    detections.forEach((detection, index) => {
      // Calculate grid position
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      // Spread nodes across the grid with better spacing
      const x = (col - gridSize / 2) * 3;
      const z = (row - gridSize / 2) * 3;
      
      // Determine node color based on ripeness ratio
      const totalFruits = (detection.ripe || 0) + (detection.unripe || 0);
      const ripeRatio = totalFruits > 0 ? (detection.ripe || 0) / totalFruits : 0;
      
      let nodeColor;
      if (ripeRatio > 0.7) {
        nodeColor = colors.ripe; // Mostly ripe - green
      } else if (ripeRatio > 0.3) {
        nodeColor = colors.primary; // Mixed - cyan
      } else {
        nodeColor = colors.unripe; // Mostly unripe - red
      }

      // Calculate intensity based on total fruit count
      const intensity = Math.min((totalFruits || 1) / 10, 2);

      createDataNode(scene, x, 2, z, nodeColor, intensity, detection);
    });

    console.log(`Created ${detections.length} data nodes in scene`);
  };

  const createDataNode = (scene, x, y, z, color, intensity, detectionData) => {
    const nodeGroup = new THREE.Group();
    nodeGroup.userData = { 
      isDataNode: true,
      detectionData: detectionData 
    };

    // Main data sphere - LARGER and more visible
    const sphereGeometry = new THREE.SphereGeometry(1.2 * intensity, 16, 12);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8, // Higher emission for better visibility
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.userData = { 
      pulseSpeed: 0.03 + Math.random() * 0.02,
      detectionData: detectionData
    };
    sphere.castShadow = true;
    nodeGroup.add(sphere);

    // Outer glow ring - LARGER
    const ringGeometry = new THREE.TorusGeometry(1.8 * intensity, 0.15, 8, 24);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.primary,
      emissive: COLORS.primary,
      emissiveIntensity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    nodeGroup.add(ring);

    // Data stream lines - MORE VISIBLE
    for (let i = 0; i < 4; i++) {
      const lineGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
      const lineMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.primary,
        emissive: COLORS.primary,
        emissiveIntensity: 0.8
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(Math.sin(i * 1.57) * 2, -1.5, Math.cos(i * 1.57) * 2);
      line.userData = { offset: i * 2 };
      nodeGroup.add(line);
    }

    // Add a label above the node showing fruit count
    const totalFruits = (detectionData.ripe || 0) + (detectionData.unripe || 0);
    if (totalFruits > 0) {
      // Create a simple cube as a label indicator
      const labelGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
      const labelMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, 2.5, 0);
      nodeGroup.add(label);
    }

    nodeGroup.position.set(x, y, z);
    scene.add(nodeGroup);

    console.log(`Created data node at (${x}, ${y}, ${z}) with ${totalFruits} fruits`);
    return nodeGroup;
  };

  const animateDataNodes = (scene, time) => {
    scene.children.forEach(child => {
      if (child.userData?.isDataNode) {
        const sphere = child.children[0];
        const ring = child.children[1];
        
        if (sphere && ring) {
          // Pulsing animation - more pronounced
          const scale = 1 + Math.sin(time * sphere.userData.pulseSpeed) * 0.3;
          sphere.scale.setScalar(scale);
          ring.scale.setScalar(scale);

          // Rotate rings
          ring.rotation.y = time * 0.8;

          // Animate data stream lines
          for (let i = 2; i < Math.min(child.children.length, 6); i++) {
            const line = child.children[i];
            if (line.userData.offset !== undefined) {
              line.scale.y = 1 + Math.sin(time * 3 + line.userData.offset) * 0.5;
            }
          }
        }
      }
    });
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', background: 'black' }}>
      <div ref={mountRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Detection Count Indicator */}
      {detections && detections.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 20, 0.8)',
          padding: '1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          border: `1px solid #00FFFF`,
          color: '#00FFFF',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          <div style={{ lineHeight: '1.4' }}>
            <div style={{ marginBottom: '0.5rem', borderBottom: `1px solid #00FFFF`, paddingBottom: '0.5rem' }}>
              <strong>📊 LIVE DATA STREAM</strong>
            </div>
            <div>🟢 ACTIVE NODES: <strong style={{color: '#00FF88'}}>{detections.length}</strong></div>
            <div>🎯 TOTAL FRUITS: <strong style={{color: '#0088FF'}}>
              {detections.reduce((sum, d) => sum + (d.ripe || 0) + (d.unripe || 0), 0)}
            </strong></div>
          </div>
        </div>
      )}

      {/* Cyber Popup Window */}
      {activePopup && (
        <div style={{
          position: 'absolute',
          left: Math.min(activePopup.position.x, window.innerWidth - 300),
          top: Math.min(activePopup.position.y, window.innerHeight - 200),
          background: 'rgba(0, 0, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `2px solid #00FFFF`,
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '250px',
          boxShadow: `0 0 20px #00FFFF`,
          color: '#00FFFF',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem',
            borderBottom: `1px solid #00FFFF`,
            paddingBottom: '0.5rem'
          }}>
            <h4 style={{ margin: 0, color: '#00FFFF' }}>⚡ DATA NODE</h4>
            <button 
              onClick={() => setActivePopup(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#00FFFF'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
            <div>🟢 RIPE: <strong style={{color: '#00FF88'}}>{activePopup.data.ripe || 0}</strong></div>
            <div>🔴 UNRIPE: <strong style={{color: '#FF4444'}}>{activePopup.data.unripe || 0}</strong></div>
            <div>📊 TOTAL: <strong style={{color: '#0088FF'}}>{(activePopup.data.ripe || 0) + (activePopup.data.unripe || 0)}</strong></div>
            {activePopup.data.timestamp && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0088FF' }}>
                DETECTED: {new Date(activePopup.data.timestamp).toLocaleTimeString()}
              </div>
            )}
            {activePopup.data.latitude && activePopup.data.longitude && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0088FF' }}>
                LOCATION: {activePopup.data.latitude.toFixed(2)}, {activePopup.data.longitude.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cyber UI Legend */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 20, 0.8)',
        padding: '1rem',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        border: `1px solid #00FFFF`,
        color: '#00FFFF',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#00FFFF', borderBottom: `1px solid #00FFFF`, paddingBottom: '0.5rem' }}>
          🌐 CYBER GRID
        </h3>
        <div style={{ lineHeight: '1.6' }}>
          <div>🟢 <strong style={{color: '#00FF88'}}>NODES:</strong> Ripe fruit data</div>
          <div>🔵 <strong style={{color: '#0088FF'}}>NODES:</strong> Mixed ripeness</div>
          <div>🔴 <strong style={{color: '#FF4444'}}>NODES:</strong> Unripe fruit data</div>
          <div>👆 <strong>CLICK NODES</strong> for data stream</div>
          <div>🎮 <strong>DRAG:</strong> Rotate view</div>
          <div>🔍 <strong>SCROLL:</strong> Zoom in/out</div>
        </div>
      </div>

      {/* No Data Message */}
      {(!detections || detections.length === 0) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 20, 0.8)',
          padding: '2rem',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          border: `2px solid #FF4444`,
          color: '#FF4444',
          fontFamily: 'monospace',
          textAlign: 'center',
          fontSize: '1.1rem'
        }}>
          ⚠️ NO DATA STREAM<br/>
          <span style={{ fontSize: '0.9rem', color: '#0088FF' }}>
            No detection data available
          </span>
        </div>
      )}
    </div>
  );
}