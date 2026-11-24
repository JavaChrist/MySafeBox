import { readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { renameStorageObject } from './server/renameStorage.js'
import { readStorageText } from './server/readStorageText.js'
import { readStorageDocx } from './server/readStorageDocx.js'
import { readStorageSheet } from './server/readStorageSheet.js'

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

function storageApiPlugin(
  route: string,
  handle: (body: Record<string, unknown>) => Promise<{
    status: number
    body?: unknown
    binary?: Buffer
    contentType?: string
  }>,
  fallback: string
): Plugin {
  return {
    name: `storage-api-${route}`,
    configureServer(server) {
      server.middlewares.use(route, async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        try {
          const body = await readJson(req)
          const result = await handle(body)
          res.statusCode = result.status
          res.setHeader('Cache-Control', 'no-store')
          if (result.binary) {
            res.setHeader('Content-Type', result.contentType || 'application/octet-stream')
            res.end(result.binary)
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: fallback }))
        }
      })
    }
  }
}

const SW_BUILD_PLACEHOLDER = '__MYSAFEBOX_BUILD_ID__'

function makeBuildId(command: 'build' | 'serve'): string {
  if (command === 'serve') return 'dev'
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  return commit ? `${commit}-${stamp}` : stamp
}

// sw.js doit changer à chaque déploiement, sinon le navigateur ne détecte jamais de nouvelle version.
function versionPlugin(buildId: string): Plugin {
  const source = JSON.stringify({ buildId })
  let outDir = 'dist'
  return {
    name: 'mysafebox-version',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/version.json') {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(source)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source })
    },
    writeBundle() {
      const swPath = resolve(outDir, 'sw.js')
      const sw = readFileSync(swPath, 'utf8')
      if (!sw.includes(SW_BUILD_PLACEHOLDER)) {
        throw new Error('public/sw.js ne contient plus le repère de version')
      }
      writeFileSync(swPath, sw.split(SW_BUILD_PLACEHOLDER).join(buildId))
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const buildId = makeBuildId(command)
  return {
    define: {
      __BUILD_ID__: JSON.stringify(buildId)
    },
    plugins: [
      react(),
      versionPlugin(buildId),
      storageApiPlugin('/api/rename-storage', renameStorageObject, 'Impossible de renommer cet élément'),
      storageApiPlugin('/api/preview-text', readStorageText, 'Impossible d\'afficher ce fichier'),
      storageApiPlugin('/api/preview-docx', readStorageDocx, 'Impossible d\'afficher ce document'),
      storageApiPlugin('/api/preview-sheet', readStorageSheet, 'Impossible d\'afficher ce classeur')
    ],
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
  }
})
