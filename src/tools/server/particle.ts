import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface ParticleState {
  particleType: string
  dustColor: string
  dustScale: number
  deltaX: number
  deltaY: number
  deltaZ: number
  speed: number
  count: number
  shape: 'point' | 'ring' | 'spiral' | 'sphere'
  radius: number
  height: number
  density: number
}

const state: ParticleState = {
  particleType: 'flame',
  dustColor: '#ff3333',
  dustScale: 1.0,
  deltaX: 0.2,
  deltaY: 0.2,
  deltaZ: 0.2,
  speed: 0.05,
  count: 20,
  shape: 'point',
  radius: 2,
  height: 3,
  density: 16,
}

const COMMON_PARTICLES = [
  'flame',
  'soul_fire_flame',
  'dust',
  'portal',
  'end_rod',
  'sculk_charge',
  'dragon_breath',
  'enchanted_hit',
  'smoke',
  'witch',
  'note',
  'heart',
  'crit',
  'electric_spark',
  'cherry_leaves',
  'firework',
]

export function mount(container: HTMLElement): void {
  let animId: number

  function getParticleParam(): string {
    if (state.particleType === 'dust') {
      const hex = state.dustColor.replace('#', '')
      const r = (parseInt(hex.substring(0, 2), 16) / 255).toFixed(2)
      const g = (parseInt(hex.substring(2, 4), 16) / 255).toFixed(2)
      const b = (parseInt(hex.substring(4, 6), 16) / 255).toFixed(2)
      return `dust{color:[${r}f,${g}f,${b}f],scale:${state.dustScale.toFixed(1)}f}`
    }
    return `minecraft:${state.particleType}`
  }

  function generateCommands(): string[] {
    const p = getParticleParam()

    if (state.shape === 'point') {
      return [
        `/particle ${p} ~ ~1 ~ ${state.deltaX} ${state.deltaY} ${state.deltaZ} ${state.speed} ${state.count} normal @a`,
      ]
    }

    if (state.shape === 'ring') {
      const cmds: string[] = []
      const step = (Math.PI * 2) / state.density
      for (let i = 0; i < state.density; i++) {
        const x = (Math.cos(i * step) * state.radius).toFixed(2)
        const z = (Math.sin(i * step) * state.radius).toFixed(2)
        cmds.push(`/particle ${p} ~${x} ~1 ~${z} 0 0 0 0 1 normal @a`)
      }
      return cmds
    }

    if (state.shape === 'spiral') {
      const cmds: string[] = []
      const count = state.density * 2
      for (let i = 0; i < count; i++) {
        const angle = i * 0.4
        const x = (Math.cos(angle) * (state.radius * (i / count))).toFixed(2)
        const z = (Math.sin(angle) * (state.radius * (i / count))).toFixed(2)
        const y = ((i / count) * state.height).toFixed(2)
        cmds.push(`/particle ${p} ~${x} ~${y} ~${z} 0 0 0 0 1 normal @a`)
      }
      return cmds
    }

    const cmds: string[] = []
    for (let i = 0; i < state.density; i++) {
      const phi = Math.acos(-1 + (2 * i) / state.density)
      const theta = Math.sqrt(state.density * Math.PI) * phi
      const x = (state.radius * Math.cos(theta) * Math.sin(phi)).toFixed(2)
      const y = (state.radius * Math.sin(theta) * Math.sin(phi) + 1).toFixed(2)
      const z = (state.radius * Math.cos(phi)).toFixed(2)
      cmds.push(`/particle ${p} ~${x} ~${y} ~${z} 0 0 0 0 1 normal @a`)
    }
    return cmds
  }

  function render(): void {
    const cmds = generateCommands()
    const isDust = state.particleType === 'dust'

    container.innerHTML = `
      <div class="split-view">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Particle Studio</span>
            <span class="badge" style="font-size:0.72rem;">/particle command</span>
          </div>

          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Particle Type</label>
              <select id="pt-type" class="form-select">
                ${COMMON_PARTICLES.map(p => `
                  <option value="${p}" ${p === state.particleType ? 'selected' : ''}>${p}</option>
                `).join('')}
              </select>
            </div>

            ${isDust ? `
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">RGB Dust Color</label>
                  <input id="pt-color" type="color" class="form-color-picker" value="${state.dustColor}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Particle Scale</label>
                  <input id="pt-scale" type="range" class="form-range" min="0.5" max="3" step="0.1" value="${state.dustScale}" />
                </div>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Emission Shape</label>
              <div class="toggle-group">
                <button class="toggle-btn ${state.shape === 'point' ? 'active' : ''}" data-shape="point">Point</button>
                <button class="toggle-btn ${state.shape === 'ring' ? 'active' : ''}" data-shape="ring">Ring</button>
                <button class="toggle-btn ${state.shape === 'spiral' ? 'active' : ''}" data-shape="spiral">Spiral</button>
                <button class="toggle-btn ${state.shape === 'sphere' ? 'active' : ''}" data-shape="sphere">Sphere</button>
              </div>
            </div>

            ${state.shape !== 'point' ? `
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Radius: ${state.radius} blocks</label>
                  <input id="pt-radius" type="range" class="form-range" min="0.5" max="10" step="0.5" value="${state.radius}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Density / Points: ${state.density}</label>
                  <input id="pt-density" type="range" class="form-range" min="8" max="48" step="4" value="${state.density}" />
                </div>
              </div>
            ` : `
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Spread (Delta): ${state.deltaX}</label>
                  <input id="pt-delta" type="range" class="form-range" min="0" max="2" step="0.1" value="${state.deltaX}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Count: ${state.count}</label>
                  <input id="pt-count" type="range" class="form-range" min="1" max="100" step="1" value="${state.count}" />
                </div>
              </div>
            `}
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Canvas Simulation & Commands</span>
            <button id="pt-copy-btn" class="btn btn-copy">${cmds.length > 1 ? 'Copy .mcfunction' : 'Copy Command'}</button>
          </div>

          <div class="panel-body">
            <!-- 2D Canvas Simulator -->
            <div style="display:flex;justify-content:center;background:#0d0d12;border-radius:var(--radius-md);border:1px solid var(--border-subtle);padding:10px;">
              <canvas id="pt-canvas" width="360" height="220" style="width:100%;max-width:360px;height:220px;"></canvas>
            </div>

            <div class="output-section" style="margin-top:14px;">
              <span class="output-title">${cmds.length} Command${cmds.length > 1 ? 's' : ''} Generated:</span>
              <pre class="code-preview" style="max-height:220px;"><code id="pt-code">${escapeHtml(cmds.join('\n'))}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
    startCanvasSimulation()
  }

  function startCanvasSimulation(): void {
    cancelAnimationFrame(animId)
    const canvas = container.querySelector<HTMLCanvasElement>('#pt-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let angle = 0
    function loop() {
      if (!ctx) return
      ctx.fillStyle = '#0d0d12'
      ctx.fillRect(0, 0, canvas!.width, canvas!.height)

      const cx = canvas!.width / 2
      const cy = canvas!.height / 2
      const col = state.particleType === 'dust' ? state.dustColor : '#ff9933'

      ctx.fillStyle = col
      ctx.shadowColor = col
      ctx.shadowBlur = 8

      if (state.shape === 'point') {
        for (let i = 0; i < state.count; i++) {
          const rx = cx + (Math.random() - 0.5) * state.deltaX * 120
          const ry = cy + (Math.random() - 0.5) * state.deltaY * 120
          ctx.beginPath()
          ctx.arc(rx, ry, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (state.shape === 'ring') {
        const r = state.radius * 25
        for (let i = 0; i < state.density; i++) {
          const a = (i * Math.PI * 2) / state.density + angle
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * (r * 0.5)
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (state.shape === 'spiral') {
        const count = state.density * 2
        for (let i = 0; i < count; i++) {
          const a = i * 0.4 + angle
          const r = (i / count) * state.radius * 35
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * (r * 0.4) - (i / count) * 40 + 20
          ctx.beginPath()
          ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        const r = state.radius * 24
        for (let i = 0; i < state.density; i++) {
          const a = i + angle
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a * 1.5) * r
          ctx.beginPath()
          ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      angle += 0.03
      animId = requestAnimationFrame(loop)
    }

    loop()
  }

  function bindEvents(): void {
    container.querySelector('#pt-type')?.addEventListener('change', (e) => {
      state.particleType = (e.target as HTMLSelectElement).value
      render()
    })

    container.querySelector('#pt-color')?.addEventListener('input', (e) => {
      state.dustColor = (e.target as HTMLInputElement).value
      render()
    })

    container.querySelector('#pt-scale')?.addEventListener('input', (e) => {
      state.dustScale = parseFloat((e.target as HTMLInputElement).value)
      render()
    })

    container.querySelectorAll<HTMLButtonElement>('[data-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.shape = btn.dataset.shape as any
        render()
      })
    })

    container.querySelector('#pt-radius')?.addEventListener('input', (e) => {
      state.radius = parseFloat((e.target as HTMLInputElement).value)
      render()
    })

    container.querySelector('#pt-density')?.addEventListener('input', (e) => {
      state.density = parseInt((e.target as HTMLInputElement).value, 10)
      render()
    })

    container.querySelector('#pt-delta')?.addEventListener('input', (e) => {
      state.deltaX = parseFloat((e.target as HTMLInputElement).value)
      state.deltaY = state.deltaX
      state.deltaZ = state.deltaX
      render()
    })

    container.querySelector('#pt-count')?.addEventListener('input', (e) => {
      state.count = parseInt((e.target as HTMLInputElement).value, 10)
      render()
    })

    container.querySelector('#pt-copy-btn')?.addEventListener('click', async () => {
      const text = generateCommands().join('\n')
      await copyToClipboard(text)
      showToast('Commands copied to clipboard!')
    })
  }

  render()
}
