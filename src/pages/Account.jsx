import { useAuth } from '../context/AuthContext'

export default function Account() {
  const { user } = useAuth()
  return (
    <section className="form">
      <h2>내 계정</h2>
      <p><b>이메일</b><br />{user.email}</p>
      <p><b>가입일</b><br />{new Date(user.created_at).toLocaleString('ko-KR')}</p>
    </section>
  )
}
