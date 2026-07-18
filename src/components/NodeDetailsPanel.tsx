import React from 'react';
import { MindMapNode } from '../types';
import { COLOR_PALETTE } from '../utils/defaultData';
import { Bold, Italic, Square, Palette } from 'lucide-react';

interface NodeDetailsPanelProps {
  node: MindMapNode;
  onUpdateNode: (updated: Partial<MindMapNode>) => void;
  onClose: () => void;
}

export default function NodeDetailsPanel({
  node,
  onUpdateNode,
  onClose,
}: NodeDetailsPanelProps) {
  const isRoot = node.parentId === null;

  const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode({ text: e.target.value });
  };

  const shapes: Array<{ id: MindMapNode['shape']; label: string }> = [
    { id: 'rounded', label: 'Arredondado' },
    { id: 'pill', label: 'Pílula' },
    { id: 'circle', label: 'Círculo' },
    { id: 'rectangle', label: 'Retângulo' },
    { id: 'cloud', label: 'Nuvem' },
  ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 shadow-2xl border-t md:border-t-0 md:border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Customizar Elemento</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title/Text Editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Texto do Balão
          </label>
          <input
            type="text"
            value={node.text}
            onChange={handleChangeText}
            className="w-full px-3 py-2 border.5 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium text-sm transition-all"
            placeholder="Insira o texto..."
          />
        </div>

        {/* Custom Colors Section - The request specifies choosing ANY custom color! */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Cor de Fundo (Balão)
            </label>
            
            {/* Quick Palette Swatches */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {COLOR_PALETTE.map((color, idx) => (
                <button
                  key={`bg-swatch-${idx}`}
                  onClick={() => onUpdateNode({ color, borderColor: color })}
                  className={`aspect-square rounded-full border border-black/10 shadow-sm transition-all relative ${
                    node.color.toLowerCase() === color.toLowerCase()
                      ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Any Custom Color Picker */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <input
                type="color"
                value={node.color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode({ color: e.target.value, borderColor: e.target.value })}
                className="w-8 h-8 rounded-md cursor-pointer border-0 p-0"
              />
              <div>
                <span className="text-xs font-medium text-slate-700 block">Personalizar Cor</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">{node.color}</span>
              </div>
            </div>
          </div>

          {/* Text Color Setting */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Cor da Fonte (Texto)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateNode({ textColor: '#FFFFFF' })}
                className={`flex-1 py-1.5 border rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  node.textColor === '#FFFFFF'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Branco
              </button>
              <button
                onClick={() => onUpdateNode({ textColor: '#1E293B' })}
                className={`flex-1 py-1.5 border rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  node.textColor === '#1E293B'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Escuro
              </button>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <input
                  type="color"
                  value={node.textColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode({ textColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  title="Selecione qualquer cor de fonte"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Text Typography Formatting */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Formatação de Texto
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateNode({ isBold: !node.isBold })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg text-sm transition-all ${
                node.isBold
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bold size={16} /> Negrito
            </button>
            <button
              onClick={() => onUpdateNode({ isItalic: !node.isItalic })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg text-sm transition-all ${
                node.isItalic
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 italic'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Italic size={16} /> Itálico
            </button>
          </div>

          {/* Font Size slider */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">Tamanho da Fonte</span>
              <span className="text-xs font-semibold text-indigo-600 font-mono">{node.fontSize}px</span>
            </div>
            <input
              type="range"
              min="11"
              max="28"
              value={node.fontSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        {/* Node Shape */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Formato do Balão
          </label>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => onUpdateNode({ shape: shape.id })}
                className={`py-2 px-3 border rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all ${
                  node.shape === shape.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Square size={14} className="opacity-70" />
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        {/* Connector Styles (Only show for non-root nodes) */}
        {!isRoot && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Linha de Conexão (Anterior)
            </h3>

            {/* Connection Color */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                Cor da Conexão
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={node.lineColor || '#94a3b8'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode({ lineColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <div>
                  <span className="text-xs font-medium text-slate-700">Selecione Cor</span>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    {node.lineColor || '#94a3b8'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Width */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium text-slate-400">Espessura</span>
                <span className="text-xs font-semibold text-indigo-600 font-mono">
                  {node.lineWidth || 2}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={node.lineWidth || 2}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode({ lineWidth: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Connection Style */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                Estilo do Traço
              </label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => onUpdateNode({ lineStyle: style })}
                    className={`flex-1 py-1.5 border rounded-lg text-[11px] font-medium transition-all ${
                      (node.lineStyle || 'solid') === style
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {style === 'solid' ? 'Sólido' : style === 'dashed' ? 'Tracejado' : 'Pontilhado'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
