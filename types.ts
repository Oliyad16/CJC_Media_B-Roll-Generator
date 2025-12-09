export interface Scene {
  id: string;
  segmentText: string;
  visualIdea: string;
  imagePrompt: string;
  generatedImageUrl?: string;
  isGeneratingImage: boolean;
  generatedVideoUrl?: string;
  isGeneratingVideo: boolean;
}

export interface AnalysisResponseItem {
  segment: string;
  visualIdea: string;
  imagePrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR'
}