import { copyToClipboard, showToast, debounce } from '../../utils/helpers'
import { store } from '../../utils/store'

type PotionItemType = 'potion' | 'splash_potion' | 'lingering_potion' | 'tipped_arrow'

interface PotionEffect {
  id: string
  name: string
  amplifier: number
  durationSeconds: number
  ambient: boolean
  showParticles: boolean
  showIcon: boolean
}

const AVAILABLE_EFFECTS = [
  { id: 'speed', name: 'Speed' },
  { id: 'slowness', name: 'Slowness' },
  { id: 'haste', name: 'Haste' },
  { id: 'mining_fatigue', name: 'Mining Fatigue' },
  { id: 'strength', name: 'Strength' },
  { id: 'instant_health', name: 'Instant Health' },
  { id: 'instant_damage', name: 'Instant Damage' },
  { id: 'jump_boost', name: 'Jump Boost' },
  { id: 'nausea', name: 'Nausea' },
  { id: 'regeneration', name: 'Regeneration' },
  { id: 'resistance', name: 'Resistance' },
  { id: 'fire_resistance', name: 'Fire Resistance' },
  { id: 'water_breathing', name: 'Water Breathing' },
  { id: 'invisibility', name: 'Invisibility' },
  { id: 'blindness', name: 'Blindness' },
  { id: 'night_vision', name: 'Night Vision' },
  { id: 'hunger', name: 'Hunger' },
  { id: 'weakness', name: 'Weakness' },
  { id: 'poison', name: 'Poison' },
  { id: 'wither', name: 'Wither' },
  { id: 'health_boost', name: 'Health Boost' },
  { id: 'absorption', name: 'Absorption' },
  { id: 'saturation', name: 'Saturation' },
  { id: 'glowing', name: 'Glowing' },
  { id: 'levitation', name: 'Levitation' },
  { id: 'slow_falling', name: 'Slow Falling' },
  { id: 'conduit_power', name: 'Conduit Power' },
  { id: 'dolphins_grace', name: "Dolphin's Grace" },
  { id: 'darkness', name: 'Darkness' },
  { id: 'wind_charged', name: 'Wind Charged' },
  { id: 'weaving', name: 'Weaving' },
  { id: 'oozing', name: 'Oozing' },
  { id: 'infested', name: 'Infested' },
]

interface PotionState {
  itemType: PotionItemType
  customName: string
  customColor: string
  overrideColor: boolean
  effects: PotionEffect[]
}

const state: PotionState = {
  itemType: 'splash_potion',
  customName: 'Elixir of Swiftness',
  customColor: '#55FFFF',
  overrideColor: true,
  effects: [
    {
      id: 'speed',
      name: 'Speed',
      amplifier: 1,
      durationSeconds: 180,
      ambient: false,
      showParticles: true,
      showIcon: true,
    },
    {
      id: 'jump_boost',
      name: 'Jump Boost',
      amplifier: 1,
      durationSeconds: 180,
      ambient: false,
      showParticles: true,
      showIcon: true,
    },
  ],
}

function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function generateModernGiveCommand(): string {
  const potionContents: any = {}

  if (state.overrideColor && state.customColor) {
    potionContents.custom_color = hexToDecimal(state.customColor)
  }

  if (state.effects.length > 0) {
    potionContents.custom_effects = state.effects.map(eff => ({
      id: `minecraft:${eff.id}`,
      amplifier: eff.amplifier,
      duration: eff.durationSeconds * 20,
      ambient: eff.ambient ? true : undefined,
      show_particles: eff.showParticles ? undefined : false,
      show_icon: eff.showIcon ? undefined : false,
    }))
  }

  const components: string[] = []
  components.push(`potion_contents=${JSON.stringify(potionContents)}`)

  if (state.customName) {
    components.push(`item_name='${JSON.stringify({ text: state.customName, color: state.customColor })}'`)
  }

  return `/give @p ${state.itemType}[${components.join(',')}] 1`
}

function generateLegacyGiveCommand(): string {
  const tagParts: string[] = []

  if (state.effects.length > 0) {
    const effectsList = state.effects.map(eff => {
      const parts = [`Id:"minecraft:${eff.id}"`, `Amplifier:${eff.amplifier}b`, `Duration:${eff.durationSeconds * 20}`]
      if (eff.ambient) parts.push('Ambient:1b')
      if (!eff.showParticles) parts.push('ShowParticles:0b')
      if (!eff.showIcon) parts.push('ShowIcon:0b')
      return `{${parts.join(',')}}`
    }).join(',')
    tagParts.push(`CustomPotionEffects:[${effectsList}]`)
  }

  if (state.overrideColor && state.customColor) {
    tagParts.push(`CustomPotionColor:${hexToDecimal(state.customColor)}`)
  }

  if (state.customName) {
    tagParts.push(`display:{Name:'${JSON.stringify({ text: state.customName, color: state.customColor })}'}`)
  }

  const tagString = tagParts.length > 0 ? `{${tagParts.join(',')}}` : ''
  return `/give @p ${state.itemType}${tagString} 1`
}

function getActiveCommand(): string {
  return store.getSyntaxVersion() === 'legacy' ? generateLegacyGiveCommand() : generateModernGiveCommand()
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const outEl = document.getElementById('pot-output')
    const colorBubble = document.getElementById('pot-color-bubble')
    if (outEl) outEl.textContent = getActiveCommand()
    if (colorBubble) colorBubble.style.backgroundColor = state.customColor
  }

  const debouncedUpdate = debounce(update, 30)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Potion & Tipped Arrow Brewer</span>
          <span class="badge badge-accent">1.20.5+ & Legacy 1.14+</span>
        </div>
        <div class="panel-body">
          <!-- Item Type Selection -->
          <div class="form-group">
            <label class="form-label">Potion Vessel</label>
            <div class="btn-grid-4" id="pot-type-grid">
              <button class="toggle-btn ${state.itemType === 'potion' ? 'active' : ''}" data-type="potion">🧪 Drinkable</button>
              <button class="toggle-btn ${state.itemType === 'splash_potion' ? 'active' : ''}" data-type="splash_potion">💥 Splash</button>
              <button class="toggle-btn ${state.itemType === 'lingering_potion' ? 'active' : ''}" data-type="lingering_potion">☁️ Lingering</button>
              <button class="toggle-btn ${state.itemType === 'tipped_arrow' ? 'active' : ''}" data-type="tipped_arrow">🏹 Arrow</button>
            </div>
          </div>

          <!-- Name & Color Row -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Custom Name</label>
              <input type="text" id="pot-name" class="form-input" value="${state.customName}" placeholder="e.g. Draught of Immortality" />
            </div>
            <div class="form-group">
              <label class="form-label">Liquid RGB Color</label>
              <div class="color-stop" style="margin-top: 2px;">
                <input type="color" id="pot-color" value="${state.customColor}" />
                <span class="color-stop-hex" id="pot-color-hex">${state.customColor}</span>
              </div>
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Custom Status Effects -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Potion Status Effects (${state.effects.length})</label>
              <button class="btn btn-sm btn-secondary" id="pot-add-eff">+ Add Effect</button>
            </div>
            <div id="pot-effects-list" class="firework-layers-list"></div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Item Visualizer & /give Command</span>
        </div>
        <div class="panel-body">
          <div class="potion-visual-card">
            <div class="potion-icon-box">
              <div class="potion-bottle-graphic" id="pot-color-bubble" style="background-color: ${state.customColor};">
                <span class="potion-type-emoji">${state.itemType === 'tipped_arrow' ? '🏹' : state.itemType === 'splash_potion' ? '💥' : '🧪'}</span>
              </div>
            </div>
            <div class="potion-card-info">
              <div class="potion-card-name" style="color: ${state.customColor};">${state.customName || 'Custom Potion'}</div>
              <div class="potion-card-type">${state.itemType.replace('_', ' ').toUpperCase()}</div>
              <div class="potion-effects-summary">
                ${state.effects.map(e => `
                  <div class="potion-eff-tag">
                    <span>${e.name} ${e.amplifier > 0 ? (e.amplifier + 1) : ''}</span>
                    <span class="eff-dur">(${formatDuration(e.durationSeconds)})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="output-block" style="margin-top: 20px;">
            <div class="output-header">
              <span class="output-label">/give Command</span>
              <div class="output-actions">
                <div class="syntax-toggle-bar">
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'modern' ? 'active' : ''}" data-syntax="modern">Modern (1.20.5+ / 1.21)</button>
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'legacy' ? 'active' : ''}" data-syntax="legacy">Legacy (1.14 - 1.20.4)</button>
                </div>
                <button class="btn btn-copy" id="pot-copy">Copy</button>
              </div>
            </div>
            <div class="output-code" id="pot-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  function renderEffects(): void {
    const listEl = document.getElementById('pot-effects-list')
    if (!listEl) return

    listEl.innerHTML = state.effects.map((eff, idx) => `
      <div class="firework-layer-card">
        <div class="firework-layer-top">
          <select class="form-select pot-eff-sel" data-idx="${idx}" style="max-width: 170px; padding: 4px 8px; font-size: 0.82rem;">
            ${AVAILABLE_EFFECTS.map(ae => `
              <option value="${ae.id}" ${eff.id === ae.id ? 'selected' : ''}>${ae.name}</option>
            `).join('')}
          </select>

          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 0.72rem; color: var(--text-tertiary);">Tier:</label>
            <select class="form-select pot-amp-sel" data-idx="${idx}" style="width: 70px; padding: 4px 6px; font-size: 0.8rem;">
              ${[0, 1, 2, 3, 4, 9].map(amp => `
                <option value="${amp}" ${eff.amplifier === amp ? 'selected' : ''}>${amp + 1} (${['I', 'II', 'III', 'IV', 'V', 'X'][amp] || amp + 1})</option>
              `).join('')}
            </select>
            <button class="color-stop-remove pot-rem-eff" data-idx="${idx}">&times;</button>
          </div>
        </div>

        <div class="form-row-2" style="margin-top: 8px;">
          <div>
            <div class="form-label-row">
              <label class="form-label" style="font-size: 0.72rem;">Duration</label>
              <span class="badge" style="font-size: 0.7rem;">${formatDuration(eff.durationSeconds)}</span>
            </div>
            <input type="range" class="form-range pot-dur-slider" data-idx="${idx}" min="5" max="600" step="5" value="${eff.durationSeconds}" />
          </div>

          <div class="toggle-group" style="margin-top: 14px;">
            <button class="toggle-btn pot-eff-prop ${eff.ambient ? 'active' : ''}" data-idx="${idx}" data-prop="ambient" title="Beacon-like ambient particles">Beacon</button>
            <button class="toggle-btn pot-eff-prop ${eff.showParticles ? 'active' : ''}" data-idx="${idx}" data-prop="showParticles">Particles</button>
            <button class="toggle-btn pot-eff-prop ${eff.showIcon ? 'active' : ''}" data-idx="${idx}" data-prop="showIcon">Icon</button>
          </div>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLSelectElement>('.pot-eff-sel').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx!)
        const match = AVAILABLE_EFFECTS.find(ae => ae.id === sel.value)
        state.effects[idx].id = sel.value
        state.effects[idx].name = match ? match.name : sel.value
        mount(container)
      })
    })

    listEl.querySelectorAll<HTMLSelectElement>('.pot-amp-sel').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx!)
        state.effects[idx].amplifier = parseInt(sel.value)
        update()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.pot-dur-slider').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx!)
        state.effects[idx].durationSeconds = parseInt(inp.value)
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.pot-eff-prop').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx!)
        const prop = btn.dataset.prop as 'ambient' | 'showParticles' | 'showIcon'
        state.effects[idx][prop] = !state.effects[idx][prop]
        renderEffects()
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.pot-rem-eff').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx!)
        state.effects.splice(idx, 1)
        mount(container)
      })
    })
  }

  renderEffects()

  document.querySelectorAll<HTMLButtonElement>('#pot-type-grid .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.itemType = btn.dataset.type as PotionItemType
      mount(container)
    })
  })

  document.getElementById('pot-name')?.addEventListener('input', (e) => {
    state.customName = (e.target as HTMLInputElement).value
    debouncedUpdate()
  })

  document.getElementById('pot-color')?.addEventListener('input', (e) => {
    state.customColor = (e.target as HTMLInputElement).value
    const hex = document.getElementById('pot-color-hex')
    if (hex) hex.textContent = state.customColor
    debouncedUpdate()
  })

  document.getElementById('pot-add-eff')?.addEventListener('click', () => {
    state.effects.push({
      id: 'regeneration',
      name: 'Regeneration',
      amplifier: 0,
      durationSeconds: 45,
      ambient: false,
      showParticles: true,
      showIcon: true,
    })
    mount(container)
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

  document.getElementById('pot-copy')?.addEventListener('click', async () => {
    await copyToClipboard(getActiveCommand())
    showToast('Copied /give potion command!')
  })

  update()
}
