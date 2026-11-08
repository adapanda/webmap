import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/geoserver': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})