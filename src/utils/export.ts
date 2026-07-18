import { MindMap, MindMapNode } from '../types';

/**
 * Triggers a client-side file download.
 */
export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports mind map as an SVG file.
 */
export function exportToSVG(map: MindMap) {
  if (map.nodes.length === 0) return;

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  map.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  });

  // Adding generous padding
  const padding = 100;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding * 2;

  // Offset to center coordinates inside the SVG viewBox
  const dx = -minX + padding;
  const dy = -minY + padding;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  
  // Style defs
  svgContent += `  <style>
    .node-text { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; text-anchor: middle; dominant-baseline: middle; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
  </style>\n`;

  // Background
  svgContent += `  <rect width="100%" height="100%" fill="#fafafa"/>\n`;

  // Draw Connections (lines)
  map.nodes.forEach(node => {
    if (node.parentId === null) return;
    const parent = map.nodes.find(n => n.id === node.parentId);
    if (!parent) return;

    const px = parent.x + dx;
    const py = parent.y + dy;
    const cx = node.x + dx;
    const cy = node.y + dy;
    
    const strokeColor = node.lineColor || '#94a3b8';
    const strokeWidth = node.lineWidth || 2;
    const dashStyle = node.lineStyle === 'dashed' ? 'stroke-dasharray="6,6"' : node.lineStyle === 'dotted' ? 'stroke-dasharray="2,4"' : '';

    let pathD = '';
    if (map.lineType === 'straight') {
      pathD = `M ${px} ${py} L ${cx} ${cy}`;
    } else if (map.lineType === 'orthogonal') {
      const midX = px + (cx - px) / 2;
      pathD = `M ${px} ${py} H ${midX} V ${cy} H ${cx}`;
    } else { // curved
      const controlOffset = Math.min(Math.abs(cx - px) * 0.5, 120);
      const pControlX = px + (cx > px ? controlOffset : -controlOffset);
      const cControlX = cx - (cx > px ? controlOffset : -controlOffset);
      pathD = `M ${px} ${py} C ${pControlX} ${py}, ${cControlX} ${cy}, ${cx} ${cy}`;
    }

    svgContent += `  <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashStyle}/>\n`;
  });

  // Draw Nodes
  map.nodes.forEach(node => {
    const nx = node.x + dx;
    const ny = node.y + dy;
    const fontStyleClass = `${node.isBold ? 'bold' : ''} ${node.isItalic ? 'italic' : ''}`.trim();
    
    // Set typical box widths based on font size and text length
    const estCharWidth = node.fontSize * 0.6;
    const lines = node.text.split('\n');
    const longestLine = lines.reduce((max, l) => l.length > max.length ? l : max, '');
    const nodeW = Math.max(120, longestLine.length * estCharWidth + 30);
    const nodeH = Math.max(50, lines.length * node.fontSize * 1.3 + 24);

    if (node.shape === 'circle') {
      const radius = Math.max(50, nodeW / 2);
      svgContent += `  <circle cx="${nx}" cy="${ny}" r="${radius}" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2"/>\n`;
    } else if (node.shape === 'pill') {
      svgContent += `  <rect x="${nx - nodeW / 2}" y="${ny - nodeH / 2}" width="${nodeW}" height="${nodeH}" rx="${nodeH / 2}" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2"/>\n`;
    } else if (node.shape === 'rectangle') {
      svgContent += `  <rect x="${nx - nodeW / 2}" y="${ny - nodeH / 2}" width="${nodeW}" height="${nodeH}" rx="0" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2"/>\n`;
    } else if (node.shape === 'cloud') {
      svgContent += `  <rect x="${nx - nodeW / 2}" y="${ny - nodeH / 2}" width="${nodeW}" height="${nodeH}" rx="20" stroke-dasharray="4,4" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2"/>\n`;
    } else { // rounded (default)
      svgContent += `  <rect x="${nx - nodeW / 2}" y="${ny - nodeH / 2}" width="${nodeW}" height="${nodeH}" rx="12" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2"/>\n`;
    }

    // Render Text (line wrapped if split)
    const lineSpacing = node.fontSize * 1.3;
    const startY = ny - ((lines.length - 1) * lineSpacing) / 2;

    lines.forEach((line, index) => {
      svgContent += `  <text x="${nx}" y="${startY + index * lineSpacing}" fill="${node.textColor}" font-size="${node.fontSize}" class="node-text ${fontStyleClass}">${escapeXML(line)}</text>\n`;
    });
  });

  svgContent += '</svg>';
  
  const sanitizedFilename = map.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'mapa_mental';
  downloadFile(svgContent, `${sanitizedFilename}.svg`, 'image/svg+xml');
}

/**
 * Triggers an offscreen canvas rendering and downloads a high resolution PNG.
 */
export function exportToPNG(map: MindMap) {
  if (map.nodes.length === 0) return;

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  map.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  });

  const padding = 100;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding * 2;
  const dx = -minX + padding;
  const dy = -minY + padding;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, width, height);

  // Connection Lines
  map.nodes.forEach(node => {
    if (node.parentId === null) return;
    const parent = map.nodes.find(n => n.id === node.parentId);
    if (!parent) return;

    const px = parent.x + dx;
    const py = parent.y + dy;
    const cx = node.x + dx;
    const cy = node.y + dy;

    ctx.strokeStyle = node.lineColor || '#94a3b8';
    ctx.lineWidth = node.lineWidth || 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    
    // Set stroke dash
    if (node.lineStyle === 'dashed') {
      ctx.setLineDash([6, 6]);
    } else if (node.lineStyle === 'dotted') {
      ctx.setLineDash([2, 4]);
    } else {
      ctx.setLineDash([]);
    }

    if (map.lineType === 'straight') {
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy);
    } else if (map.lineType === 'orthogonal') {
      const midX = px + (cx - px) / 2;
      ctx.moveTo(px, py);
      ctx.lineTo(midX, py);
      ctx.lineTo(midX, cy);
      ctx.lineTo(cx, cy);
    } else { // curved
      const controlOffset = Math.min(Math.abs(cx - px) * 0.5, 120);
      const pControlX = px + (cx > px ? controlOffset : -controlOffset);
      const cControlX = cx - (cx > px ? controlOffset : -controlOffset);
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(pControlX, py, cControlX, cy, cx, cy);
    }
    ctx.stroke();
  });

  // Reset line dash
  ctx.setLineDash([]);

  // Draw Nodes
  map.nodes.forEach(node => {
    const nx = node.x + dx;
    const ny = node.y + dy;

    // Font settings
    const fontStyle = `${node.isItalic ? 'italic' : ''} ${node.isBold ? 'bold' : ''} ${node.fontSize}px Plus Jakarta Sans, system-ui, sans-serif`.trim();
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const estCharWidth = node.fontSize * 0.6;
    const lines = node.text.split('\n');
    const longestLine = lines.reduce((max, l) => l.length > max.length ? l : max, '');
    const nodeW = Math.max(120, longestLine.length * estCharWidth + 30);
    const nodeH = Math.max(50, lines.length * node.fontSize * 1.3 + 24);

    // Node Box Shape
    ctx.fillStyle = node.color;
    ctx.strokeStyle = node.borderColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    if (node.shape === 'circle') {
      const r = Math.max(50, nodeW / 2);
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
    } else if (node.shape === 'pill') {
      const radius = nodeH / 2;
      ctx.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, radius);
    } else if (node.shape === 'rectangle') {
      ctx.rect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH);
    } else if (node.shape === 'cloud') {
      // Draw wavy cloud-like rectangle
      const radius = 20;
      ctx.setLineDash([4, 4]);
      ctx.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, radius);
    } else { // rounded (default)
      const radius = 12;
      ctx.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, radius);
    }
    ctx.fill();
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);

    // Draw Texts
    ctx.fillStyle = node.textColor;
    const lineSpacing = node.fontSize * 1.3;
    const startY = ny - ((lines.length - 1) * lineSpacing) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, nx, startY + index * lineSpacing);
    });
  });

  // Download
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const sanitizedFilename = map.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'mapa_mental';
    link.href = dataUrl;
    link.download = `${sanitizedFilename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('PNG Export failed', err);
    alert('Erro ao exportar como imagem PNG. Use a exportação em SVG!');
  }
}

/**
 * Escapes strings for XML compatibility.
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
