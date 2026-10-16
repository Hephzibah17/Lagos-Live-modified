import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
          signup: path.resolve(__dirname, 'sign-up.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          weather: path.resolve(__dirname, 'weather.html'),
          transport: path.resolve(__dirname, 'transport.html'),
          events: path.resolve(__dirname, 'events.html'),
          explore: path.resolve(__dirname, 'explore.html'),
          emergency: path.resolve(__dirname, 'emergency.html'),
          saved: path.resolve(__dirname, 'saved.html'),
          settings: path.resolve(__dirname, 'settings.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
