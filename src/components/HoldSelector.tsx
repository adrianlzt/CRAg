import React from 'react';
import { HoldType } from '../App';

interface HoldSelectorProps {
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedKneeColor: 'purple' | 'pink';
  onHoldTypeSelect: (holdType: HoldType) => void;
  onHandColorSelect: (color: 'red' | 'green') => void;
  onFootColorSelect: (color: 'blue' | 'yellow') => void;
  onKneeColorSelect: (color: 'purple' | 'pink') => void;
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
  { id: 'knee', name: 'Knee', icon: '/icons/knee.png', category: 'knee' },
];

export const HoldSelector: React.FC<HoldSelectorProps> = ({
  selectedHoldType,
  selectedHandColor,
  selectedFootColor,
  selectedKneeColor,
  onHoldTypeSelect,
  onHandColorSelect,
  onFootColorSelect,
  onKneeColorSelect,
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

      <button
        onClick={() => onKneeColorSelect('purple')}
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${selectedKneeColor === 'purple'
            ? 'border-purple-400 bg-purple-400/20 text-purple-300'
            : 'border-slate-600 text-slate-400 hover:border-purple-400/50 hover:text-purple-300'
          }`}
      >
        K
      </button>
      <button
        onClick={() => onKneeColorSelect('pink')}
        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${selectedKneeColor === 'pink'
            ? 'border-pink-400 bg-pink-400/20 text-pink-300'
            : 'border-slate-600 text-slate-400 hover:border-pink-400/50 hover:text-pink-300'
          }`}
      >
        K
      </button>

      {HOLD_TYPES.map((hold) => (
        <button
          key={hold.id}
          onClick={() => onHoldTypeSelect(hold)}
          className={`group flex flex-col aspect-square items-center justify-center rounded-lg border p-1.5 transition-all duration-200 ${selectedHoldType?.id === hold.id
            ? hold.category === 'hand'
              ? `border-${selectedHandColor}-400 bg-${selectedHandColor}-400/20`
              : hold.category === 'foot'
                ? `border-${selectedFootColor}-400 bg-${selectedFootColor}-400/20`
                : `border-${selectedKneeColor}-400 bg-${selectedKneeColor}-400/20`
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
