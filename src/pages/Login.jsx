import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      setError(
        error.message.includes('Email not confirmed')
          ? '이메일 인증이 아직 완료되지 않았습니다. 메일함을 확인해주세요.'
          : '이메일 또는 비밀번호가 올바르지 않습니다.',
      )
      return
    }
    navigate(location.state?.from || '/gallery', { replace: true })
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>로그인</h2>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
      <p>계정이 없나요? <Link to="/signup">회원가입</Link></p>
    </form>
  )
}
