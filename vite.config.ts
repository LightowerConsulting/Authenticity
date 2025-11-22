import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Vercel injects environment variables into process.env, but loadEnv loads from .env files.
  // We need to check both.
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // This is critical: it replaces `process.env.API_KEY` in the client code 
      // with the actual value from your environment variables during the build.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});