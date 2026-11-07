import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/web',
  plugins: [react()],
  server: {
    port: 10610,
    strictPort: true,
    proxy: { '/api': 'http://localhost:10600' },
  },
  build: { outDir: '../../dist/web', emptyOutDir: true },
});
