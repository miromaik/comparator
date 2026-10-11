import { copyToClipboard, showToast } from '../../utils/helpers'

type BeaconPreset = 'single' | 'double' | 'quad' | 'six'
type BeaconMaterial = 'iron' | 'gold' | 'emerald' | 'diamond' | 'netherite'

interface PresetConfig {
  name: string
  beacons: number
  layers: { [key: number]: { w: number; h: number; blocks: number } }
  description: string
}

const PRESET_CONFIGS: Record<BeaconPreset, PresetConfig> = {
  single: {
    name: 'Single Beacon (1x1)',
    beacons: 1,
    description: 'Standard single beacon pyramid. Provides 1-2 concurrent effects.',
    layers: {
      1: { w: 3, h: 3, blocks: 9 },
      2: { w: 5, h: 5, blocks: 25 },
      3: { w: 7, h: 7, blocks: 49 },
      4: { w: 9, h: 9, blocks: 81 },
    },
  },
  double: {
    name: 'Double Beacon (1x2)',
    beacons: 2,
    description: 'Dual beacon base. Efficient sharing of pyramid base for 2 full effects.',
    layers: {
      1: { w: 4, h: 3, blocks: 12 },
      2: { w: 6, h: 5, blocks: 30 },
      3: { w: 8, h: 7, blocks: 56 },
      4: { w: 10, h: 9, blocks: 90 },
    },
  },
  quad: {
    name: 'Quad Beacon (2x2)',
    beacons: 4,
    description: 'Square 4-beacon base. Provides 4 simultaneous permanent effects.',
    layers: {
      1: { w: 4, h: 4, blocks: 16 },
      2: { w: 6, h: 6, blocks: 36 },
      3: { w: 8, h: 8, blocks: 64 },
      4: { w: 10, h: 10, blocks: 100 },
    },
  },
  six: {
    name: '6-Beacon Mega (2x3 Full Effects)',
    beacons: 6,
    description: 'The ultimate base: grants all 6 primary & secondary effects at maximum level.',
    layers: {
      1: { w: 5, h: 4, blocks: 20 },
      2: { w: 7, h: 6, blocks: 42 },
      3: { w: 9, h: 8, blocks: 72 },
      4: { w: 11, h: 10, blocks: 110 },
    },
  },
}

const MATERIAL_INFO: Record<BeaconMaterial, { name: string; color: string; item: string }> = {
  iron: { name: 'Iron', color: '#d8d8d8', item: 'Iron Ingot' },
  gold: { name: 'Gold', color: '#fcee4b', item: 'Gold Ingot' },
  emerald: { name: 'Emerald', color: '#17dd62', item: 'Emerald' },
  diamond: { name: 'Diamond', color: '#4dedf4', item: 'Diamond' },
  netherite: { name: 'Netherite', color: '#4c4244', item: 'Netherite Ingot' },
}

let currentPreset: BeaconPreset = 'single'
let currentTier: number = 4
let currentMaterial: BeaconMaterial = 'iron'
let selectedVisualLayer: number = 1

export function mount(container: HTMLElement): void {
  function calculateTotalBlocks(): number {
    const config = PRESET_CONFIGS[currentPreset]
    let total = 0
    for (let i = 1; i <= currentTier; i++) {
      total += config.layers[i].blocks
    }
    return total
  }

  function renderVisualGrid(): string {
    const config = PRESET_CONFIGS[currentPreset]
    const layer = config.layers[selectedVisualLayer]
    if (!layer) return ''

    let gridHtml = `<div class="beacon-grid" style="grid-template-columns: repeat(${layer.w}, 1fr); max-width: ${layer.w * 32}px;">`
    for (let r = 0; r < layer.h; r++) {
      for (let c = 0; c < layer.w; c++) {
        gridHtml += `<div class="beacon-block" style="border-color: ${MATERIAL_INFO[currentMaterial].color}40; background: ${MATERIAL_INFO[currentMaterial].color}22;" title="Block ${c+1},${r+1}"></div>`
      }
    }
    gridHtml += `</div>`
    return gridHtml
  }

  function update(): void {
    const totalBlocks = calculateTotalBlocks()
    const totalIngots = totalBlocks * 9
    const blockStacks = Math.floor(totalBlocks / 64)
    const blockRemainder = totalBlocks % 64
    const ingotStacks = Math.floor(totalIngots / 64)
    const ingotRemainder = totalIngots % 64
    const range = currentTier === 1 ? 20 : currentTier === 2 ? 30 : currentTier === 3 ? 40 : 50
    const config = PRESET_CONFIGS[currentPreset]

    const totalBlocksEl = document.getElementById('b-total-blocks')
    const totalIngotsEl = document.getElementById('b-total-ingots')
    const blockStacksEl = document.getElementById('b-block-stacks')
    const ingotStacksEl = document.getElementById('b-ingot-stacks')
    const rangeEl = document.getElementById('b-range')
    const visualGridEl = document.getElementById('b-visual-grid')
    const layerLabelEl = document.getElementById('b-layer-label')
    const summaryCodeEl = document.getElementById('b-summary-code')

    if (totalBlocksEl) totalBlocksEl.textContent = `${totalBlocks} blocks`
    if (totalIngotsEl) totalIngotsEl.textContent = `${totalIngots.toLocaleString()} ${MATERIAL_INFO[currentMaterial].item}s`
    if (blockStacksEl) blockStacksEl.textContent = `${blockStacks} stacks + ${blockRemainder} blocks`
    if (ingotStacksEl) ingotStacksEl.textContent = `${ingotStacks} stacks + ${ingotRemainder} items`
    if (rangeEl) rangeEl.textContent = `${range} blocks radius`

    if (layerLabelEl) {
      const l = config.layers[selectedVisualLayer]
      layerLabelEl.textContent = `Layer ${selectedVisualLayer} (${l.w}×${l.h} = ${l.blocks} blocks)`
    }

    if (visualGridEl) {
      visualGridEl.innerHTML = renderVisualGrid()
    }

    if (summaryCodeEl) {
      const lines = [
        `# Beacon Project: ${config.name} (Tier ${currentTier})`,
        `Material: ${MATERIAL_INFO[currentMaterial].name}`,
        `Total Pyramid Blocks: ${totalBlocks} (${blockStacks} stacks + ${blockRemainder} blocks)`,
        `Total Raw ${MATERIAL_INFO[currentMaterial].item}s: ${totalIngots.toLocaleString()} (${ingotStacks} stacks + ${ingotRemainder})`,
        `Beacons Required: ${config.beacons}`,
        `Effective Range: ${range} blocks`,
        `--- Layer Breakdown ---`,
      ]
      for (let i = currentTier; i >= 1; i--) {
        const l = config.layers[i]
        lines.push(`Layer ${i}: ${l.w}x${l.h} (${l.blocks} blocks)`)
      }
      summaryCodeEl.textContent = lines.join('\n')
    }
  }

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Beacon Parameters</span>
        </div>
        <div class="panel-body">
          <!-- Preset Selector -->
          <div class="form-group">
            <label class="form-label">Pyramid Layout</label>
            <div class="btn-grid-2">
              <button class="toggle-btn ${currentPreset === 'single' ? 'active' : ''}" data-preset="single">
                Single (1 Beacon)
              </button>
              <button class="toggle-btn ${currentPreset === 'double' ? 'active' : ''}" data-preset="double">
                Double (2 Beacons)
              </button>
              <button class="toggle-btn ${currentPreset === 'quad' ? 'active' : ''}" data-preset="quad">
                Quad (4 Beacons)
              </button>
              <button class="toggle-btn ${currentPreset === 'six' ? 'active' : ''}" data-preset="six">
                6-Mega (All Effects)
              </button>
            </div>
          </div>

          <!-- Tier Selector -->
          <div class="form-group">
            <label class="form-label">Pyramid Tier (Height / Layers)</label>
            <div class="btn-grid-4">
              <button class="toggle-btn ${currentTier === 1 ? 'active' : ''}" data-tier="1">Tier I (1 L)</button>
              <button class="toggle-btn ${currentTier === 2 ? 'active' : ''}" data-tier="2">Tier II (2 L)</button>
              <button class="toggle-btn ${currentTier === 3 ? 'active' : ''}" data-tier="3">Tier III (3 L)</button>
              <button class="toggle-btn ${currentTier === 4 ? 'active' : ''}" data-tier="4">Tier IV (4 L)</button>
            </div>
          </div>

          <!-- Material Selector -->
          <div class="form-group">
            <label class="form-label">Base Mineral Material</label>
            <div class="material-grid">
              ${(Object.keys(MATERIAL_INFO) as BeaconMaterial[]).map(mat => `
                <button class="material-btn ${currentMaterial === mat ? 'active' : ''}" data-material="${mat}">
                  <span class="mat-color-dot" style="background-color: ${MATERIAL_INFO[mat].color};"></span>
                  <span>${MATERIAL_INFO[mat].name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Stats Quick Cards -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-title">Pyramid Blocks</span>
              <span class="stat-val highlight-red" id="b-total-blocks">164 blocks</span>
              <span class="stat-sub" id="b-block-stacks">2 stacks + 36 blocks</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Raw Ingots / Gems</span>
              <span class="stat-val" id="b-total-ingots">1,476 Ingots</span>
              <span class="stat-sub" id="b-ingot-stacks">23 stacks + 4 items</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview & Blueprints -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Layer Blueprint & Visual Grid</span>
          <div class="layer-selector-group" id="b-layer-tabs">
            ${[1, 2, 3, 4].map(l => `
              <button class="layer-tab ${l === selectedVisualLayer ? 'active' : ''}" data-layer="${l}">L${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" id="b-layer-label">Layer 1</label>
              <span class="range-badge" id="b-range">50 blocks radius</span>
            </div>
            <div class="beacon-visual-wrapper">
              <div id="b-visual-grid"></div>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Resource Plan Summary</span>
              <button class="btn btn-copy" id="b-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="b-summary-code"></div>
          </div>
        </div>
      </div>
    </div>
  `

  container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentPreset = btn.dataset.preset as BeaconPreset
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentTier = parseInt(btn.dataset.tier || '4', 10)
      if (selectedVisualLayer > currentTier) {
        selectedVisualLayer = currentTier
        container.querySelectorAll<HTMLElement>('#b-layer-tabs .layer-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.layer === String(selectedVisualLayer))
        })
      }
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-material]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-material]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentMaterial = btn.dataset.material as BeaconMaterial
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('#b-layer-tabs .layer-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const l = parseInt(tab.dataset.layer || '1', 10)
      if (l <= currentTier) {
        container.querySelectorAll('#b-layer-tabs .layer-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        selectedVisualLayer = l
        update()
      } else {
        showToast(`Increase pyramid tier to view Layer ${l}`)
      }
    })
  })

  document.getElementById('b-copy')?.addEventListener('click', async () => {
    const code = document.getElementById('b-summary-code')?.textContent || ''
    await copyToClipboard(code)
    showToast('Beacon plan copied!')
  })

  update()
}
