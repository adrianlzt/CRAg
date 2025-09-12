import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { X, Folder, ChevronRight } from 'lucide-react';
import { listProjects } from '../lib/api';

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

interface ProjectLoaderProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (projectId: string) => void;
}

export const ProjectLoader: React.FC<ProjectLoaderProps> = ({ isOpen, onClose, onProjectSelect }) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const projects = await listProjects();
          setProjects(projects);
        } catch (err) {
          setError((err as Error).message || 'Failed to load projects.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4 text-orange-400">Load Project</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
          {isLoading ? (
            <p className="text-slate-400">Loading projects...</p>
          ) : projects.length > 0 ? (
            projects.map(project => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-slate-400">
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </div>
            ))
          ) : (
            <p className="text-slate-400">No saved projects found.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
