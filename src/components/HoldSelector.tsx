import React from 'react';
import { HoldType } from '../App';

interface HoldSelectorProps {
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  onHoldTypeSelect: (holdType: HoldType) => void;
  onHandColorSelect: (color: 'red' | 'green') => void;
  onFootColorSelect: (color: 'blue' | 'yellow') => void;
}

// Define climbing hold types with their visual representations
const HOLD_TYPES: HoldType[] = [
  { id: 'jug', name: 'Jug', icon: '/icons/jug.svg', category: 'hand' },
  { id: 'pinch', name: 'Pinch', icon: '/icons/pinch.svg', category: 'hand' },
  { id: 'sloper', name: 'Sloper', icon: '/icons/sloper.svg', category: 'hand' },
  { id: 'crimp', name: 'Crimp', icon: '/icons/crimp.svg', category: 'hand' },
  { id: 'medium', name: 'Medium', icon: '/icons/medium.svg', category: 'hand' },
  { id: 'undercling', name: 'Undercling', icon: '/icons/undercling.svg', category: 'hand' },
  { id: 'one_finger', name: '1-Finger Pocket', icon: '/icons/one_finger.svg', category: 'hand' },
  { id: 'two_finger', name: '2-Finger Pocket', icon: '/icons/two_finger.svg', category: 'hand' },
  { id: 'three_finger', name: '3-Finger Pocket', icon: '/icons/three_finger.svg', category: 'hand' },
  { id: 'foothold', name: 'Foot Hold', icon: '/icons/foothold.svg', category: 'foot' },
];

export const HoldSelector: React.FC<HoldSelectorProps> = ({
  selectedHoldType,
  selectedHandColor,
  selectedFootColor,
  onHoldTypeSelect,
  onHandColorSelect,
  onFootColorSelect,
}) => {
  const handHolds = HOLD_TYPES.filter(hold => hold.category === 'hand');
  const footHolds = HOLD_TYPES.filter(hold => hold.category === 'foot');

  return (
    <div className="space-y-6">
      {/* Hand Color Selection */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Hand Color</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onHandColorSelect('green')}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 ${
              selectedHandColor === 'green'
                ? 'border-green-400 bg-green-400/20 text-green-300'
                : 'border-slate-600 hover:border-green-400/50 text-slate-400 hover:text-green-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Left Hand</span>
            </div>
          </button>
          <button
            onClick={() => onHandColorSelect('red')}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 ${
              selectedHandColor === 'red'
                ? 'border-red-400 bg-red-400/20 text-red-300'
                : 'border-slate-600 hover:border-red-400/50 text-slate-400 hover:text-red-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Right Hand</span>
            </div>
          </button>
        </div>
      </div>

      {/* Hand Holds */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Hand Holds</h3>
        <div className="grid grid-cols-2 gap-2">
          {handHolds.map((hold) => (
            <button
              key={hold.id}
              onClick={() => onHoldTypeSelect(hold)}
              className={`p-3 rounded-lg border transition-all duration-200 text-center group ${
                selectedHoldType?.id === hold.id
                  ? `border-${selectedHandColor}-400 bg-${selectedHandColor}-400/20`
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }`}
            >
              <img src={hold.icon} alt={hold.name} className="h-8 w-8 mx-auto mb-1" />
              <div className="text-xs text-slate-300 font-medium">{hold.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Foot Color Selection */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Foot Color</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onFootColorSelect('yellow')}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 ${
              selectedFootColor === 'yellow'
                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                : 'border-slate-600 hover:border-yellow-400/50 text-slate-400 hover:text-yellow-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">Left Foot</span>
            </div>
          </button>
          <button
            onClick={() => onFootColorSelect('blue')}
            className={`flex-1 p-3 rounded-lg border transition-all duration-200 ${
              selectedFootColor === 'blue'
                ? 'border-blue-400 bg-blue-400/20 text-blue-300'
                : 'border-slate-600 hover:border-blue-400/50 text-slate-400 hover:text-blue-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Right Foot</span>
            </div>
          </button>
        </div>
      </div>

      {/* Foot Holds */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Foot Holds</h3>
        <div className="grid grid-cols-1 gap-2">
          {footHolds.map((hold) => (
            <button
              key={hold.id}
              onClick={() => onHoldTypeSelect(hold)}
              className={`p-3 rounded-lg border transition-all duration-200 text-center group ${
                selectedHoldType?.id === hold.id
                  ? `border-${selectedFootColor}-400 bg-${selectedFootColor}-400/20`
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <img src={hold.icon} alt={hold.name} className="h-8 w-8" />
                <div className="text-sm text-slate-300 font-medium">{hold.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
