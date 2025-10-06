import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/shortie',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
