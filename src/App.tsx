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
import { useAppState } from './hooks/useAppState';
import { exportAsImage } from './lib/image-export';
export type { Photo, Annotation, HoldType } from './types';
import './index.css';

function App() {
  const {
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
  } = useAppState();

  const { toast } = useToast();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExportAsImage = useCallback(async () => {
    await exportAsImage(state, toast);
  }, [state, toast]);

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
        isVisible={true}
        projectName={state.projectName}
        onProjectNameChange={(name) => updateState({ projectName: name })}
      />

      <div className={`flex-1 flex overflow-hidden transition-all duration-300 ease-in-out pt-[73px] lg:pt-0`}>
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
                  <div className="flex space-x-2 mt-4">
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
                  <h2 className="text-lg font-semibold mb-4 text-orange-400">Instructions</h2>
                  <div className="text-sm text-slate-300 space-y-2">
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>To add a hold, text or draw a line, select the appropiate tool and touch, or drag for lines, in the image.</li>
                      <li>Long press to select holds or text to move, resize or rotate.</li>
                      <li>Double tap to delete holds, texts or lines.</li>
                      <li>Pinch to zoom.</li>
                    </ul>
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
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 lg:max-w-md">
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
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 lg:max-w-md">
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 lg:p-4 border border-slate-700/50 flex items-center justify-center gap-6">
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
