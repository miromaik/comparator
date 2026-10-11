import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

type RecipeType = 'crafting_shaped' | 'crafting_shapeless' | 'smelting' | 'blasting' | 'stonecutting'

interface RecipeState {
  type: RecipeType
  grid: (string | null)[]
  resultItem: string
  resultCount: number
  cookingTime: number
  experience: number
}

const COMMON_ITEMS = [
  'diamond', 'iron_ingot', 'gold_ingot', 'redstone', 'stick', 'oak_planks',
  'cobblestone', 'obsidian', 'leather', 'string', 'emerald', 'glass',
  'netherite_ingot', 'copper_ingot', 'amethyst_shard', 'blaze_rod',
]

const state: RecipeState = {
  type: 'crafting_shaped',
  grid: [
    'diamond', 'diamond', 'diamond',
    null, 'stick', null,
    null, 'stick', null,
  ],
  resultItem: 'diamond_pickaxe',
  resultCount: 1,
  cookingTime: 200,
  experience: 0.7,
}

let activeSlotIndex: number = 0

export function mount(container: HTMLElement): void {
  function generateJson(): string {
    const resultObj = {
      id: state.resultItem.includes(':') ? state.resultItem : `minecraft:${state.resultItem}`,
      count: state.resultCount,
    }

    if (state.type === 'crafting_shaped') {
      const keyMap: Record<string, string> = {}
      const charGrid: string[] = []
      let charCode = 65

      for (let i = 0; i < 9; i++) {
        const item = state.grid[i]
        if (!item) {
          charGrid.push(' ')
        } else {
          let foundChar = Object.keys(keyMap).find(k => keyMap[k] === item)
          if (!foundChar) {
            foundChar = String.fromCharCode(charCode++)
            keyMap[foundChar] = item.includes(':') ? item : `minecraft:${item}`
          }
          charGrid.push(foundChar)
        }
      }

      const pattern = [
        charGrid.slice(0, 3).join(''),
        charGrid.slice(3, 6).join(''),
        charGrid.slice(6, 9).join(''),
      ]

      const keyObject: Record<string, { item: string }> = {}
      for (const [k, v] of Object.entries(keyMap)) {
        keyObject[k] = { item: v }
      }

      return JSON.stringify({
        type: 'minecraft:crafting_shaped',
        category: 'equipment',
        pattern,
        key: keyObject,
        result: resultObj,
      }, null, 2)
    }

    if (state.type === 'crafting_shapeless') {
      const ingredients = state.grid
        .filter(item => Boolean(item))
        .map(item => ({ item: item!.includes(':') ? item! : `minecraft:${item}` }))

      return JSON.stringify({
        type: 'minecraft:crafting_shapeless',
        category: 'misc',
        ingredients,
        result: resultObj,
      }, null, 2)
    }

    if (state.type === 'smelting' || state.type === 'blasting') {
      const inputItem = state.grid[4] || state.grid.find(i => Boolean(i)) || 'raw_iron'
      return JSON.stringify({
        type: `minecraft:${state.type}`,
        ingredient: { item: inputItem.includes(':') ? inputItem : `minecraft:${inputItem}` },
        result: state.resultItem.includes(':') ? state.resultItem : `minecraft:${state.resultItem}`,
        experience: state.experience,
        cookingtime: state.cookingTime,
      }, null, 2)
    }

    if (state.type === 'stonecutting') {
      const inputItem = state.grid[4] || state.grid.find(i => Boolean(i)) || 'stone'
      return JSON.stringify({
        type: 'minecraft:stonecutting',
        ingredient: { item: inputItem.includes(':') ? inputItem : `minecraft:${inputItem}` },
        result: resultObj.id,
        count: resultObj.count,
      }, null, 2)
    }

    return '{}'
  }

  function renderGrid(): void {
    const gridEl = document.getElementById('r-crafting-grid')
    if (!gridEl) return

    gridEl.innerHTML = state.grid.map((item, idx) => {
      const isActive = idx === activeSlotIndex
      const displayName = item ? item.replace('minecraft:', '').replace(/_/g, ' ') : ''

      return `
        <div class="crafting-slot ${isActive ? 'active' : ''} ${item ? 'filled' : ''}" data-slot="${idx}" title="${displayName || 'Empty slot'}">
          ${item ? `<span class="slot-item-tag">${displayName}</span>` : ''}
        </div>
      `
    }).join('')

    gridEl.querySelectorAll<HTMLElement>('.crafting-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        activeSlotIndex = parseInt(slot.dataset.slot || '0', 10)
        renderGrid()
      })
    })
  }

  function update(): void {
    renderGrid()
    const outEl = document.getElementById('r-output')
    if (outEl) outEl.textContent = generateJson()
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Recipe Designer</span>
        </div>
        <div class="panel-body">
          <!-- Recipe Type -->
          <div class="form-group">
            <label class="form-label">Recipe Type</label>
            <div class="btn-grid-3">
              <button class="toggle-btn ${state.type === 'crafting_shaped' ? 'active' : ''}" data-rec-type="crafting_shaped">
                Shaped 3×3
              </button>
              <button class="toggle-btn ${state.type === 'crafting_shapeless' ? 'active' : ''}" data-rec-type="crafting_shapeless">
                Shapeless
              </button>
              <button class="toggle-btn ${state.type === 'smelting' ? 'active' : ''}" data-rec-type="smelting">
                Smelting / Furnace
              </button>
            </div>
          </div>

          <!-- Crafting Grid View -->
          <div class="crafting-table-area">
            <div class="crafting-grid-wrapper">
              <span class="crafting-area-label">3×3 Crafting Matrix (Click a slot to place item)</span>
              <div class="crafting-grid-3x3" id="r-crafting-grid"></div>
              <button class="btn btn-sm" id="r-clear-grid" style="margin-top: 8px;">Clear Grid</button>
            </div>
          </div>

          <!-- Quick Palette -->
          <div class="form-group" style="margin-top: 14px;">
            <label class="form-label">Quick Item Palette</label>
            <div class="item-palette-grid">
              ${COMMON_ITEMS.map(item => `
                <button class="palette-item-btn" data-palette-item="${item}">
                  ${item.replace(/_/g, ' ')}
                </button>
              `).join('')}
              <button class="palette-item-btn clear-btn" data-palette-item="__clear">Clear Slot</button>
            </div>
          </div>

          <!-- Custom Item Input -->
          <div class="form-group">
            <label class="form-label" for="r-custom-item">Custom Ingredient ID</label>
            <div class="form-row-2">
              <input id="r-custom-item" class="input" type="text" placeholder="e.g. nether_star or custom:item" />
              <button class="btn btn-secondary" id="r-apply-custom">Set Slot</button>
            </div>
          </div>

          <!-- Output Item -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="r-result-item">Result Item ID</label>
              <input id="r-result-item" class="input" type="text" value="${state.resultItem}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="r-result-count">Result Count</label>
              <input id="r-result-count" class="input" type="number" value="${state.resultCount}" min="1" max="64" />
            </div>
          </div>
        </div>
      </div>

      <!-- JSON Output -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Generated Recipe JSON</span>
        </div>
        <div class="panel-body">
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Recipe JSON (Datapack format)</span>
              <div class="output-actions">
                <button class="btn btn-sm" id="r-download">Download</button>
                <button class="btn btn-copy" id="r-copy">Copy</button>
              </div>
            </div>
            <div class="output-code" id="r-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  container.querySelectorAll<HTMLButtonElement>('[data-rec-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-rec-type]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.type = btn.dataset.recType as RecipeType
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-palette-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.paletteItem
      state.grid[activeSlotIndex] = item === '__clear' ? null : item || null
      activeSlotIndex = (activeSlotIndex + 1) % 9
      update()
    })
  })

  document.getElementById('r-apply-custom')?.addEventListener('click', () => {
    const input = document.getElementById('r-custom-item') as HTMLInputElement
    const val = input.value.trim()
    if (val) {
      state.grid[activeSlotIndex] = val
      activeSlotIndex = (activeSlotIndex + 1) % 9
      input.value = ''
      update()
    }
  })

  document.getElementById('r-clear-grid')?.addEventListener('click', () => {
    state.grid = Array(9).fill(null)
    update()
  })

  const resultItemInput = document.getElementById('r-result-item') as HTMLInputElement
  const resultCountInput = document.getElementById('r-result-count') as HTMLInputElement

  resultItemInput?.addEventListener('input', () => {
    state.resultItem = resultItemInput.value.trim() || 'diamond_pickaxe'
    debouncedUpdate()
  })

  resultCountInput?.addEventListener('input', () => {
    state.resultCount = Math.max(1, parseInt(resultCountInput.value, 10) || 1)
    debouncedUpdate()
  })

  document.getElementById('r-copy')?.addEventListener('click', async () => {
    const json = generateJson()
    await copyToClipboard(json)
    showToast('Recipe JSON copied!')
  })

  document.getElementById('r-download')?.addEventListener('click', () => {
    const json = generateJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.resultItem}_recipe.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Recipe JSON downloaded!')
  })

  update()
}
