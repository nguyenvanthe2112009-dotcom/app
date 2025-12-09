export interface ThumbnailState {
  isLoading: boolean;
  generatedImage: string | null;
  error: string | null;
}

export interface PromptInputs {
  title: string;
  description: string;
  style: string;
  aspectRatio: string;
}

export enum ImageAspectRatio {
  SQUARE = "1:1",
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16"
}