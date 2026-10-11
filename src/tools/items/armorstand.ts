import { copyToClipboard, showToast, debounce } from '../../utils/helpers'
import { store } from '../../utils/store'

type Vec3 = [number, number, number]

interface ArmorStandPose {
  Head: Vec3
  Body: Vec3
  LeftArm: Vec3
  RightArm: Vec3
  LeftLeg: Vec3
  RightLeg: Vec3
}

type ArmorMaterial = 'none' | 'diamond' | 'netherite' | 'iron' | 'gold' | 'leather'
type WeaponType = 'none' | 'diamond_sword' | 'netherite_sword' | 'trident' | 'bow'

interface ArmorStandState {
  showArms: boolean
  noBasePlate: boolean
  small: boolean
  invisible: boolean
  noGravity: boolean
  invulnerable: boolean
  marker: boolean
  customName: string
  helmet: ArmorMaterial
  chestplate: ArmorMaterial
  weapon: WeaponType
  pose: ArmorStandPose
}

const PRESETS: Record<string, ArmorStandPose> = {
  default: {
    Head: [0, 0, 0],
    Body: [0, 0, 0],
    LeftArm: [-10, 0, -10],
    RightArm: [-15, 0, 10],
    LeftLeg: [-1, 0, -1],
    RightLeg: [1, 0, 1],
  },
  salute: {
    Head: [-5, 10, 0],
    Body: [0, 0, 0],
    LeftArm: [-10, 0, -10],
    RightArm: [-120, -30, 20],
    LeftLeg: [0, 0, 0],
    RightLeg: [0, 0, 0],
  },
  pointing: {
    Head: [0, 20, 0],
    Body: [0, 15, 0],
    LeftArm: [-10, 0, -10],
    RightArm: [-90, 20, 0],
    LeftLeg: [-10, 0, 0],
    RightLeg: [10, 0, 0],
  },
  walking: {
    Head: [0, 0, 0],
    Body: [0, 0, 0],
    LeftArm: [25, 0, 0],
    RightArm: [-25, 0, 0],
    LeftLeg: [-25, 0, 0],
    RightLeg: [25, 0, 0],
  },
  blocking: {
    Head: [-10, 0, 0],
    Body: [0, 0, 0],
    LeftArm: [-30, 30, -30],
    RightArm: [-45, -30, 45],
    LeftLeg: [-15, 0, -10],
    RightLeg: [15, 0, 10],
  },
  dual_wield: {
    Head: [0, 0, 0],
    Body: [0, 0, 0],
    LeftArm: [-90, 0, 0],
    RightArm: [-90, 0, 0],
    LeftLeg: [-10, 0, -5],
    RightLeg: [10, 0, 5],
  },
  tpose: {
    Head: [0, 0, 0],
    Body: [0, 0, 0],
    LeftArm: [0, 0, -90],
    RightArm: [0, 0, 90],
    LeftLeg: [0, 0, 0],
    RightLeg: [0, 0, 0],
  },
}

const MATERIAL_COLORS: Record<ArmorMaterial, string> = {
  none: 'transparent',
  diamond: '#4aedd9',
  netherite: '#443a3b',
  iron: '#d8d8d8',
  gold: '#fdf55f',
  leather: '#965527',
}

const state: ArmorStandState = {
  showArms: true,
  noBasePlate: false,
  small: false,
  invisible: false,
  noGravity: true,
  invulnerable: true,
  marker: false,
  customName: '',
  helmet: 'diamond',
  chestplate: 'diamond',
  weapon: 'diamond_sword',
  pose: { ...PRESETS.default },
}

function generateSummonCommand(): string {
  const nbtParts: string[] = []

  if (state.showArms) nbtParts.push('ShowArms:1b')
  if (state.noBasePlate) nbtParts.push('NoBasePlate:1b')
  if (state.small) nbtParts.push('Small:1b')
  if (state.invisible) nbtParts.push('Invisible:1b')
  if (state.noGravity) nbtParts.push('NoGravity:1b')
  if (state.invulnerable) nbtParts.push('Invulnerable:1b')
  if (state.marker) nbtParts.push('Marker:1b')

  if (state.customName) {
    nbtParts.push(`CustomName:'{"text":"${state.customName}"}'`)
    nbtParts.push('CustomNameVisible:1b')
  }

  const isLegacy = store.getSyntaxVersion() === 'legacy'
  const countTag = isLegacy ? 'Count:1b' : 'count:1'
  const armorItems: string[] = []
  armorItems.push('{}')
  armorItems.push('{}')
  armorItems.push(state.chestplate !== 'none' ? `{id:"minecraft:${state.chestplate}_chestplate",${countTag}}` : '{}')
  armorItems.push(state.helmet !== 'none' ? `{id:"minecraft:${state.helmet}_helmet",${countTag}}` : '{}')

  if (state.chestplate !== 'none' || state.helmet !== 'none') {
    nbtParts.push(`ArmorItems:[${armorItems.join(',')}]`)
  }

  if (state.weapon !== 'none') {
    nbtParts.push(`HandItems:[{id:"minecraft:${state.weapon}",${countTag}},{}]`)
  }

  const poseParts: string[] = []
  const p = state.pose
  if (p.Head.some(v => v !== 0)) poseParts.push(`Head:[${p.Head.map(v => v + 'f').join(',')}]`)
  if (p.Body.some(v => v !== 0)) poseParts.push(`Body:[${p.Body.map(v => v + 'f').join(',')}]`)
  if (p.LeftArm.some(v => v !== 0)) poseParts.push(`LeftArm:[${p.LeftArm.map(v => v + 'f').join(',')}]`)
  if (p.RightArm.some(v => v !== 0)) poseParts.push(`RightArm:[${p.RightArm.map(v => v + 'f').join(',')}]`)
  if (p.LeftLeg.some(v => v !== 0)) poseParts.push(`LeftLeg:[${p.LeftLeg.map(v => v + 'f').join(',')}]`)
  if (p.RightLeg.some(v => v !== 0)) poseParts.push(`RightLeg:[${p.RightLeg.map(v => v + 'f').join(',')}]`)

  if (poseParts.length > 0) {
    nbtParts.push(`Pose:{${poseParts.join(',')}}`)
  }

  return `/summon armor_stand ~ ~ ~ {${nbtParts.join(', ')}}`
}

function drawMinecraftArmorStand(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#0e0e14'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += 24) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  const centerX = w / 2
  const groundY = h - 35
  const scale = state.small ? 0.7 : 1.1

  if (!state.noBasePlate) {
    ctx.fillStyle = '#4a4a52'
    ctx.fillRect(centerX - 42 * scale, groundY + 4 * scale, 84 * scale, 8 * scale)
    ctx.fillStyle = '#72727c'
    ctx.fillRect(centerX - 40 * scale, groundY, 80 * scale, 6 * scale)
    ctx.fillStyle = '#8e8e98'
    ctx.fillRect(centerX - 38 * scale, groundY, 76 * scale, 2 * scale)
  }

  const woodMain = '#a57548'
  const woodShadow = '#754b24'
  const woodHighlight = '#c69567'

  const drawWoodStick = (x: number, y: number, width: number, length: number, angleDeg: number = 0) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angleDeg * Math.PI) / 180)

    ctx.fillStyle = woodShadow
    ctx.fillRect(-width / 2, 0, width, length)
    ctx.fillStyle = woodMain
    ctx.fillRect(-width / 2 + 1, 0, width - 2, length)
    ctx.fillStyle = woodHighlight
    ctx.fillRect(-width / 2 + 1, 0, 1, length)

    ctx.restore()
  }

  const p = state.pose

  ctx.save()
  ctx.translate(centerX, groundY - 170 * scale)

  const hipY = 110 * scale
  const legLen = 56 * scale
  const legSpacing = 10 * scale

  ctx.save()
  ctx.translate(-legSpacing, hipY)
  ctx.rotate((p.LeftLeg[0] * Math.PI) / 180)
  drawWoodStick(0, 0, 4 * scale, legLen, 0)
  ctx.restore()

  ctx.save()
  ctx.translate(legSpacing, hipY)
  ctx.rotate((p.RightLeg[0] * Math.PI) / 180)
  drawWoodStick(0, 0, 4 * scale, legLen, 0)
  ctx.restore()

  ctx.fillStyle = woodShadow
  ctx.fillRect(-legSpacing - 3 * scale, hipY, (legSpacing * 2) + 6 * scale, 4 * scale)
  ctx.fillStyle = woodMain
  ctx.fillRect(-legSpacing - 2 * scale, hipY + 1 * scale, (legSpacing * 2) + 4 * scale, 2 * scale)

  ctx.save()
  ctx.rotate((p.Body[1] * Math.PI) / 180)

  const torsoTopY = 48 * scale
  const torsoLen = hipY - torsoTopY
  drawWoodStick(-6 * scale, torsoTopY, 4 * scale, torsoLen)
  drawWoodStick(6 * scale, torsoTopY, 4 * scale, torsoLen)

  const shoulderWidth = 44 * scale
  ctx.fillStyle = woodShadow
  ctx.fillRect(-shoulderWidth / 2, torsoTopY, shoulderWidth, 5 * scale)
  ctx.fillStyle = woodMain
  ctx.fillRect(-shoulderWidth / 2 + 1, torsoTopY + 1, shoulderWidth - 2, 3 * scale)

  if (state.chestplate !== 'none') {
    const cpColor = MATERIAL_COLORS[state.chestplate]
    ctx.fillStyle = cpColor
    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 1.5 * scale
    ctx.fillRect(-18 * scale, torsoTopY - 2 * scale, 36 * scale, 42 * scale)
    ctx.strokeRect(-18 * scale, torsoTopY - 2 * scale, 36 * scale, 42 * scale)
    ctx.fillRect(-24 * scale, torsoTopY - 2 * scale, 8 * scale, 12 * scale)
    ctx.fillRect(16 * scale, torsoTopY - 2 * scale, 8 * scale, 12 * scale)
  }

  if (state.showArms) {
    const armLen = 46 * scale

    ctx.save()
    ctx.translate(shoulderWidth / 2 - 2 * scale, torsoTopY + 2 * scale)
    ctx.rotate((p.RightArm[0] * Math.PI) / 180)
    ctx.rotate((p.RightArm[2] * Math.PI) / 180)
    drawWoodStick(0, 0, 4 * scale, armLen)

    if (state.weapon !== 'none') {
      ctx.save()
      ctx.translate(0, armLen - 4 * scale)
      ctx.rotate((35 * Math.PI) / 180)
      ctx.fillStyle = state.weapon.includes('netherite') ? '#443a3b' : '#4aedd9'
      ctx.fillRect(-2 * scale, -32 * scale, 4 * scale, 32 * scale)
      ctx.fillStyle = '#6b4624'
      ctx.fillRect(-6 * scale, 0, 12 * scale, 3 * scale)
      ctx.fillRect(-1.5 * scale, 3 * scale, 3 * scale, 7 * scale)
      ctx.restore()
    }
    ctx.restore()

    ctx.save()
    ctx.translate(-shoulderWidth / 2 + 2 * scale, torsoTopY + 2 * scale)
    ctx.rotate((p.LeftArm[0] * Math.PI) / 180)
    ctx.rotate((p.LeftArm[2] * Math.PI) / 180)
    drawWoodStick(0, 0, 4 * scale, armLen)
    ctx.restore()
  }

  const neckY = torsoTopY - 14 * scale
  drawWoodStick(0, neckY, 4 * scale, 14 * scale)

  ctx.save()
  ctx.translate(0, neckY)
  ctx.rotate((p.Head[0] * Math.PI) / 180)
  ctx.rotate((p.Head[1] * Math.PI) / 180)

  ctx.fillStyle = '#ff3333'
  ctx.fillRect(-4 * scale, -10 * scale, 8 * scale, 10 * scale)

  if (state.helmet !== 'none') {
    const hColor = MATERIAL_COLORS[state.helmet]
    ctx.fillStyle = hColor
    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 1.5 * scale
    ctx.fillRect(-14 * scale, -24 * scale, 28 * scale, 24 * scale)
    ctx.strokeRect(-14 * scale, -24 * scale, 28 * scale, 24 * scale)
    ctx.fillStyle = '#111118'
    ctx.fillRect(-10 * scale, -14 * scale, 20 * scale, 6 * scale)
  }

  ctx.restore()
  ctx.restore()

  ctx.restore()
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const outEl = document.getElementById('as-output')
    const canvas = document.getElementById('as-canvas') as HTMLCanvasElement
    if (outEl) outEl.textContent = generateSummonCommand()
    if (canvas) drawMinecraftArmorStand(canvas)
  }

  const debouncedUpdate = debounce(update, 30)

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Controls Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Armor Stand & Pose Studio</span>
          <span class="badge badge-accent">Vanilla Model</span>
        </div>
        <div class="panel-body">
          <!-- Presets -->
          <div class="form-group">
            <label class="form-label">Pose Presets</label>
            <div class="btn-grid-3" id="as-presets">
              <button class="btn btn-sm btn-secondary" data-preset="default">Default</button>
              <button class="btn btn-sm btn-secondary" data-preset="salute">Salute</button>
              <button class="btn btn-sm btn-secondary" data-preset="pointing">Pointing</button>
              <button class="btn btn-sm btn-secondary" data-preset="walking">Walking</button>
              <button class="btn btn-sm btn-secondary" data-preset="blocking">Blocking</button>
              <button class="btn btn-sm btn-secondary" data-preset="dual_wield">Dual Wield</button>
            </div>
          </div>

          <!-- Equipment Loadout -->
          <div class="form-group">
            <label class="form-label">Equipment Loadout</label>
            <div class="form-row-3">
              <div>
                <label class="form-label" style="font-size: 0.72rem;">Helmet</label>
                <select id="as-sel-helmet" class="form-select" style="padding: 4px 6px; font-size: 0.8rem;">
                  <option value="none" ${state.helmet === 'none' ? 'selected' : ''}>None</option>
                  <option value="diamond" ${state.helmet === 'diamond' ? 'selected' : ''}>Diamond</option>
                  <option value="netherite" ${state.helmet === 'netherite' ? 'selected' : ''}>Netherite</option>
                  <option value="iron" ${state.helmet === 'iron' ? 'selected' : ''}>Iron</option>
                  <option value="gold" ${state.helmet === 'gold' ? 'selected' : ''}>Gold</option>
                  <option value="leather" ${state.helmet === 'leather' ? 'selected' : ''}>Leather</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size: 0.72rem;">Chestplate</label>
                <select id="as-sel-chest" class="form-select" style="padding: 4px 6px; font-size: 0.8rem;">
                  <option value="none" ${state.chestplate === 'none' ? 'selected' : ''}>None</option>
                  <option value="diamond" ${state.chestplate === 'diamond' ? 'selected' : ''}>Diamond</option>
                  <option value="netherite" ${state.chestplate === 'netherite' ? 'selected' : ''}>Netherite</option>
                  <option value="iron" ${state.chestplate === 'iron' ? 'selected' : ''}>Iron</option>
                  <option value="gold" ${state.chestplate === 'gold' ? 'selected' : ''}>Gold</option>
                  <option value="leather" ${state.chestplate === 'leather' ? 'selected' : ''}>Leather</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size: 0.72rem;">Weapon</label>
                <select id="as-sel-weapon" class="form-select" style="padding: 4px 6px; font-size: 0.8rem;">
                  <option value="none" ${state.weapon === 'none' ? 'selected' : ''}>None</option>
                  <option value="diamond_sword" ${state.weapon === 'diamond_sword' ? 'selected' : ''}>Diamond Sword</option>
                  <option value="netherite_sword" ${state.weapon === 'netherite_sword' ? 'selected' : ''}>Netherite Sword</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Flags & Attributes -->
          <div class="form-group">
            <label class="form-label">Attributes & Flags</label>
            <div class="btn-grid-4">
              <button class="toggle-btn ${state.showArms ? 'active' : ''}" data-flag="showArms">Show Arms</button>
              <button class="toggle-btn ${state.noBasePlate ? 'active' : ''}" data-flag="noBasePlate">No BasePlate</button>
              <button class="toggle-btn ${state.small ? 'active' : ''}" data-flag="small">Small</button>
              <button class="toggle-btn ${state.invisible ? 'active' : ''}" data-flag="invisible">Invisible</button>
              <button class="toggle-btn ${state.noGravity ? 'active' : ''}" data-flag="noGravity">No Gravity</button>
              <button class="toggle-btn ${state.invulnerable ? 'active' : ''}" data-flag="invulnerable">Invulnerable</button>
              <button class="toggle-btn ${state.marker ? 'active' : ''}" data-flag="marker">Marker</button>
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Interactive Joint Rotations with Stepper Controls -->
          <div class="form-group">
            <label class="form-label">Joint Rotations with Steppers</label>

            <div class="as-joint-card">
              <span class="joint-title">Head</span>
              <div class="as-stepper-row">
                <span class="axis-label">X:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="Head" data-axis="0" data-delta="-10">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="Head" data-axis="0" value="${state.pose.Head[0]}" />
                  <button class="stepper-btn" data-joint="Head" data-axis="0" data-delta="10">+</button>
                </div>
                <span class="axis-label" style="margin-left: 10px;">Y:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="Head" data-axis="1" data-delta="-10">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="Head" data-axis="1" value="${state.pose.Head[1]}" />
                  <button class="stepper-btn" data-joint="Head" data-axis="1" data-delta="10">+</button>
                </div>
              </div>
            </div>

            <div class="as-joint-card">
              <span class="joint-title">Right Arm</span>
              <div class="as-stepper-row">
                <span class="axis-label">X:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="RightArm" data-axis="0" data-delta="-15">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="RightArm" data-axis="0" value="${state.pose.RightArm[0]}" />
                  <button class="stepper-btn" data-joint="RightArm" data-axis="0" data-delta="15">+</button>
                </div>
                <span class="axis-label" style="margin-left: 10px;">Z:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="RightArm" data-axis="2" data-delta="-15">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="RightArm" data-axis="2" value="${state.pose.RightArm[2]}" />
                  <button class="stepper-btn" data-joint="RightArm" data-axis="2" data-delta="15">+</button>
                </div>
              </div>
            </div>

            <div class="as-joint-card">
              <span class="joint-title">Left Arm</span>
              <div class="as-stepper-row">
                <span class="axis-label">X:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="LeftArm" data-axis="0" data-delta="-15">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="LeftArm" data-axis="0" value="${state.pose.LeftArm[0]}" />
                  <button class="stepper-btn" data-joint="LeftArm" data-axis="0" data-delta="15">+</button>
                </div>
                <span class="axis-label" style="margin-left: 10px;">Z:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="LeftArm" data-axis="2" data-delta="-15">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="LeftArm" data-axis="2" value="${state.pose.LeftArm[2]}" />
                  <button class="stepper-btn" data-joint="LeftArm" data-axis="2" data-delta="15">+</button>
                </div>
              </div>
            </div>

            <div class="as-joint-card">
              <span class="joint-title">Legs</span>
              <div class="as-stepper-row">
                <span class="axis-label">R:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="RightLeg" data-axis="0" data-delta="-10">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="RightLeg" data-axis="0" value="${state.pose.RightLeg[0]}" />
                  <button class="stepper-btn" data-joint="RightLeg" data-axis="0" data-delta="10">+</button>
                </div>
                <span class="axis-label" style="margin-left: 10px;">L:</span>
                <div class="number-stepper">
                  <button class="stepper-btn" data-joint="LeftLeg" data-axis="0" data-delta="-10">-</button>
                  <input type="number" class="form-input text-center as-num-inp" data-joint="LeftLeg" data-axis="0" value="${state.pose.LeftLeg[0]}" />
                  <button class="stepper-btn" data-joint="LeftLeg" data-axis="0" data-delta="10">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Voxel Model Preview & /summon</span>
        </div>
        <div class="panel-body">
          <div class="canvas-wrapper">
            <canvas id="as-canvas" width="380" height="270" class="firework-canvas"></canvas>
          </div>

          <div class="output-block" style="margin-top: 16px;">
            <div class="output-header">
              <span class="output-label">/summon Command</span>
              <div class="output-actions">
                <div class="syntax-toggle-bar">
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'modern' ? 'active' : ''}" data-syntax="modern">Modern (1.20.5+ / 1.21)</button>
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'legacy' ? 'active' : ''}" data-syntax="legacy">Legacy (1.14 - 1.20.4)</button>
                </div>
                <button class="btn btn-copy" id="as-copy">Copy</button>
              </div>
            </div>
            <div class="output-code" id="as-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  document.querySelectorAll<HTMLButtonElement>('#as-presets button').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset!
      if (PRESETS[presetKey]) {
        state.pose = JSON.parse(JSON.stringify(PRESETS[presetKey]))
        mount(container)
      }
    })
  })

  document.getElementById('as-sel-helmet')?.addEventListener('change', (e) => {
    state.helmet = (e.target as HTMLSelectElement).value as ArmorMaterial
    update()
  })

  document.getElementById('as-sel-chest')?.addEventListener('change', (e) => {
    state.chestplate = (e.target as HTMLSelectElement).value as ArmorMaterial
    update()
  })

  document.getElementById('as-sel-weapon')?.addEventListener('change', (e) => {
    state.weapon = (e.target as HTMLSelectElement).value as WeaponType
    update()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-flag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const flag = btn.dataset.flag as keyof ArmorStandState
      ;(state[flag] as boolean) = !state[flag]
      btn.classList.toggle('active')
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('.stepper-btn[data-joint]').forEach(btn => {
    btn.addEventListener('click', () => {
      const joint = btn.dataset.joint as keyof ArmorStandPose
      const axis = parseInt(btn.dataset.axis!)
      const delta = parseInt(btn.dataset.delta!)
      state.pose[joint][axis] += delta

      const inp = container.querySelector<HTMLInputElement>(`.as-num-inp[data-joint="${joint}"][data-axis="${axis}"]`)
      if (inp) inp.value = state.pose[joint][axis].toString()
      update()
    })
  })

  container.querySelectorAll<HTMLInputElement>('.as-num-inp').forEach(inp => {
    inp.addEventListener('input', () => {
      const joint = inp.dataset.joint as keyof ArmorStandPose
      const axis = parseInt(inp.dataset.axis!)
      state.pose[joint][axis] = parseInt(inp.value) || 0
      debouncedUpdate()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-syntax]').forEach(btn => {
    btn.addEventListener('click', () => {
      const syn = btn.dataset.syntax as 'modern' | 'legacy'
      store.setSyntaxVersion(syn)
      container.querySelectorAll<HTMLButtonElement>('[data-syntax]').forEach(b => {
        b.classList.toggle('active', b.dataset.syntax === syn)
      })
      update()
    })
  })

  document.getElementById('as-copy')?.addEventListener('click', async () => {
    await copyToClipboard(generateSummonCommand())
    showToast('Copied /summon armor_stand command!')
  })

  update()
}
