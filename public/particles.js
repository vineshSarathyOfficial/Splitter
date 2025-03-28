import * as THREE from 'three';

export function initParticles(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  
  const particles = new THREE.BufferGeometry();
  const particleCount = 1000;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 10;
    
    colors[i] = Math.random() * 0.5 + 0.5;
    colors[i + 1] = Math.random() * 0.5;
    colors[i + 2] = Math.random() * 0.5 + 0.5;
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6
  });
  
  const points = new THREE.Points(particles, material);
  scene.add(points);
  
  camera.position.z = 5;
  
  function animate() {
    requestAnimationFrame(animate);
    points.rotation.x += 0.001;
    points.rotation.y += 0.001;
    renderer.render(scene, camera);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  return () => {
    container.removeChild(renderer.domElement);
    renderer.dispose();
  };
}