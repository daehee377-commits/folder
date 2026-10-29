import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import {
  A, B, ORCHARD_ZONE, SPOTS, HARBORS, LIGHTHOUSES, WIND_SITES, DOLHAREUBANG,
  heightAt, snapToLand, coastPoint, fromUV, toXZ, wob,
} from './geo'

const STOPS = [
  [-1.6, '#0e4d6b'], [-0.2, '#1d7a99'], [0, '#d9c98f'], [0.12, '#e0d29a'], [0.25, '#6fae5c'],
  [1.0, '#4e944d'], [2.2, '#3b7a42'], [3.4, '#7d7468'], [5.0, '#9a948c'], [6.3, '#eef1f2'],
].map(([y, c]) => [y, new THREE.Color(c)])

function colorAt(y, out) {
  if (y <= STOPS[0][0]) return out.copy(STOPS[0][1])
  for (let i = 1; i < STOPS.length; i++) {
    if (y <= STOPS[i][0]) {
      const [y0, c0] = STOPS[i - 1]
      const [y1, c1] = STOPS[i]
      return out.copy(c0).lerp(c1, (y - y0) / (y1 - y0))
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1])
}

const PIN_COLORS = {
  spot: 0xe5484d, oreum: 0x2f9e44, port: 0x1c7ed6, lighthouse: 0xf59f00, dol: 0x868e96, opendata: 0x15aabf,
}

export function createJejuScene(container, { onPick }) {
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  const labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(width, height)
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })
  container.appendChild(labelRenderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xbfe3f2)
  scene.fog = new THREE.Fog(0xbfe3f2, 110, 260)

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 600)
  const HOME = { pos: new THREE.Vector3(0, 46, 58), target: new THREE.Vector3(0, 0, 0) }
  camera.position.copy(HOME.pos)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2.05
  controls.minDistance = 4
  controls.maxDistance = 150
  controls.autoRotateSpeed = 0.6
  controls.target.copy(HOME.target)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6b8f6b, 1.1))
  const sun = new THREE.DirectionalLight(0xfff3d6, 2.0)
  sun.position.set(-40, 60, 30)
  scene.add(sun)

  // ---- 지형 ----
  const W = 92
  const D = 56
  const terrainGeo = new THREE.PlaneGeometry(W, D, 368, 224)
  terrainGeo.rotateX(-Math.PI / 2)
  {
    const pos = terrainGeo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = heightAt(x, z)
      pos.setY(i, y)
      colorAt(y, c).multiplyScalar(0.94 + 0.06 * wob(x * 3, z * 3))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    terrainGeo.computeVertexNormals()
  }
  scene.add(new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })))

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x2a8fbd, transparent: true, opacity: 0.86, roughness: 0.35, metalness: 0.1 }),
  )
  sea.rotation.x = -Math.PI / 2
  sea.position.y = -0.02
  scene.add(sea)

  // ---- 레이어/유틸 ----
  const layers = {}
  const layer = (name) => {
    if (!layers[name]) {
      layers[name] = new THREE.Group()
      scene.add(layers[name])
    }
    return layers[name]
  }
  const ticks = []
  const pickables = []
  const groundY = (x, z) => Math.max(heightAt(x, z), 0)

  function addPin(layerName, kind, { x, z, name, desc, lat, lng, extra }, { label = true, size = 1 } = {}) {
    const g = new THREE.Group()
    g.position.set(x, groundY(x, z), z)
    const mat = new THREE.MeshStandardMaterial({ color: PIN_COLORS[kind], roughness: 0.5 })
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2 * size, 0.7 * size, 12), mat)
    cone.rotation.x = Math.PI
    cone.position.y = 0.35 * size
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26 * size, 16, 12), mat)
    head.position.y = 0.95 * size
    head.userData.info = { title: name, kind, desc, lat, lng, extra }
    g.add(cone, head)
    if (label) {
      const div = document.createElement('div')
      div.className = 'label3d'
      div.textContent = name
      const l = new CSS2DObject(div)
      l.position.set(0, 1.55 * size, 0)
      g.add(l)
    }
    pickables.push(head)
    layer(layerName).add(g)
    return g
  }

  // 관광지/오름
  for (const s of SPOTS) {
    addPin(s.cat === 'oreum' ? 'oreum' : 'spot', s.cat, { ...toXZ(s.lat, s.lng), ...s })
  }

  // 항·포구
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x9aa3a8, roughness: 0.9 })
  const boatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
  for (const h of HARBORS) {
    const p = toXZ(h.lat, h.lng)
    const land = snapToLand(p.x, p.z, 0.03)
    addPin('port', 'port', { ...land, ...h })
    const dir = new THREE.Vector3(land.x, 0, land.z).normalize()
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.22), pierMat)
    pier.position.set(land.x + dir.x * 0.9, 0.08, land.z + dir.z * 0.9)
    pier.rotation.y = -Math.atan2(dir.z, dir.x)
    const boat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.16), boatMat)
    boat.position.set(land.x + dir.x * 1.8, 0.05, land.z + dir.z * 1.8 + 0.25)
    layer('port').add(pier, boat)
  }

  // 풍력발전기
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f7f8, roughness: 0.6 })
  const bladeGeo = new THREE.BoxGeometry(0.05, 0.55, 0.012)
  bladeGeo.translate(0, 0.28, 0)
  function makeTurbine() {
    const g = new THREE.Group()
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 1.1, 8), white)
    tower.position.y = 0.55
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.22), white)
    nacelle.position.y = 1.12
    const rotor = new THREE.Group()
    rotor.position.set(0, 1.12, 0.13)
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(bladeGeo, white)
      b.rotation.z = (i * Math.PI * 2) / 3
      rotor.add(b)
    }
    g.add(tower, nacelle, rotor)
    g.scale.setScalar(1.3)
    const speed = 1.2 + Math.random() * 0.8
    ticks.push((t) => (rotor.rotation.z = t * speed))
    return g
  }
  for (const w of WIND_SITES) {
    const p = toXZ(w.lat, w.lng)
    for (let i = 0; i < w.n; i++) {
      const q = snapToLand(p.x + (i - w.n / 2) * 0.9, p.z + Math.sin(i * 1.7) * 0.5)
      const t = makeTurbine()
      t.position.set(q.x, groundY(q.x, q.z), q.z)
      t.rotation.y = -0.6
      layer('wind').add(t)
    }
    const c = snapToLand(p.x, p.z)
    const div = document.createElement('div')
    div.className = 'label3d'
    div.textContent = w.name
    const l = new CSS2DObject(div)
    l.position.set(c.x, groundY(c.x, c.z) + 2.2, c.z)
    layer('wind').add(l)
  }

  // 등대
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffd43b, emissiveIntensity: 1 })
  for (const l of LIGHTHOUSES) {
    const p = toXZ(l.lat, l.lng)
    const q = snapToLand(p.x, p.z, 0.03)
    const g = new THREE.Group()
    g.position.set(q.x, groundY(q.x, q.z), q.z)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.9, 12), white)
    tower.position.y = 0.45
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12), lanternMat)
    lantern.position.y = 0.97
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xd9480f }))
    roof.position.y = 1.12
    g.add(tower, lantern, roof)
    layer('lighthouse').add(g)
    const div = document.createElement('div')
    div.className = 'label3d'
    div.textContent = l.name
    const lab = new CSS2DObject(div)
    lab.position.set(0, 1.6, 0)
    g.add(lab)
    tower.userData.info = { title: l.name, kind: 'lighthouse', desc: l.desc, lat: l.lat, lng: l.lng }
    pickables.push(tower)
  }
  ticks.push((t) => (lanternMat.emissiveIntensity = 0.7 + 0.6 * Math.sin(t * 3)))

  // 돌하르방
  const stone = new THREE.MeshStandardMaterial({ color: 0x4b4742, roughness: 1 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x24211f, roughness: 1 })
  function makeDol() {
    const g = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.55, 12), stone)
    body.position.y = 0.28
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), stone)
    head.position.y = 0.72
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.29, 0.2, 14), stone)
    hat.position.y = 0.98
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), stone)
    nose.position.set(0, 0.7, 0.23)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dark)
    eyeL.position.set(-0.1, 0.78, 0.19)
    const eyeR = eyeL.clone()
    eyeR.position.x = 0.1
    const arms = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.08), stone)
    arms.position.set(0, 0.45, 0.24)
    g.add(body, head, hat, nose, eyeL, eyeR, arms)
    g.scale.setScalar(1.7)
    return g
  }
  for (const d of DOLHAREUBANG) {
    const p = toXZ(d.lat, d.lng)
    const q = snapToLand(p.x, p.z, 0.2)
    const m = makeDol()
    m.position.set(q.x, groundY(q.x, q.z), q.z)
    m.rotation.y = 0.5
    layer('dol').add(m)
    const body = m.children[0]
    body.userData.info = { title: d.name, kind: 'dol', desc: d.desc, lat: d.lat, lng: d.lng }
    pickables.push(body)
    const div = document.createElement('div')
    div.className = 'label3d'
    div.textContent = d.name
    const lab = new CSS2DObject(div)
    lab.position.set(q.x, groundY(q.x, q.z) + 2.4, q.z)
    layer('dol').add(lab)
  }

  // 감귤 재배지 (한라산 남쪽 사면)
  {
    const N = 700
    const treeGeo = new THREE.SphereGeometry(0.11, 8, 6)
    const fruitGeo = new THREE.SphereGeometry(0.055, 6, 5)
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: 0x2f8f3a }), N)
    const fruit = new THREE.InstancedMesh(fruitGeo, new THREE.MeshStandardMaterial({ color: 0xff8c1a }), N)
    const m = new THREE.Matrix4()
    let n = 0
    let guard = 0
    while (n < N && guard++ < 20000) {
      const u = ORCHARD_ZONE.uMin + Math.random() * (ORCHARD_ZONE.uMax - ORCHARD_ZONE.uMin)
      const v = ORCHARD_ZONE.vMin + Math.random() * (ORCHARD_ZONE.vMax - ORCHARD_ZONE.vMin)
      const { x, z } = fromUV(u, v)
      const y = heightAt(x, z)
      if (y < 0.15 || y > 1.3) continue
      m.makeTranslation(x, y + 0.1, z)
      trees.setMatrixAt(n, m)
      m.makeTranslation(x + 0.03, y + 0.2, z + 0.03)
      fruit.setMatrixAt(n, m)
      n++
    }
    trees.count = n
    fruit.count = n
    layer('orchard').add(trees, fruit)
    const c = snapToLand(...Object.values(toXZ(33.29, 126.6)))
    const div = document.createElement('div')
    div.className = 'label3d'
    div.textContent = '감귤 재배지'
    const lab = new CSS2DObject(div)
    lab.position.set(c.x, groundY(c.x, c.z) + 1.4, c.z)
    layer('orchard').add(lab)
  }

  // 올레길 (해안 일주 개념도)
  {
    const pts = []
    for (let i = 0; i < 240; i++) {
      const th = (i / 240) * Math.PI * 2
      const { x, z } = coastPoint(th, 0.93 + wob(i * 0.2, 3) * 0.012)
      pts.push(new THREE.Vector3(x, Math.max(heightAt(x, z), 0) + 0.1, z))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true)
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 600, 0.07, 6, true),
      new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff3b1f, emissiveIntensity: 0.35 }),
    )
    layer('olle').add(tube)
  }

  // ---- 상호작용 ----
  const ray = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let down = null
  const el = renderer.domElement
  const isShown = (o) => {
    for (let p = o; p; p = p.parent) if (!p.visible) return false
    return true
  }
  const onDown = (e) => (down = { x: e.clientX, y: e.clientY })
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return
    const r = el.getBoundingClientRect()
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(mouse, camera)
    const hit = ray.intersectObjects(pickables.filter(isShown), false)[0]
    onPick?.(hit ? hit.object.userData.info : null)
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)

  // ---- 카메라 이동 ----
  let fly = null
  function flyTo(target, dist = 14, elev = 0.75) {
    const t = new THREE.Vector3(target.x, target.y ?? 0, target.z)
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).setY(0).normalize()
    const pos = t.clone().add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, dist * elev, 0))
    fly = { t0: performance.now(), fromPos: camera.position.clone(), fromTarget: controls.target.clone(), pos, target: t }
  }
  const resetView = () => {
    fly = { t0: performance.now(), fromPos: camera.position.clone(), fromTarget: controls.target.clone(), pos: HOME.pos.clone(), target: HOME.target.clone() }
  }

  // ---- 공공데이터 포인트 ----
  function addOpenData(points) {
    for (const p of points) {
      const { x, z } = toXZ(p.lat, p.lng)
      addPin('opendata', 'opendata', { x, z, name: p.title, desc: p.desc, lat: p.lat, lng: p.lng, extra: p.extra }, { label: false, size: 0.6 })
    }
  }

  // ---- 루프 ----
  let raf = 0
  const clock = new THREE.Clock()
  const loop = () => {
    raf = requestAnimationFrame(loop)
    const t = clock.getElapsedTime()
    for (const f of ticks) f(t)
    if (fly) {
      const k = Math.min(1, (performance.now() - fly.t0) / 1100)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      camera.position.lerpVectors(fly.fromPos, fly.pos, e)
      controls.target.lerpVectors(fly.fromTarget, fly.target, e)
      if (k >= 1) fly = null
    }
    controls.update()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }
  loop()

  const onResize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    labelRenderer.setSize(w, h)
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(container)

  return {
    setLayerVisible: (name, v) => layers[name] && (layers[name].visible = v),
    setAutoRotate: (v) => (controls.autoRotate = v),
    flyTo,
    resetView,
    addOpenData,
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      controls.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const m = o.material
        if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
      labelRenderer.domElement.remove()
    },
  }
}

export const PRESETS = [
  { label: '한라산', x: -2.5, z: 2, y: 5, dist: 16 },
  { label: '성산·동부', ...toXZ(33.46, 126.9), y: 0, dist: 14 },
  { label: '서부 해안', ...toXZ(33.36, 126.25), y: 0, dist: 16 },
  { label: '제주항', ...toXZ(33.52, 126.54), y: 0, dist: 10 },
  { label: '서귀포', ...toXZ(33.25, 126.56), y: 0, dist: 12 },
]

export { A, B }
