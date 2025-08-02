import React, { useRef } from 'react';
import JSZip from 'jszip';
import { useToast } from '../hooks/use-toast';
import type { Photo, Annotation } from '../types';

interface ProjectImporterProps {
  onProjectImport: (data: { projectName?: string; photos: Photo[]; annotations: Annotation[] }) => void;
  children: (importProject: () => void) => React.ReactNode;
}

type PhotoMetadata = Omit<Photo, 'file' | 'url'> & {
  fileName: string;
};

export async function processProjectZip(zipFile: Blob): Promise<{ projectName?: string; photos: Photo[]; annotations: Annotation[] }> {
  const zip = await JSZip.loadAsync(zipFile);
  const projectFile = zip.file('project.json');
  if (!projectFile) {
    throw new Error('project.json not found in the zip file.');
  }

  const projectDataStr = await projectFile.async('string');
  const projectData: { projectName?: string, photos: PhotoMetadata[], annotations: Annotation[] } = JSON.parse(projectDataStr);

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

  return { projectName: projectData.projectName, photos: importedPhotos, annotations: projectData.annotations };
}

export const ProjectImporter: React.FC<ProjectImporterProps> = ({ onProjectImport, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const projectData = await processProjectZip(file);
      onProjectImport(projectData);
      
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
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        className="hidden"
      />
      {children(handleImportClick)}
    </>
  );
};
