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
  id: string;
  name: string;
  icon: string;
  category: 'hand' | 'foot' | 'knee';
}

export interface AppState {
  projectName: string;
  projectDescription: string;
  photos: Photo[];
  currentPhotoIndex: number;
  annotations: Annotation[];
  selectedTool: 'hold' | 'line' | 'text';
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedKneeColor: 'purple' | 'pink';
  selectedLineColor: string;
  selectedLineWidth: number;
  isDrawing: boolean;
  history: Annotation[][];
  historyIndex: number;
}
