// Vercel 서버리스 함수: Pixabay API 키를 브라우저에 노출하지 않도록 서버에서 대신 호출
export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' })
  }

  const { q = 'jeju island', page = '1', per_page = '24' } = req.query
  const params = new URLSearchParams({
    key,
    q: String(q).slice(0, 100),
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    page: String(page),
    per_page: String(per_page),
  })

  try {
    const r = await fetch(`https://pixabay.com/api/?${params}`)
    if (!r.ok) return res.status(r.status).json({ error: `Pixabay 오류 (${r.status})` })
    const data = await r.json()
    const hits = data.hits.map((h) => ({
      id: h.id,
      preview: h.webformatURL,
      large: h.largeImageURL,
      tags: h.tags,
      user: h.user,
      pageURL: h.pageURL,
    }))
    res.status(200).json({ total: data.totalHits, hits })
  } catch (e) {
    res.status(502).json({ error: '이미지를 불러오지 못했습니다.' })
  }
}
