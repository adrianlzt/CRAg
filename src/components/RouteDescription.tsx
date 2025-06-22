import React, { useState } from 'react';
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
    <div
      className={cn(
        'relative',
        isMaximized &&
          'fixed inset-0 z-50 bg-background/80 p-4 flex items-center justify-center backdrop-blur-sm'
      )}
      onClick={() => {
        if (isMaximized) {
          setIsMaximized(false);
        }
      }}
    >
      <div
        className={cn('relative w-full', isMaximized && 'max-w-2xl')}
        onClick={(e) => {
          if (isMaximized) {
            e.stopPropagation();
          }
        }}
      >
        <Textarea
          id="route-description"
          value={photo.description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the route, beta, or sequence..."
          className={cn(
            'min-h-[120px]',
            isMaximized && 'min-h-[calc(100vh-10rem)] resize-none'
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleMaximize}
          className="absolute top-2 right-2 h-7 w-7"
        >
          {isMaximized ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isMaximized ? 'Minimize' : 'Maximize'}
          </span>
        </Button>
      </div>
    </div>
  );
};
