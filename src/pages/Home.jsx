import { Link } from 'react-router-dom'
import { usePixabay } from '../hooks/usePixabay'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const { hits, loading, error } = usePixabay('jeju island', 6)
  const hero = hits[0]

  return (
    <>
      <section
        className="hero"
        style={hero ? { backgroundImage: `linear-gradient(#0006,#0009), url(${hero.large})` } : undefined}
      >
        <h1>돌하르방부터 한라산까지</h1>
        <p>제주를 대표하는 이야기와 상징(IP)을 한곳에 모았습니다.</p>
        <Link to={user ? '/gallery' : '/signup'} className="btn">
          {user ? '갤러리 보러가기' : '무료로 시작하기'}
        </Link>
      </section>

      <section className="section">
        <h2>미리보기</h2>
        {loading && <p className="center">불러오는 중…</p>}
        {error && <p className="error">{error}</p>}
        <div className="grid">
          {hits.slice(1).map((h) => (
            <img key={h.id} src={h.preview} alt={h.tags} loading="lazy" />
          ))}
        </div>
        {!user && <p className="center">전체 갤러리는 로그인 후 이용할 수 있어요.</p>}
      </section>
    </>
  )
}
