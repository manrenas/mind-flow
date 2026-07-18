import React, { useRef, useState, useEffect } from 'react';
import { MindMapNode, ViewportState, DraggingState } from '../types';
import { Plus, Trash, Edit3, Palette } from 'lucide-react';

interface MindMapCanvasProps {
  nodes: MindMapNode[];
  selectedNodeId: string | null;
  viewport: ViewportState;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onAddChildNode: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onStartEditing: (nodeId: string) => void;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  lineType: 'curved' | 'straight' | 'orthogonal';
}

export default function MindMapCanvas({
  nodes,
  selectedNodeId,
  viewport,
  onSelectNode,
  onUpdateNodePosition,
  onAddChildNode,
  onDeleteNode,
  onStartEditing,
  setViewport,
  lineType,
}: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, viewportX: 0, viewportY: 0 });
  const [draggingNode, setDraggingNode] = useState<DraggingState | null>(null);

  // Find selected node
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Center canvas on first load
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setViewport(prev => ({
        ...prev,
        x: rect.width / 2,
        y: rect.height / 2,
      }));
    }
  }, [setViewport]);

  // Handle zooming with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let nextZoom = viewport.zoom;
    
    if (e.deltaY < 0) {
      nextZoom = Math.min(2.5, viewport.zoom * zoomFactor);
    } else {
      nextZoom = Math.max(0.4, viewport.zoom / zoomFactor);
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust panning so that the point under the mouse cursor remains static while zooming
      setViewport(prev => {
        const dx = mouseX - prev.x;
        const dy = mouseY - prev.y;
        return {
          zoom: nextZoom,
          x: mouseX - dx * (nextZoom / prev.zoom),
          y: mouseY - dy * (nextZoom / prev.zoom),
        };
      });
    }
  };

  // Canvas Panning Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // If clicking directly on a node or custom control button, don't pan the canvas
    const target = e.target as HTMLElement;
    if (target.closest('.mind-map-node') || target.closest('button')) {
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
    };
    
    // Set pointer capture to track drag outside container
    target.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (draggingNode) {
      e.stopPropagation();
      // Calculate delta of movement in scaled space
      const dx = (e.clientX - draggingNode.startX) / viewport.zoom;
      const dy = (e.clientY - draggingNode.startY) / viewport.zoom;
      
      onUpdateNodePosition(
        draggingNode.nodeId,
        draggingNode.nodeStartX + dx,
        draggingNode.nodeStartY + dy
      );
      return;
    }

    if (!isPanning) return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;

    setViewport(prev => ({
      ...prev,
      x: panStartRef.current.viewportX + dx,
      y: panStartRef.current.viewportY + dy,
    }));
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      const target = e.target as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe check for browser release capture support
      }
    }
    
    if (draggingNode) {
      setDraggingNode(null);
    }
  };

  // Node Dragging Handlers
  const handleNodePointerDown = (e: React.PointerEvent, node: MindMapNode) => {
    e.stopPropagation();
    onSelectNode(node.id);

    setDraggingNode({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    });

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const handleNodePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (draggingNode) {
      setDraggingNode(null);
    }
    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safe check
    }
  };

  // Generate SVG Path for connections
  const getConnectorPath = (parent: MindMapNode, child: MindMapNode) => {
    const px = parent.x;
    const py = parent.y;
    const cx = child.x;
    const cy = child.y;

    if (lineType === 'straight') {
      return `M ${px} ${py} L ${cx} ${cy}`;
    }

    if (lineType === 'orthogonal') {
      const midX = px + (cx - px) / 2;
      return `M ${px} ${py} H ${midX} V ${cy} H ${cx}`;
    }

    // Default: 'curved' (beautiful cubic bezier)
    const controlOffset = Math.min(Math.abs(cx - px) * 0.5, 120);
    const pControlX = px + (cx > px ? controlOffset : -controlOffset);
    const cControlX = cx - (cx > px ? controlOffset : -controlOffset);
    
    return `M ${px} ${py} C ${pControlX} ${py}, ${cControlX} ${cy}, ${cx} ${cy}`;
  };

  // Node Shape CSS Selector
  const getNodeShapeClass = (shape: string) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full aspect-square w-24 h-24 flex items-center justify-center';
      case 'pill':
        return 'rounded-full px-6 py-3 min-w-[120px]';
      case 'rectangle':
        return 'rounded-none px-5 py-3 min-w-[120px]';
      case 'cloud':
        return 'rounded-3xl border-dashed border-3 px-6 py-4 min-w-[130px]';
      case 'rounded':
      default:
        return 'rounded-2xl px-5 py-3 min-w-[120px]';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none bg-[#fafafa] grid-bg-dots cursor-grab active:cursor-grabbing"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onWheel={handleWheel}
      id="mindmap-main-canvas"
    >
      {/* Infinite scale & translate layer */}
      <div
        className="absolute origin-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: 0,
          height: 0,
          left: 0,
          top: 0,
        }}
      >
        {/* SVG connection lines layer */}
        <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
            </marker>
          </defs>
          {nodes.map(node => {
            if (node.parentId === null) return null;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return null;

            return (
              <path
                key={`line-${node.id}`}
                d={getConnectorPath(parent, node)}
                fill="none"
                stroke={node.lineColor || '#94a3b8'}
                strokeWidth={node.lineWidth || 2}
                strokeDasharray={
                  node.lineStyle === 'dashed'
                    ? '6,6'
                    : node.lineStyle === 'dotted'
                    ? '2,4'
                    : 'none'
                }
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* HTML nodes layer */}
        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          const isRoot = node.parentId === null;

          return (
            <div
              key={node.id}
              className="absolute mind-map-node select-none group"
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 50 : 10,
              }}
            >
              {/* Node Card */}
              <div
                onPointerDown={e => handleNodePointerDown(e, node)}
                onPointerUp={handleNodePointerUp}
                onDoubleClick={() => onStartEditing(node.id)}
                className={`
                  ${getNodeShapeClass(node.shape)}
                  shadow-md transition-all duration-200 border-2 text-center select-none cursor-pointer flex flex-col justify-center items-center relative
                  ${isSelected ? 'scale-105 selected-node-pulse border-blue-500' : 'hover:shadow-lg'}
                `}
                style={{
                  backgroundColor: node.color,
                  color: node.textColor,
                  borderColor: isSelected ? '#3B82F6' : node.borderColor,
                  fontSize: `${node.fontSize}px`,
                  fontWeight: node.isBold ? '700' : '400',
                  fontStyle: node.isItalic ? 'italic' : 'normal',
                }}
                id={`node-${node.id}`}
              >
                <span className="break-words max-w-[200px] pointer-events-none line-clamp-3">
                  {node.text}
                </span>

                {/* Micro Actions Menu (Hover on PC, Tap-Active when Selected) */}
                {isSelected && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1.5 gap-1.5 pointer-events-auto z-50 animate-bounce-short">
                    <button
                      onClick={() => onAddChildNode(node.id)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors"
                      title="Adicionar Sub-nó"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => onStartEditing(node.id)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-full transition-colors"
                      title="Editar Texto"
                    >
                      <Edit3 size={16} />
                    </button>
                    {!isRoot && (
                      <button
                        onClick={() => onDeleteNode(node.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors"
                        title="Excluir Nó"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
