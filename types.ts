export enum ContentType {
  TEXT = 'Text',
  IMAGE = 'Image',
  VIDEO = 'Video',
}

export interface ApiDetail {
  provider: string;
  score: number;
  details: string[];
}

export interface ScanResult {
  overallScore: number;
  contentType: ContentType;
  analysis: ApiDetail[];
  manualInspectionTips: string[];
  fileName?: string;
}