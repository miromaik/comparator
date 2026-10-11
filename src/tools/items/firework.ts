import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

type FireworkShape = 'small_ball' | 'large_ball' | 'star' | 'creeper' | 'burst'

interface Explosion {
  shape: FireworkShape
  colors: string[]
  fadeColors: string[]
  trail: boolean
  twinkle: boolean
}

interface FireworkState {
  flightDuration: number
  explosions: Explosion[]
}

const SHAPE_NAMES: Record<FireworkShape, string> = {
  small_ball: 'Small Ball',
  large_ball: 'Large Ball',
  star: 'Star Shape',
  creeper: 'Creeper Head',
  burst: 'Burst',
}

const state: FireworkState = {
  flightDuration: 2,
  explosions: [
    {
      shape: 'large_ball',
      colors: ['#FF3333', '#FFAA00'],
      fadeColors: ['#FFFF55', '#FFFFFF'],
      trail: true,
      twinkle: true,
    },
  ],
}

function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

function generateGiveCommand(): string {
  const explosionsData = state.explosions.map(exp => {
    const primaryDecs = exp.colors.map(hexToDecimal)
    const fadeDecs = exp.fadeColors.map(hexToDecimal)
    
    const obj: any = {
      shape: exp.shape,
      colors: primaryDecs,
    }
    if (fadeDecs.length > 0) obj.fade_colors = fadeDecs
    if (exp.trail) obj.has_trail = true
    if (exp.twinkle) obj.has_twinkle = true
    return obj
  })

  const component = JSON.stringify({
    flight_duration: state.flightDuration,
    explosions: explosionsData,
  })

  return `/give @p firework_rocket[fireworks=${component}] 64`
}

function generateSummonCommand(): string {
  const tag = JSON.stringify({
    LifeTime: state.flightDuration * 10,
    FireworksItem: {
      id: 'minecraft:firework_rocket',
      count: 1,
      components: {
        'minecraft:fireworks': {
          flight_duration: state.flightDuration,
          explosions: state.explosions.map(exp => ({
            shape: exp.shape,
            colors: exp.colors.map(hexToDecimal),
            fade_colors: exp.fadeColors.map(hexToDecimal),
            has_trail: exp.trail,
            has_twinkle: exp.twinkle,
          })),
        },
      },
    },
  })

  return `/summon firework_rocket ~ ~1 ~ ${tag}`
}

function drawSimulation(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#0a0a12'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  for (let i = 0; i < 30; i++) {
    const sx = (i * 37) % w
    const sy = (i * 47) % (h - 40)
    ctx.fillRect(sx, sy, 1.5, 1.5)
  }

  const startX = w / 2
  const startY = h - 20
  const burstX = w / 2
  const burstY = Math.max(60, h - 30 - state.flightDuration * 45)

  ctx.strokeStyle = 'rgba(255, 180, 100, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(burstX, burstY)
  ctx.stroke()

  state.explosions.forEach((exp, expIdx) => {
    const count = exp.shape === 'large_ball' ? 42 : exp.shape === 'star' ? 30 : 24
    const radius = exp.shape === 'large_ball' ? 55 : 38

    for (let i = 0; i < count; i++) {
      let angle = (i / count) * Math.PI * 2
      let dist = radius * (0.6 + Math.random() * 0.4)
      if (exp.shape === 'star' && i % 2 === 0) dist *= 1.4

      const px = burstX + Math.cos(angle) * dist
      const py = burstY + Math.sin(angle) * dist + (expIdx * 6)

      const color = exp.colors[i % exp.colors.length] || '#FF3333'
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = exp.twinkle ? 10 : 4

      ctx.beginPath()
      ctx.arc(px, py, exp.trail ? 2.5 : 2, 0, Math.PI * 2)
      ctx.fill()

      if (exp.trail) {
        ctx.strokeStyle = exp.fadeColors[0] || color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(burstX, burstY)
        ctx.lineTo(px, py)
        ctx.stroke()
      }
    }
  })
  ctx.shadowBlur = 0
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const outEl = document.getElementById('fw-output')
    const summonOutEl = document.getElementById('fw-summon-output')
    const canvas = document.getElementById('fw-canvas') as HTMLCanvasElement
    if (outEl) outEl.textContent = generateGiveCommand()
    if (summonOutEl) summonOutEl.textContent = generateSummonCommand()
    if (canvas) drawSimulation(canvas)
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Input Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Firework Rocket Designer</span>
          <span class="badge badge-accent">1.20.5+ / 1.21 / 26.x</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Flight Duration</label>
              <span class="badge" id="fw-duration-val">${state.flightDuration} (${state.flightDuration * 10 - 5} - ${state.flightDuration * 10 + 7} blocks)</span>
            </div>
            <input type="range" id="fw-flight" class="form-range" min="1" max="3" value="${state.flightDuration}" />
          </div>

          <div class="form-divider"></div>

          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Explosion Layers (${state.explosions.length}/3)</label>
              ${state.explosions.length < 3 ? '<button class="btn btn-sm btn-secondary" id="fw-add-exp">+ Add Layer</button>' : ''}
            </div>
            <div id="fw-layers-container" class="firework-layers-list"></div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Live Particle Simulation & Output</span>
          <button class="btn btn-sm btn-secondary" id="fw-sim-btn">✨ Burst Preview</button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Particle Burst Simulator</label>
            <div class="canvas-wrapper">
              <canvas id="fw-canvas" width="360" height="200" class="firework-canvas"></canvas>
            </div>
          </div>

          <div class="output-block" style="margin-bottom: 12px;">
            <div class="output-header">
              <span class="output-label">/give Command (Modern Data Components)</span>
              <button class="btn btn-copy" id="fw-copy-give">Copy</button>
            </div>
            <div class="output-code" id="fw-output"></div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">/summon Command</span>
              <button class="btn btn-copy" id="fw-copy-summon">Copy</button>
            </div>
            <div class="output-code" id="fw-summon-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  function renderLayers(): void {
    const listEl = document.getElementById('fw-layers-container')
    if (!listEl) return

    listEl.innerHTML = state.explosions.map((exp, idx) => `
      <div class="firework-layer-card" data-idx="${idx}">
        <div class="firework-layer-top">
          <span class="layer-num">Layer #${idx + 1}</span>
          <select class="form-select fw-shape-sel" data-idx="${idx}" style="max-width: 140px; padding: 4px 8px; font-size: 0.8rem;">
            ${Object.entries(SHAPE_NAMES).map(([val, name]) => `
              <option value="${val}" ${exp.shape === val ? 'selected' : ''}>${name}</option>
            `).join('')}
          </select>
          ${state.explosions.length > 1 ? `<button class="color-stop-remove fw-rem-layer" data-idx="${idx}">&times;</button>` : ''}
        </div>

        <div class="form-row-2" style="margin-top: 8px;">
          <div>
            <label class="form-label" style="font-size: 0.72rem;">Primary Colors</label>
            <div class="color-picker-row">
              ${exp.colors.map((c, cIdx) => `
                <input type="color" value="${c}" class="fw-primary-color" data-layer="${idx}" data-color-idx="${cIdx}" />
              `).join('')}
              ${exp.colors.length < 4 ? `<button class="btn-add-color fw-add-pcolor" data-layer="${idx}" style="padding: 2px 6px; font-size: 0.75rem;">+</button>` : ''}
            </div>
          </div>

          <div>
            <label class="form-label" style="font-size: 0.72rem;">Fade Colors</label>
            <div class="color-picker-row">
              ${exp.fadeColors.map((c, cIdx) => `
                <input type="color" value="${c}" class="fw-fade-color" data-layer="${idx}" data-color-idx="${cIdx}" />
              `).join('')}
              ${exp.fadeColors.length < 4 ? `<button class="btn-add-color fw-add-fcolor" data-layer="${idx}" style="padding: 2px 6px; font-size: 0.75rem;">+</button>` : ''}
            </div>
          </div>
        </div>

        <div class="toggle-group" style="margin-top: 8px;">
          <button class="toggle-btn fw-toggle-prop ${exp.trail ? 'active' : ''}" data-layer="${idx}" data-prop="trail">☄️ Trail</button>
          <button class="toggle-btn fw-toggle-prop ${exp.twinkle ? 'active' : ''}" data-layer="${idx}" data-prop="twinkle">✨ Twinkle</button>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLSelectElement>('.fw-shape-sel').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx!)
        state.explosions[idx].shape = sel.value as FireworkShape
        update()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.fw-primary-color').forEach(inp => {
      inp.addEventListener('input', () => {
        const lIdx = parseInt(inp.dataset.layer!)
        const cIdx = parseInt(inp.dataset.colorIdx!)
        state.explosions[lIdx].colors[cIdx] = inp.value
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.fw-fade-color').forEach(inp => {
      inp.addEventListener('input', () => {
        const lIdx = parseInt(inp.dataset.layer!)
        const cIdx = parseInt(inp.dataset.colorIdx!)
        state.explosions[lIdx].fadeColors[cIdx] = inp.value
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.fw-add-pcolor').forEach(btn => {
      btn.addEventListener('click', () => {
        const lIdx = parseInt(btn.dataset.layer!)
        state.explosions[lIdx].colors.push('#55FF55')
        renderLayers()
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.fw-add-fcolor').forEach(btn => {
      btn.addEventListener('click', () => {
        const lIdx = parseInt(btn.dataset.layer!)
        state.explosions[lIdx].fadeColors.push('#FFFFFF')
        renderLayers()
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.fw-toggle-prop').forEach(btn => {
      btn.addEventListener('click', () => {
        const lIdx = parseInt(btn.dataset.layer!)
        const prop = btn.dataset.prop as 'trail' | 'twinkle'
        state.explosions[lIdx][prop] = !state.explosions[lIdx][prop]
        renderLayers()
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.fw-rem-layer').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx!)
        state.explosions.splice(idx, 1)
        renderLayers()
        update()
      })
    })
  }

  renderLayers()

  document.getElementById('fw-flight')?.addEventListener('input', (e) => {
    state.flightDuration = parseInt((e.target as HTMLInputElement).value)
    const valEl = document.getElementById('fw-duration-val')
    if (valEl) valEl.textContent = `${state.flightDuration} (${state.flightDuration * 10 - 5} - ${state.flightDuration * 10 + 7} blocks)`
    update()
  })

  document.getElementById('fw-add-exp')?.addEventListener('click', () => {
    if (state.explosions.length >= 3) return
    state.explosions.push({
      shape: 'star',
      colors: ['#55FFFF'],
      fadeColors: ['#FFFFFF'],
      trail: false,
      twinkle: true,
    })
    mount(container)
  })

  document.getElementById('fw-sim-btn')?.addEventListener('click', () => {
    const canvas = document.getElementById('fw-canvas') as HTMLCanvasElement
    if (canvas) drawSimulation(canvas)
  })

  document.getElementById('fw-copy-give')?.addEventListener('click', async () => {
    await copyToClipboard(generateGiveCommand())
    showToast('Copied /give command!')
  })

  document.getElementById('fw-copy-summon')?.addEventListener('click', async () => {
    await copyToClipboard(generateSummonCommand())
    showToast('Copied /summon command!')
  })

  update()
}
