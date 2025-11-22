/// <reference types="vite/client" />

// Define global constant replaced by Vite at build time
declare const __GEMINI_API_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}