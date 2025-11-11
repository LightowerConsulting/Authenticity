
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
  "Initializing detection engines...",
  "Analyzing content structure...",
  "For video, this may take several minutes...",
  "Cross-referencing with AI models...",
  "Extracting digital artifacts...",
  "Compiling multi-source report...",
  "Finalizing authenticity score...",
  "Still working... Large files can take longer.",
];