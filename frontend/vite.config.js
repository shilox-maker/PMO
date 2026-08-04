import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Librerías Azure MSAL — separadas para cacheo independiente
          if (id.includes('@azure/msal')) return 'vendor-msal';
          // Recharts — librería de gráficos pesada
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          // Quill editor
          if (id.includes('quill') || id.includes('react-quill')) return 'vendor-quill';
          // React core y router — siempre necesarios
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          // Resto de node_modules como vendor genérico
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})
