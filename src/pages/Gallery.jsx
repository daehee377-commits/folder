import { useState } from 'react'
import { usePixabay } from '../hooks/usePixabay'

const CATEGORIES = [
  { label: '전체', q: 'jeju island' },
  { label: '돌하르방', q: 'dol hareubang jeju' },
  { label: '해녀', q: 'jeju haenyeo' },
  { label: '감귤', q: 'jeju tangerine' },
  { label: '한라산', q: 'hallasan' },
  { label: '오름', q: 'jeju oreum' },
  { label: '성산일출봉', q: 'seongsan ilchulbong' },
  { label: '유채꽃', q: 'jeju canola flower' },
]

export default function Gallery() {
  const [cat, setCat] = useState(CATEGORIES[0])
  const [selected, setSelected] = useState(null)
  const { hits, loading, error } = usePixabay(cat.q, 30)

  return (
    <section className="section">
      <h2>제주 갤러리</h2>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c.label} className={c === cat ? 'chip active' : 'chip'} onClick={() => setCat(c)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p className="center">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && hits.length === 0 && <p className="center">결과가 없습니다.</p>}

      <div className="grid">
        {hits.map((h) => (
          <button key={h.id} className="card" onClick={() => setSelected(h)}>
            <img src={h.preview} alt={h.tags} loading="lazy" />
          </button>
        ))}
      </div>

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={selected.large} alt={selected.tags} />
            <figcaption>
              {selected.tags} · by{' '}
              <a href={selected.pageURL} target="_blank" rel="noreferrer">{selected.user}</a> (Pixabay)
            </figcaption>
            <button className="btn" onClick={() => setSelected(null)}>닫기</button>
          </figure>
        </div>
      )}
    </section>
  )
}
