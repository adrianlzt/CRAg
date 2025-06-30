import React from 'react';
import { Circle, Minus, Type, Hand } from 'lucide-react';

interface DrawingToolsProps {
  selectedTool: 'hold' | 'line' | 'text';
  onToolSelect: (tool: 'hold' | 'line' | 'text') => void;
}

interface Tool {
  id: 'hold' | 'line' | 'text';
  name: string;
  icon: React.ReactNode;
  description: string;
}

const TOOLS: Tool[] = [
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


    </div>
  );
};
