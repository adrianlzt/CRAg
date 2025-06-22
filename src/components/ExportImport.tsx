import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Upload, Image as ImageIcon } from 'lucide-react';

import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import type { Photo, Annotation } from '../App';
import { ProjectImporter } from './ProjectImporter';

interface ExportImportProps {
  projectName: string;
  photos: Photo[];
  annotations: Annotation[];
  onProjectImport: (data: { photos: Photo[]; annotations: Annotation[] }) => void;
  onExportAsImage: () => void;
}

type PhotoMetadata = Omit<Photo, 'file' | 'url'> & {
  fileName: string;
};

export const ExportImport: React.FC<ExportImportProps> = ({
  projectName,
  photos,
  annotations,
  onProjectImport,
  onExportAsImage,
}) => {
  const { toast } = useToast();

  const handleExportProject = async () => {
    if (photos.length === 0) {
      toast({
        title: 'Export Error',
        description: 'There are no photos to export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const zip = new JSZip();

      const photosMetadata: PhotoMetadata[] = photos.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        fileName: p.file.name,
      }));

      const projectData = {
        version: '1.1-zip',
        timestamp: new Date().toISOString(),
        photos: photosMetadata,
        annotations,
      };

      zip.file('project.json', JSON.stringify(projectData, null, 2));

      const imagesFolder = zip.folder('images');
      if (imagesFolder) {
        for (const photo of photos) {
          imagesFolder.file(photo.file.name, photo.file);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const safeProjectName = (projectName || 'climb-route-project').replace(/[\s/\\?%*:|"<>]/g, '_');
      saveAs(zipBlob, `${safeProjectName}.zip`);
      
      toast({
        title: 'Export Successful',
        description: 'Your project has been downloaded as a .zip file.',
      });
    } catch (error) {
      console.error('Failed to export project:', error);
      toast({
        title: 'Export Failed',
        description: 'Something went wrong while exporting your project.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExportProject}
        variant="secondary"
        className="w-full"
        disabled={photos.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export Project
      </Button>
      <Button
        onClick={onExportAsImage}
        variant="secondary"
        className="w-full"
        disabled={photos.length === 0}
      >
        <ImageIcon className="mr-2 h-4 w-4" />
        Export as Image
      </Button>
      <ProjectImporter onProjectImport={onProjectImport}>
        {(importProject) => (
          <Button
            onClick={importProject}
            variant="secondary"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Project
          </Button>
        )}
      </ProjectImporter>
      <p className="text-xs text-slate-500 pt-2 text-center">
        Save project or export a shareable image.
      </p>
    </div>
  );
};
