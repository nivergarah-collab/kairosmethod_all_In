import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El parámetro --base lo entrega infra/scripts/build-site.sh (GitHub Pages).
export default defineConfig({
  plugins: [react()],
});
