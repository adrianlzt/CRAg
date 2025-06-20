import React, { useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Upload } from 'lucide-react';

import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import type { Photo, Annotation } from '../App';

interface ExportImportProps {
  photos: Photo[];
  annotations: Annotation[];
  onProjectImport: (data: { photos: Photo[]; annotations: Annotation[] }) => void;
}

type PhotoMetadata = Omit<Photo, 'file' | 'url'> & {
  fileName: string;
};

export const ExportImport: React.FC<ExportImportProps> = ({
  photos,
  annotations,
  onProjectImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      saveAs(zipBlob, 'climb-route-project.zip');
      
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const projectFile = zip.file('project.json');
      if (!projectFile) {
        throw new Error('project.json not found in the zip file.');
      }

      const projectDataStr = await projectFile.async('string');
      const projectData: { photos: PhotoMetadata[], annotations: Annotation[] } = JSON.parse(projectDataStr);

      const imagesFolder = zip.folder('images');
      if (!imagesFolder) {
        throw new Error('images folder not found in the zip file.');
      }

      const importedPhotos: Photo[] = await Promise.all(
        projectData.photos.map(async (photoMeta) => {
          const imageFileInZip = imagesFolder.file(photoMeta.fileName);
          if (!imageFileInZip) {
            throw new Error(`Image file ${photoMeta.fileName} not found in zip.`);
          }
          const imageBlob = await imageFileInZip.async('blob');
          const newImageFile = new File([imageBlob], photoMeta.fileName, { type: imageBlob.type });

          return {
            id: photoMeta.id,
            name: photoMeta.name,
            description: photoMeta.description,
            file: newImageFile,
            url: URL.createObjectURL(newImageFile),
          };
        })
      );

      onProjectImport({ photos: importedPhotos, annotations: projectData.annotations });
      
      toast({
        title: 'Import Successful',
        description: 'Your project has been loaded.',
      });

    } catch (error) {
      console.error('Failed to import project:', error);
      toast({
        title: 'Import Failed',
        description: (error as Error).message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={handleExportProject}
        variant="outline"
        className="w-full"
        disabled={photos.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export Project
      </Button>
      <Button
        onClick={handleImportClick}
        variant="outline"
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        Import Project
      </Button>
      <p className="text-xs text-slate-500 pt-2 text-center">
        Save or load project as a .zip file.
      </p>
    </div>
  );
};
