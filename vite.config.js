import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

// Standardized configuration tailored for clean Supabase routing
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});