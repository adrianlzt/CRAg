import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { PhotoViewer } from './components/PhotoViewer';
import { HoldSelector } from './components/HoldSelector';
import { DrawingTools } from './components/DrawingTools';
import { ExportImport } from './components/ExportImport';
import { Header } from './components/Header';
import { RouteDescription } from './components/RouteDescription';
import { ProjectImporter } from './components/ProjectImporter';
import { Button } from './components/ui/button';
import { Upload, Redo, Undo, FilePlus, Menu } from 'lucide-react';
import { useToast } from './hooks/use-toast';
import { saveAs } from 'file-saver';
import { HOLD_TYPES } from './components/HoldSelector';
import { get, set, del } from 'idb-keyval';
import './index.css';

export interface Photo {
  id: string;
  file: File;
  url: string;
  name: string;
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
  id: string;
  name: string;
  icon: string;
  category: 'hand' | 'foot';
}

export interface AppState {
  projectName: string;
  projectDescription: string;
  photos: Photo[];
  currentPhotoIndex: number;
  annotations: Annotation[];
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedLineColor: string;
  selectedLineWidth: number;
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
  const textLines = text.split('\n');
  let currentY = y;

  for (const textLine of textLines) {
    const words = textLine.split(' ');
    let line = '';

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
    currentY += lineHeight;
  }
  return currentY;
}

async function drawSvgOnCanvas(
  ctx: CanvasRenderingContext2D,
  svgString: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      resolve();
    };
    img.onerror = (err) => {
      console.error("Failed to load SVG for canvas drawing:", err);
      reject(err);
    };
    // Use fill='white' as the original code used white fill for the emoji
    const coloredSvg = svgString.replace('<svg', `<svg fill='white'`);
    img.src = `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
  });
}

const initialState: AppState = {
  projectName: 'Climbing Route Project',
  projectDescription: '',
  photos: [],
  currentPhotoIndex: 0,
  annotations: [],
  selectedTool: 'select',
  selectedHoldType: null,
  selectedHandColor: 'red',
  selectedFootColor: 'blue',
  selectedLineColor: '#f97316',
  selectedLineWidth: 3,
  isDrawing: false,
  history: [[]],
  historyIndex: 0,
};

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const { toast } = useToast();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load state from IndexedDB on startup
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await get('app-state');
        if (savedState) {
          // Recreate photo URLs from stored File objects
          const photosWithUrls = savedState.photos.map((p: Omit<Photo, 'url'>) => ({
            ...p,
            url: URL.createObjectURL(p.file),
          }));
          setState({
            ...savedState,
            photos: photosWithUrls,
            projectDescription: savedState.projectDescription || '',
            // Reset transient state that shouldn't be persisted across reloads
            selectedTool: 'select',
            isDrawing: false,
          });
        }
      } catch (error) {
        console.error("Failed to load state from IndexedDB", error);
        toast({
          title: "Could not load project",
          description: "There was an error loading your saved project. Starting fresh.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, [toast]);

  // Save state to IndexedDB on change
  useEffect(() => {
    if (isLoading) return;

    const saveState = async () => {
      try {
        // Create a savable state without photo URLs
        const savableState = {
          ...state,
          photos: state.photos.map(({ url, ...rest }) => rest),
        };
        await set('app-state', savableState);
      } catch (error) {
        console.error("Failed to save state to IndexedDB", error);
      }
    };

    saveState();
  }, [state, isLoading]);

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
    setState(prev => {
      const photoToRemove = prev.photos.find(p => p.id === photoId);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return {
        ...prev,
        photos: prev.photos.filter(p => p.id !== photoId),
        annotations: prev.annotations.filter(a => a.photoId !== photoId),
        currentPhotoIndex: Math.max(0, prev.currentPhotoIndex - 1),
      };
    });
  }, []);

  const reorderPhotos = useCallback((startIndex: number, endIndex: number) => {
    setState(prev => {
      const newPhotos = [...prev.photos];
      const [removed] = newPhotos.splice(startIndex, 1);
      newPhotos.splice(endIndex, 0, removed);
      return { ...prev, photos: newPhotos };
    });
  }, []);

  const handleProjectDescriptionChange = useCallback((newDescription: string) => {
    updateState({ projectDescription: newDescription });
  }, [updateState]);

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

  const handleNewProject = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new project? All current progress will be lost and cannot be recovered.")) {
      // Clean up old photo URLs to prevent memory leaks
      state.photos.forEach(p => URL.revokeObjectURL(p.url));

      del('app-state')
        .then(() => {
          setState(initialState);
          toast({
            title: "New Project Started",
            description: "Your previous project has been cleared.",
          });
        })
        .catch((error) => {
          console.error("Failed to clear project from IndexedDB", error);
          toast({
            title: "Error",
            description: "Could not clear the project data.",
            variant: "destructive",
          });
        });
    }
  }, [state.photos, toast]);

  const handleExportAsImage = useCallback(async () => {
    if (state.photos.length === 0) {
      toast({ title: "Cannot export", description: "There are no photos to export.", variant: "destructive" });
      return;
    }

    const { id: toastId, update } = toast({
      title: 'Exporting as Image',
      description: 'Please wait while the image is being generated...',
    });

    const fetchedSvgs: { [key: string]: string } = {};
    try {
      await Promise.all(
        HOLD_TYPES.map(async (holdType) => {
          const response = await fetch(holdType.icon);
          if (!response.ok) throw new Error(`Failed to fetch ${holdType.icon}`);
          fetchedSvgs[holdType.id] = await response.text();
        })
      );
    } catch (error) {
      console.error("Failed to fetch SVG icons:", error);
      update({
        id: toastId,
        title: 'Export Failed',
        description: 'Could not load hold icons for export.',
        variant: 'destructive',
      });
      return;
    }

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

      // Dynamically scale font sizes based on the image width. Reference is 16px for 1000px wide.
      const scaleFactor = maxWidth > 0 ? maxWidth / 1000 : 1;
      const FONT_SIZE_TITLE = Math.max(12, Math.round(20 * scaleFactor));
      const FONT_SIZE_BODY = Math.max(10, Math.round(16 * scaleFactor));
      const LINE_HEIGHT = Math.max(15, Math.round(24 * scaleFactor));

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
            const scale = annotation.data.scale || 1;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Draw background circle
            ctx.strokeStyle = getHoldColor(annotation);
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(0, 0, 18 * scale, 0, 2 * Math.PI);
            ctx.stroke();

            // Draw Hold type SVG icon
            const holdTypeId = annotation.data.holdType || annotation.data.holdTypeId;
            const svgIcon = fetchedSvgs[holdTypeId];

            if (svgIcon) {
              ctx.globalAlpha = 1.0;
              ctx.shadowColor = "black";
              ctx.shadowBlur = 2;

              const iconSize = 24 * scale;
              await drawSvgOnCanvas(ctx, svgIcon, -iconSize / 2, -iconSize / 2, iconSize, iconSize);

              ctx.shadowBlur = 0; // reset shadow
            }

            ctx.restore();
          } else if (annotation.type === 'line') {
            const points = annotation.data.points as number[];
            if (points && points.length >= 4) {
              ctx.save();
              ctx.globalAlpha = 0.8;
              ctx.strokeStyle = annotation.data.color || '#f97316';
              ctx.lineWidth = annotation.data.width || 3;
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

            const TEXT_PADDING = 5;
            const textLines = annotation.data.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));

            const rectWidth = textWidth + TEXT_PADDING * 2;
            const rectHeight = (textLines.length * lineHeight) - (lineHeight - fontSize) + TEXT_PADDING * 2;

            // Draw background
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillRect(0, 0, rectWidth, rectHeight);

            // Draw text
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#000000';
            textLines.forEach((line, index) => {
              ctx.fillText(line, TEXT_PADDING, TEXT_PADDING + (index * lineHeight));
            });

            ctx.restore();
          }
        }

        currentY += img.height;
      }

      // 4. Draw descriptions
      let textY = currentY + PADDING;
      ctx.fillStyle = 'black';

      if (state.projectDescription) {
        if (textY < canvasHeight - PADDING) {
          ctx.font = `bold ${FONT_SIZE_TITLE}px sans-serif`;
          ctx.fillText("Route Description", PADDING, textY);
          textY += LINE_HEIGHT * 1.5;

          ctx.font = `${FONT_SIZE_BODY}px sans-serif`;
          textY = wrapText(ctx, state.projectDescription, PADDING, textY, maxWidth, LINE_HEIGHT);
          textY += LINE_HEIGHT;
        }
      }

      // 5. Trigger download
      canvas.toBlob((blob) => {
        if (blob) {
          const safeProjectName = (state.projectName || 'climbing-route').replace(/[\s/\\?%*:|"<>]/g, '_');
          saveAs(blob, `${safeProjectName}.jpg`);
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
  }, [state.photos, state.annotations, state.projectName, state.projectDescription, toast]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleScroll = () => {
      // lg breakpoint from tailwind is 1024px
      if (window.innerWidth >= 1024) {
        if (!isHeaderVisible) setIsHeaderVisible(true);
        return;
      }
      const scrollTop = sidebar.scrollTop;
      if (scrollTop > 0) {
        if (isHeaderVisible) setIsHeaderVisible(false);
      } else {
        if (!isHeaderVisible) setIsHeaderVisible(true);
      }
    };

    sidebar.addEventListener('scroll', handleScroll);
    return () => sidebar.removeEventListener('scroll', handleScroll);
  }, [isHeaderVisible]);

  const currentPhoto = state.photos[state.currentPhotoIndex];
  const currentPhotoAnnotations = state.annotations.filter(
    a => a.photoId === currentPhoto?.id
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🧗‍♂️</div>
          <h2 className="text-2xl font-bold text-slate-300">Loading Project...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex flex-col">
      <Header
        isVisible={isHeaderVisible}
        projectName={state.projectName}
        onProjectNameChange={(name) => updateState({ projectName: name })}
      />

      <div className={`flex-1 flex overflow-hidden transition-all duration-300 ease-in-out ${isHeaderVisible ? 'pt-[73px]' : 'pt-0'} lg:pt-0`}>
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        {/* Sidebar - Tools and Controls */}
        <div
          ref={sidebarRef}
          className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 p-4 overflow-y-auto transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}
        >
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
                    onToolSelect={(tool) => {
                      updateState({ selectedTool: tool });
                      setIsMenuOpen(false);
                    }}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Route Description</h2>
                  <RouteDescription
                    photo={currentPhoto}
                    description={state.projectDescription}
                    onDescriptionChange={handleProjectDescriptionChange}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Export / Import</h2>
                  <ExportImport
                    projectName={state.projectName}
                    photos={state.photos}
                    annotations={state.annotations}
                    onProjectImport={handleProjectImport}
                    onExportAsImage={handleExportAsImage}
                  />
                  <Button
                    variant="destructive"
                    className="w-full mt-4"
                    onClick={handleNewProject}
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">History</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={undo}
                      disabled={!(state.historyIndex > 0)}
                      className={`flex-1 p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${state.historyIndex > 0
                          ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 text-slate-300'
                          : 'border-slate-700 text-slate-600 cursor-not-allowed'
                        }`}
                      title="Undo last action"
                    >
                      <Undo className="h-4 w-4" />
                      <span className="text-sm">Undo</span>
                    </button>

                    <button
                      onClick={redo}
                      disabled={!(state.historyIndex < state.history.length - 1)}
                      className={`flex-1 p-3 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${state.historyIndex < state.history.length - 1
                          ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30 text-slate-300'
                          : 'border-slate-700 text-slate-600 cursor-not-allowed'
                        }`}
                      title="Redo last action"
                    >
                      <Redo className="h-4 w-4" />
                      <span className="text-sm">Redo</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Instructions</h2>
                  <div className="text-sm text-slate-300 space-y-2">
                    <p>Click and drag to move annotations. Tap to select.</p>
                    <div>
                      <p className="font-semibold text-slate-100">Touch Gestures</p>
                      <ul className="list-disc list-inside pl-2">
                        <li>Pinch to zoom in/out</li>
                        <li>Drag with two fingers to pan</li>
                        <li>Long press to delete annotation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Photo Viewer */}
        <div className="flex-1 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-30 lg:hidden bg-slate-900/70 hover:bg-slate-800/80 text-white rounded-full"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          {currentPhoto ? (
            <PhotoViewer
              photo={currentPhoto}
              annotations={currentPhotoAnnotations}
              selectedTool={state.selectedTool}
              selectedHoldType={state.selectedHoldType}
              selectedHandColor={state.selectedHandColor}
              selectedFootColor={state.selectedFootColor}
              selectedLineColor={state.selectedLineColor}
              selectedLineWidth={state.selectedLineWidth}
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
          {currentPhoto && state.selectedTool === 'hold' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-full z-20 w-full max-w-sm px-4 lg:max-w-md">
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 lg:p-4 border border-slate-700/50">
                <HoldSelector
                  selectedHoldType={state.selectedHoldType}
                  selectedHandColor={state.selectedHandColor}
                  selectedFootColor={state.selectedFootColor}
                  onHoldTypeSelect={(holdType) => updateState({ selectedHoldType: holdType, selectedTool: 'hold' })}
                  onHandColorSelect={(color) => updateState({ selectedHandColor: color })}
                  onFootColorSelect={(color) => updateState({ selectedFootColor: color })}
                />
              </div>
            </div>
          )}
          {currentPhoto && state.selectedTool === 'line' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-full z-20 px-4">
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 flex items-center gap-6">
                {/* Line Color Selection */}
                <div className="flex flex-wrap gap-2">
                  {[
                    '#f97316', // orange
                    '#ef4444', // red
                    '#10b981', // green
                    '#3b82f6', // blue
                    '#eab308', // yellow
                    '#ec4899', // pink
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => updateState({ selectedLineColor: color })}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${state.selectedLineColor === color
                          ? `border-white`
                          : 'border-slate-600 hover:border-slate-400'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Line Width Selection */}
                <div className="flex items-center gap-2">
                  {[3, 5, 8, 12].map((width) => (
                    <button
                      key={width}
                      onClick={() => updateState({ selectedLineWidth: width })}
                      title={`${width}px`}
                      className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all ${state.selectedLineWidth === width
                          ? "border-white"
                          : "border-slate-600 hover:border-slate-400"
                        }`}
                    >
                      <div
                        className="bg-white rounded-full"
                        style={{ width: `${width}px`, height: `${width}px` }}
                      ></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
