import { copyToClipboard, showToast } from '../../utils/helpers'

interface BannerPattern {
  id: string
  code: string
  name: string
}

interface BannerLayer {
  patternCode: string
  color: string
}

const MC_COLORS = [
  { name: 'White', hex: '#FFFFFF', code: 0 },
  { name: 'Orange', hex: '#D87F33', code: 1 },
  { name: 'Magenta', hex: '#B24CD8', code: 2 },
  { name: 'Light Blue', hex: '#6699D8', code: 3 },
  { name: 'Yellow', hex: '#E5E533', code: 4 },
  { name: 'Lime', hex: '#7FCC19', code: 5 },
  { name: 'Pink', hex: '#F27FA5', code: 6 },
  { name: 'Gray', hex: '#4C4C4C', code: 7 },
  { name: 'Light Gray', hex: '#999999', code: 8 },
  { name: 'Cyan', hex: '#4C7F99', code: 9 },
  { name: 'Purple', hex: '#7F3FB2', code: 10 },
  { name: 'Blue', hex: '#334CB2', code: 11 },
  { name: 'Brown', hex: '#664C33', code: 12 },
  { name: 'Green', hex: '#667F33', code: 13 },
  { name: 'Red', hex: '#993333', code: 14 },
  { name: 'Black', hex: '#191919', code: 15 },
]

const PATTERNS: BannerPattern[] = [
  { id: 'cross', code: 'cr', name: 'Cross (Saltire)' },
  { id: 'straight_cross', code: 'sc', name: 'Straight Cross' },
  { id: 'stripe_center', code: 'cs', name: 'Center Stripe (Pale)' },
  { id: 'stripe_bottom', code: 'bs', name: 'Base Stripe' },
  { id: 'stripe_top', code: 'ts', name: 'Chief Stripe' },
  { id: 'border', code: 'bo', name: 'Border (Bordure)' },
  { id: 'gradient', code: 'gra', name: 'Gradient' },
  { id: 'skull', code: 'sku', name: 'Skull Charge' },
  { id: 'creeper', code: 'cre', name: 'Creeper Charge' },
  { id: 'flower', code: 'flo', name: 'Flower Charge' },
  { id: 'mojang', code: 'moj', name: 'Mojang Thing' },
]

let baseColor = '#FFFFFF'
let layers: BannerLayer[] = [
  { patternCode: 'cr', color: '#993333' },
  { patternCode: 'cs', color: '#D87F33' },
  { patternCode: 'bo', color: '#191919' },
]

export function mount(container: HTMLElement): void {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  function drawBanner(): void {
    if (!canvas || !ctx) return

    canvas.width = 160
    canvas.height = 320

    ctx.clearRect(0, 0, 160, 320)

    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 160, 320)

    for (const layer of layers) {
      ctx.fillStyle = layer.color
      ctx.strokeStyle = layer.color

      switch (layer.patternCode) {
        case 'cr':
          ctx.beginPath()
          ctx.moveTo(0, 0); ctx.lineTo(40, 0); ctx.lineTo(160, 240); ctx.lineTo(160, 320); ctx.lineTo(120, 320); ctx.lineTo(0, 80); ctx.closePath()
          ctx.fill()
          ctx.beginPath()
          ctx.moveTo(160, 0); ctx.lineTo(120, 0); ctx.lineTo(0, 240); ctx.lineTo(0, 320); ctx.lineTo(40, 320); ctx.lineTo(160, 80); ctx.closePath()
          ctx.fill()
          break

        case 'sc':
          ctx.fillRect(60, 0, 40, 320)
          ctx.fillRect(0, 130, 160, 40)
          break

        case 'cs':
          ctx.fillRect(60, 0, 40, 320)
          break

        case 'bs':
          ctx.fillRect(0, 240, 160, 80)
          break

        case 'ts':
          ctx.fillRect(0, 0, 160, 80)
          break

        case 'bo':
          ctx.lineWidth = 18
          ctx.strokeRect(9, 9, 142, 302)
          break

        case 'gra':
          const grad = ctx.createLinearGradient(0, 0, 0, 320)
          grad.addColorStop(0, layer.color)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, 160, 320)
          break

        default:
          ctx.beginPath()
          ctx.arc(80, 160, 42, 0, Math.PI * 2)
          ctx.fill()
          break
      }
    }
  }

  function generateCommand(): string {
    const baseColorName = MC_COLORS.find(c => c.hex.toLowerCase() === baseColor.toLowerCase())?.name.toLowerCase().replace(/ /g, '_') || 'white'
    const patternList = layers.map(l => {
      const colName = MC_COLORS.find(c => c.hex.toLowerCase() === l.color.toLowerCase())?.name.toLowerCase().replace(/ /g, '_') || 'red'
      const pat = PATTERNS.find(p => p.code === l.patternCode)
      return `{pattern:"minecraft:${pat ? pat.id : 'cross'}",color:"${colName}"}`
    })

    return `/give @p minecraft:${baseColorName}_banner[banner_patterns=[${patternList.join(',')}]] 1`
  }

  function update(): void {
    drawBanner()
    const listEl = document.getElementById('b-layer-list')
    const outEl = document.getElementById('bn-output')

    if (listEl) {
      listEl.innerHTML = layers.map((l, i) => {
        const pat = PATTERNS.find(p => p.code === l.patternCode)
        return `
          <div class="banner-layer-row">
            <span class="layer-num">#${i + 1}</span>
            <span class="layer-name">${pat ? pat.name : l.patternCode}</span>
            <span class="layer-dot" style="background: ${l.color};"></span>
            <button class="btn-remove-layer" data-remove-layer="${i}">×</button>
          </div>
        `
      }).join('')

      listEl.querySelectorAll<HTMLButtonElement>('[data-remove-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.removeLayer || '0', 10)
          layers.splice(idx, 1)
          update()
        })
      })
    }

    if (outEl) outEl.textContent = generateCommand()
  }


  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Banner Pattern Studio</span>
        </div>
        <div class="panel-body">
          <!-- Base Color -->
          <div class="form-group">
            <label class="form-label">Base Banner Color</label>
            <div class="mc-color-grid">
              ${MC_COLORS.map(c => `
                <button class="mc-color-btn ${baseColor === c.hex ? 'active' : ''}" data-base-color="${c.hex}" title="${c.name}" style="background-color: ${c.hex};"></button>
              `).join('')}
            </div>
          </div>

          <!-- Add Layer Form -->
          <div class="form-group" style="padding: 12px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-default);">
            <label class="form-label">Add Pattern Layer</label>
            <div class="form-row-2">
              <select id="bn-pattern-select" class="select">
                ${PATTERNS.map(p => `<option value="${p.code}">${p.name}</option>`).join('')}
              </select>
              <select id="bn-color-select" class="select">
                ${MC_COLORS.map(c => `<option value="${c.hex}">${c.name}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary btn-sm" id="bn-add-layer" style="width: 100%; margin-top: 8px;">+ Add Layer Pattern</button>
          </div>

          <!-- Active Layers List -->
          <div class="form-group">
            <label class="form-label">Active Layers Stack (${layers.length}/6 Survival Cap)</label>
            <div id="b-layer-list" class="banner-layers-container"></div>
          </div>
        </div>
      </div>

      <!-- Preview Canvas -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Real-Time Loom Preview</span>
        </div>
        <div class="panel-body">
          <div class="banner-preview-box">
            <canvas id="bn-canvas" class="banner-canvas"></canvas>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Banner /give Command</span>
              <button class="btn btn-copy" id="bn-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="bn-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  canvas = document.getElementById('bn-canvas') as HTMLCanvasElement
  ctx = canvas?.getContext('2d')!

  container.querySelectorAll<HTMLButtonElement>('[data-base-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      baseColor = btn.dataset.baseColor || '#FFFFFF'
      update()
    })
  })

  document.getElementById('bn-add-layer')?.addEventListener('click', () => {
    const patSelect = document.getElementById('bn-pattern-select') as HTMLSelectElement
    const colSelect = document.getElementById('bn-color-select') as HTMLSelectElement
    layers.push({
      patternCode: patSelect.value,
      color: colSelect.value,
    })
    update()
  })

  document.getElementById('bn-copy')?.addEventListener('click', async () => {
    const cmd = document.getElementById('bn-output')?.textContent || ''
    await copyToClipboard(cmd)
    showToast('Banner command copied!')
  })

  update()
}
