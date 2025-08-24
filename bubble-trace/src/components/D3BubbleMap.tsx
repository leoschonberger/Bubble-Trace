'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ParentRequirement, ChildRequirement, TestRun } from '@/types';

interface D3BubbleMapProps {
  parentRequirements: ParentRequirement[];
  childRequirements: ChildRequirement[];
  testRuns: TestRun[];
  filters: {
    parentFilter: number[];
    childFilter: number[];
    statusFilter: string[];
  };
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'parent' | 'child' | 'test';
  name: string;
  radius: number;
  color: string;
  data: ParentRequirement | ChildRequirement | TestRun;
  group: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  color: string;
}

interface BubbleDetails {
  node: D3Node;
  x: number;
  y: number;
  visible: boolean;
}

export default function D3BubbleMap({ 
  parentRequirements, 
  childRequirements, 
  testRuns, 
  filters 
}: D3BubbleMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [bubbleDetails, setBubbleDetails] = useState<BubbleDetails>({ 
    node: {} as D3Node, 
    x: 0, 
    y: 0, 
    visible: false 
  });

  const clearSelection = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const container = svg.select<SVGGElement>('.container');
    
    container.selectAll<SVGGElement, D3Node>('.node-group').each(function(d) {
      const nodeGroup = d3.select(this);
      const shape = d.type === 'test' ? nodeGroup.select('rect') : nodeGroup.select('circle');
      shape.attr('stroke', '#1A1A1A')
        .attr('stroke-width', 2)
        .style('filter', 'url(#te-shadow)');
    });
  }, []);

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width),
          height: Math.max(600, rect.height)
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const { width, height } = dimensions;

  const processData = useCallback(() => {
    // Filter data based on multi-select filters
    const filteredParents = parentRequirements.filter(p => 
      filters.parentFilter.length === 0 || filters.parentFilter.includes(p.id)
    );

    const filteredChildren = childRequirements.filter(c => 
      (filters.childFilter.length === 0 || filters.childFilter.includes(c.id)) &&
      filteredParents.some(p => p.id === c.parent_requirement_id)
    );

    const filteredTests = testRuns.filter(t => 
      (filters.statusFilter.length === 0 || filters.statusFilter.includes(t.status)) &&
      filteredChildren.some(c => c.id === t.child_requirement_id)
    );

    // Create nodes
    const nodes: D3Node[] = [];
    
    // Teenage Engineering color palette
    const teColors = {
      base: '#F5F5F5',      // Off-white base
      dark: '#1A1A1A',      // Deep black
      accent1: '#FF6B35',   // Orange
      accent2: '#00D4AA',   // Teal
      accent3: '#FFE066',   // Yellow
      accent4: '#FF4757',   // Red
      accent5: '#7C4DFF',   // Purple
      gray: '#8E8E93'       // Light gray
    };

    // Create a hierarchical structure to minimize line crossings
    const parentChildTestGroups: Array<{
      parent: ParentRequirement;
      children: Array<{
        child: ChildRequirement;
        tests: TestRun[];
      }>;
    }> = [];

    // Build the hierarchical structure
    filteredParents.forEach(parent => {
      const children = filteredChildren
        .filter(c => c.parent_requirement_id === parent.id)
        .map(child => ({
          child,
          tests: filteredTests.filter(t => t.child_requirement_id === child.id)
        }));
      
      parentChildTestGroups.push({ parent, children });
    });

    // Calculate positions with tests in simple vertical line with proper spacing
    const testRadius = 18;
    const minTestGap = 10; // Minimum gap between test nodes
    const testSpacing = Math.max(
      (testRadius * 2) + minTestGap, // Minimum spacing to avoid overlap
      height / (filteredTests.length + 1) // Even distribution across height
    );
    const childSpacing = Math.max(80, height / (filteredChildren.length + 1));

    // Position parent nodes based on their test distribution
    let childIndex = 0;
    let testIndex = 0;
    
    parentChildTestGroups.forEach((group, groupIndex) => {
      // Calculate parent Y position based on the center of its test cases
      const groupTestCount = group.children.reduce((sum, child) => sum + child.tests.length, 0);
      const firstTestIndex = testIndex;
      const lastTestIndex = testIndex + groupTestCount - 1;
      const parentY = groupTestCount > 0 ? 
        ((firstTestIndex + lastTestIndex + 2) / 2) * testSpacing :
        (groupIndex + 1) * (height / (filteredParents.length + 1));

      // Position child nodes in center column - centered with their test cases
      group.children.forEach((childGroup) => {
        // Calculate child Y position based on the center of its test cases
        const childTestCount = childGroup.tests.length;
        const firstChildTestIndex = testIndex;
        const lastChildTestIndex = testIndex + childTestCount - 1;
        const childY = childTestCount > 0 ? 
          ((firstChildTestIndex + lastChildTestIndex + 2) / 2) * testSpacing :
          (childIndex + 1) * childSpacing;

        // Position test nodes in right column - simple vertical sequence
        childGroup.tests.forEach((test) => {
          const color = test.status === 'passed' ? teColors.accent2 : 
                       test.status === 'failed' ? teColors.accent4 : 
                       teColors.accent3;
          
          const testY = (testIndex + 1) * testSpacing;
          
          nodes.push({
            id: `test-${test.id}`,
            type: 'test',
            name: test.name,
            radius: 18,
            color,
            data: test,
            group: 3,
            x: width * 0.85, // Move further right for more spacing
            y: testY,
            fx: width * 0.85, // Fix X position - won't move
            fy: testY         // Fix Y position - won't move
          });
          
          testIndex++;
        });

        // Add child node after calculating test positions
        nodes.push({
          id: `child-${childGroup.child.id}`,
          type: 'child',
          name: childGroup.child.name,
          radius: 30,
          color: teColors.accent5,
          data: childGroup.child,
          group: 2,
          x: width * 0.45,
          y: childY
        });
        
        childIndex++;
      });

      // Add parent node after calculating test positions
      nodes.push({
        id: `parent-${group.parent.id}`,
        type: 'parent',
        name: group.parent.name,
        radius: 45,
        color: teColors.accent1,
        data: group.parent,
        group: 1,
        x: width * 0.12,
        y: parentY
      });
    });

    // Create links
    const links: D3Link[] = [];
    
    // Parent to child links
    filteredChildren.forEach(child => {
      links.push({
        source: `parent-${child.parent_requirement_id}`,
        target: `child-${child.id}`,
        color: teColors.gray
      });
    });

    // Child to test links
    filteredTests.forEach(test => {
      links.push({
        source: `child-${test.child_requirement_id}`,
        target: `test-${test.id}`,
        color: teColors.gray
      });
    });

    return { nodes, links };
  }, [parentRequirements, childRequirements, testRuns, filters]);


  const getTextContent = (name: string, radius: number, zoomLevel: number = 1): string => {
    // Return full name in uppercase without truncation
    return name.toUpperCase();
  };

  const calculateRectSize = (text: string, baseFontSize: number) => {
    // Calculate optimal rectangle size for text
    const padding = 16; // Horizontal and vertical padding
    const charWidth = baseFontSize * 0.6; // Approximate character width for monospace
    const lineHeight = baseFontSize * 1.2;
    
    const textWidth = text.length * charWidth;
    const width = textWidth + padding;
    const height = lineHeight + (padding * 0.75); // Less vertical padding
    
    return { width, height };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = svg.select<SVGGElement>('.container');
    
    if (container.empty()) {
      // Initialize SVG structure
      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', '100%')
         .attr('height', '100%');

      // Add definitions for TE-style effects
      const defs = svg.append('defs');
      
      // Minimal shadow for depth
      const filter = defs.append('filter')
        .attr('id', 'te-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      
      filter.append('feDropShadow')
        .attr('dx', 0)
        .attr('dy', 1)
        .attr('stdDeviation', 1)
        .attr('flood-color', '#00000020');

      svg.append('g').attr('class', 'container');
    }

    const { nodes, links } = processData();

    // Create zoom behavior with text scaling
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        
        // Update text size based on zoom level (text content stays the same - full names)
        container.selectAll('text')
          .attr('font-size', function() {
            const d = d3.select(this).datum() as D3Node;
            const zoomAdjustedRadius = d.radius / Math.sqrt(event.transform.k);
            const baseSize = Math.max(6, zoomAdjustedRadius * 0.32);
            
            if (d.type === 'test') {
              // Test rectangles are sized to fit, so just scale with zoom
              return baseSize;
            } else {
              // For circles, still need to fit text within the circle
              const textLength = d.name.length;
              const availableWidth = zoomAdjustedRadius * 1.6;
              const charWidth = baseSize * 0.6;
              const maxCharsPerLine = Math.floor(availableWidth / charWidth);
              
              if (textLength > maxCharsPerLine) {
                const widthScale = maxCharsPerLine / textLength;
                return Math.max(5, baseSize * widthScale);
              }
              return baseSize;
            }
          });
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svg as any).call(zoom);

    // Set initial viewport to show entire graph centered and zoomed out
    if (nodes.length > 0) {
      // Calculate actual bounds of all nodes including their radii
      const xExtent = d3.extent(nodes, d => d.x!) as [number, number];
      const yExtent = d3.extent(nodes, d => d.y!) as [number, number];
      
      // Add padding around the graph (more generous padding)
      const padding = 150;
      const graphWidth = (xExtent[1] - xExtent[0]) + (2 * padding);
      const graphHeight = (yExtent[1] - yExtent[0]) + (2 * padding);
      
      // Calculate scale to fit entire graph with margin (more zoom out)
      const scaleX = width / graphWidth;
      const scaleY = height / graphHeight;
      const initialScale = Math.min(scaleX, scaleY, 0.6); // Cap at 0.6 for more zoom out
      
      // Calculate centering translation - ensure graph bounds fit in viewport
      const scaledGraphWidth = graphWidth * initialScale;
      const scaledGraphHeight = graphHeight * initialScale;
      
      const graphLeft = xExtent[0] - padding;
      const graphTop = yExtent[0] - padding;
      
      const translateX = (width - scaledGraphWidth) / 2 - (graphLeft * initialScale);
      const translateY = (height - scaledGraphHeight) / 2 - (graphTop * initialScale);
      
      const initialTransform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(initialScale);
        
      if (svgRef.current) {
        d3.select(svgRef.current).call(zoom.transform, initialTransform);
      }
    }

    // Initialize simulation with minimal forces to maintain horizontal layout
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(d => {
          const sourceRadius = (d.source as D3Node).radius;
          const targetRadius = (d.target as D3Node).radius;
          return sourceRadius + targetRadius + 60;
        })
        .strength(0.1))
      .force('collision', d3.forceCollide<D3Node>()
        .radius(d => (d as D3Node).radius + (d.type === 'test' ? 0 : 8))
        .strength(0.1))
      .force('x', d3.forceX<D3Node>().x(d => {
        // Very strong force to keep test nodes in exact single file line
        if (d.type === 'parent') return width * 0.12;
        if (d.type === 'child') return width * 0.45;
        return width * 0.85; // tests - must be exact
      }).strength(d => d.type === 'test' ? 0.99 : 0.9))
      .force('y', d3.forceY<D3Node>().y(d => {
        // Very strong force for tests to maintain vertical line, weaker for others
        return d.y!;
      }).strength(d => d.type === 'test' ? 0.98 : 0.7));

    simulationRef.current = simulation;

    // Clear previous elements
    container.selectAll('*').remove();

    // Create links - TE style: thin, clean lines
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Create node groups
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('.node-group')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    // Add shapes - circles for parent/child, rectangles for tests
    node.each(function(d) {
      const nodeGroup = d3.select(this);
      
      if (d.type === 'test') {
        // Rectangle for test nodes - dynamically sized to fit text
        const baseFontSize = Math.max(9, d.radius * 0.32);
        const rectSize = calculateRectSize(d.name.toUpperCase(), baseFontSize);
        
        nodeGroup.append('rect')
          .attr('width', rectSize.width)
          .attr('height', rectSize.height)
          .attr('x', 0) // Left align the rectangle
          .attr('y', -rectSize.height / 2)
          .attr('rx', 4) // Rounded corners
          .attr('ry', 4)
          .attr('fill', d.color)
          .attr('stroke', '#1A1A1A')
          .attr('stroke-width', 2)
          .style('filter', 'url(#te-shadow)');
      } else {
        // Circle for parent/child nodes
        nodeGroup.append('circle')
          .attr('r', d.radius)
          .attr('fill', d.color)
          .attr('stroke', '#1A1A1A')
          .attr('stroke-width', 2)
          .style('filter', 'url(#te-shadow)');
      }
    });

    // Add clean text - TE style typography with zoom-responsive sizing
    node.append('text')
      .attr('text-anchor', d => d.type === 'test' ? 'start' : 'middle') // Left align for rectangles
      .attr('dominant-baseline', 'middle')
      .attr('x', d => {
        if (d.type === 'test') {
          // Position text with padding from left edge of rectangle
          return 8; // 8px padding from left edge
        }
        return 0; // Centered for circles
      })
      .attr('font-family', 'ui-monospace, "Menlo", "Monaco", "Cascadia Code", monospace')
      .attr('font-weight', '500')
      .attr('font-size', d => {
        const baseSize = Math.max(9, d.radius * 0.32);
        
        if (d.type === 'test') {
          // Test rectangles are sized to fit text, so use consistent font size
          return baseSize;
        } else {
          // For circles, still need to fit text within the circle
          const textLength = d.name.length;
          const availableWidth = d.radius * 1.6; // Diameter minus padding
          const charWidth = baseSize * 0.6; // Approximate character width
          const maxCharsPerLine = Math.floor(availableWidth / charWidth);
          
          if (textLength > maxCharsPerLine) {
            const widthScale = maxCharsPerLine / textLength;
            return Math.max(7, baseSize * widthScale);
          }
          return baseSize;
        }
      })
      .attr('fill', '#1A1A1A')
      .style('pointer-events', 'none')
      .style('letter-spacing', '0.02em')
      .text(d => getTextContent(d.name, d.radius));

    // Add minimal hover effects - TE style
    node.on('mouseenter', function(event, d) {
      if (d.type === 'test') {
        d3.select(this).select('rect')
          .transition()
          .duration(150)
          .attr('stroke-width', 3);
      } else {
        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('stroke-width', 3)
          .attr('r', d.radius * 1.05);
      }
      
      d3.select(this).select('text')
        .transition()
        .duration(150)
        .attr('font-weight', '600');
    })
    .on('mouseleave', function(event, d) {
      if (d.type === 'test') {
        d3.select(this).select('rect')
          .transition()
          .duration(150)
          .attr('stroke-width', 2);
      } else {
        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('stroke-width', 2)
          .attr('r', d.radius);
      }
      
      d3.select(this).select('text')
        .transition()
        .duration(150)
        .attr('font-weight', '500');
    });

    // Add click handling
    node.on('click', function(event, d) {
      event.stopPropagation();
      
      // Remove previous selection styling
      container.selectAll<SVGGElement, D3Node>('.node-group').each(function(nodeData) {
        const nodeGroup = d3.select(this);
        const shape = nodeData.type === 'test' ? nodeGroup.select('rect') : nodeGroup.select('circle');
        shape.attr('stroke', '#1A1A1A')
          .attr('stroke-width', 2)
          .style('filter', 'url(#te-shadow)');
      });
      
      // Add selection styling to clicked node
      const shape = d.type === 'test' ? 
        d3.select(this).select('rect') : 
        d3.select(this).select('circle');
      shape.attr('stroke', '#FFE066')
        .attr('stroke-width', 4)
        .style('filter', 'url(#te-shadow) brightness(1.1)');
      
      // Center on clicked node with smooth transition
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1.5)
        .translate(-d.x!, -d.y!);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svg.transition() as any)
        .duration(750)
        .call(zoom.transform, transform);

      // Show details popup
      setBubbleDetails({
        node: d,
        x: event.pageX || 400,
        y: event.pageY || 300,
        visible: true
      });
    });

    // Click elsewhere to close popup and clear selection
    svg.on('click', () => {
      clearSelection();
      setBubbleDetails(prev => ({ ...prev, visible: false }));
    });

    // Add drag behavior
    const drag = d3.drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [processData, width, height, clearSelection]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-50 rounded-none border-2 border-gray-900 overflow-hidden"
    >
      <svg
        ref={svgRef}
        className="w-full h-full bg-white"
        width={width}
        height={height}
      />
      
      {/* TE-Style Details Panel */}
      {bubbleDetails.visible && (
        <div 
          className="fixed bg-white border-2 border-gray-900 shadow-lg p-4 max-w-xs z-50 pointer-events-none font-mono"
          style={{
            left: Math.min(bubbleDetails.x + 15, window.innerWidth - 280),
            top: Math.max(bubbleDetails.y - 50, 10)
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 border border-gray-900 ${
                bubbleDetails.node.type === 'parent' ? 'bg-orange-500' :
                bubbleDetails.node.type === 'child' ? 'bg-teal-400' :
                'bg-yellow-400'
              }`} />
              <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                {bubbleDetails.node.type === 'parent' ? '🎯 REQ' : 
                 bubbleDetails.node.type === 'child' ? '📋 SUB' : '🧪 TEST'}
              </span>
            </div>
            <button 
              onClick={() => {
                clearSelection();
                setBubbleDetails(prev => ({ ...prev, visible: false }));
              }}
              className="text-gray-600 hover:text-gray-900 text-lg font-bold w-6 h-6 flex items-center justify-center border border-gray-300 hover:border-gray-900 transition-all"
              style={{ pointerEvents: 'auto' }}
            >
              ×
            </button>
          </div>
          
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wide">
            {bubbleDetails.node.name}
          </h3>
          
          <div className="space-y-2 text-xs">
            {bubbleDetails.node.data?.description && (
              <div>
                <div className="text-gray-600 uppercase font-medium mb-1">DESC</div>
                <div className="text-gray-900">{bubbleDetails.node.data.description}</div>
              </div>
            )}
            {bubbleDetails.node.type === 'test' && (bubbleDetails.node.data as TestRun)?.status && (
              <div>
                <div className="text-gray-600 uppercase font-medium mb-1">STATUS</div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 border ${
                  (bubbleDetails.node.data as TestRun).status === 'passed' ? 'border-teal-400 bg-teal-400 text-gray-900' :
                  (bubbleDetails.node.data as TestRun).status === 'failed' ? 'border-red-500 bg-red-500 text-white' :
                  'border-yellow-400 bg-yellow-400 text-gray-900'
                }`}>
                  {(bubbleDetails.node.data as TestRun).status === 'passed' ? '✓' :
                   (bubbleDetails.node.data as TestRun).status === 'failed' ? '✗' : '●'}
                  <span className="text-xs font-bold uppercase">
                    {(bubbleDetails.node.data as TestRun).status}
                  </span>
                </div>
              </div>
            )}
            {bubbleDetails.node.data?.created_at && (
              <div>
                <div className="text-gray-600 uppercase font-medium mb-1">⏰ DATE</div>
                <div className="text-gray-900 font-medium">
                  {new Date(bubbleDetails.node.data.created_at).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* TE-Style Control Panel */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-gray-900 p-3 text-xs font-mono shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-orange-500 border border-gray-900" />
          <div className="font-bold text-gray-900 uppercase tracking-wider">CTRL</div>
        </div>
        <div className="space-y-1 text-gray-700">
          <div>⚲ <span className="font-medium uppercase">SCROLL</span> → ZOOM</div>
          <div>✋ <span className="font-medium uppercase">DRAG</span> → PAN</div>
          <div>👆 <span className="font-medium uppercase">CLICK</span> → INFO</div>
          <div>🔄 <span className="font-medium uppercase">DRAG BUBBLE</span> → MOVE</div>
        </div>
      </div>
    </div>
  );
}