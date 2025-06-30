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
export const HOLD_TYPES: HoldType[] = [
  { id: 'jug', name: 'Jug', icon: '/icons/jug.png', category: 'hand' },
  { id: 'pinch', name: 'Pinch', icon: '/icons/pinch.png', category: 'hand' },
  { id: 'sloper', name: 'Sloper', icon: '/icons/sloper.png', category: 'hand' },
  { id: 'crimp', name: 'Crimp', icon: '/icons/crimp.png', category: 'hand' },
  { id: 'medium', name: 'Medium', icon: '/icons/medium.png', category: 'hand' },
  { id: 'undercling', name: 'Undercling', icon: '/icons/undercling.png', category: 'hand' },
  { id: 'one_finger', name: 'Mono', icon: '/icons/one_finger.png', category: 'hand' },
  { id: 'two_finger', name: '2F', icon: '/icons/two_finger.png', category: 'hand' },
  { id: 'three_finger', name: '3F', icon: '/icons/three_finger.png', category: 'hand' },
  { id: 'foothold', name: 'Foot', icon: '/icons/foothold.png', category: 'foot' },
];

export const HoldSelector: React.FC<HoldSelectorProps> = ({
  selectedHoldType,
  selectedHandColor,
  selectedFootColor,
  onHoldTypeSelect,
  onHandColorSelect,
  onFootColorSelect,
}) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      <button
        onClick={() => {
          onHandColorSelect('green');
          onFootColorSelect('yellow');
        }}
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${selectedHandColor === 'green'
          ? 'border-green-400 bg-green-400/20 text-green-300'
          : 'border-slate-600 text-slate-400 hover:border-green-400/50 hover:text-green-300'
          }`}
      >
        L
      </button>
      <button
        onClick={() => {
          onHandColorSelect('red');
          onFootColorSelect('blue');
        }}
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${selectedHandColor === 'red'
          ? 'border-red-400 bg-red-400/20 text-red-300'
          : 'border-slate-600 text-slate-400 hover:border-red-400/50 hover:text-red-300'
          }`}
      >
        R
      </button>

      {HOLD_TYPES.map((hold) => (
        <button
          key={hold.id}
          onClick={() => onHoldTypeSelect(hold)}
          className={`group flex flex-col aspect-square items-center justify-center rounded-lg border p-1.5 transition-all duration-200 ${selectedHoldType?.id === hold.id
            ? hold.category === 'hand'
              ? `border-${selectedHandColor}-400 bg-${selectedHandColor}-400/20`
              : `border-${selectedFootColor}-400 bg-${selectedFootColor}-400/20`
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
            }`}
        >
          <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
            <img
              src={hold.icon}
              alt={hold.name}
              className={`max-h-full max-w-full object-contain transform transition-transform duration-200 ${
                selectedHandColor === 'green' ? '-scale-x-100' : ''
              }`}
            />
          </div>
          <span className="mt-1 text-center text-[10px] leading-tight">{hold.name}</span>
        </button>
      ))}
    </div>
  );
};
