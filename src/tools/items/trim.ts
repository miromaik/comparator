import { copyToClipboard, showToast } from '../../utils/helpers'

type ArmorType = 'helmet' | 'chestplate' | 'leggings' | 'boots'
type ArmorTier = 'netherite' | 'diamond' | 'iron' | 'golden' | 'chainmail' | 'leather'
type TrimMaterial =
  | 'amethyst'
  | 'copper'
  | 'diamond'
  | 'emerald'
  | 'gold'
  | 'iron'
  | 'lapis'
  | 'netherite'
  | 'quartz'
  | 'redstone'

type TrimPattern =
  | 'bolt'
  | 'coast'
  | 'dune'
  | 'eye'
  | 'flow'
  | 'host'
  | 'raiser'
  | 'rib'
  | 'sentry'
  | 'shaper'
  | 'silence'
  | 'snout'
  | 'spire'
  | 'tide'
  | 'vex'
  | 'ward'
  | 'wayfinder'
  | 'wild'

interface TrimState {
  armorType: ArmorType
  armorTier: ArmorTier
  pattern: TrimPattern
  material: TrimMaterial
  showFullSet: boolean
}

const state: TrimState = {
  armorType: 'chestplate',
  armorTier: 'netherite',
  pattern: 'silence',
  material: 'amethyst',
  showFullSet: true,
}

const MATERIAL_COLORS: Record<TrimMaterial, string> = {
  amethyst: '#9a5cc6',
  copper: '#b4684d',
  diamond: '#4aedd9',
  emerald: '#17dd62',
  gold: '#fdf55f',
  iron: '#e2e8f0',
  lapis: '#1e40af',
  netherite: '#383335',
  quartz: '#e5e7eb',
  redstone: '#ef4444',
}

const TIER_COLORS: Record<ArmorTier, string> = {
  netherite: '#443a3b',
  diamond: '#32b2a6',
  iron: '#cbd5e1',
  golden: '#eab308',
  chainmail: '#64748b',
  leather: '#854d0e',
}

function buildModernGiveCommand(type: ArmorType): string {
  const item = `${state.armorTier}_${type}`
  return `/give @p ${item}[trim={pattern:"${state.pattern}",material:"${state.material}"}] 1`
}

function buildLegacyGiveCommand(type: ArmorType): string {
  const item = `${state.armorTier}_${type}`
  return `/give @p ${item}{Trim:{pattern:"minecraft:${state.pattern}",material:"minecraft:${state.material}"}} 1`
}

function drawArmorTrim(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#0a0a10'
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const baseCol = TIER_COLORS[state.armorTier]
  const trimCol = MATERIAL_COLORS[state.material]

  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  if (state.showFullSet || state.armorType === 'helmet') {
    ctx.fillStyle = baseCol
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillRect(cx - 24, cy - 110, 48, 44)
    ctx.strokeRect(cx - 24, cy - 110, 48, 44)

    ctx.fillStyle = '#111827'
    ctx.fillRect(cx - 16, cy - 92, 32, 10)

    ctx.strokeStyle = trimCol
    ctx.lineWidth = 3
    ctx.strokeRect(cx - 20, cy - 106, 40, 12)
    ctx.beginPath()
    ctx.moveTo(cx, cy - 106); ctx.lineTo(cx, cy - 94)
    ctx.stroke()
  }

  if (state.showFullSet || state.armorType === 'chestplate') {
    ctx.fillStyle = baseCol
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillRect(cx - 36, cy - 60, 72, 64)
    ctx.strokeRect(cx - 36, cy - 60, 72, 64)

    ctx.fillRect(cx - 48, cy - 60, 12, 24)
    ctx.fillRect(cx + 36, cy - 60, 12, 24)

    ctx.strokeStyle = trimCol
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.moveTo(cx - 28, cy - 54); ctx.lineTo(cx, cy - 24); ctx.lineTo(cx + 28, cy - 54)
    ctx.moveTo(cx - 28, cy - 8); ctx.lineTo(cx + 28, cy - 8)
    ctx.stroke()
  }

  if (state.showFullSet || state.armorType === 'leggings') {
    ctx.fillStyle = baseCol
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillRect(cx - 28, cy + 8, 56, 12)
    ctx.fillRect(cx - 26, cy + 22, 22, 54)
    ctx.fillRect(cx + 4, cy + 22, 22, 54)
    ctx.strokeRect(cx - 26, cy + 22, 22, 54)
    ctx.strokeRect(cx + 4, cy + 22, 22, 54)

    ctx.strokeStyle = trimCol
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx - 26, cy + 40); ctx.lineTo(cx - 4, cy + 40)
    ctx.moveTo(cx + 4, cy + 40); ctx.lineTo(cx + 26, cy + 40)
    ctx.stroke()
  }

  if (state.showFullSet || state.armorType === 'boots') {
    ctx.fillStyle = baseCol
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.fillRect(cx - 30, cy + 80, 26, 24)
    ctx.fillRect(cx + 4, cy + 80, 26, 24)
    ctx.strokeRect(cx - 30, cy + 80, 26, 24)
    ctx.strokeRect(cx + 4, cy + 80, 26, 24)

    ctx.fillStyle = trimCol
    ctx.fillRect(cx - 30, cy + 80, 26, 6)
    ctx.fillRect(cx + 4, cy + 80, 26, 6)
  }
}

export function mount(container: HTMLElement): void {
  function render(): void {
    const canvas = document.getElementById('trim-canvas') as HTMLCanvasElement
    if (canvas) drawArmorTrim(canvas)

    const cmdEl = document.getElementById('trim-cmd-out')
    const legCmdEl = document.getElementById('trim-legacy-out')
    if (cmdEl) cmdEl.textContent = buildModernGiveCommand(state.armorType)
    if (legCmdEl) legCmdEl.textContent = buildLegacyGiveCommand(state.armorType)
  }

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Controls Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Armor Trim Studio (1.20+)</span>
        </div>
        <div class="panel-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Armor Material</label>
              <select id="trim-tier" class="form-select">
                <option value="netherite" ${state.armorTier === 'netherite' ? 'selected' : ''}>Netherite</option>
                <option value="diamond" ${state.armorTier === 'diamond' ? 'selected' : ''}>Diamond</option>
                <option value="iron" ${state.armorTier === 'iron' ? 'selected' : ''}>Iron</option>
                <option value="golden" ${state.armorTier === 'golden' ? 'selected' : ''}>Golden</option>
                <option value="chainmail" ${state.armorTier === 'chainmail' ? 'selected' : ''}>Chainmail</option>
                <option value="leather" ${state.armorTier === 'leather' ? 'selected' : ''}>Leather</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Armor Piece</label>
              <select id="trim-type" class="form-select">
                <option value="helmet" ${state.armorType === 'helmet' ? 'selected' : ''}>Helmet</option>
                <option value="chestplate" ${state.armorType === 'chestplate' ? 'selected' : ''}>Chestplate</option>
                <option value="leggings" ${state.armorType === 'leggings' ? 'selected' : ''}>Leggings</option>
                <option value="boots" ${state.armorType === 'boots' ? 'selected' : ''}>Boots</option>
              </select>
            </div>
          </div>

          <!-- Trim Pattern Selector -->
          <div class="form-group">
            <label class="form-label">Trim Pattern Template (18 Patterns)</label>
            <select id="trim-pattern" class="form-select">
              <option value="silence">Silence (Ancient City)</option>
              <option value="spire">Spire (End City)</option>
              <option value="vex">Vex (Woodland Mansion)</option>
              <option value="ward">Ward (Ancient City)</option>
              <option value="eye">Eye (Stronghold)</option>
              <option value="tide">Tide (Ocean Monument)</option>
              <option value="rib">Rib (Nether Fortress)</option>
              <option value="snout">Snout (Bastion Remnant)</option>
              <option value="wild">Wild (Jungle Temple)</option>
              <option value="coast">Coast (Shipwreck)</option>
              <option value="dune">Dune (Desert Pyramid)</option>
              <option value="sentry">Sentry (Pillager Outpost)</option>
              <option value="wayfinder">Wayfinder (Trail Ruins)</option>
              <option value="raiser">Raiser (Trail Ruins)</option>
              <option value="shaper">Shaper (Trail Ruins)</option>
              <option value="host">Host (Trail Ruins)</option>
              <option value="flow">Flow (Trial Chamber 1.21)</option>
              <option value="bolt">Bolt (Trial Chamber 1.21)</option>
            </select>
          </div>

          <!-- Trim Material Ingot / Mineral -->
          <div class="form-group">
            <label class="form-label">Trim Mineral Material</label>
            <div class="material-grid" style="grid-template-columns: repeat(5, 1fr);" id="trim-mat-grid">
              ${Object.keys(MATERIAL_COLORS).map(mat => `
                <button class="material-btn ${state.material === mat ? 'active' : ''}" data-trim-mat="${mat}">
                  <span class="mat-color-dot" style="background:${MATERIAL_COLORS[mat as TrimMaterial]};"></span>
                  <span>${mat.charAt(0).toUpperCase() + mat.slice(1)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-group" style="margin-top:10px;">
            <label class="form-checkbox">
              <input type="checkbox" id="trim-chk-set" ${state.showFullSet ? 'checked' : ''} />
              <span>Preview Full Armor Set Model</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Trim Visualizer & /give Command</span>
        </div>
        <div class="panel-body">
          <canvas id="trim-canvas" width="360" height="260" class="firework-canvas"></canvas>

          <!-- Modern Give Output (1.20.5+) -->
          <div class="output-block" style="margin-top:14px;">
            <div class="output-header">
              <span class="output-label">Modern /give Command (1.20.5+)</span>
              <button class="btn btn-copy" id="trim-copy-modern">Copy</button>
            </div>
            <div class="output-code" id="trim-cmd-out"></div>
          </div>

          <!-- Legacy Give Output (1.20 - 1.20.4) -->
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Legacy NBT /give (1.20 - 1.20.4)</span>
              <button class="btn btn-copy" id="trim-copy-legacy">Copy</button>
            </div>
            <div class="output-code" id="trim-legacy-out"></div>
          </div>
        </div>
      </div>
    </div>
  `

  render()

  document.getElementById('trim-tier')?.addEventListener('change', (e) => {
    state.armorTier = (e.target as HTMLSelectElement).value as ArmorTier
    render()
  })

  document.getElementById('trim-type')?.addEventListener('change', (e) => {
    state.armorType = (e.target as HTMLSelectElement).value as ArmorType
    render()
  })

  document.getElementById('trim-pattern')?.addEventListener('change', (e) => {
    state.pattern = (e.target as HTMLSelectElement).value as TrimPattern
    render()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-trim-mat]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.material = btn.dataset.trimMat as TrimMaterial
      container.querySelectorAll('[data-trim-mat]').forEach(b => b.classList.toggle('active', b === btn))
      render()
    })
  })

  document.getElementById('trim-chk-set')?.addEventListener('change', (e) => {
    state.showFullSet = (e.target as HTMLInputElement).checked
    render()
  })

  document.getElementById('trim-copy-modern')?.addEventListener('click', async () => {
    await copyToClipboard(buildModernGiveCommand(state.armorType))
    showToast('Copied 1.20.5+ item component /give command!')
  })

  document.getElementById('trim-copy-legacy')?.addEventListener('click', async () => {
    await copyToClipboard(buildLegacyGiveCommand(state.armorType))
    showToast('Copied legacy /give command!')
  })
}
