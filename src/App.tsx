import React, { useState, useEffect, useRef } from 'react';
import { MindMap, MindMapNode, ViewportState } from './types';
import { createDefaultMindMap, COLORS } from './utils/defaultData';
import { autoLayoutMindMap } from './utils/layout';
import { exportToPNG, exportToSVG, downloadFile } from './utils/export';
import MindMapCanvas from './components/MindMapCanvas';
import NodeDetailsPanel from './components/NodeDetailsPanel';
import MapsSidebar from './components/MapsSidebar';
import { 
  Menu, 
  Download, 
  RotateCcw, 
  RotateCw, 
  GitCommit, 
  Info, 
  Maximize, 
  Plus, 
  Minus, 
  FileText, 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  Upload, 
  HelpCircle,
  FolderOpen
} from 'lucide-react';

export default function App() {
  // 1. Core States
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [activeMapId, setActiveMapId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  
  // 2. Modals & Panels UI States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isEditingTextModalOpen, setIsEditingTextModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeText, setEditingNodeText] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  // 3. Undo / Redo History State
  const [history, setHistory] = useState<Array<{ activeId: string; maps: MindMap[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Map helper
  const activeMap = maps.find(m => m.id === activeMapId) || maps[0];

  // Load maps from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem('mind_flow_maps');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MindMap[];
        if (parsed.length > 0) {
          setMaps(parsed);
          setActiveMapId(parsed[0].id);
          // Initialize history
          setHistory([{ activeId: parsed[0].id, maps: parsed }]);
          setHistoryIndex(0);
          return;
        }
      } catch (e) {
        console.error('Failed parsing saved mindmaps', e);
      }
    }

    // Default map if empty
    const defaultMap = createDefaultMindMap();
    const initialMapsList = [defaultMap];
    setMaps(initialMapsList);
    setActiveMapId(defaultMap.id);
    setHistory([{ activeId: defaultMap.id, maps: initialMapsList }]);
    setHistoryIndex(0);
  }, []);

  // Sync to localStorage
  const saveToStorage = (updatedMaps: MindMap[]) => {
    localStorage.setItem('mind_flow_maps', JSON.stringify(updatedMaps));
  };

  // Record historical snapshots for undo/redo
  const recordHistory = (newMapsList: MindMap[], activeId = activeMapId) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ activeId, maps: newMapsList });
    
    // Cap history length at 50 to conserve memory
    if (nextHistory.length > 50) {
      nextHistory.shift();
    }
    
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Perform Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const snapshot = history[prevIdx];
      setHistoryIndex(prevIdx);
      setMaps(snapshot.maps);
      setActiveMapId(snapshot.activeId);
      setSelectedNodeId(null);
      saveToStorage(snapshot.maps);
    }
  };

  // Perform Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const snapshot = history[nextIdx];
      setHistoryIndex(nextIdx);
      setMaps(snapshot.maps);
      setActiveMapId(snapshot.activeId);
      setSelectedNodeId(null);
      saveToStorage(snapshot.maps);
    }
  };

  // Update complete maps state
  const updateMapsState = (updater: (prev: MindMap[]) => MindMap[], recordSnapshot = true) => {
    setMaps(prev => {
      const updated = updater(prev);
      saveToStorage(updated);
      if (recordSnapshot) {
        recordHistory(updated);
      }
      return updated;
    });
  };

  // 4. Core Handlers

  // Switch between maps
  const handleSelectMap = (mapId: string) => {
    setActiveMapId(mapId);
    setSelectedNodeId(null);
    setIsRightPanelOpen(false);
    
    // Reset viewport to center
    const map = maps.find(m => m.id === mapId);
    if (map && map.nodes.length > 0) {
      centerOnRootNode(map.nodes);
    }
  };

  // Center viewport on the root node
  const centerOnRootNode = (nodeList = activeMap?.nodes) => {
    const root = nodeList.find(n => n.parentId === null) || nodeList[0];
    const container = document.getElementById('mindmap-main-canvas');
    if (root && container) {
      const rect = container.getBoundingClientRect();
      setViewport({
        x: rect.width / 2 - root.x * viewport.zoom,
        y: rect.height / 2 - root.y * viewport.zoom,
        zoom: 1,
      });
    }
  };

  // Create a new empty mind map
  const handleCreateNewMap = (name = 'Novo Mapa Mental') => {
    const id = `map-${Date.now()}`;
    const newMap: MindMap = {
      id,
      name,
      nodes: [
        {
          id: `node-${Date.now()}-root`,
          text: 'Tópico Central 🧠',
          x: 0,
          y: 0,
          parentId: null,
          color: '#8B5CF6',
          textColor: '#FFFFFF',
          borderColor: '#7C3AED',
          shape: 'pill',
          fontSize: 18,
          isBold: true,
          isItalic: false,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      themeColor: '#8B5CF6',
      gridType: 'dots',
      lineType: 'curved'
    };

    updateMapsState(prev => [newMap, ...prev]);
    setActiveMapId(id);
    setSelectedNodeId(null);
    setIsRightPanelOpen(false);
    
    // Center viewport on the new root node immediately
    setTimeout(() => {
      centerOnRootNode(newMap.nodes);
    }, 100);
  };

  // Duplicate map
  const handleDuplicateMap = (mapId: string) => {
    const target = maps.find(m => m.id === mapId);
    if (!target) return;

    const newId = `map-copy-${Date.now()}`;
    const duplicate: MindMap = {
      ...target,
      id: newId,
      name: `${target.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: target.nodes.map(node => ({ ...node })),
    };

    updateMapsState(prev => [duplicate, ...prev]);
    setActiveMapId(newId);
    setSelectedNodeId(null);
  };

  // Delete map
  const handleDeleteMap = (mapId: string) => {
    if (maps.length <= 1) return;
    
    const remaining = maps.filter(m => m.id !== mapId);
    updateMapsState(() => remaining);
    
    if (activeMapId === mapId) {
      setActiveMapId(remaining[0].id);
      setSelectedNodeId(null);
      setIsRightPanelOpen(false);
    }
  };

  // Rename current active map
  const handleRenameActiveMap = (newName: string) => {
    if (!newName.trim()) return;
    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? { ...m, name: newName, updatedAt: new Date().toISOString() } : m),
      false // don't record minor title edits as independent history steps
    );
  };

  // Node editing & updating
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? {
        ...m,
        updatedAt: new Date().toISOString(),
        nodes: m.nodes.map(n => n.id === nodeId ? { ...n, x: Math.round(x), y: Math.round(y) } : n)
      } : m),
      false // we'll capture history snapshots on drag start/end to avoid cluttering undo list
    );
  };

  const handleUpdateNodeProperties = (nodeId: string, updatedProps: Partial<MindMapNode>) => {
    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? {
        ...m,
        updatedAt: new Date().toISOString(),
        nodes: m.nodes.map(n => n.id === nodeId ? { ...n, ...updatedProps } : n)
      } : m)
    );
  };

  // Recursive Helper to collect all descendants of a node to delete them
  const getDescendantIds = (nodeId: string, nodeList: MindMapNode[]): string[] => {
    const children = nodeList.filter(n => n.parentId === nodeId);
    const childIds = children.map(c => c.id);
    let allIds = [...childIds];
    childIds.forEach(id => {
      allIds = [...allIds, ...getDescendantIds(id, nodeList)];
    });
    return allIds;
  };

  // Add child node
  const handleAddChildNode = (parentId: string) => {
    const parentNode = activeMap?.nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    // Offset child node position
    const offsetDistanceX = 180;
    const offsetDistanceY = (Math.random() - 0.5) * 100;
    
    // Decide side (left or right of parent or screen based on hierarchy)
    const direction = parentNode.x >= 0 ? 1 : -1;
    const childX = parentNode.x + (offsetDistanceX * direction);
    const childY = parentNode.y + offsetDistanceY;

    // Generate nice child color automatically based on parent color or default presets
    const parentColorKey = Object.keys(COLORS).find(
      k => COLORS[k as keyof typeof COLORS].bg === parentNode.color
    );
    let childBg = '#EFF6FF';
    let childText = '#1E40AF';
    let childBorder = '#DBEAFE';

    if (parentColorKey) {
      // Pick a pastel light version of the same color family
      const lightKey = `${parentColorKey}Light` as keyof typeof COLORS;
      if (COLORS[lightKey]) {
        childBg = COLORS[lightKey].bg;
        childText = COLORS[lightKey].text;
        childBorder = COLORS[lightKey].border;
      }
    }

    const newChild: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'Novo Tópico',
      x: Math.round(childX),
      y: Math.round(childY),
      parentId,
      color: childBg,
      textColor: childText,
      borderColor: childBorder,
      shape: 'rounded',
      fontSize: 13,
      isBold: false,
      isItalic: false,
      lineColor: parentNode.color,
      lineWidth: 2,
    };

    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? {
        ...m,
        updatedAt: new Date().toISOString(),
        nodes: [...m.nodes, newChild]
      } : m)
    );

    // Select the new child and trigger text editing right away
    setSelectedNodeId(newChild.id);
    handleStartEditingText(newChild.id);
  };

  // Delete node and its branches
  const handleDeleteNode = (nodeId: string) => {
    if (!activeMap) return;
    const nodeToDelete = activeMap.nodes.find(n => n.id === nodeId);
    if (!nodeToDelete || nodeToDelete.parentId === null) return; // cannot delete root node

    const descendants = getDescendantIds(nodeId, activeMap.nodes);
    const idsToRemove = [nodeId, ...descendants];

    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? {
        ...m,
        updatedAt: new Date().toISOString(),
        nodes: m.nodes.filter(n => !idsToRemove.includes(n.id))
      } : m)
    );

    if (selectedNodeId && idsToRemove.includes(selectedNodeId)) {
      setSelectedNodeId(null);
      setIsRightPanelOpen(false);
    }
  };

  // Start double-click rename flow
  const handleStartEditingText = (nodeId: string) => {
    const node = activeMap?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setEditingNodeId(nodeId);
    setEditingNodeText(node.text);
    setIsEditingTextModalOpen(true);
  };

  const handleSaveNodeText = () => {
    if (editingNodeId && editingNodeText.trim()) {
      handleUpdateNodeProperties(editingNodeId, { text: editingNodeText });
    }
    setIsEditingTextModalOpen(false);
    setEditingNodeId(null);
  };

  // Quick prepending of emojis inside renaming modal
  const handleAddEmojiToEditingText = (emoji: string) => {
    setEditingNodeText(prev => `${emoji} ${prev}`);
  };

  // Organizes current mind map
  const handleAutoLayout = () => {
    if (!activeMap) return;
    const organizedNodes = autoLayoutMindMap(activeMap.nodes);
    
    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? {
        ...m,
        updatedAt: new Date().toISOString(),
        nodes: organizedNodes
      } : m)
    );

    // Re-center on root node
    setTimeout(() => {
      centerOnRootNode(organizedNodes);
    }, 120);
  };

  // Import JSON Map
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);
        
        // Validate keys briefly
        if (parsed && typeof parsed === 'object' && parsed.name && Array.isArray(parsed.nodes)) {
          const importedMap: MindMap = {
            id: `map-imported-${Date.now()}`,
            name: parsed.name,
            nodes: parsed.nodes,
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            themeColor: parsed.themeColor || '#8B5CF6',
            gridType: parsed.gridType || 'dots',
            lineType: parsed.lineType || 'curved'
          };

          updateMapsState(prev => [importedMap, ...prev]);
          setActiveMapId(importedMap.id);
          setSelectedNodeId(null);
          alert('Mapa Mental importado com sucesso!');
        } else {
          alert('Erro: Arquivo JSON de mapa mental inválido.');
        }
      } catch (err) {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    // clear input
    e.target.value = '';
  };

  // Trigger JSON download
  const handleExportJSON = () => {
    if (!activeMap) return;
    const content = JSON.stringify(activeMap, null, 2);
    const sanitizedFilename = activeMap.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'mapa_mental';
    downloadFile(content, `${sanitizedFilename}.json`, 'application/json');
    setIsExportDropdownOpen(false);
  };

  // Theme Line toggler
  const handleToggleLineType = (type: MindMap['lineType']) => {
    updateMapsState(prev => 
      prev.map(m => m.id === activeMapId ? { ...m, lineType: type } : m)
    );
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 relative antialiased">
      
      {/* 1. SIDEBAR: LIBRARY MANAGER (Left drawer) */}
      {isLeftSidebarOpen && (
        <div className="absolute inset-0 z-[100] md:relative md:inset-auto md:w-80 md:h-full shrink-0 animate-fade-in flex">
          {/* Backdrop on Mobile */}
          <div 
            className="absolute inset-0 bg-black/50 md:hidden" 
            onClick={() => setIsLeftSidebarOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm h-full md:w-full md:max-w-none">
            <MapsSidebar
              maps={maps}
              activeMapId={activeMapId}
              onSelectMap={handleSelectMap}
              onCreateNewMap={handleCreateNewMap}
              onDuplicateMap={handleDuplicateMap}
              onDeleteMap={handleDeleteMap}
              onClose={() => setIsLeftSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER TOOLBAR (Top bar - mimicking an Android layout) */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 shadow-sm z-30">
          
          {/* Left menu and title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsLeftSidebarOpen(true)}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer relative"
              title="Meus Mapas"
            >
              <Menu size={20} />
              {!isLeftSidebarOpen && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse md:hidden" />
              )}
            </button>

            {/* Editable Map Title input */}
            <div className="min-w-0">
              <input
                type="text"
                value={activeMap?.name || ''}
                onChange={(e) => handleRenameActiveMap(e.target.value)}
                className="font-bold text-slate-800 text-sm md:text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 rounded transition-all max-w-[200px] md:max-w-[400px] truncate"
                placeholder="Nome do Mapa Mental"
                title="Clique para renomear este mapa"
              />
              <span className="hidden md:block text-[10px] text-slate-400 font-medium px-1 mt-0.5">
                Salvo no Navegador
              </span>
            </div>
          </div>

          {/* Center-Right Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                historyIndex > 0 ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Desfazer (Undo)"
            >
              <RotateCcw size={18} />
            </button>

            {/* Redo */}
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                historyIndex < history.length - 1 ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Refazer (Redo)"
            >
              <RotateCw size={18} />
            </button>

            {/* Auto-Layout organizes the map beautifully */}
            <button
              onClick={handleAutoLayout}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Organizar layout automaticamente"
            >
              <GitCommit size={14} />
              <span className="hidden md:inline">Organizar</span>
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Download size={14} />
                <span>Exportar</span>
              </button>

              {isExportDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-scale-up">
                    <button
                      onClick={() => {
                        exportToPNG(activeMap);
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Baixar como Imagem PNG
                    </button>
                    <button
                      onClick={() => {
                        exportToSVG(activeMap);
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Baixar como Vetor SVG
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Salvar Backup (.JSON)
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-2"
                    >
                      <Upload size={12} />
                      Importar Backup
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hidden file input for import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />

            {/* Help Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Ajuda"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* CANVAS EDITOR AREA */}
        <main className="flex-1 w-full relative overflow-hidden">
          
          {/* The interactive Mind Map canvas */}
          {activeMap && (
            <MindMapCanvas
              nodes={activeMap.nodes}
              selectedNodeId={selectedNodeId}
              viewport={viewport}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                setIsRightPanelOpen(nodeId !== null);
              }}
              onUpdateNodePosition={handleUpdateNodePosition}
              onAddChildNode={handleAddChildNode}
              onDeleteNode={handleDeleteNode}
              onStartEditing={handleStartEditingText}
              setViewport={setViewport}
              lineType={activeMap.lineType}
            />
          )}

          {/* CANVAS FLOATING OVERLAY UI CONTROLS */}
          <div className="absolute left-4 bottom-4 flex flex-col gap-2 z-20 pointer-events-auto">
            {/* Connection Line Style Toggler */}
            <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Linhas:</span>
              {(['curved', 'straight', 'orthogonal'] as const).map((style) => (
                <button
                  key={`line-style-${style}`}
                  onClick={() => handleToggleLineType(style)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeMap?.lineType === style
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {style === 'curved' ? 'Curva' : style === 'straight' ? 'Reta' : 'Grade'}
                </button>
              ))}
            </div>

            {/* Quick Map Creator indicator if library empty (fallback check) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => centerOnRootNode()}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 p-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
                title="Centralizar no Tópico Principal"
              >
                <Maximize size={16} />
              </button>

              <div className="bg-white border border-slate-200 text-slate-700 rounded-xl shadow-md flex items-center divide-x divide-slate-100">
                <button
                  onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.4, v.zoom / 1.1) }))}
                  className="p-2.5 hover:bg-slate-50 rounded-l-xl cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <Minus size={16} />
                </button>
                <span className="px-2.5 text-[10px] font-bold font-mono text-slate-500 w-12 text-center">
                  {Math.round(viewport.zoom * 100)}%
                </span>
                <button
                  onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2.5, v.zoom * 1.1) }))}
                  className="p-2.5 hover:bg-slate-50 rounded-r-xl cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active node property Quick Editor drawer overlay (on select) */}
          {!selectedNodeId && (
            <div className="absolute right-4 bottom-4 pointer-events-auto z-10 animate-fade-in hidden md:flex items-center gap-2 bg-slate-900 text-slate-100 px-4 py-3 rounded-2xl shadow-xl border border-slate-800">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <p className="text-xs font-semibold">
                Dica: Toque duas vezes em um balão para editar seu texto!
              </p>
            </div>
          )}
        </main>
      </div>

      {/* 3. SIDEBAR: CUSTOMIZER PROPERTIES (Right drawer or panel) */}
      {isRightPanelOpen && selectedNodeId && activeMap && (
        <div className="fixed inset-x-0 bottom-0 h-2/3 md:h-full md:relative md:inset-auto md:w-80 shrink-0 z-50 flex animate-slide-up md:animate-fade-in">
          {/* Mobile backdrop wrapper */}
          <div 
            className="fixed inset-0 bg-black/40 md:hidden z-40" 
            onClick={() => {
              setIsRightPanelOpen(false);
              setSelectedNodeId(null);
            }}
          />
          <div className="relative w-full h-full bg-white z-50">
            {activeMap.nodes.find(n => n.id === selectedNodeId) && (
              <NodeDetailsPanel
                node={activeMap.nodes.find(n => n.id === selectedNodeId)!}
                onUpdateNode={(updatedProps) => handleUpdateNodeProperties(selectedNodeId, updatedProps)}
                onClose={() => {
                  setIsRightPanelOpen(false);
                  setSelectedNodeId(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: DOUBLE-CLICK / QUICK RENAME TEXT EDITOR */}
      {isEditingTextModalOpen && editingNodeId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={() => setIsEditingTextModalOpen(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 border border-slate-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Editar Texto do Balão
              </h3>
              <button 
                onClick={() => setIsEditingTextModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <textarea
                value={editingNodeText}
                onChange={(e) => setEditingNodeText(e.target.value)}
                className="w-full h-24 p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 bg-slate-50 text-sm resize-none"
                placeholder="Insira o conteúdo do balão..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveNodeText();
                  }
                }}
              />

              {/* Emoji Helper Palette */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Adicionar Ícone Rápido
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['💡', '🚀', '📊', '💻', '🎯', '🎨', '📢', '✉️', '👥', '🌈', '⚛️', '📝', '🌟', '❤️', '🔥'].map((emoji) => (
                    <button
                      key={`emoji-${emoji}`}
                      onClick={() => handleAddEmojiToEditingText(emoji)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-indigo-50 hover:scale-110 rounded-xl text-lg transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setIsEditingTextModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNodeText}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
              >
                <Check size={14} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DIALOG: COMO USAR (HELP GUIDE) */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={() => setIsHelpOpen(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 border border-slate-200 animate-scale-up">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                Como usar o Mind Flow 🧠
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5 text-indigo-600">
                  Navegando na Tela
                </h4>
                <p>
                  Arrastar o fundo da tela move todo o mapa mental (pan). Use o botão de scroll do mouse ou os botões de <kbd className="bg-slate-100 border px-1 rounded text-xs font-mono font-bold font-sans">+</kbd> e <kbd className="bg-slate-100 border px-1 rounded text-xs font-mono font-bold font-sans">-</kbd> para controlar o Zoom.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5 text-indigo-600">
                  Criação e Edição
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Toque em um balão para selecioná-lo.</li>
                  <li>Use o menu flutuante abaixo do balão ou o botão de <strong>+</strong> para criar um sub-nó.</li>
                  <li>Toque duas vezes em qualquer balão para alterar seu texto e escolher emojis.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5 text-indigo-600">
                  Customização Completa
                </h4>
                <p>
                  Ao selecionar um balão, use a barra lateral direita para alterar o formato, estilo do texto, <strong>qualquer cor personalizada que quiser</strong> (através do seletor de cores completo) e personalizar as linhas de conexões de cada ramo.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5 text-indigo-600">
                  Exportar e Salvar
                </h4>
                <p>
                  Suas criações são salvas de forma automática no próprio navegador. Use o botão <strong>Exportar</strong> no topo para baixar seu mapa como Imagem de alta qualidade (PNG), Vetor editável de resolução infinita (SVG) ou arquivo de backup (JSON).
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
