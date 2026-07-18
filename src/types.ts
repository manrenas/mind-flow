export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  
  // Custom Styles
  color: string;           // Background color
  textColor: string;       // Text color
  borderColor: string;     // Border color
  shape: 'rounded' | 'circle' | 'rectangle' | 'pill' | 'cloud';
  fontSize: number;        // Font size in px
  isBold: boolean;
  isItalic: boolean;
  
  // Connector custom styles (to parent)
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  createdAt: string;
  updatedAt: string;
  
  // Map-wide preferences
  themeColor: string;      // Accent theme color
  gridType: 'dots' | 'grid' | 'none';
  lineType: 'curved' | 'straight' | 'orthogonal';
}

export interface DraggingState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

export interface ViewportState {
  x: number;      // pan x
  y: number;      // pan y
  zoom: number;   // zoom scale (e.g. 0.5 to 2)
}
