import React from 'react';
import { MousePointer, Circle, Minus, Type, Undo, Redo, Hand } from 'lucide-react';

interface DrawingToolsProps {
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  onToolSelect: (tool: 'select' | 'hold' | 'line' | 'text') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedLineColor: string;
  onLineColorSelect: (color: string) => void;
  selectedLineWidth: number;
  onLineWidthSelect: (width: number) => void;
}

interface Tool {
  id: 'select' | 'hold' | 'line' | 'text';
  name: string;
  icon: React.ReactNode;
  description: string;
}

const TOOLS: Tool[] = [
  {
    id: 'select',
    name: 'Select',
    icon: <MousePointer className="h-5 w-5" />,
    description: 'Select and move annotations'
  },
  {
    id: 'hold',
    name: 'Holds',
    icon: <Hand className="h-5 w-5" />,
    description: 'Place climbing holds'
  },
  {
    id: 'line',
    name: 'Draw',
    icon: <Minus className="h-5 w-5" />,
    description: 'Draw route lines'
  },
  {
    id: 'text',
    name: 'Text',
    icon: <Type className="h-5 w-5" />,
    description: 'Add text annotations'
  }
];

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  selectedTool,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedLineColor,
  onLineColorSelect,
  selectedLineWidth,
  onLineWidthSelect,
}) => {
  return (
    <div className="space-y-4">
      {/* Main Tools */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`p-3 rounded-lg border transition-all duration-200 text-center group ${
                selectedTool === tool.id
                  ? 'border-orange-400 bg-orange-400/20 text-orange-300'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 text-slate-400'
              }`}
              title={tool.description}
            >
              <div className="flex flex-col items-center space-y-2">
                {tool.icon}
                <span className="text-xs font-medium">{tool.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Line Color Selection */}
      {selectedTool === 'line' && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Line Color</h3>
          <div className="flex flex-wrap gap-2">
            {[
              '#f97316', // orange
              '#ef4444', // red
              '#10b981', // green
              '#3b82f6', // blue
              '#eab308', // yellow
              '#ec4899', // pink
            ].map(color => (
              <button
                key={color}
                onClick={() => onLineColorSelect(color)}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  selectedLineColor === color
                    ? `border-white`
                    : 'border-slate-600 hover:border-slate-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <h3 className="text-sm font-medium text-slate-300 mt-4 mb-3">Line Width</h3>
          <div className="flex items-center gap-2">
            {[3, 5, 8, 12].map((width) => (
              <button
                key={width}
                onClick={() => onLineWidthSelect(width)}
                title={`${width}px`}
                className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedLineWidth === width
                    ? "border-white"
                    : "border-slate-600 hover:border-slate-400"
                }`}
              >
                <div
                  className="bg-white rounded-full"
                  style={{ width: `${width}px`, height: `${width}px` }}
                ></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Controls */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">History</h3>
        <div className="flex space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
              canUndo
                ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 text-slate-300'
                : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
            title="Undo last action"
          >
            <Undo className="h-4 w-4" />
            <span className="text-sm">Undo</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
              canRedo
                ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 text-slate-300'
                : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
            title="Redo last action"
          >
            <Redo className="h-4 w-4" />
            <span className="text-sm">Redo</span>
          </button>
        </div>
      </div>

      {/* Tool Instructions */}
      <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-700">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Instructions</h4>
        <div className="text-xs text-slate-500">
          {selectedTool === 'select' && "Click and drag to move annotations. Tap to select."}
          {selectedTool === 'hold' && "Choose a hold type above, then tap on the image to place it."}
          {selectedTool === 'line' && "Drag to draw route lines. Use for marking climbing paths."}
          {selectedTool === 'text' && "Tap on the image to add text annotations."}
        </div>
      </div>

      {/* Mobile Gesture Hints */}
      <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-700/50">
        <h4 className="text-xs font-medium text-blue-300 mb-2">Touch Gestures</h4>
        <div className="space-y-1 text-xs text-blue-200">
          <div>• Pinch to zoom in/out</div>
          <div>• Drag with two fingers to pan</div>
          <div>• Long press to delete annotation</div>
        </div>
      </div>
    </div>
  );
};
