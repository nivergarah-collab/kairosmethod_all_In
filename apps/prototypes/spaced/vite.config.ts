import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  // Rutas relativas: el build se despliega bajo una subruta (GitHub Pages, ref/) y
  // no en la raíz del dominio.
  base: './',
  plugins: [react()],
  server: {
    // Igual que el hub: HMR se desactiva con DISABLE_HMR (evita parpadeos
    // cuando un agente edita archivos en AI Studio).
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
