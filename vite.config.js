import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: parseInt(process.env.PORT) || 4173,
        host: '0.0.0.0',
        strictPort: false,
        allowedHosts: [
            'snapliweb-production.up.railway.app',
            'snapliweb-production.up.railway.app',
            '.railway.app',
            'localhost',
        ],
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
    },
})
