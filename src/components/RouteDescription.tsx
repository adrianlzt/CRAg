import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Textarea } from './ui/textarea';
import { Photo } from '../App';
import { Button } from './ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '../lib/utils';

interface RouteDescriptionProps {
  photo: Photo | null;
  onDescriptionChange: (newDescription: string) => void;
}

export const RouteDescription: React.FC<RouteDescriptionProps> = ({ photo, onDescriptionChange }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!photo) {
    return null;
  }

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <>
      <div className={cn('relative', isMaximized ? 'invisible' : '')}>
        <Textarea
          id="route-description"
          value={photo.description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the route, beta, or sequence..."
          className="min-h-[120px]"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleMaximize}
          className="absolute top-2 right-2 h-7 w-7"
        >
          <Maximize className="h-4 w-4" />
          <span className="sr-only">Maximize</span>
        </Button>
      </div>
      {isMaximized &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={handleToggleMaximize}
          >
            <div
              className="relative w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Textarea
                value={photo.description || ''}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Describe the route, beta, or sequence..."
                className="min-h-[calc(100vh-10rem)] resize-none"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMaximize}
                className="absolute right-2 top-2 h-7 w-7"
              >
                <Minimize className="h-4 w-4" />
                <span className="sr-only">Minimize</span>
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
