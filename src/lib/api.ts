import { AppState, Photo, Annotation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function listProjects() {
  const response = await fetch(`${API_URL}/projects`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function getProject(projectId: string) {
  const response = await fetch(`${API_URL}/projects/${projectId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to fetch project ${projectId}` }));
    throw new Error(errorData.message);
  }
  return response.json();
}

type ProjectPayload = {
  projectName: string;
  projectDescription: string;
  photos: (Omit<Photo, 'file' | 'url'> & { url?: string })[];
  annotations: Annotation[];
};

export async function saveProject(state: AppState, projectId: string | null) {
  const formData = new FormData();

  const newPhotos: Photo[] = [];
  const existingPhotos: (Omit<Photo, 'file' | 'url'> & { url?: string })[] = [];

  state.photos.forEach(photo => {
    // A photo is new if its URL is a local blob URL.
    if (photo.url.startsWith('blob:')) {
      newPhotos.push(photo);
    } else {
      const { file, url, ...rest } = photo;
      existingPhotos.push({ ...rest, url });
    }
  });

  const projectPayload: ProjectPayload = {
    projectName: state.projectName,
    projectDescription: state.projectDescription,
    annotations: state.annotations,
    photos: [
      ...existingPhotos,
      // For new photos, we only send metadata. The file is sent separately.
      ...newPhotos.map(({ file, url, ...rest }) => rest),
    ],
  };

  formData.append('project', JSON.stringify(projectPayload));

  newPhotos.forEach(photo => {
    formData.append(photo.id, photo.file);
  });

  const url = projectId
    ? `${API_URL}/projects/${projectId}`
    : `${API_URL}/projects`;
  const method = projectId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to save project' }));
    throw new Error(errorData.message);
  }

  return response.json();
}
