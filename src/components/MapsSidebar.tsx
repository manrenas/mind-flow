import React, { useState } from 'react';
import { MindMap } from '../types';
import { Plus, Search, Map, Trash, Copy, Calendar, Folder, ArrowRight } from 'lucide-react';

interface MapsSidebarProps {
  maps: MindMap[];
  activeMapId: string;
  onSelectMap: (mapId: string) => void;
  onCreateNewMap: (name?: string) => void;
  onDuplicateMap: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
  onClose: () => void;
}

export default function MapsSidebar({
  maps,
  activeMapId,
  onSelectMap,
  onCreateNewMap,
  onDuplicateMap,
  onDeleteMap,
  onClose,
}: MapsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter maps based on search query
  const filteredMaps = maps.filter(map =>
    map.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 shadow-2xl border-r border-slate-800">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Folder size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">Mind Flow</h2>
            <span className="text-xs text-slate-400">Gerenciador de Mapas</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Action: Create Map Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onCreateNewMap();
            onClose();
          }}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Criar Novo Mapa
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 mb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar mapas mentais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Maps List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredMaps.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nenhum mapa encontrado
          </div>
        ) : (
          filteredMaps.map(map => {
            const isActive = map.id === activeMapId;
            return (
              <div
                key={map.id}
                className={`
                  group rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-slate-800 border border-indigo-500 text-white' 
                    : 'hover:bg-slate-800/40 text-slate-300 hover:text-slate-100 border border-transparent'
                  }
                `}
                onClick={() => {
                  onSelectMap(map.id);
                  onClose();
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Map size={18} className={`mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm leading-tight truncate">
                      {map.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/30">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar size={10} />
                    <span>{formatDate(map.updatedAt)}</span>
                  </div>
                  
                  {/* Action buttons on hover */}
                  <div className="flex items-center gap-1.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateMap(map.id);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded transition-colors"
                      title="Duplicar Mapa"
                    >
                      <Copy size={13} />
                    </button>
                    {maps.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Tem certeza que deseja excluir o mapa "${map.name}"?`)) {
                            onDeleteMap(map.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-700/50 rounded transition-colors"
                        title="Excluir Mapa"
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
        <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block">
          Mind Flow v1.0.0
        </span>
      </div>
    </div>
  );
}
