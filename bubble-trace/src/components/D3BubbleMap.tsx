'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ParentRequirement, ChildRequirement, TestRun } from '@/types';

interface D3BubbleMapProps {
  parentRequirements: ParentRequirement[];
  childRequirements: ChildRequirement[];
  testRuns: TestRun[];
  filters: {
    parentFilter: string;
    statusFilter: string;
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
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  
  const [bubbleDetails, setBubbleDetails] = useState<BubbleDetails>({ 
    node: {} as D3Node, 
    x: 0, 
    y: 0, 
    visible: false 
  });

  const clearSelection = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const container = svg.select<SVGGElement>('.container');
    
    container.selectAll('.node-group').select('circle')
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 2)
      .style('filter', 'url(#te-shadow)');
  }, []);

  const width = 800;
  const height = 600;

  const processData = useCallback(() => {
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

    // Calculate positions with tests in simple vertical line
    const parentSpacing = Math.max(120, height / (filteredParents.length + 1));
    const childSpacing = Math.max(80, height / (filteredChildren.length + 1));
    const testSpacing = Math.max(50, height / (filteredTests.length + 1));

    // Position parent nodes in left column
    let childIndex = 0;
    let testIndex = 0;
    
    parentChildTestGroups.forEach((group, groupIndex) => {
      const parentY = (groupIndex + 1) * parentSpacing;
      
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

      // Position child nodes in center column - simple vertical sequence
      group.children.forEach((childGroup) => {
        const childY = (childIndex + 1) * childSpacing;
        
        nodes.push({
          id: `child-${childGroup.child.id}`,
          type: 'child',
          name: childGroup.child.name,
          radius: 30,
          color: teColors.accent2,
          data: childGroup.child,
          group: 2,
          x: width * 0.45,
          y: childY
        });
        
        childIndex++;

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
            x: width * 0.78,
            y: testY
          });
          
          testIndex++;
        });
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


  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 2) + '...';
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
        
        // Update text size based on zoom level
        container.selectAll('text')
          .attr('font-size', function() {
            const d = d3.select(this).datum() as D3Node;
            return Math.max(6, (d.radius * 0.32) / Math.sqrt(event.transform.k));
          });
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svg as any).call(zoom);

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
        .radius(d => (d as D3Node).radius + 8)
        .strength(0.6))
      .force('x', d3.forceX<D3Node>().x(d => {
        // Strong force to keep nodes in their designated columns
        if (d.type === 'parent') return width * 0.12;
        if (d.type === 'child') return width * 0.45;
        return width * 0.78; // tests
      }).strength(0.9))
      .force('y', d3.forceY<D3Node>().y(d => {
        // Maintain the calculated horizontal alignment
        return d.y!;
      }).strength(0.7));

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

    // Add flat circles - TE style: no gradients, flat colors
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 2)
      .style('filter', 'url(#te-shadow)');

    // Add clean text - TE style typography with zoom-responsive sizing
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'ui-monospace, "Menlo", "Monaco", "Cascadia Code", monospace')
      .attr('font-weight', '500')
      .attr('font-size', d => Math.max(9, d.radius * 0.32))
      .attr('fill', '#1A1A1A')
      .style('pointer-events', 'none')
      .style('letter-spacing', '0.02em')
      .text(d => truncateText(d.name.toUpperCase(), Math.max(4, Math.floor(d.radius / 4))));

    // Add minimal hover effects - TE style
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('stroke-width', 3)
        .attr('r', d.radius * 1.05);
      
      d3.select(this).select('text')
        .transition()
        .duration(150)
        .attr('font-weight', '600');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('stroke-width', 2)
        .attr('r', d.radius);
      
      d3.select(this).select('text')
        .transition()
        .duration(150)
        .attr('font-weight', '500');
    });

    // Add click handling
    node.on('click', function(event, d) {
      event.stopPropagation();
      
      // Remove previous selection styling
      container.selectAll('.node-group').select('circle')
        .attr('stroke', '#1A1A1A')
        .attr('stroke-width', 2)
        .style('filter', 'url(#te-shadow)');
      
      // Add selection styling to clicked node
      d3.select(this).select('circle')
        .attr('stroke', '#FFE066')
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
    <div className="relative w-full h-full bg-gray-50 rounded-none border-2 border-gray-900 overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full bg-white"
        style={{ minHeight: '600px' }}
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