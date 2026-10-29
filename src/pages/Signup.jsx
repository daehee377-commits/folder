import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.')

    setBusy(true)
    const { data, error } = await signUp(email, password)
    setBusy(false)
    if (error) return setError(error.message)

    // 이메일 인증을 끈 프로젝트는 바로 세션이 생성됨
    if (data.session) navigate('/gallery', { replace: true })
    else setNotice('인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.')
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>회원가입</h2>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input type="password" placeholder="비밀번호 확인" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      {notice && <p className="ok">{notice}</p>}
      <button className="btn" disabled={busy}>{busy ? '처리 중…' : '가입하기'}</button>
      <p>이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </form>
  )
}
