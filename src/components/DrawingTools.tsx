import React from 'react';
import { MousePointer, Circle, Minus, Type, Hand } from 'lucide-react';

interface DrawingToolsProps {
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  onToolSelect: (tool: 'select' | 'hold' | 'line' | 'text') => void;
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

    </div>
  );
};
