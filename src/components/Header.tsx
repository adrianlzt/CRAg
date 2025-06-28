import React from 'react';
import { Mountain, Route, Pencil } from 'lucide-react';

interface HeaderProps {
  isVisible: boolean;
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ isVisible, projectName, onProjectNameChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className={`fixed lg:static top-0 w-full z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 transition-transform duration-300 ease-in-out ${!isVisible ? '-translate-y-full' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Mountain className="h-8 w-8 text-orange-500" />
            <Route className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder="Project Name"
                className="bg-transparent text-xl font-bold text-white outline-none border-none rounded-md transition-colors hover:bg-slate-800/75 focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 px-2 py-1 -mx-2 -my-1"
              />
              <Pencil
                className="h-4 w-4 text-slate-400 cursor-pointer"
                onClick={() => inputRef.current?.focus()}
              />
            </div>
            <p className="text-sm text-slate-400">Mark holds, draw routes, share beta</p>
          </div>
        </div>
      </div>
    </header>
  );
};
