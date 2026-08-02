import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SourcePage } from '../types';

type TheoryGraphProps = {
  pages: SourcePage[];
  activeId: string;
  onSelect: (id: string) => void;
};

const areaColors: Record<SourcePage['area'], number> = {
  Concept: 0xf2b84b,
  Foundation: 0x7dd3fc,
  Practice: 0x5eead4,
  Reference: 0xd6d3d1,
  Theory: 0xf87171,
};

function nodePosition(index: number, total: number) {
  const turns = 2.2;
  const angle = (index / total) * Math.PI * 2 * turns;
  const radius = 3.8 + (index % 4) * 0.34;
  const y = ((index % 7) - 3) * 0.62;
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function createLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(7, 12, 14, 0.78)';
  context.fillRect(0, 24, canvas.width, 72);
  context.strokeStyle = 'rgba(125, 211, 252, 0.8)';
  context.strokeRect(1, 25, canvas.width - 2, 70);
  context.font = '600 30px Inter, Segoe UI, Arial';
  context.fillStyle = '#f4efe1';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.length > 24 ? `${text.slice(0, 22)}...` : text, canvas.width / 2, 62);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.92 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.9, 0.48, 1);
  return sprite;
}

export function TheoryGraph({ pages, activeId, onSelect }: TheoryGraphProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x071012, 8, 18);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 3.2, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xb9f6ff, 0.75);
    scene.add(ambient);
    const key = new THREE.PointLight(0xffd28a, 38, 30);
    key.position.set(2.8, 5, 5);
    scene.add(key);

    const positions = new Map<string, THREE.Vector3>();
    const nodeObjects: THREE.Mesh[] = [];
    const disposableMaterials: THREE.Material[] = [];
    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableTextures: THREE.Texture[] = [];

    pages.forEach((page, index) => {
      const position = nodePosition(index, pages.length);
      positions.set(page.id, position);

      const geometry = new THREE.SphereGeometry(page.id === activeId ? 0.18 : 0.13, 24, 16);
      const material = new THREE.MeshStandardMaterial({
        color: areaColors[page.area],
        emissive: areaColors[page.area],
        emissiveIntensity: page.id === activeId ? 0.42 : 0.16,
        roughness: 0.48,
        metalness: 0.16,
      });
      disposableGeometries.push(geometry);
      disposableMaterials.push(material);

      const node = new THREE.Mesh(geometry, material);
      node.position.copy(position);
      node.userData = { id: page.id };
      group.add(node);
      nodeObjects.push(node);

      const label = createLabel(page.title);
      if (label && (page.id === activeId || index % 3 === 0)) {
        label.position.copy(position.clone().add(new THREE.Vector3(0, 0.42, 0)));
        group.add(label);
        if (label.material.map) disposableTextures.push(label.material.map);
        disposableMaterials.push(label.material);
      }
    });

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x87f6ff,
      transparent: true,
      opacity: 0.28,
    });
    disposableMaterials.push(lineMaterial);

    const connected = new Set<string>();
    const addLine = (a: string, b: string) => {
      const keyName = [a, b].sort().join(':');
      if (connected.has(keyName)) return;
      const start = positions.get(a);
      const end = positions.get(b);
      if (!start || !end) return;
      connected.add(keyName);
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      disposableGeometries.push(geometry);
      group.add(new THREE.Line(geometry, lineMaterial));
    };

    pages.forEach((page, index) => {
      const nextInGroup = pages.slice(index + 1).find((candidate) => candidate.group === page.group);
      if (nextInGroup) addLine(page.id, nextInGroup.id);
      page.relatedIds.forEach((relatedId) => addLine(page.id, relatedId));
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const resize = () => {
      const width = Math.max(mount.clientWidth, 280);
      const height = Math.max(mount.clientHeight, 320);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(nodeObjects, false)[0];
      const id = hit?.object.userData.id as string | undefined;
      if (id) onSelectRef.current(id);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    let animationId = 0;
    const animate = () => {
      frame += 1;
      group.rotation.y += 0.0025;
      group.rotation.x = Math.sin(frame / 220) * 0.08;
      nodeObjects.forEach((node, index) => {
        node.scale.setScalar(1 + Math.sin(frame / 28 + index) * 0.04);
      });
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      mount.removeChild(renderer.domElement);
      disposableTextures.forEach((texture) => texture.dispose());
      disposableGeometries.forEach((geometry) => geometry.dispose());
      disposableMaterials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, [activeId, pages]);

  const activePage = pages.find((page) => page.id === activeId);

  return (
    <div className="graph-wrap">
      <div className="graph-canvas" ref={mountRef} aria-label="Interactive 3D theory graph" />
      <div className="graph-readout">
        <span>Selected node</span>
        <strong>{activePage?.title ?? 'None'}</strong>
      </div>
    </div>
  );
}
