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
  return (
    <div className="grid grid-cols-6 gap-2">
      <button
        onClick={() => {
          onHandColorSelect('green');
          onFootColorSelect('yellow');
        }}
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${
          selectedHandColor === 'green'
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
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${
          selectedHandColor === 'red'
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
          className={`group flex aspect-square items-center justify-center rounded-lg border p-1.5 transition-all duration-200 ${
            selectedHoldType?.id === hold.id
              ? hold.category === 'hand'
                ? `border-${selectedHandColor}-400 bg-${selectedHandColor}-400/20`
                : `border-${selectedFootColor}-400 bg-${selectedFootColor}-400/20`
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
          }`}
        >
          <img src={hold.icon} alt={hold.name} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
};
