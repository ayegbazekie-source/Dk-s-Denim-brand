import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// Standardized configuration tailored for clean Supabase routing
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

