import { useEffect, useRef, useState } from 'react'
import { createJejuScene, PRESETS } from '../three/jejuScene'
import { isInJeju } from '../three/geo'

const LAYERS = [
  { key: 'spot', label: '관광지', color: '#e5484d' },
  { key: 'oreum', label: '오름', color: '#2f9e44' },
  { key: 'olle', label: '올레길(개념도)', color: '#ff5a3c' },
  { key: 'port', label: '항·포구', color: '#1c7ed6' },
  { key: 'orchard', label: '감귤 재배지', color: '#ff8c1a' },
  { key: 'wind', label: '풍력발전기', color: '#adb5bd' },
  { key: 'lighthouse', label: '등대', color: '#f59f00' },
  { key: 'dol', label: '돌하르방', color: '#4b4742' },
  { key: 'opendata', label: '공공데이터', color: '#15aabf' },
]

// 공공데이터 응답에서 위도/경도 필드를 찾아 지도 포인트로 변환
function extractPoints(records) {
  const points = []
  for (const r of records) {
    const keys = Object.keys(r)
    const latKey = keys.find((k) => /위도|lat/i.test(k))
    const lngKey = keys.find((k) => /경도|lng|lon/i.test(k))
    if (!latKey || !lngKey) continue
    const lat = parseFloat(r[latKey])
    const lng = parseFloat(r[lngKey])
    if (!isInJeju(lat, lng)) continue
    const nameKey = keys.find((k) => /명$|명칭|name|title|제목/i.test(k)) ?? keys[0]
    points.push({ lat, lng, title: String(r[nameKey]), desc: '', extra: r })
  }
  return points
}

export default function Map3D() {
  const box = useRef(null)
  const api = useRef(null)
  const [visible, setVisible] = useState(() => Object.fromEntries(LAYERS.map((l) => [l.key, true])))
  const [selected, setSelected] = useState(null)
  const [auto, setAuto] = useState(false)
  const [dataStatus, setDataStatus] = useState('공공데이터 불러오는 중…')

  useEffect(() => {
    const scene = createJejuScene(box.current, { onPick: setSelected })
    api.current = scene

    let cancelled = false
    fetch('/api/jeju-data?perPage=300')
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error || '요청 실패')
        if (cancelled) return
        const pts = extractPoints(body.data)
        scene.addOpenData(pts)
        setDataStatus(
          pts.length
            ? `공공데이터 ${pts.length}건을 지도에 표시했습니다.`
            : `공공데이터 ${body.data.length}건을 받았지만 좌표(위도/경도) 필드가 없어 표시하지 못했습니다.`,
        )
      })
      .catch((e) => !cancelled && setDataStatus(`공공데이터 미표시: ${e.message}`))

    return () => {
      cancelled = true
      scene.dispose()
      api.current = null
    }
  }, [])

  const toggle = (key) => {
    const v = !visible[key]
    setVisible((s) => ({ ...s, [key]: v }))
    api.current?.setLayerVisible(key, v)
  }

  return (
    <div className="map3d">
      <div ref={box} className="stage" />

      <aside className="panel left">
        <h3>레이어</h3>
        {LAYERS.map((l) => (
          <label key={l.key} className="layer">
            <input type="checkbox" checked={visible[l.key]} onChange={() => toggle(l.key)} />
            <i style={{ background: l.color }} /> {l.label}
          </label>
        ))}
        <h3>바로가기</h3>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.label} className="chip" onClick={() => api.current?.flyTo(p, p.dist)}>
              {p.label}
            </button>
          ))}
          <button className="chip" onClick={() => api.current?.resetView()}>전체</button>
        </div>
        <label className="layer">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => {
              setAuto(e.target.checked)
              api.current?.setAutoRotate(e.target.checked)
            }}
          />
          자동 회전
        </label>
        <p className="hint">드래그: 회전 · 휠/핀치: 확대 · 우클릭 드래그: 이동 · 핀 클릭: 상세</p>
      </aside>

      {selected && (
        <aside className="panel right">
          <button className="close" onClick={() => setSelected(null)} aria-label="닫기">×</button>
          <h3>{selected.title}</h3>
          {selected.desc && <p>{selected.desc}</p>}
          {selected.lat && <p className="hint">위도 {selected.lat} · 경도 {selected.lng}</p>}
          {selected.extra && (
            <dl>
              {Object.entries(selected.extra).slice(0, 8).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
          )}
        </aside>
      )}

      <div className="status">
        {dataStatus} · 지형은 개념도(높이 약 3.4배 과장)이며 위치는 근사값입니다.
      </div>
    </div>
  )
}
