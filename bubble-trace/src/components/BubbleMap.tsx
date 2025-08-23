'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BubbleNode, TraceLine, ParentRequirement, ChildRequirement, TestRun } from '@/types';

interface BubbleMapProps {
  parentRequirements: ParentRequirement[];
  childRequirements: ChildRequirement[];
  testRuns: TestRun[];
  filters: {
    parentFilter: string;
    statusFilter: string;
  };
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface BubbleDetails {
  node: BubbleNode;
  x: number;
  y: number;
  visible: boolean;
}

export default function BubbleMap({ 
  parentRequirements, 
  childRequirements, 
  testRuns, 
  filters 
}: BubbleMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [lines, setLines] = useState<TraceLine[]>([]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [bubbleDetails, setBubbleDetails] = useState<BubbleDetails>({ 
    node: {} as BubbleNode, 
    x: 0, 
    y: 0, 
    visible: false 
  });

  const canvasWidth = 800;
  const canvasHeight = 600;

  const generateBubbles = useCallback(() => {
    const newNodes: BubbleNode[] = [];
    const newLines: TraceLine[] = [];

    // Filter data based on filters
    const filteredParents = parentRequirements.filter(p => 
      !filters.parentFilter || p.name.toLowerCase().includes(filters.parentFilter.toLowerCase())
    );

    const filteredChildren = childRequirements.filter(c => 
      filteredParents.some(p => p.id === c.parent_requirement_id)
    );

    const filteredTests = testRuns.filter(t => 
      (!filters.statusFilter || t.status === filters.statusFilter) &&
      filteredChildren.some(c => c.id === t.child_requirement_id)
    );

    // Create parent requirement bubbles with physics properties
    filteredParents.forEach((parent, index) => {
      newNodes.push({
        id: `parent-${parent.id}`,
        type: 'parent',
        name: parent.name,
        x: 200 + (index * 300) % (canvasWidth - 400),
        y: 150 + Math.floor(index / 2) * 200,
        radius: 40,
        color: '#3b82f6',
        data: parent,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        targetX: 200 + (index * 300) % (canvasWidth - 400),
        targetY: 150 + Math.floor(index / 2) * 200
      } as BubbleNode & { vx: number; vy: number; targetX: number; targetY: number });
    });

    // Create child requirement bubbles
    filteredChildren.forEach((child, index) => {
      const parentNode = newNodes.find(n => n.id === `parent-${child.parent_requirement_id}`);
      if (parentNode) {
        const angle = (index % 6) * (Math.PI * 2 / 6);
        const distance = 120 + Math.random() * 40;
        const targetX = parentNode.x + Math.cos(angle) * distance;
        const targetY = parentNode.y + Math.sin(angle) * distance;
        
        newNodes.push({
          id: `child-${child.id}`,
          type: 'child',
          name: child.name,
          x: targetX,
          y: targetY,
          radius: 25,
          color: '#10b981',
          data: child,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          targetX,
          targetY,
          parentId: parentNode.id
        } as BubbleNode & { vx: number; vy: number; targetX: number; targetY: number; parentId: string });

        // Add trace line from parent to child
        newLines.push({
          from: `parent-${child.parent_requirement_id}`,
          to: `child-${child.id}`,
          color: '#6b7280'
        });
      }
    });

    // Create test run bubbles
    filteredTests.forEach((test, index) => {
      const childNode = newNodes.find(n => n.id === `child-${test.child_requirement_id}`);
      if (childNode) {
        const angle = (index % 5) * (Math.PI * 2 / 5);
        const distance = 70 + Math.random() * 30;
        const targetX = childNode.x + Math.cos(angle) * distance;
        const targetY = childNode.y + Math.sin(angle) * distance;
        
        const color = test.status === 'passed' ? '#22c55e' : 
                     test.status === 'failed' ? '#ef4444' : '#f59e0b';

        newNodes.push({
          id: `test-${test.id}`,
          type: 'test',
          name: test.name,
          x: targetX,
          y: targetY,
          radius: 15,
          color,
          data: test,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          targetX,
          targetY,
          parentId: childNode.id
        } as BubbleNode & { vx: number; vy: number; targetX: number; targetY: number; parentId: string });

        // Add trace line from child to test
        newLines.push({
          from: `child-${test.child_requirement_id}`,
          to: `test-${test.id}`,
          color: '#9ca3af'
        });
      }
    });

    setNodes(newNodes);
    setLines(newLines);
  }, [parentRequirements, childRequirements, testRuns, filters]);

  const updatePhysics = useCallback((_deltaTime: number) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        const n = node as BubbleNode & { vx: number; vy: number; targetX: number; targetY: number };
        
        // Apply gentle floating motion
        const floatX = Math.sin(Date.now() * 0.001 + parseInt(n.id.slice(-1)) * 0.5) * 0.3;
        const floatY = Math.cos(Date.now() * 0.0008 + parseInt(n.id.slice(-1)) * 0.7) * 0.2;
        
        // Spring force towards target position
        const springForce = 0.02;
        const dampening = 0.95;
        
        const targetX = n.targetX + floatX;
        const targetY = n.targetY + floatY;
        
        n.vx += (targetX - n.x) * springForce;
        n.vy += (targetY - n.y) * springForce;
        
        n.vx *= dampening;
        n.vy *= dampening;
        
        // Apply velocity
        n.x += n.vx;
        n.y += n.vy;
        
        return n;
      })
    );
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - camera.x) / camera.zoom,
      y: (screenY - rect.top - camera.y) / camera.zoom
    };
  }, [camera]);

  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX * camera.zoom + camera.x,
      y: worldY * camera.zoom + camera.y
    };
  }, [camera]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, camera.zoom * zoomFactor));
    
    // Zoom towards mouse position
    setCamera(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
      zoom: newZoom
    }));
  }, [camera]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    // Check if clicking on a bubble
    const clickedNode = nodes.find(node => {
      const dx = worldPos.x - node.x;
      const dy = worldPos.y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });
    
    if (clickedNode) {
      // Center camera on clicked bubble
      setCamera(prev => ({
        ...prev,
        x: canvasWidth / 2 - clickedNode.x * prev.zoom,
        y: canvasHeight / 2 - clickedNode.y * prev.zoom
      }));
      
      // Show bubble details
      const screenPos = worldToScreen(clickedNode.x, clickedNode.y);
      setBubbleDetails({
        node: clickedNode,
        x: screenPos.x,
        y: screenPos.y,
        visible: true
      });
    } else {
      // Start panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      setBubbleDetails(prev => ({ ...prev, visible: false }));
    }
  }, [nodes, screenToWorld, worldToScreen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      
      setCamera(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply camera transform
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw trace lines
    lines.forEach(line => {
      const fromNode = nodes.find(n => n.id === line.from);
      const toNode = nodes.find(n => n.id === line.to);
      
      if (fromNode && toNode) {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    });

    // Draw bubbles
    nodes.forEach(node => {
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(8, node.radius / 3)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate long names
      const maxLength = Math.max(6, node.radius / 2);
      const displayName = node.name.length > maxLength ? 
        node.name.substring(0, maxLength) + '...' : node.name;
      
      ctx.fillText(displayName, node.x, node.y);
    });

    ctx.restore();
  }, [nodes, lines, camera]);

  const animate = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    if (deltaTime < 100) { // Avoid large delta times
      updatePhysics(deltaTime);
    }
    
    drawCanvas();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updatePhysics, drawCanvas]);

  useEffect(() => {
    generateBubbles();
  }, [generateBubbles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-full border rounded-lg cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      {/* Bubble Details Popup */}
      {bubbleDetails.visible && (
        <div 
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-10 pointer-events-none"
          style={{
            left: Math.min(bubbleDetails.x + 10, canvasWidth - 250),
            top: Math.max(bubbleDetails.y - 50, 10)
          }}
        >
          <h3 className="font-bold text-lg mb-2 text-gray-800">
            {bubbleDetails.node.name}
          </h3>
          <div className="space-y-1 text-sm">
            <p><strong>Type:</strong> {bubbleDetails.node.type === 'parent' ? 'Parent Requirement' : 
                                      bubbleDetails.node.type === 'child' ? 'Child Requirement' : 'Test Run'}</p>
            {bubbleDetails.node.data?.description && (
              <p><strong>Description:</strong> {bubbleDetails.node.data.description}</p>
            )}
            {bubbleDetails.node.type === 'test' && (bubbleDetails.node.data as TestRun)?.status && (
              <p><strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  (bubbleDetails.node.data as TestRun).status === 'passed' ? 'bg-green-100 text-green-800' :
                  (bubbleDetails.node.data as TestRun).status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(bubbleDetails.node.data as TestRun).status}
                </span>
              </p>
            )}
            {bubbleDetails.node.data?.created_at && (
              <p><strong>Created:</strong> {new Date(bubbleDetails.node.data.created_at).toLocaleDateString()}</p>
            )}
          </div>
          
          <button 
            onClick={() => setBubbleDetails(prev => ({ ...prev, visible: false }))}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            style={{ pointerEvents: 'auto' }}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs text-gray-600">
        <div><strong>Controls:</strong></div>
        <div>• Scroll to zoom</div>
        <div>• Click & drag to pan</div>
        <div>• Click bubble for details</div>
      </div>
    </div>
  );
}