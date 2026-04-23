import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const treatJsFilesAsJsx = {
  name: 'treat-js-files-as-jsx',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\/src\/.*\.js$/.test(id)) {
      return null;
    }

    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic',
    });
  },
};

export default defineConfig({
  plugins: [treatJsFilesAsJsx, react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
});
