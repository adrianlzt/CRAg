import { useState, useCallback, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { AppState, Photo, Annotation } from '../types';
import { useToast } from './use-toast';

const initialState: AppState = {
  projectName: 'Climbing Route Project',
  projectDescription: '',
  photos: [],
  currentPhotoIndex: 0,
  annotations: [],
  selectedTool: 'hold',
  selectedHoldType: null,
  selectedHandColor: 'red',
  selectedFootColor: 'blue',
  selectedLineColor: '#f97316',
  selectedLineWidth: 3,
  isDrawing: false,
  history: [[]],
  historyIndex: 0,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
            selectedTool: 'hold',
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
        // Create a savable state without photo URLs and with fresh File objects
        const savablePhotos = await Promise.all(
          state.photos.map(async ({ url, file, ...rest }) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return {
              ...rest,
              file: new File([blob], file.name, { type: file.type, lastModified: file.lastModified }),
            };
          })
        );
        const savableState = {
          ...state,
          photos: savablePhotos,
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

  const handleProjectImport = useCallback((data: { projectName?: string; photos: Photo[]; annotations: Annotation[] }) => {
    setState(prev => {
      // Clean up old photo URLs to prevent memory leaks
      prev.photos.forEach(p => URL.revokeObjectURL(p.url));

      const { projectName, photos: importedPhotos, annotations: importedAnnotations } = data;

      return {
        ...prev,
        projectName: projectName !== undefined ? projectName : prev.projectName,
        photos: importedPhotos,
        annotations: importedAnnotations,
        currentPhotoIndex: importedPhotos.length > 0 ? 0 : 0,
        history: [importedAnnotations],
        historyIndex: 0,
        selectedTool: 'hold',
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

  return {
    state,
    isLoading,
    updateState,
    addPhotos,
    removePhoto,
    reorderPhotos,
    handleProjectDescriptionChange,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    undo,
    redo,
    handleProjectImport,
    handleNewProject,
  };
}
