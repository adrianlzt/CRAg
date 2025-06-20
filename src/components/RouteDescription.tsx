import React from 'react';
import { Textarea } from './ui/textarea';
import { Photo } from '../App';

interface RouteDescriptionProps {
  photo: Photo | null;
  onDescriptionChange: (newDescription: string) => void;
}

export const RouteDescription: React.FC<RouteDescriptionProps> = ({ photo, onDescriptionChange }) => {
  if (!photo) {
    return null;
  }

  return (
    <Textarea
      id="route-description"
      value={photo.description || ''}
      onChange={(e) => onDescriptionChange(e.target.value)}
      placeholder="Describe the route, beta, or sequence..."
      className="min-h-[120px]"
    />
  );
};
