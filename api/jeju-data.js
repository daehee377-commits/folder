// Vercel 서버리스 함수: 공공데이터포털(odcloud) 인증키를 서버에서만 사용
const DATASET = 'https://api.odcloud.kr/api/15125100/v1/uddi:32a1b877-af20-4505-a76a-fd389ebd30ca'

export default async function handler(req, res) {
  const raw = process.env.ODCLOUD_SERVICE_KEY
  if (!raw) {
    return res.status(500).json({ error: 'ODCLOUD_SERVICE_KEY 환경변수가 설정되지 않았습니다.' })
  }
  // 포털에서 복사한 "Encoding" 키(%포함)와 "Decoding" 키 모두 허용
  const serviceKey = raw.includes('%') ? decodeURIComponent(raw) : raw

  const { page = '1', perPage = '100' } = req.query
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage), returnType: 'JSON', serviceKey })

  try {
    const r = await fetch(`${DATASET}?${params}`)
    if (!r.ok) return res.status(r.status).json({ error: `공공데이터 API 오류 (${r.status})` })
    const body = await r.json()
    res.setHeader?.('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.status(200).json({ total: body.totalCount ?? body.data?.length ?? 0, data: body.data ?? [] })
  } catch {
    res.status(502).json({ error: '공공데이터를 불러오지 못했습니다.' })
  }
}
