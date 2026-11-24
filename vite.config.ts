import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { renameStorageObject } from './server/renameStorage.js'

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString()
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function storageRenamePlugin(): Plugin {
  return {
    name: 'storage-rename',
    configureServer(server) {
      server.middlewares.use('/api/rename-storage', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        try {
          const body = await readJson(req)
          const result = await renameStorageObject(body)
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Impossible de renommer cet élément' }))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), storageRenamePlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    },
    proxy: {
      '/webapi': {
        target: 'http://192.168.1.82:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    }
  },
  css: {
    devSourcemap: true
  }
})
