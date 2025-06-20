import React, { useState, useCallback } from 'react';
import { PhotoUpload } from './components/PhotoUpload';
import { PhotoViewer } from './components/PhotoViewer';
import { HoldSelector } from './components/HoldSelector';
import { DrawingTools } from './components/DrawingTools';
import { ExportImport } from './components/ExportImport';
import { Header } from './components/Header';
import { RouteDescription } from './components/RouteDescription';
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
  isDrawing: boolean;
  history: Annotation[][];
  historyIndex: number;
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
    isDrawing: false,
    history: [[]],
    historyIndex: 0,
  });

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

  const currentPhoto = state.photos[state.currentPhotoIndex];
  const currentPhotoAnnotations = state.annotations.filter(
    a => a.photoId === currentPhoto?.id
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Header />
      
      <div className="flex flex-col lg:flex-row h-full">
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
                    onHoldTypeSelect={(holdType) => updateState({ selectedHoldType: holdType, selectedTool: 'hold' })}
                    onHandColorSelect={(color) => updateState({ selectedHandColor: color })}
                    onFootColorSelect={(color) => updateState({ selectedFootColor: color })}
                    onLineColorSelect={(color) => updateState({ selectedLineColor: color })}
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
                    currentPhoto={currentPhoto}
                    onImport={(data) => {
                      const { annotations: importedAnnotations, photos: importedPhotos } = data;
                      const newHistory = state.history.slice(0, state.historyIndex + 1);
                      newHistory.push(importedAnnotations);

                      let newPhotos = state.photos;
                      if (importedPhotos) {
                        newPhotos = state.photos.map(p => {
                          const importedPhoto = importedPhotos.find(ip => ip.id === p.id || ip.name === p.name);
                          if (importedPhoto) {
                            return { ...p, description: importedPhoto.description };
                          }
                          return p;
                        });
                      }

                      updateState({
                        annotations: importedAnnotations,
                        photos: newPhotos,
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                      });
                    }}
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
              onAnnotationAdd={addAnnotation}
              onAnnotationUpdate={updateAnnotation}
              onAnnotationRemove={removeAnnotation}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-800/30">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🧗‍♂️</div>
                <h2 className="text-2xl font-bold mb-2 text-slate-300">Ready to Annotate Routes</h2>
                <p className="text-slate-400">Upload photos to start marking your climbing routes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
