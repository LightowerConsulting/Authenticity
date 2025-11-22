import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Use '.' instead of process.cwd() to avoid potential path issues.
  const env = loadEnv(mode, '.', '');
  
  // Priority: Vercel System Env (GEMINI_API_KEY) > .env file (GEMINI_API_KEY) > Fallbacks
  // We default to '' to ensure JSON.stringify never receives undefined.
  const rawApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define a global constant for the API Key.
      // This bypasses 'import.meta.env' issues entirely by replacing the variable at compile time.
      // We explicitly stringify it here.
      __GEMINI_API_KEY__: JSON.stringify(rawApiKey),
    },
  };
});