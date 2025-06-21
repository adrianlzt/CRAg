import React, { useState, useCallback } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { PhotoViewer } from './components/PhotoViewer';
import { HoldSelector } from './components/HoldSelector';
import { DrawingTools } from './components/DrawingTools';
import { ExportImport } from './components/ExportImport';
import { Header } from './components/Header';
import { RouteDescription } from './components/RouteDescription';
import { ProjectImporter } from './components/ProjectImporter';
import { Button } from './components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from './hooks/use-toast';
import { saveAs } from 'file-saver';
import './index.css';

export interface Photo {
  id: string;
  file: File;
  url: string;
  name: string;
  description?: string;
}

export interface Annotation {
  id: string;
  type: 'hold' | 'line' | 'text';
  photoId: string;
  x: number;
  y: number;
  data: any;
}

export interface HoldType {
  id:string;
  name: string;
  icon: string;
  category: 'hand' | 'foot';
}

export interface AppState {
  photos: Photo[];
  currentPhotoIndex: number;
  annotations: Annotation[];
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedLineColor: string;
  selectedTextColor: string;
  isDrawing: boolean;
  history: Annotation[][];
  historyIndex: number;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function App() {
  const [state, setState] = useState<AppState>({
    photos: [],
    currentPhotoIndex: 0,
    annotations: [],
    selectedTool: 'select',
    selectedHoldType: null,
    selectedHandColor: 'red',
    selectedFootColor: 'blue',
    selectedLineColor: '#f97316',
    selectedTextColor: '#ffffff',
    isDrawing: false,
    history: [[]],
    historyIndex: 0,
  });
  const { toast } = useToast();

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addPhotos = useCallback((newPhotos: Photo[]) => {
    setState(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }));
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setState(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId),
      annotations: prev.annotations.filter(a => a.photoId !== photoId),
      currentPhotoIndex: Math.max(0, prev.currentPhotoIndex - 1),
    }));
  }, []);

  const reorderPhotos = useCallback((startIndex: number, endIndex: number) => {
    setState(prev => {
      const newPhotos = [...prev.photos];
      const [removed] = newPhotos.splice(startIndex, 1);
      newPhotos.splice(endIndex, 0, removed);
      return { ...prev, photos: newPhotos };
    });
  }, []);

  const handleDescriptionChange = useCallback((newDescription: string) => {
    setState(prev => {
      const newPhotos = prev.photos.map((photo, index) => {
        if (index === prev.currentPhotoIndex) {
          return { ...photo, description: newDescription };
        }
        return photo;
      });
      return { ...prev, photos: newPhotos };
    });
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setState(prev => {
      const newAnnotations = [...prev.annotations, annotation];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newAnnotations);
      
      return {
        ...prev,
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const updateAnnotation = useCallback((annotationId: string, updates: Partial<Annotation>) => {
    setState(prev => {
      const newAnnotations = prev.annotations.map(a =>
        a.id === annotationId ? { ...a, ...updates } : a
      );
      
      return { ...prev, annotations: newAnnotations };
    });
  }, []);

  const removeAnnotation = useCallback((annotationId: string) => {
    setState(prev => {
      const newAnnotations = prev.annotations.filter(a => a.id !== annotationId);
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newAnnotations);
      
      return {
        ...prev,
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          annotations: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          annotations: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const handleProjectImport = useCallback((data: { photos: Photo[]; annotations: Annotation[] }) => {
    setState(prev => {
      // Clean up old photo URLs to prevent memory leaks
      prev.photos.forEach(p => URL.revokeObjectURL(p.url));

      const { photos: importedPhotos, annotations: importedAnnotations } = data;
      
      return {
        ...prev,
        photos: importedPhotos,
        annotations: importedAnnotations,
        currentPhotoIndex: importedPhotos.length > 0 ? 0 : 0,
        history: [importedAnnotations],
        historyIndex: 0,
        selectedTool: 'select',
      };
    });
  }, []);

  const handleExportAsImage = useCallback(async () => {
    if (state.photos.length === 0) {
      toast({ title: "Cannot export", description: "There are no photos to export.", variant: "destructive" });
      return;
    }

    const { id: toastId, update } = toast({
      title: 'Exporting as Image',
      description: 'Please wait while the image is being generated...',
    });

    const HOLD_TYPES_MAP: { [key: string]: { icon: string, name: string } } = {
      'jug': { icon: '🤲', name: 'Jug' },
      'crimp': { icon: '✊', name: 'Crimp' },
      'sidepull': { icon: '👋', name: 'Side Pull' },
      'undercling': { icon: '🙌', name: 'Undercling' },
      'one_finger': { icon: '☝️', name: '1-Finger Pocket' },
      'two_finger': { icon: '✌️', name: '2-Finger Pocket' },
      'three_finger': { icon: '🤟', name: '3-Finger Pocket' },
      'foothold': { icon: '🦶', name: 'Foot Hold' },
    };

    const getHoldIcon = (annotation: Annotation) => {
      const holdTypeId = annotation.data.holdType || annotation.data.holdTypeId;
      return HOLD_TYPES_MAP[holdTypeId]?.icon || '⚫';
    };

    const getHoldColor = (annotation: Annotation) => {
      switch (annotation.data.handColor) {
        case 'red': return '#ef4444';
        case 'green': return '#10b981';
        case 'blue': return '#3b82f6';
        case 'yellow': return '#eab308';
        default: return '#f97316';
      }
    };

    try {
      const PADDING = 50;
      const TEXT_AREA_HEIGHT = 400;
      const LINE_HEIGHT = 24;
      const FONT_SIZE_TITLE = 20;
      const FONT_SIZE_BODY = 16;

      // 1. Load all images to get their dimensions
      const loadedImages = await Promise.all(
        state.photos.map(p => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = p.url;
        }))
      );

      // 2. Calculate canvas dimensions
      const maxWidth = Math.max(...loadedImages.map(img => img.width));
      const totalImageHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);
      const canvasWidth = maxWidth + PADDING * 2;
      const canvasHeight = totalImageHeight + TEXT_AREA_HEIGHT + PADDING * 2;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // 3. Draw background and images with annotations
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      let currentY = PADDING;
      for (let i = 0; i < state.photos.length; i++) {
        const photo = state.photos[i];
        const img = loadedImages[i];
        const offsetX = (maxWidth - img.width) / 2 + PADDING;

        // Draw the image
        ctx.drawImage(img, offsetX, currentY);

        // Filter annotations for this photo
        const photoAnnotations = state.annotations.filter(a => a.photoId === photo.id);

        // Draw annotations on the main canvas
        for (const annotation of photoAnnotations) {
          if (annotation.type === 'hold') {
            const x = offsetX + annotation.x;
            const y = currentY + annotation.y;
            const rotation = annotation.data.rotation || 0;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Draw background circle
            ctx.fillStyle = getHoldColor(annotation);
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = getHoldColor(annotation);
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Hold type emoji
            ctx.globalAlpha = 1.0;
            ctx.font = '24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.shadowColor = "black";
            ctx.shadowBlur = 2;
            ctx.fillText(getHoldIcon(annotation), 0, 0);
            ctx.shadowBlur = 0; // reset shadow
            
            ctx.restore();
          } else if (annotation.type === 'line') {
            const points = annotation.data.points as number[];
            if (points && points.length >= 4) {
              ctx.save();
              ctx.globalAlpha = 0.8;
              ctx.strokeStyle = annotation.data.color || '#f97316';
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(offsetX + points[0], currentY + points[1]);
              for (let i = 2; i < points.length; i += 2) {
                ctx.lineTo(offsetX + points[i], currentY + points[i + 1]);
              }
              ctx.stroke();
              ctx.restore();
            }
          } else if (annotation.type === 'text' && annotation.data.text) {
            const x = offsetX + annotation.x;
            const y = currentY + annotation.y;
            const rotation = annotation.data.rotation || 0;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            const fontSize = annotation.data.fontSize || 16;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            const PADDING = 5;
            const text = annotation.data.text;
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            
            const rectWidth = textWidth + PADDING * 2;
            const rectHeight = fontSize + PADDING * 2;

            // Draw background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(0, 0, rectWidth, rectHeight);

            // Draw text
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 2;
            ctx.fillStyle = annotation.data.color || 'white';
            ctx.fillText(text, PADDING, PADDING);
            
            ctx.restore();
          }
        }

        currentY += img.height;
      }

      // 4. Draw descriptions
      let textY = currentY + PADDING;
      ctx.fillStyle = 'black';

      for (const photo of state.photos) {
        if (textY > canvasHeight - PADDING) break; // Stop if out of space
        ctx.font = `bold ${FONT_SIZE_TITLE}px sans-serif`;
        ctx.fillText(photo.name, PADDING, textY);
        textY += LINE_HEIGHT * 1.5;

        if (photo.description) {
          ctx.font = `${FONT_SIZE_BODY}px sans-serif`;
          textY = wrapText(ctx, photo.description, PADDING, textY, maxWidth, LINE_HEIGHT);
          textY += LINE_HEIGHT;
        }
      }

      // 5. Trigger download
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, 'climbing-route.jpg');
          update({
            id: toastId,
            title: 'Export Successful',
            description: 'Your image has been downloaded.',
          });
        } else {
          throw new Error("Canvas to Blob conversion failed");
        }
      }, 'image/jpeg');

    } catch (error) {
      console.error("Failed to export as image:", error);
      update({
        id: toastId,
        title: 'Export Failed',
        description: (error as Error).message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  }, [state.photos, state.annotations, toast]);

  const currentPhoto = state.photos[state.currentPhotoIndex];
  const currentPhotoAnnotations = state.annotations.filter(
    a => a.photoId === currentPhoto?.id
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex flex-col">
      <Header />
  
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Sidebar - Tools and Controls */}
        <div className="w-full lg:w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Photo Upload Section */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h2 className="text-lg font-semibold mb-4 text-orange-400">Photos</h2>
              <PhotoUpload
                photos={state.photos}
                onPhotosAdd={addPhotos}
                onPhotoRemove={removePhoto}
                onPhotosReorder={reorderPhotos}
                currentPhotoIndex={state.currentPhotoIndex}
                onPhotoSelect={(index) => updateState({ currentPhotoIndex: index })}
              />
            </div>

            {/* Tools Section */}
            {currentPhoto && (
              <>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Annotation Tools</h2>
                  <DrawingTools
                    selectedTool={state.selectedTool}
                    onToolSelect={(tool) => updateState({ selectedTool: tool })}
                    canUndo={state.historyIndex > 0}
                    canRedo={state.historyIndex < state.history.length - 1}
                    onUndo={undo}
                    onRedo={redo}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Climbing Holds</h2>
                  <HoldSelector
                    selectedHoldType={state.selectedHoldType}
                    selectedHandColor={state.selectedHandColor}
                    selectedFootColor={state.selectedFootColor}
                    selectedLineColor={state.selectedLineColor}
                    selectedTextColor={state.selectedTextColor}
                    onHoldTypeSelect={(holdType) => updateState({ selectedHoldType: holdType, selectedTool: 'hold' })}
                    onHandColorSelect={(color) => updateState({ selectedHandColor: color })}
                    onFootColorSelect={(color) => updateState({ selectedFootColor: color })}
                    onLineColorSelect={(color) => updateState({ selectedLineColor: color })}
                    onTextColorSelect={(color) => updateState({ selectedTextColor: color })}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Route Description</h2>
                  <RouteDescription
                    photo={currentPhoto}
                    onDescriptionChange={handleDescriptionChange}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Export / Import</h2>
                  <ExportImport
                    photos={state.photos}
                    annotations={state.annotations}
                    onProjectImport={handleProjectImport}
                    onExportAsImage={handleExportAsImage}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Photo Viewer */}
        <div className="flex-1 relative">
          {currentPhoto ? (
            <PhotoViewer
              photo={currentPhoto}
              annotations={currentPhotoAnnotations}
              selectedTool={state.selectedTool}
              selectedHoldType={state.selectedHoldType}
              selectedHandColor={state.selectedHandColor}
              selectedFootColor={state.selectedFootColor}
              selectedLineColor={state.selectedLineColor}
              selectedTextColor={state.selectedTextColor}
              onAnnotationAdd={addAnnotation}
              onAnnotationUpdate={updateAnnotation}
              onAnnotationRemove={removeAnnotation}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-800/30">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🧗‍♂️</div>
                <h2 className="text-2xl font-bold mb-2 text-slate-300">Ready to Annotate Routes</h2>
                <p className="text-slate-400 mb-6">Upload photos or import an existing project to get started.</p>
                <ProjectImporter onProjectImport={handleProjectImport}>
                  {(importProject) => (
                    <Button onClick={importProject} variant="secondary">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Project
                    </Button>
                  )}
                </ProjectImporter>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
