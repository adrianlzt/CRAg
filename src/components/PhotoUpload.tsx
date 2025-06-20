import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, GripVertical, Image as ImageIcon, Plus } from 'lucide-react';
import { Photo } from '../App';

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosAdd: (photos: Photo[]) => void;
  onPhotoRemove: (photoId: string) => void;
  onPhotosReorder: (startIndex: number, endIndex: number) => void;
  currentPhotoIndex: number;
  onPhotoSelect: (index: number) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onPhotosAdd,
  onPhotoRemove,
  onPhotosReorder,
  currentPhotoIndex,
  onPhotoSelect,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList) => {
    const newPhotos: Photo[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const photo: Photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
        };
        newPhotos.push(photo);
      }
    });

    if (newPhotos.length > 0) {
      onPhotosAdd(newPhotos);
    }
  }, [onPhotosAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const loadSamplePhotos = useCallback(async () => {
    try {
      // Load sample climbing photos from public directory
      const sampleUrls = [
        '/test-climbing-photo-1.jpg',
        '/test-climbing-photo-2.png'
      ];

      const samplePhotos: Photo[] = [];

      for (let i = 0; i < sampleUrls.length; i++) {
        const url = sampleUrls[i];
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], `sample-climbing-${i + 1}.${url.split('.').pop()}`, {
              type: blob.type || 'image/jpeg'
            });

            const photo: Photo = {
              id: `sample_photo_${Date.now()}_${i}`,
              file,
              url,
              name: `Sample Climbing Photo ${i + 1}`,
            };
            samplePhotos.push(photo);
          }
        } catch (error) {
          console.log(`Could not load sample photo ${url}:`, error);
        }
      }

      if (samplePhotos.length > 0) {
        onPhotosAdd(samplePhotos);
      } else {
        // Fallback: create a placeholder photo using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create a gradient background
          const gradient = ctx.createLinearGradient(0, 0, 800, 600);
          gradient.addColorStop(0, '#8B5A3C');
          gradient.addColorStop(1, '#5A5A5A');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 600);
          
          // Add some text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Sample Climbing Wall', 400, 250);
          ctx.font = '24px Arial';
          ctx.fillText('Use this to test annotation features', 400, 300);
          
          // Add some visual elements to simulate holds
          ctx.fillStyle = '#f97316';
          for (let i = 0; i < 10; i++) {
            const x = 100 + (i % 3) * 250 + Math.random() * 100;
            const y = 100 + Math.floor(i / 3) * 150 + Math.random() * 50;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'sample-climbing-wall.png', { type: 'image/png' });
              const photo: Photo = {
                id: `sample_photo_${Date.now()}`,
                file,
                url: URL.createObjectURL(blob),
                name: 'Sample Climbing Wall',
              };
              onPhotosAdd([photo]);
            }
          }, 'image/png');
        }
      }
    } catch (error) {
      console.error('Error loading sample photos:', error);
    }
  }, [onPhotosAdd]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDropOnPhoto = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onPhotosReorder(draggedIndex, dropIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sample Photos Button */}
      <div className="mb-4">
        <button
          onClick={loadSamplePhotos}
          className="w-full p-3 rounded-lg border border-blue-600 hover:border-blue-500 hover:bg-blue-600/10 text-blue-300 transition-all duration-200"
        >
          <div className="flex items-center justify-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Load Sample Climbing Photos</span>
          </div>
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-orange-400 bg-orange-400/10 scale-105'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handlePhotoClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-3">
          <div className={`p-3 rounded-full transition-colors ${
            isDragOver ? 'bg-orange-400/20' : 'bg-slate-700'
          }`}>
            {isDragOver ? (
              <Plus className="h-6 w-6 text-orange-400" />
            ) : (
              <Upload className="h-6 w-6 text-slate-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-300">
              {isDragOver ? 'Drop photos here' : 'Upload climbing photos'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Drag & drop or click to select
            </p>
          </div>
        </div>
      </div>

      {/* Photo List */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300 flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Photos ({photos.length})</span>
          </h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDropOnPhoto(e, index)}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                  index === currentPhotoIndex
                    ? 'border-orange-400 bg-orange-400/10'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
                onClick={() => onPhotoSelect(index)}
              >
                <GripVertical className="h-4 w-4 text-slate-500 cursor-grab" />
                
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 truncate">
                    {photo.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoRemove(photo.id);
                  }}
                  className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
