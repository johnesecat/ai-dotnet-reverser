// src/visualization/control-flow-graph.tsx

import React, { useEffect, useRef } from 'react';

interface CFGNode {
  id: number;
  label: string;
  instructions: string[];
}

interface CFGEdge {
  from: number;
  to: number;
  label?: string;
}

interface ControlFlowGraphProps {
  nodes: CFGNode[];
  edges: CFGEdge[];
}

export function ControlFlowGraph({ nodes, edges }: ControlFlowGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate layout
    const layout = calculateLayout(nodes, edges);

    // Draw edges
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    edges.forEach(edge => {
      const from = layout.get(edge.from);
      const to = layout.get(edge.to);
      if (from && to) {
        drawArrow(ctx, from.x + 60, from.y + 30, to.x + 60, to.y);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = layout.get(node.id);
      if (pos) {
        drawNode(ctx, pos.x, pos.y, node);
      }
    });
  }, [nodes, edges]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}

function calculateLayout(nodes: CFGNode[], edges: CFGEdge[]): Map<number, { x: number; y: number }> {
  const layout = new Map<number, { x: number; y: number }>();
  
  // Simple vertical layout
  let y = 50;
  nodes.forEach((node, index) => {
    layout.set(node.id, { x: 50, y });
    y += 100;
  });

  return layout;
}

function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, node: CFGNode) {
  // Draw box
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(x, y, 120, 60);

  // Draw label
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Block ${node.id}`, x + 60, y + 20);

  // Draw instruction count
  ctx.font = '10px monospace';
  ctx.fillText(`${node.instructions.length} instrs`, x + 60, y + 40);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowSize = 10;

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowSize * Math.cos(angle - Math.PI / 6),
    y2 - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - arrowSize * Math.cos(angle + Math.PI / 6),
    y2 - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
}