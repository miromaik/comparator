import { copyToClipboard, showToast, debounce } from '../../utils/helpers'
import { store } from '../../utils/store'

interface SummonState {
  mobType: string
  customName: string
  nameColor: string
  showName: boolean
  maxHealth: number
  attackDamage: number
  movementSpeed: number
  isBoss: boolean
  noAi: boolean
  persistent: boolean
  silent: boolean
  invulnerable: boolean
  glowing: boolean
  mainHand: string
  headItem: string
}

const state: SummonState = {
  mobType: 'zombie',
  customName: 'Corrupted Overlord',
  nameColor: '#FF3333',
  showName: true,
  maxHealth: 150,
  attackDamage: 12,
  movementSpeed: 0.32,
  isBoss: true,
  noAi: false,
  persistent: true,
  silent: false,
  invulnerable: false,
  glowing: true,
  mainHand: 'netherite_sword',
  headItem: 'netherite_helmet',
}

const MOBS = [
  { id: 'zombie', name: 'Zombie' },
  { id: 'skeleton', name: 'Skeleton' },
  { id: 'wither_skeleton', name: 'Wither Skeleton' },
  { id: 'creeper', name: 'Creeper' },
  { id: 'piglin_brute', name: 'Piglin Brute' },
  { id: 'warden', name: 'Warden' },
  { id: 'ravager', name: 'Ravager' },
  { id: 'iron_golem', name: 'Iron Golem' },
  { id: 'enderman', name: 'Enderman' },
]

export function mount(container: HTMLElement): void {
  function generateModernCommand(): string {
    const tags: string[] = []

    if (state.customName) {
      const nameJson = JSON.stringify({ text: state.customName, color: state.nameColor, bold: true })
      tags.push(`CustomName:'${nameJson}'`)
      if (state.showName) tags.push('CustomNameVisible:1b')
    }

    const attributes: string[] = [
      `{id:"minecraft:generic.max_health",base:${state.maxHealth}d}`,
      `{id:"minecraft:generic.attack_damage",base:${state.attackDamage}d}`,
      `{id:"minecraft:generic.movement_speed",base:${state.movementSpeed}d}`,
      `{id:"minecraft:generic.follow_range",base:64.0d}`,
    ]
    tags.push(`attributes:[${attributes.join(',')}]`)
    tags.push(`Health:${state.maxHealth}f`)

    const handItems = [`{id:"minecraft:${state.mainHand}",count:1}`, '{}']
    const armorItems = ['{}', '{}', '{}', `{id:"minecraft:${state.headItem}",count:1}`]
    tags.push(`HandItems:[${handItems.join(',')}],ArmorItems:[${armorItems.join(',')}]`)

    if (state.noAi) tags.push('NoAI:1b')
    if (state.persistent) tags.push('PersistenceRequired:1b')
    if (state.silent) tags.push('Silent:1b')
    if (state.invulnerable) tags.push('Invulnerable:1b')
    if (state.glowing) tags.push('Glowing:1b')

    return `/summon minecraft:${state.mobType} ~ ~ ~ {${tags.join(',')}}`
  }

  function generateLegacyCommand(): string {
    const tags: string[] = []

    if (state.customName) {
      const nameJson = JSON.stringify({ text: state.customName, color: state.nameColor, bold: true })
      tags.push(`CustomName:'${nameJson}'`)
      if (state.showName) tags.push('CustomNameVisible:1b')
    }

    const attributes: string[] = [
      `{Name:"generic.max_health",Base:${state.maxHealth}d}`,
      `{Name:"generic.attack_damage",Base:${state.attackDamage}d}`,
      `{Name:"generic.movement_speed",Base:${state.movementSpeed}d}`,
      `{Name:"generic.follow_range",Base:64.0d}`,
    ]
    tags.push(`Attributes:[${attributes.join(',')}]`)
    tags.push(`Health:${state.maxHealth}f`)

    const handItems = [`{id:"minecraft:${state.mainHand}",Count:1b}`, '{}']
    const armorItems = ['{}', '{}', '{}', `{id:"minecraft:${state.headItem}",Count:1b}`]
    tags.push(`HandItems:[${handItems.join(',')}],ArmorItems:[${armorItems.join(',')}]`)

    if (state.noAi) tags.push('NoAI:1b')
    if (state.persistent) tags.push('PersistenceRequired:1b')
    if (state.silent) tags.push('Silent:1b')
    if (state.invulnerable) tags.push('Invulnerable:1b')
    if (state.glowing) tags.push('Glowing:1b')

    return `/summon minecraft:${state.mobType} ~ ~ ~ {${tags.join(',')}}`
  }

  function getActiveCommand(): string {
    return store.getSyntaxVersion() === 'legacy' ? generateLegacyCommand() : generateModernCommand()
  }

  function update(): void {
    const outEl = document.getElementById('sm-output')
    const heartsEl = document.getElementById('sm-hearts')
    if (heartsEl) heartsEl.textContent = `${state.maxHealth / 2} Hearts (${state.maxHealth} HP)`
    if (outEl) outEl.textContent = getActiveCommand()
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Entity & Boss Creator</span>
        </div>
        <div class="panel-body">
          <!-- Mob Type -->
          <div class="form-group">
            <label class="form-label" for="sm-mob">Entity Species</label>
            <select id="sm-mob" class="select">
              ${MOBS.map(m => `
                <option value="${m.id}" ${state.mobType === m.id ? 'selected' : ''}>${m.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Custom Name -->
          <div class="form-group">
            <label class="form-label" for="sm-name">Boss Custom Name</label>
            <div class="form-row-2">
              <input id="sm-name" class="input" type="text" value="${state.customName}" />
              <input type="color" id="sm-color" class="color-picker" value="${state.nameColor}" />
            </div>
          </div>

          <!-- Stats Sliders -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="sm-hp">Max Health (HP)</label>
              <span class="range-badge" id="sm-hearts">${state.maxHealth / 2} Hearts</span>
            </div>
            <input type="range" id="sm-hp" class="range-slider" min="1" max="1000" value="${state.maxHealth}" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="sm-dmg">Attack Damage</label>
              <input id="sm-dmg" class="input" type="number" value="${state.attackDamage}" min="0" max="100" />
            </div>
            <div class="form-group">
              <label class="form-label" for="sm-spd">Movement Speed</label>
              <input id="sm-spd" class="input" type="number" step="0.05" value="${state.movementSpeed}" min="0.05" max="1.5" />
            </div>
          </div>

          <!-- Equipment -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="sm-weapon">Main Weapon</label>
              <select id="sm-weapon" class="select">
                <option value="netherite_sword">Netherite Sword</option>
                <option value="diamond_axe">Diamond Axe</option>
                <option value="bow">Bow</option>
                <option value="mace">Mace (1.21)</option>
                <option value="air">None</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="sm-helmet">Helmet / Crown</label>
              <select id="sm-helmet" class="select">
                <option value="netherite_helmet">Netherite Helmet</option>
                <option value="diamond_helmet">Diamond Helmet</option>
                <option value="carved_pumpkin">Carved Pumpkin</option>
                <option value="air">None</option>
              </select>
            </div>
          </div>

          <!-- Toggles -->
          <div class="form-group">
            <label class="form-label">Behavior & Entity Flags</label>
            <div class="btn-grid-3">
              <button class="toggle-btn ${state.persistent ? 'active' : ''}" id="sm-t-persist">No Despawn</button>
              <button class="toggle-btn ${state.glowing ? 'active' : ''}" id="sm-t-glow">Glowing Aura</button>
              <button class="toggle-btn ${state.noAi ? 'active' : ''}" id="sm-t-noai">No AI (Statue)</button>
              <button class="toggle-btn ${state.silent ? 'active' : ''}" id="sm-t-silent">Silent</button>
              <button class="toggle-btn ${state.invulnerable ? 'active' : ''}" id="sm-t-invul">Invulnerable</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview & Output -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Generated /summon Command</span>
        </div>
        <div class="panel-body">
          <div class="stats-row" style="margin-top: 0; margin-bottom: 18px;">
            <div class="stat-card">
              <span class="stat-title">Entity Boss Health</span>
              <span class="stat-val highlight-red">${state.maxHealth} HP</span>
              <span class="stat-sub">${state.maxHealth / 2} full hearts</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Damage Per Hit</span>
              <span class="stat-val">${state.attackDamage} DMG</span>
              <span class="stat-sub">Speed: ${state.movementSpeed}</span>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">/summon Command</span>
              <div class="output-actions">
                <div class="syntax-toggle-bar">
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'modern' ? 'active' : ''}" data-syntax="modern">Modern (1.20.5+ / 1.21)</button>
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'legacy' ? 'active' : ''}" data-syntax="legacy">Legacy (1.14 - 1.20.4)</button>
                </div>
                <button class="btn btn-copy" id="sm-copy">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="output-code" id="sm-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const mobSelect = document.getElementById('sm-mob') as HTMLSelectElement
  const nameInput = document.getElementById('sm-name') as HTMLInputElement
  const colorInput = document.getElementById('sm-color') as HTMLInputElement
  const hpSlider = document.getElementById('sm-hp') as HTMLInputElement
  const dmgInput = document.getElementById('sm-dmg') as HTMLInputElement
  const spdInput = document.getElementById('sm-spd') as HTMLInputElement
  const weaponSelect = document.getElementById('sm-weapon') as HTMLSelectElement
  const helmetSelect = document.getElementById('sm-helmet') as HTMLSelectElement

  mobSelect?.addEventListener('change', () => { state.mobType = mobSelect.value; update() })
  nameInput?.addEventListener('input', () => { state.customName = nameInput.value; debouncedUpdate() })
  colorInput?.addEventListener('input', () => { state.nameColor = colorInput.value; debouncedUpdate() })
  hpSlider?.addEventListener('input', () => { state.maxHealth = parseInt(hpSlider.value, 10) || 100; update() })
  dmgInput?.addEventListener('input', () => { state.attackDamage = parseInt(dmgInput.value, 10) || 10; debouncedUpdate() })
  spdInput?.addEventListener('input', () => { state.movementSpeed = parseFloat(spdInput.value) || 0.3; debouncedUpdate() })
  weaponSelect?.addEventListener('change', () => { state.mainHand = weaponSelect.value; update() })
  helmetSelect?.addEventListener('change', () => { state.headItem = helmetSelect.value; update() })

  document.getElementById('sm-t-persist')?.addEventListener('click', (e) => {
    state.persistent = !state.persistent; (e.target as HTMLElement).classList.toggle('active', state.persistent); update()
  })
  document.getElementById('sm-t-glow')?.addEventListener('click', (e) => {
    state.glowing = !state.glowing; (e.target as HTMLElement).classList.toggle('active', state.glowing); update()
  })
  document.getElementById('sm-t-noai')?.addEventListener('click', (e) => {
    state.noAi = !state.noAi; (e.target as HTMLElement).classList.toggle('active', state.noAi); update()
  })
  document.getElementById('sm-t-silent')?.addEventListener('click', (e) => {
    state.silent = !state.silent; (e.target as HTMLElement).classList.toggle('active', state.silent); update()
  })
  document.getElementById('sm-t-invul')?.addEventListener('click', (e) => {
    state.invulnerable = !state.invulnerable; (e.target as HTMLElement).classList.toggle('active', state.invulnerable); update()
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

  document.getElementById('sm-copy')?.addEventListener('click', async () => {
    const cmd = getActiveCommand()
    await copyToClipboard(cmd)
    showToast('/summon command copied!')
  })

  update()
}
