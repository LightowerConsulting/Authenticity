import { ContentType } from './types';

export const MAX_TEXT_LENGTH = 10000;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 100;

export const CONTENT_TYPE_CONFIG = {
  [ContentType.TEXT]: {
    accept: '.txt',
    maxSize: MAX_TEXT_LENGTH,
    label: 'Paste text or upload a .txt file',
  },
  [ContentType.IMAGE]: {
    accept: 'image/jpeg, image/png',
    maxSize: MAX_IMAGE_SIZE_MB * 1024 * 1024,
    label: 'Upload a JPEG or PNG image',
  },
  [ContentType.VIDEO]: {
    accept: 'video/mp4',
    maxSize: MAX_VIDEO_SIZE_MB * 1024 * 1024,
    label: 'Upload an MP4 video',
  },
};

export const LOADING_MESSAGES = [
  "Initializing analysis engine...",
  "Analyzing content structure...",
  "Running content through Gemini model...",
  "Cross-referencing with known patterns...",
  "Extracting digital artifacts...",
  "Compiling analysis report...",
  "Finalizing authenticity score...",
  "This can take a moment for large files...",
];