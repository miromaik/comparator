import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface LootItem {
  itemId: string
  weight: number
  minCount: number
  maxCount: number
  enchantRandomly: boolean
}

interface LootPool {
  rolls: number
  bonusRolls: number
  items: LootItem[]
}

interface LootTableState {
  tableType: 'minecraft:chest' | 'minecraft:entity' | 'minecraft:block' | 'minecraft:fishing'
  pools: LootPool[]
}

const state: LootTableState = {
  tableType: 'minecraft:chest',
  pools: [
    {
      rolls: 3,
      bonusRolls: 1,
      items: [
        { itemId: 'diamond', weight: 10, minCount: 1, maxCount: 3, enchantRandomly: false },
        { itemId: 'gold_ingot', weight: 30, minCount: 2, maxCount: 8, enchantRandomly: false },
        { itemId: 'enchanted_book', weight: 5, minCount: 1, maxCount: 1, enchantRandomly: true },
        { itemId: 'iron_ingot', weight: 40, minCount: 4, maxCount: 12, enchantRandomly: false },
      ],
    },
  ],
}

function generateLootJson(): string {
  const lootTableData: any = {
    type: state.tableType,
    pools: state.pools.map(p => {
      const poolObj: any = {
        rolls: p.rolls,
        entries: p.items.map(item => {
          const entryObj: any = {
            type: 'minecraft:item',
            name: item.itemId.includes(':') ? item.itemId : `minecraft:${item.itemId}`,
            weight: item.weight,
          }

          const functions: any[] = []

          if (item.minCount > 1 || item.maxCount > 1) {
            functions.push({
              function: 'minecraft:set_count',
              count: item.minCount === item.maxCount ? item.minCount : {
                type: 'minecraft:uniform',
                min: item.minCount,
                max: item.maxCount,
              },
            })
          }

          if (item.enchantRandomly) {
            functions.push({
              function: 'minecraft:enchant_randomly',
            })
          }

          if (functions.length > 0) {
            entryObj.functions = functions
          }

          return entryObj
        }),
      }

      if (p.bonusRolls > 0) {
        poolObj.bonus_rolls = p.bonusRolls
      }

      return poolObj
    }),
  }

  return JSON.stringify(lootTableData, null, 2)
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const outEl = document.getElementById('lt-output')
    if (outEl) outEl.textContent = generateLootJson()
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Loot Table Designer</span>
          <span class="badge badge-accent">Datapack JSON</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Loot Table Type</label>
            <div class="btn-grid-4" id="lt-type-grid">
              <button class="toggle-btn ${state.tableType === 'minecraft:chest' ? 'active' : ''}" data-type="minecraft:chest">📦 Chest</button>
              <button class="toggle-btn ${state.tableType === 'minecraft:entity' ? 'active' : ''}" data-type="minecraft:entity">👾 Entity</button>
              <button class="toggle-btn ${state.tableType === 'minecraft:block' ? 'active' : ''}" data-type="minecraft:block">🧱 Block</button>
              <button class="toggle-btn ${state.tableType === 'minecraft:fishing' ? 'active' : ''}" data-type="minecraft:fishing">🎣 Fishing</button>
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Pool Rolls -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Base Rolls</label>
              <input type="number" id="lt-rolls" class="form-input" min="1" max="20" value="${state.pools[0].rolls}" />
            </div>
            <div class="form-group">
              <label class="form-label">Bonus Rolls (Luck)</label>
              <input type="number" id="lt-bonus-rolls" class="form-input" min="0" max="10" value="${state.pools[0].bonusRolls}" />
            </div>
          </div>

          <!-- Items in Pool -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Drop Table Entries (${state.pools[0].items.length})</label>
              <button class="btn btn-sm btn-secondary" id="lt-add-item">+ Add Item</button>
            </div>
            <div id="lt-items-container" class="firework-layers-list"></div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Generated loot_tables/*.json</span>
          <button class="btn btn-sm btn-secondary" id="lt-dl-btn">📥 Download .json</button>
        </div>
        <div class="panel-body">
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Loot Table JSON</span>
              <button class="btn btn-copy" id="lt-copy">Copy</button>
            </div>
            <div class="output-code" id="lt-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  function renderItems(): void {
    const listEl = document.getElementById('lt-items-container')
    if (!listEl) return

    listEl.innerHTML = state.pools[0].items.map((item, idx) => `
      <div class="firework-layer-card">
        <div class="firework-layer-top">
          <input type="text" class="form-input lt-item-id" data-idx="${idx}" value="${item.itemId}" placeholder="item id (e.g. netherite_ingot)" style="padding: 4px 8px; font-size: 0.82rem; font-family: var(--font-mono);" />
          <button class="color-stop-remove lt-rem-item" data-idx="${idx}">&times;</button>
        </div>

        <div class="form-row-3" style="margin-top: 8px;">
          <div>
            <label class="form-label" style="font-size: 0.72rem;">Weight</label>
            <input type="number" class="form-input lt-item-weight" data-idx="${idx}" value="${item.weight}" min="1" max="1000" style="padding: 4px 6px;" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.72rem;">Min Count</label>
            <input type="number" class="form-input lt-item-min" data-idx="${idx}" value="${item.minCount}" min="1" max="64" style="padding: 4px 6px;" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.72rem;">Max Count</label>
            <input type="number" class="form-input lt-item-max" data-idx="${idx}" value="${item.maxCount}" min="1" max="64" style="padding: 4px 6px;" />
          </div>
        </div>

        <div style="margin-top: 6px;">
          <button class="toggle-btn lt-item-ench ${item.enchantRandomly ? 'active' : ''}" data-idx="${idx}" style="font-size: 0.75rem;">✨ Enchant Randomly</button>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLInputElement>('.lt-item-id').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx!)
        state.pools[0].items[idx].itemId = inp.value.trim()
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.lt-item-weight').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx!)
        state.pools[0].items[idx].weight = parseInt(inp.value) || 1
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.lt-item-min').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx!)
        state.pools[0].items[idx].minCount = parseInt(inp.value) || 1
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.lt-item-max').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx!)
        state.pools[0].items[idx].maxCount = parseInt(inp.value) || 1
        debouncedUpdate()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.lt-item-ench').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx!)
        state.pools[0].items[idx].enchantRandomly = !state.pools[0].items[idx].enchantRandomly
        btn.classList.toggle('active')
        update()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('.lt-rem-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx!)
        state.pools[0].items.splice(idx, 1)
        renderItems()
        update()
      })
    })
  }

  renderItems()

  document.querySelectorAll<HTMLButtonElement>('#lt-type-grid .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tableType = btn.dataset.type as LootTableState['tableType']
      mount(container)
    })
  })

  document.getElementById('lt-rolls')?.addEventListener('input', (e) => {
    state.pools[0].rolls = parseInt((e.target as HTMLInputElement).value) || 1
    debouncedUpdate()
  })

  document.getElementById('lt-bonus-rolls')?.addEventListener('input', (e) => {
    state.pools[0].bonusRolls = parseInt((e.target as HTMLInputElement).value) || 0
    debouncedUpdate()
  })

  document.getElementById('lt-add-item')?.addEventListener('click', () => {
    state.pools[0].items.push({
      itemId: 'emerald',
      weight: 15,
      minCount: 1,
      maxCount: 4,
      enchantRandomly: false,
    })
    renderItems()
    update()
  })

  document.getElementById('lt-copy')?.addEventListener('click', async () => {
    await copyToClipboard(generateLootJson())
    showToast('Copied Loot Table JSON!')
  })

  document.getElementById('lt-dl-btn')?.addEventListener('click', () => {
    const json = generateLootJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custom_loot_table.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded custom_loot_table.json!')
  })

  update()
}
