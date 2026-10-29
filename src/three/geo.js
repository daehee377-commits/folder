// 제주 개념도용 지형/좌표 데이터. 1 unit ≈ 1km, 높이는 약 3.4배 과장.
export const A = 38.5 // 장축 반경 (동-서)
export const B = 15.5 // 단축 반경 (남-북)
const TILT = (14 * Math.PI) / 180 // 섬의 장축은 동북동으로 기울어져 있음
const COS = Math.cos(TILT)
const SIN = Math.sin(TILT)
const LAT0 = 33.38
const LNG0 = 126.56

export const toXZ = (lat, lng) => ({ x: (lng - LNG0) * 93, z: -(lat - LAT0) * 111 })
const toUV = (x, z) => ({ u: x * COS - z * SIN, v: x * SIN + z * COS })
export const fromUV = (u, v) => ({ x: u * COS + v * SIN, z: -u * SIN + v * COS })
export const isInJeju = (lat, lng) => lat > 33.0 && lat < 33.7 && lng > 126.0 && lng < 127.1

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const wob = (x, z) =>
  Math.sin(x * 0.35) * Math.cos(z * 0.45) * 0.5 + Math.sin(x * 0.9 + z * 0.7) * 0.3 + Math.sin(x * 1.7 - z * 1.3) * 0.15

export const HALLA = toXZ(33.362, 126.533)

// 이름 있는 오름/화산체 (높이·폭 지정) + 무작위 소형 오름(제주에는 360여 개)
const NAMED_OREUMS = [
  { lat: 33.454, lng: 126.819, h: 0.7, s: 0.9 }, // 다랑쉬
  { lat: 33.366, lng: 126.357, h: 0.7, s: 0.9 }, // 새별
  { lat: 33.443, lng: 126.83, h: 0.55, s: 0.8 }, // 용눈이
  { lat: 33.431, lng: 126.687, h: 0.6, s: 1.0 }, // 산굼부리
  { lat: 33.2397, lng: 126.314, h: 1.2, s: 0.7 }, // 산방산
  { lat: 33.458, lng: 126.9425, h: 0.9, s: 0.55 }, // 성산일출봉
].map((o) => ({ ...toXZ(o.lat, o.lng), h: o.h, s: o.s }))

const OREUMS = [...NAMED_OREUMS]
{
  const rand = mulberry32(7)
  while (OREUMS.length < 76) {
    const u = (rand() * 2 - 1) * A * 0.85
    const v = (rand() * 2 - 1) * B * 0.85
    if (Math.hypot(u / A, v / B) > 0.85) continue
    const { x, z } = fromUV(u, v)
    if (Math.hypot(x - HALLA.x, z - HALLA.z) < 4.5) continue
    OREUMS.push({ x, z, h: 0.25 + rand() * 0.4, s: 0.6 + rand() * 0.8 })
  }
}

export function heightAt(x, z) {
  const { u, v } = toUV(x, z)
  const d = Math.hypot(u / A, v / B) + wob(x, z) * 0.03
  const base = 0.97 - d
  if (base <= 0) return Math.max(base * 14, -1.6)
  const edge = smooth(0, 0.06, base)
  let y = Math.pow(base, 1.15) * 1.5
  const dh = (x - HALLA.x) ** 2 + (z - HALLA.z) ** 2
  y += 5.0 * Math.exp(-dh / (2 * 3.8 * 3.8))
  y -= 0.45 * Math.exp(-dh / (2 * 0.55 * 0.55)) // 백록담
  for (const o of OREUMS) {
    const dd = (x - o.x) ** 2 + (z - o.z) ** 2
    if (dd < 36) y += o.h * Math.exp(-dd / (2 * o.s * o.s))
  }
  y += wob(x * 2, z * 2) * 0.1 * edge
  return y * edge
}

export function snapToLand(x, z, min = 0.06) {
  let px = x
  let pz = z
  for (let i = 0; i < 80 && heightAt(px, pz) < min; i++) {
    px *= 0.985
    pz *= 0.985
  }
  return { x: px, z: pz }
}

// 해안선(d≈0.965)을 따라 도는 점들
export function coastPoint(theta, r = 0.965) {
  return fromUV(A * r * Math.cos(theta), B * r * Math.sin(theta))
}

export const SPOTS = [
  { name: '한라산 백록담', cat: 'spot', lat: 33.3617, lng: 126.5292, desc: '해발 1,947m, 대한민국 최고봉이자 화산 분화구 호수.' },
  { name: '성산일출봉', cat: 'spot', lat: 33.458, lng: 126.9425, desc: '바다에서 솟은 수성화산체. 일출 명소.' },
  { name: '만장굴', cat: 'spot', lat: 33.5283, lng: 126.7714, desc: '세계적 규모의 용암동굴.' },
  { name: '천지연폭포', cat: 'spot', lat: 33.2467, lng: 126.5553, desc: '서귀포 시내의 대표 폭포.' },
  { name: '정방폭포', cat: 'spot', lat: 33.244, lng: 126.571, desc: '바다로 곧장 떨어지는 폭포.' },
  { name: '협재해수욕장', cat: 'spot', lat: 33.394, lng: 126.2397, desc: '에메랄드빛 바다와 비양도 전망.' },
  { name: '용두암', cat: 'spot', lat: 33.5159, lng: 126.5117, desc: '용머리를 닮은 해안 암석.' },
  { name: '섭지코지', cat: 'spot', lat: 33.424, lng: 126.93, desc: '붉은 화산송이 해안 절벽 곶.' },
  { name: '주상절리대', cat: 'spot', lat: 33.2378, lng: 126.4258, desc: '육각 기둥 모양의 현무암 절벽.' },
  { name: '비자림', cat: 'spot', lat: 33.49, lng: 126.804, desc: '수백 년 된 비자나무 숲.' },
  { name: '우도', cat: 'spot', lat: 33.5, lng: 126.951, desc: '성산 앞바다의 작은 섬.' },
  { name: '산방산', cat: 'oreum', lat: 33.2397, lng: 126.314, desc: '용암돔 형태의 종 모양 산.' },
  { name: '다랑쉬오름', cat: 'oreum', lat: 33.454, lng: 126.819, desc: '정상에 깊은 굼부리가 있는 "오름의 여왕".' },
  { name: '새별오름', cat: 'oreum', lat: 33.366, lng: 126.357, desc: '들불축제가 열리는 서부 대표 오름.' },
  { name: '용눈이오름', cat: 'oreum', lat: 33.443, lng: 126.83, desc: '부드러운 능선이 인상적인 오름.' },
  { name: '산굼부리', cat: 'oreum', lat: 33.431, lng: 126.687, desc: '평지에 움푹 팬 분화구.' },
]

export const HARBORS = [
  { name: '제주항', lat: 33.52, lng: 126.541, desc: '제주 관문 항구(여객·화물).' },
  { name: '성산포항', lat: 33.471, lng: 126.934, desc: '우도 연결 도항선 출발지.' },
  { name: '서귀포항', lat: 33.24, lng: 126.565, desc: '남부 대표 항구.' },
  { name: '한림항', lat: 33.414, lng: 126.265, desc: '비양도 연결 서부 항구.' },
  { name: '모슬포항', lat: 33.215, lng: 126.251, desc: '마라도·가파도 연결 항구.' },
]

export const LIGHTHOUSES = [
  { name: '산지등대', lat: 33.5185, lng: 126.547, desc: '제주항 인근 등대.' },
  { name: '우도등대', lat: 33.504, lng: 126.95, desc: '우도 동쪽 언덕의 등대.' },
  { name: '고산등대', lat: 33.293, lng: 126.163, desc: '서쪽 끝 해안 등대.' },
  { name: '성산포등대', lat: 33.462, lng: 126.94, desc: '성산일출봉 인근 등대.' },
]

export const WIND_SITES = [
  { name: '가시리 풍력', lat: 33.39, lng: 126.76, n: 5 },
  { name: '행원 풍력', lat: 33.556, lng: 126.8, n: 5 },
  { name: '한경 풍력', lat: 33.34, lng: 126.18, n: 5 },
  { name: '삼달 풍력', lat: 33.38, lng: 126.87, n: 4 },
]

export const DOLHAREUBANG = [
  { name: '돌하르방 (제주시)', lat: 33.5099, lng: 126.5219, desc: '제주를 수호하는 돌 조각상.' },
  { name: '돌하르방 (서귀포)', lat: 33.253, lng: 126.56, desc: '제주를 수호하는 돌 조각상.' },
  { name: '돌하르방 (성산)', lat: 33.46, lng: 126.93, desc: '제주를 수호하는 돌 조각상.' },
]

// 감귤 재배지: 한라산 남쪽 사면
export const ORCHARD_ZONE = { uMin: -26, uMax: 28, vMin: 3, vMax: 12 }
