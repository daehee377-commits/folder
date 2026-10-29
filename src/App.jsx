import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
const Map3D = lazy(() => import('./pages/Map3D'))
import { useAuth } from './context/AuthContext'
import { supabaseReady } from './lib/supabase'

function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="center">불러오는 중…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      {!supabaseReady && (
        <div className="warn">
          Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/gallery" element={<Protected><Gallery /></Protected>} />
          <Route path="/map" element={<Suspense fallback={<p className="center">3D 지도 불러오는 중…</p>}><Map3D /></Suspense>} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Protected><Cart /></Protected>} />
          <Route path="/account" element={<Protected><Account /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer>
        이미지 출처:{' '}
        <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a>
      </footer>
    </>
  )
}
