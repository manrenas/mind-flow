import { MindMapNode } from '../types';

/**
 * Organizes mind map nodes into a beautiful, balanced horizontal tree layout.
 * The root node is placed in the center, main children are split to the left and right,
 * and deeper sub-children extend outwards vertically.
 */
export function autoLayoutMindMap(nodes: MindMapNode[]): MindMapNode[] {
  if (nodes.length === 0) return [];

  // Find the root node (node with no parent, or first node)
  const rootNode = nodes.find(n => n.parentId === null) || nodes[0];
  const rootId = rootNode.id;

  const newNodes = [...nodes];
  
  // Helper to build a tree structure
  const adjList: Record<string, string[]> = {};
  nodes.forEach(n => {
    if (n.parentId) {
      if (!adjList[n.parentId]) adjList[n.parentId] = [];
      adjList[n.parentId].push(n.id);
    }
  });

  // Center the root
  const rootIdx = newNodes.findIndex(n => n.id === rootId);
  if (rootIdx !== -1) {
    newNodes[rootIdx] = { ...newNodes[rootIdx], x: 0, y: 0 };
  }

  const rootChildren = adjList[rootId] || [];
  if (rootChildren.length === 0) return newNodes;

  // Split root children into right and left sides
  const half = Math.ceil(rootChildren.length / 2);
  const rightChildren = rootChildren.slice(0, half);
  const leftChildren = rootChildren.slice(half);

  // Vertical spacing config
  const verticalSpacing = 120;
  const horizontalSpacing = 220;

  // Function to layout a subtree extending in a specific direction (1 for right, -1 for left)
  function layoutSubtree(
    nodeId: string, 
    direction: 1 | -1, 
    currentX: number, 
    startY: number
  ): { totalHeight: number; nodePositions: Record<string, { x: number; y: number }> } {
    const children = adjList[nodeId] || [];
    const positions: Record<string, { x: number; y: number }> = {};
    
    if (children.length === 0) {
      // Leaf node
      positions[nodeId] = { x: currentX, y: startY };
      return { totalHeight: verticalSpacing, nodePositions: positions };
    }

    let subtreeHeight = 0;
    const childrenPositions: Record<string, { x: number; y: number }> = {};
    
    // First, layout all children recursively
    let currentY = startY;
    children.forEach(childId => {
      const result = layoutSubtree(
        childId, 
        direction, 
        currentX + (horizontalSpacing * direction), 
        currentY
      );
      
      // Merge child positions
      Object.assign(childrenPositions, result.nodePositions);
      currentY += result.totalHeight;
      subtreeHeight += result.totalHeight;
    });

    // Place the parent in the vertical center of its children
    const averageY = startY + (subtreeHeight - verticalSpacing) / 2;
    positions[nodeId] = { x: currentX, y: averageY };

    // Update recursively calculated children positions relative to parent vertical center adjustment
    // (Optional, but simple offset vertical centering is fine)
    Object.assign(positions, childrenPositions);

    return { totalHeight: Math.max(subtreeHeight, verticalSpacing), nodePositions: positions };
  }

  // Layout right side
  let rightY = -((rightChildren.length - 1) * verticalSpacing) / 2;
  const rightPositions: Record<string, { x: number; y: number }> = {};
  rightChildren.forEach(childId => {
    const result = layoutSubtree(childId, 1, horizontalSpacing, rightY);
    Object.assign(rightPositions, result.nodePositions);
    rightY += result.totalHeight;
  });

  // Layout left side
  let leftY = -((leftChildren.length - 1) * verticalSpacing) / 2;
  const leftPositions: Record<string, { x: number; y: number }> = {};
  leftChildren.forEach(childId => {
    const result = layoutSubtree(childId, -1, -horizontalSpacing, leftY);
    Object.assign(leftPositions, result.nodePositions);
    leftY += result.totalHeight;
  });

  // Combine and update positions in newNodes
  const allPositions = { ...rightPositions, ...leftPositions };
  
  return newNodes.map(node => {
    if (node.id === rootId) {
      return { ...node, x: 0, y: 0 };
    }
    const pos = allPositions[node.id];
    if (pos) {
      return { ...node, x: pos.x, y: pos.y };
    }
    return node;
  });
}
