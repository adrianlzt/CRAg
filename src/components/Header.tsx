import React from 'react';
import { Mountain, Route } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Mountain className="h-8 w-8 text-orange-500" />
            <Route className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Climbing Route Annotator</h1>
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
