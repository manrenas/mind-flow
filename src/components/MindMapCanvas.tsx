import React, { useRef, useState, useEffect } from 'react';
import { MindMapNode, ViewportState } from '../types';
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
  onOpenStylePanel: (nodeId: string) => void;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  lineType: 'curved' | 'straight' | 'orthogonal';
}

const DRAG_THRESHOLD_PX = 5;

type ActivePointer =
  | {
      kind: 'pan';
      pointerId: number;
      startX: number;
      startY: number;
      viewportX: number;
      viewportY: number;
    }
  | {
      kind: 'node';
      pointerId: number;
      nodeId: string;
      startX: number;
      startY: number;
      nodeStartX: number;
      nodeStartY: number;
      dragging: boolean;
    };

export default function MindMapCanvas({
  nodes,
  selectedNodeId,
  viewport,
  onSelectNode,
  onUpdateNodePosition,
  onAddChildNode,
  onDeleteNode,
  onStartEditing,
  onOpenStylePanel,
  setViewport,
  lineType,
}: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);
  const pointerRef = useRef<ActivePointer | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const current = viewportRef.current;
    let nextZoom = current.zoom;

    if (e.deltaY < 0) {
      nextZoom = Math.min(2.5, current.zoom * zoomFactor);
    } else {
      nextZoom = Math.max(0.4, current.zoom / zoomFactor);
    }

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setViewport(prev => {
      const dx = mouseX - prev.x;
      const dy = mouseY - prev.y;
      return {
        zoom: nextZoom,
        x: mouseX - dx * (nextZoom / prev.zoom),
        y: mouseY - dy * (nextZoom / prev.zoom),
      };
    });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.mind-map-node') || target.closest('button') || target.closest('.node-action-menu')) {
      return;
    }

    // Deselect when tapping empty canvas
    onSelectNode(null);

    pointerRef.current = {
      kind: 'pan',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      viewportX: viewportRef.current.x,
      viewportY: viewportRef.current.y,
    };
    setIsPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: MindMapNode) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.node-action-menu')) {
      return;
    }

    e.stopPropagation();
    onSelectNode(node.id);

    pointerRef.current = {
      kind: 'node',
      pointerId: e.pointerId,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
      dragging: false,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const active = pointerRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    if (active.kind === 'pan') {
      const dx = e.clientX - active.startX;
      const dy = e.clientY - active.startY;
      setViewport(prev => ({
        ...prev,
        x: active.viewportX + dx,
        y: active.viewportY + dy,
      }));
      return;
    }

    const dxScreen = e.clientX - active.startX;
    const dyScreen = e.clientY - active.startY;
    const distance = Math.hypot(dxScreen, dyScreen);

    if (!active.dragging && distance < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!active.dragging) {
      active.dragging = true;
      setIsDraggingNode(true);
    }

    const zoom = viewportRef.current.zoom || 1;
    onUpdateNodePosition(
      active.nodeId,
      active.nodeStartX + dxScreen / zoom,
      active.nodeStartY + dyScreen / zoom
    );
  };

  const endPointer = (e: React.PointerEvent) => {
    const active = pointerRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    pointerRef.current = null;
    setIsPanning(false);
    setIsDraggingNode(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Pointer may already be released
    }
  };

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

    const controlOffset = Math.min(Math.abs(cx - px) * 0.5, 120);
    const pControlX = px + (cx > px ? controlOffset : -controlOffset);
    const cControlX = cx - (cx > px ? controlOffset : -controlOffset);

    return `M ${px} ${py} C ${pControlX} ${py}, ${cControlX} ${cy}, ${cx} ${cy}`;
  };

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

  const stopMenuPointer = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none bg-[#fafafa] grid-bg-dots ${
        isPanning || isDraggingNode ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={handleWheel}
      id="mindmap-main-canvas"
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: 0,
          height: 0,
          left: 0,
          top: 0,
        }}
      >
        <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
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
              />
            );
          })}
        </svg>

        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          const isRoot = node.parentId === null;

          return (
            <div
              key={node.id}
              className="absolute mind-map-node select-none"
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 50 : 10,
              }}
            >
              <div
                onPointerDown={e => handleNodePointerDown(e, node)}
                onDoubleClick={e => {
                  e.stopPropagation();
                  onStartEditing(node.id);
                }}
                className={`
                  ${getNodeShapeClass(node.shape)}
                  shadow-md border-2 text-center select-none cursor-pointer flex flex-col justify-center items-center relative
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
              </div>

              {/* Menu is a sibling of the drag target so it never inherits pointer capture */}
              {isSelected && (
                <div
                  className="node-action-menu absolute left-1/2 top-full mt-3 -translate-x-1/2 flex items-center bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1.5 gap-1.5 z-50"
                  onPointerDown={stopMenuPointer}
                  onPointerUp={stopMenuPointer}
                >
                  <button
                    type="button"
                    onPointerDown={stopMenuPointer}
                    onClick={e => {
                      e.stopPropagation();
                      onAddChildNode(node.id);
                    }}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors"
                    title="Adicionar Sub-nó"
                    aria-label="Adicionar Sub-nó"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={stopMenuPointer}
                    onClick={e => {
                      e.stopPropagation();
                      onStartEditing(node.id);
                    }}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-full transition-colors"
                    title="Editar Texto"
                    aria-label="Editar Texto"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={stopMenuPointer}
                    onClick={e => {
                      e.stopPropagation();
                      onOpenStylePanel(node.id);
                    }}
                    className="p-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-full transition-colors"
                    title="Estilo do Balão"
                    aria-label="Estilo do Balão"
                  >
                    <Palette size={16} />
                  </button>
                  {!isRoot && (
                    <button
                      type="button"
                      onPointerDown={stopMenuPointer}
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors"
                      title="Excluir Nó"
                      aria-label="Excluir Nó"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
