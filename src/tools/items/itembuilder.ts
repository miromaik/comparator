import { copyToClipboard, showToast, debounce } from '../../utils/helpers'
import { store } from '../../utils/store'

interface EnchantmentEntry {
  id: string
  name: string
  level: number
  maxLevel: number
}

interface ItemBuilderState {
  itemType: string
  customName: string
  nameColor: string
  bold: boolean
  italic: boolean
  lore: string[]
  enchantments: Record<string, number>
  unbreakable: boolean
  glintOverride: boolean
  hideTooltip: boolean
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  customModelData: number | null
}

const COMMON_ENCHANTS: EnchantmentEntry[] = [
  { id: 'sharpness', name: 'Sharpness', level: 5, maxLevel: 5 },
  { id: 'unbreaking', name: 'Unbreaking', level: 3, maxLevel: 3 },
  { id: 'mending', name: 'Mending', level: 1, maxLevel: 1 },
  { id: 'looting', name: 'Looting', level: 3, maxLevel: 3 },
  { id: 'efficiency', name: 'Efficiency', level: 5, maxLevel: 5 },
  { id: 'fortune', name: 'Fortune', level: 3, maxLevel: 3 },
  { id: 'protection', name: 'Protection', level: 4, maxLevel: 4 },
  { id: 'fire_aspect', name: 'Fire Aspect', level: 2, maxLevel: 2 },
]

const state: ItemBuilderState = {
  itemType: 'diamond_sword',
  customName: 'Blade of the Ancients',
  nameColor: '#FFAA00',
  bold: true,
  italic: false,
  lore: ['Forged in the depths of the Nether', '§7Slays beasts with a single strike'],
  enchantments: {
    sharpness: 5,
    unbreaking: 3,
    mending: 1,
    looting: 3,
  },
  unbreakable: true,
  glintOverride: false,
  hideTooltip: false,
  rarity: 'epic',
  customModelData: null,
}

export function mount(container: HTMLElement): void {
  function generateModernCommand(): string {
    const components: string[] = []

    if (state.customName) {
      const nameObj = JSON.stringify({
        text: state.customName,
        color: state.nameColor,
        bold: state.bold ? true : undefined,
        italic: state.italic ? true : false,
      })
      components.push(`item_name='${nameObj}'`)
    }

    if (state.lore.length > 0) {
      const loreJson = state.lore.map(line => `'${JSON.stringify({ text: line, color: '#AAAAAA' })}'`)
      components.push(`lore=[${loreJson.join(',')}]`)
    }

    const activeEnchants = Object.entries(state.enchantments).filter(([_, lvl]) => lvl > 0)
    if (activeEnchants.length > 0) {
      const levelsMap = activeEnchants.map(([k, v]) => `"minecraft:${k}":${v}`).join(',')
      components.push(`enchantments={levels:{${levelsMap}}}`)
    }

    if (state.unbreakable) {
      components.push('unbreakable={}')
    }

    if (state.glintOverride) {
      components.push('enchantment_glint_override=true')
    }

    if (state.rarity !== 'common') {
      components.push(`rarity="${state.rarity}"`)
    }

    if (state.customModelData !== null && state.customModelData > 0) {
      components.push(`custom_model_data={floats:[${state.customModelData}.0f]}`)
    }

    const compString = components.length > 0 ? `[${components.join(',')}]` : ''
    return `/give @p minecraft:${state.itemType}${compString} 1`
  }

  function generateLegacyCommand(): string {
    const tagParts: string[] = []

    const displayParts: string[] = []
    if (state.customName) {
      const nameObj = JSON.stringify({
        text: state.customName,
        color: state.nameColor,
        bold: state.bold ? true : undefined,
        italic: state.italic ? true : false,
      })
      displayParts.push(`Name:'${nameObj}'`)
    }

    if (state.lore.length > 0) {
      const loreJson = state.lore.map(line => `'${JSON.stringify({ text: line, color: '#AAAAAA' })}'`)
      displayParts.push(`Lore:[${loreJson.join(',')}]`)
    }

    if (displayParts.length > 0) {
      tagParts.push(`display:{${displayParts.join(',')}}`)
    }

    const activeEnchants = Object.entries(state.enchantments).filter(([_, lvl]) => lvl > 0)
    if (activeEnchants.length > 0) {
      const enchList = activeEnchants.map(([k, v]) => `{id:"minecraft:${k}",lvl:${v}s}`).join(',')
      tagParts.push(`Enchantments:[${enchList}]`)
    }

    if (state.unbreakable) {
      tagParts.push('Unbreakable:1b')
    }

    if (state.customModelData !== null && state.customModelData > 0) {
      tagParts.push(`CustomModelData:${state.customModelData}`)
    }

    const tagString = tagParts.length > 0 ? `{${tagParts.join(',')}}` : ''
    return `/give @p minecraft:${state.itemType}${tagString} 1`
  }

  function getActiveCommand(): string {
    return store.getSyntaxVersion() === 'legacy' ? generateLegacyCommand() : generateModernCommand()
  }

  function renderTooltipPreview(): string {
    let html = `<div class="mc-item-tooltip">`
    const nameStyle = `color: ${state.nameColor}; font-weight: ${state.bold ? '700' : '400'}; font-style: ${state.italic ? 'italic' : 'normal'};`
    html += `<div class="mc-tooltip-title" style="${nameStyle}">${state.customName || state.itemType}</div>`

    const activeEnchants = Object.entries(state.enchantments).filter(([_, lvl]) => lvl > 0)
    if (activeEnchants.length > 0) {
      html += `<div class="mc-tooltip-enchants">`
      for (const [k, lvl] of activeEnchants) {
        const found = COMMON_ENCHANTS.find(e => e.id === k)
        const name = found ? found.name : k
        html += `<div class="mc-tooltip-enchant">§7${name} ${lvl > 1 ? lvl : ''}</div>`
      }
      html += `</div>`
    }

    if (state.lore.length > 0) {
      html += `<div class="mc-tooltip-lore">`
      for (const line of state.lore) {
        html += `<div>${line}</div>`
      }
      html += `</div>`
    }

    if (state.unbreakable) {
      html += `<div class="mc-tooltip-unbreakable">Unbreakable</div>`
    }

    html += `</div>`
    return html
  }

  function update(): void {
    const previewEl = document.getElementById('ib-preview')
    const outEl = document.getElementById('ib-output')

    if (previewEl) previewEl.innerHTML = renderTooltipPreview()
    if (outEl) outEl.textContent = getActiveCommand()
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Item Builder & Custom /give</span>
        </div>
        <div class="panel-body">
          <!-- Item Type -->
          <div class="form-group">
            <label class="form-label" for="ib-type">Base Item</label>
            <select id="ib-type" class="select">
              <option value="diamond_sword" ${state.itemType === 'diamond_sword' ? 'selected' : ''}>Diamond Sword</option>
              <option value="netherite_sword" ${state.itemType === 'netherite_sword' ? 'selected' : ''}>Netherite Sword</option>
              <option value="mace" ${state.itemType === 'mace' ? 'selected' : ''}>Mace (1.21)</option>
              <option value="netherite_pickaxe" ${state.itemType === 'netherite_pickaxe' ? 'selected' : ''}>Netherite Pickaxe</option>
              <option value="bow" ${state.itemType === 'bow' ? 'selected' : ''}>Bow</option>
              <option value="elytra" ${state.itemType === 'elytra' ? 'selected' : ''}>Elytra</option>
              <option value="diamond_chestplate" ${state.itemType === 'diamond_chestplate' ? 'selected' : ''}>Diamond Chestplate</option>
              <option value="golden_apple" ${state.itemType === 'golden_apple' ? 'selected' : ''}>Golden Apple</option>
              <option value="stick" ${state.itemType === 'stick' ? 'selected' : ''}>Stick</option>
            </select>
          </div>

          <!-- Custom Name & Styling -->
          <div class="form-group">
            <label class="form-label" for="ib-name">Item Name</label>
            <div class="form-row-2">
              <input id="ib-name" class="input" type="text" value="${state.customName}" />
              <div class="color-input-wrapper">
                <input type="color" id="ib-color" class="color-picker" value="${state.nameColor}" />
                <button class="toggle-btn ${state.bold ? 'active' : ''}" id="ib-bold"><strong>B</strong></button>
                <button class="toggle-btn ${state.italic ? 'active' : ''}" id="ib-italic"><em>I</em></button>
              </div>
            </div>
          </div>

          <!-- Multi-line Lore -->
          <div class="form-group">
            <label class="form-label" for="ib-lore">Item Lore (one line per row)</label>
            <textarea id="ib-lore" class="textarea" rows="2">${state.lore.join('\n')}</textarea>
          </div>

          <!-- Enchantments Grid -->
          <div class="form-group">
            <label class="form-label">Enchantments</label>
            <div class="enchant-grid">
              ${COMMON_ENCHANTS.map(ench => `
                <div class="enchant-row">
                  <span class="enchant-label">${ench.name}</span>
                  <input type="number" class="input input-sm" data-ench-id="${ench.id}" value="${state.enchantments[ench.id] || 0}" min="0" max="255" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Toggles -->
          <div class="form-group">
            <label class="form-label">Item Flags</label>
            <div class="btn-grid-3">
              <button class="toggle-btn ${state.unbreakable ? 'active' : ''}" id="ib-unbreakable">Unbreakable</button>
              <button class="toggle-btn ${state.glintOverride ? 'active' : ''}" id="ib-glint">Glint Foil</button>
              <select id="ib-rarity" class="select-sm">
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic" selected>Epic</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview & Output -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">In-Game Tooltip Preview</span>
        </div>
        <div class="panel-body">
          <div class="tooltip-container" id="ib-preview"></div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">/give Command</span>
              <div class="output-actions">
                <div class="syntax-toggle-bar">
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'modern' ? 'active' : ''}" data-syntax="modern">Modern (1.20.5+ / 1.21)</button>
                  <button class="syntax-toggle-btn ${store.getSyntaxVersion() === 'legacy' ? 'active' : ''}" data-syntax="legacy">Legacy (1.14 - 1.20.4)</button>
                </div>
                <button class="btn btn-copy" id="ib-copy">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                  Copy
                </button>
              </div>
            </div>
            <div class="output-code" id="ib-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const typeSelect = document.getElementById('ib-type') as HTMLSelectElement
  const nameInput = document.getElementById('ib-name') as HTMLInputElement
  const colorInput = document.getElementById('ib-color') as HTMLInputElement
  const loreTextarea = document.getElementById('ib-lore') as HTMLTextAreaElement

  typeSelect?.addEventListener('change', () => {
    state.itemType = typeSelect.value
    update()
  })

  nameInput?.addEventListener('input', () => {
    state.customName = nameInput.value
    debouncedUpdate()
  })

  colorInput?.addEventListener('input', () => {
    state.nameColor = colorInput.value
    debouncedUpdate()
  })

  loreTextarea?.addEventListener('input', () => {
    state.lore = loreTextarea.value.split('\n').filter(l => l.length > 0)
    debouncedUpdate()
  })

  document.getElementById('ib-bold')?.addEventListener('click', (e) => {
    state.bold = !state.bold
    ;(e.target as HTMLElement).classList.toggle('active', state.bold)
    update()
  })

  document.getElementById('ib-italic')?.addEventListener('click', (e) => {
    state.italic = !state.italic
    ;(e.target as HTMLElement).classList.toggle('active', state.italic)
    update()
  })

  document.getElementById('ib-unbreakable')?.addEventListener('click', (e) => {
    state.unbreakable = !state.unbreakable
    ;(e.target as HTMLElement).classList.toggle('active', state.unbreakable)
    update()
  })

  document.getElementById('ib-glint')?.addEventListener('click', (e) => {
    state.glintOverride = !state.glintOverride
    ;(e.target as HTMLElement).classList.toggle('active', state.glintOverride)
    update()
  })

  container.querySelectorAll<HTMLInputElement>('[data-ench-id]').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.enchId!
      state.enchantments[id] = parseInt(input.value, 10) || 0
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

  document.getElementById('ib-copy')?.addEventListener('click', async () => {
    const cmd = getActiveCommand()
    await copyToClipboard(cmd)
    showToast('/give command copied!')
  })

  update()
}
