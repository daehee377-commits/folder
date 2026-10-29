import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 개발(npm run dev)에서도 Vercel 서버리스 함수(api/*.js)를 흉내 내는 플러그인
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace(/^\/+/, '')
        if (!/^[\w-]+$/.test(name)) {
          res.statusCode = 404
          return res.end()
        }
        Object.assign(process.env, env)
        const shim = {
          status(code) {
            res.statusCode = code
            return shim
          },
          setHeader: (k, v) => res.setHeader(k, v),
          json(body) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          },
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          await mod.default({ query: Object.fromEntries(url.searchParams) }, shim)
        } catch (e) {
          shim.status(500).json({ error: String(e.message || e) })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), localApi(env)] }
})
