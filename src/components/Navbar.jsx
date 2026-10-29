import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">🍊 제주 IP 아카이브</Link>
      <nav>
        <NavLink to="/gallery">갤러리</NavLink>
        {user ? (
          <>
            <NavLink to="/account">내 계정</NavLink>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <NavLink to="/login">로그인</NavLink>
            <NavLink to="/signup" className="cta">회원가입</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
