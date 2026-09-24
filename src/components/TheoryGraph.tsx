import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { GraphEdge, GraphNode } from '../data/knowledge';

type TheoryGraphProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeId: string;
  onSelect: (id: string) => void;
};

const kindColors: Record<GraphNode['kind'], number> = {
  concept: 0xf2b84b,
  module: 0x7dd3fc,
  publication: 0x5eead4,
  theorist: 0xf87171,
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

export function TheoryGraph({ nodes, edges, activeId, onSelect }: TheoryGraphProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);
  const [selectedNodeId, setSelectedNodeId] = useState(activeId);

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

    nodes.forEach((entry, index) => {
      const position = nodePosition(index, nodes.length);
      positions.set(entry.id, position);

      const geometry = new THREE.SphereGeometry(entry.id === activeId ? 0.18 : 0.13, 24, 16);
      const material = new THREE.MeshStandardMaterial({
        color: kindColors[entry.kind],
        emissive: kindColors[entry.kind],
        emissiveIntensity: entry.id === activeId ? 0.42 : 0.16,
        roughness: 0.48,
        metalness: 0.16,
      });
      disposableGeometries.push(geometry);
      disposableMaterials.push(material);

      const node = new THREE.Mesh(geometry, material);
      node.position.copy(position);
      node.userData = { id: entry.id, moduleId: entry.moduleId };
      group.add(node);
      nodeObjects.push(node);

      const label = createLabel(entry.label);
      if (label && (entry.id === activeId || entry.kind !== 'module')) {
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

    edges.forEach((edge) => addLine(edge.from, edge.to));

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
      const moduleId = hit?.object.userData.moduleId as string | undefined;
      if (id) setSelectedNodeId(id);
      if (moduleId) onSelectRef.current(moduleId);
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderer.render(scene, camera);
    } else {
      animate();
    }

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
  }, [activeId, edges, nodes]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.id === activeId);

  return (
    <div className="graph-wrap">
      <div className="graph-canvas" ref={mountRef} aria-hidden="true" />
      <div className="graph-readout">
        <span>Selected node</span>
        <strong>{selectedNode?.label ?? 'None'}</strong>
        {selectedNode ? <a href={selectedNode.sourceUrl} target="_blank" rel="noreferrer">Source</a> : null}
      </div>
    </div>
  );
}
