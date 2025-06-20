import React, { useRef } from 'react';
import { Download, Upload, FileText, Save } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Photo, Annotation } from '../App';

interface ExportImportProps {
  photos: Photo[];
  annotations: Annotation[];
  currentPhoto: Photo | null;
  onImport: (data: { annotations: Annotation[]; photos?: any[] }) => void;
}

export const ExportImport: React.FC<ExportImportProps> = ({
  photos,
  annotations,
  currentPhoto,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportCurrentPhotoSVG = () => {
    if (!currentPhoto) return;

    const currentAnnotations = annotations.filter(a => a.photoId === currentPhoto.id);
    
    // Create SVG content with annotations
    const svg = generateSVG(currentPhoto, currentAnnotations);
    
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const fileName = `${currentPhoto.name.split('.')[0]}_annotated.svg`;
    saveAs(blob, fileName);
  };

  const exportAllAnnotationsJSON = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      photos: photos.map(p => ({
        id: p.id,
        name: p.name,
        size: p.file.size,
        description: p.description || '',
      })),
      annotations: annotations,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8' 
    });
    saveAs(blob, 'climbing_route_annotations.json');
  };

  const importAnnotations = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data.annotations && Array.isArray(data.annotations)) {
            onImport({ annotations: data.annotations, photos: data.photos });
          }
        } else if (file.name.endsWith('.svg')) {
          // Parse SVG and extract annotations (simplified implementation)
          const annotations = parseSVGAnnotations(content);
          onImport({ annotations });
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check the file format.');
      }
    };

    if (file.name.endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }

    // Reset input
    e.target.value = '';
  };

  const generateSVG = (photo: Photo, photoAnnotations: Annotation[]): string => {
    // This is a simplified SVG generation - in a real app you'd want more sophisticated handling
    const img = new Image();
    img.src = photo.url;
    
    const svgWidth = 800;
    const svgHeight = 600;
    
    let annotationsSVG = '';
    
    photoAnnotations.forEach(annotation => {
      if (annotation.type === 'hold') {
        const color = annotation.data.handColor === 'red' ? '#ef4444' : 
                     annotation.data.handColor === 'green' ? '#10b981' : '#3b82f6';
        
        annotationsSVG += `
          <circle 
            cx="${annotation.x}" 
            cy="${annotation.y}" 
            r="12" 
            fill="${color}" 
            fill-opacity="0.7" 
            stroke="${color}" 
            stroke-width="2"
            data-type="hold"
            data-hold-type="${annotation.data.holdType}"
            data-hand-color="${annotation.data.handColor}"
          />
          <text 
            x="${annotation.x}" 
            y="${annotation.y + 5}" 
            text-anchor="middle" 
            fill="white" 
            font-size="14"
            font-weight="bold"
          >${annotation.data.icon}</text>
        `;
      } else if (annotation.type === 'line') {
        annotationsSVG += `
          <path 
            d="${annotation.data.path}" 
            stroke="#f97316" 
            stroke-width="3" 
            fill="none"
            data-type="line"
          />
        `;
      } else if (annotation.type === 'text') {
        annotationsSVG += `
          <text 
            x="${annotation.x}" 
            y="${annotation.y}" 
            fill="#f1f5f9" 
            font-size="16"
            font-weight="bold"
            data-type="text"
          >${annotation.data.text}</text>
        `;
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <metadata>
      <photo-id>${photo.id}</photo-id>
      <photo-name>${photo.name}</photo-name>
      <export-timestamp>${new Date().toISOString()}</export-timestamp>
    </metadata>
  </defs>
  <image href="${photo.url}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"/>
  ${annotationsSVG}
</svg>`;
  };

  const parseSVGAnnotations = (svgContent: string): Annotation[] => {
    // Simplified SVG parsing - in a real app you'd use a proper XML parser
    const annotations: Annotation[] = [];
    
    // Extract circles (holds)
    const circleMatches = svgContent.match(/<circle[^>]*>/g) || [];
    circleMatches.forEach((circle, index) => {
      const cx = circle.match(/cx="([^"]*)"/) ?.[1];
      const cy = circle.match(/cy="([^"]*)"/) ?.[1];
      const holdType = circle.match(/data-hold-type="([^"]*)"/) ?.[1];
      const handColor = circle.match(/data-hand-color="([^"]*)"/) ?.[1];
      
      if (cx && cy) {
        annotations.push({
          id: `imported_hold_${index}`,
          type: 'hold',
          photoId: currentPhoto?.id || '',
          x: parseFloat(cx),
          y: parseFloat(cy),
          data: { holdType, handColor, icon: '⭕' }
        });
      }
    });

    return annotations;
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.svg"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Export Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Export</h3>
        <div className="space-y-2">
          <button
            onClick={exportCurrentPhotoSVG}
            disabled={!currentPhoto || annotations.filter(a => a.photoId === currentPhoto?.id).length === 0}
            className={`w-full p-3 rounded-lg border transition-all duration-200 ${
              currentPhoto && annotations.filter(a => a.photoId === currentPhoto?.id).length > 0
                ? 'border-green-600 hover:border-green-500 hover:bg-green-600/10 text-green-300'
                : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export Current as SVG</span>
            </div>
          </button>

          <button
            onClick={exportAllAnnotationsJSON}
            disabled={annotations.length === 0}
            className={`w-full p-3 rounded-lg border transition-all duration-200 ${
              annotations.length > 0
                ? 'border-blue-600 hover:border-blue-500 hover:bg-blue-600/10 text-blue-300'
                : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Save className="h-4 w-4" />
              <span className="text-sm font-medium">Export All as JSON</span>
            </div>
          </button>
        </div>
      </div>

      {/* Import Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Import</h3>
        <button
          onClick={importAnnotations}
          className="w-full p-3 rounded-lg border border-purple-600 hover:border-purple-500 hover:bg-purple-600/10 text-purple-300 transition-all duration-200"
        >
          <div className="flex items-center justify-center space-x-2">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">Import Annotations</span>
          </div>
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Supports JSON and SVG files
        </p>
      </div>

      {/* Statistics */}
      <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-700">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Statistics</h4>
        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Total Photos:</span>
            <span>{photos.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Annotations:</span>
            <span>{annotations.length}</span>
          </div>
          {currentPhoto && (
            <div className="flex justify-between">
              <span>Current Photo:</span>
              <span>{annotations.filter(a => a.photoId === currentPhoto.id).length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
