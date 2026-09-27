import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tauri from '@tauri-apps/vite-plugin-tauri';

export default defineConfig({
  plugins: [
    svelte(),
    tauri()
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@tauri-apps/api', '@tauri-apps/plugin-sql']
        }
      }
    }
  }
});
