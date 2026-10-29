import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 개발(npm run dev)에서도 Vercel 서버리스 함수(api/*.js)를 흉내 내는 플러그인
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/pixabay', async (req, res) => {
        process.env.PIXABAY_API_KEY = env.PIXABAY_API_KEY
        const url = new URL(req.url, 'http://localhost')
        const mod = await server.ssrLoadModule('/api/pixabay.js')
        const shim = {
          status(code) {
            res.statusCode = code
            return shim
          },
          json(body) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          },
        }
        await mod.default({ query: Object.fromEntries(url.searchParams) }, shim)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), localApi(env)] }
})
