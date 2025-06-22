import React from 'react';
import { Mountain, Route } from 'lucide-react';

interface HeaderProps {
  isVisible: boolean;
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ isVisible, projectName, onProjectNameChange }) => {
  return (
    <header className={`fixed lg:static top-0 w-full z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 transition-transform duration-300 ease-in-out ${!isVisible ? '-translate-y-full' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Mountain className="h-8 w-8 text-orange-500" />
            <Route className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Project Name"
              className="bg-transparent text-xl font-bold text-white outline-none border-none p-0 focus:ring-0"
            />
            <p className="text-sm text-slate-400">Mark holds, draw routes, share beta</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Right Hand</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Left Hand</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Feet</span>
          </div>
        </div>
      </div>
    </header>
  );
};
