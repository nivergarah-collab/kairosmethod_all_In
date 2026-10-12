import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La base se pasa por CLI en el despliegue: npm run build -- --base=/<ruta>/pomodoro-paridad/
export default defineConfig({
  plugins: [react()],
});
