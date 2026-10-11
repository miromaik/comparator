import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface TradeItem {
  name: string
  baseCost: number
  baseItem: string
  resultItem: string
  resultAmount: number
  maxUses: number
}

interface ProfessionConfig {
  name: string
  trades: TradeItem[]
}

const PROFESSIONS: Record<string, ProfessionConfig> = {
  librarian: {
    name: 'Librarian',
    trades: [
      { name: 'Mending Book', baseCost: 36, baseItem: 'Emerald', resultItem: 'Enchanted Book (Mending)', resultAmount: 1, maxUses: 12 },
      { name: 'Unbreaking III Book', baseCost: 48, baseItem: 'Emerald', resultItem: 'Enchanted Book (Unbreaking III)', resultAmount: 1, maxUses: 12 },
      { name: 'Efficiency V Book', baseCost: 64, baseItem: 'Emerald', resultItem: 'Enchanted Book (Efficiency V)', resultAmount: 1, maxUses: 12 },
      { name: 'Paper -> Emerald', baseCost: 24, baseItem: 'Paper', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Glass -> Emeralds', baseCost: 4, baseItem: 'Emerald', resultItem: 'Glass Block', resultAmount: 4, maxUses: 12 },
    ],
  },
  fletcher: {
    name: 'Fletcher',
    trades: [
      { name: 'Sticks -> Emerald', baseCost: 32, baseItem: 'Stick', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Flint -> Emerald', baseCost: 26, baseItem: 'Flint', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Emerald -> Arrows', baseCost: 1, baseItem: 'Emerald', resultItem: 'Arrow', resultAmount: 16, maxUses: 12 },
    ],
  },
  cleric: {
    name: 'Cleric',
    trades: [
      { name: 'Rotten Flesh -> Emerald', baseCost: 32, baseItem: 'Rotten Flesh', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Gold Ingot -> Emerald', baseCost: 3, baseItem: 'Gold Ingot', resultItem: 'Emerald', resultAmount: 1, maxUses: 12 },
      { name: 'Emerald -> Ender Pearl', baseCost: 5, baseItem: 'Emerald', resultItem: 'Ender Pearl', resultAmount: 1, maxUses: 12 },
      { name: 'Emerald -> Redstone', baseCost: 1, baseItem: 'Emerald', resultItem: 'Redstone Dust', resultAmount: 2, maxUses: 12 },
    ],
  },
  armorer: {
    name: 'Armorer',
    trades: [
      { name: 'Coal -> Emerald', baseCost: 15, baseItem: 'Coal', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Iron Ingot -> Emerald', baseCost: 4, baseItem: 'Iron Ingot', resultItem: 'Emerald', resultAmount: 1, maxUses: 12 },
      { name: 'Diamond Chestplate', baseCost: 35, baseItem: 'Emerald', resultItem: 'Diamond Chestplate', resultAmount: 1, maxUses: 3 },
      { name: 'Diamond Boots', baseCost: 28, baseItem: 'Emerald', resultItem: 'Diamond Boots', resultAmount: 1, maxUses: 3 },
    ],
  },
  farmer: {
    name: 'Farmer',
    trades: [
      { name: 'Wheat -> Emerald', baseCost: 20, baseItem: 'Wheat', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Carrots -> Emerald', baseCost: 22, baseItem: 'Carrot', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Potatoes -> Emerald', baseCost: 26, baseItem: 'Potato', resultItem: 'Emerald', resultAmount: 1, maxUses: 16 },
      { name: 'Emerald -> Golden Carrot', baseCost: 3, baseItem: 'Emerald', resultItem: 'Golden Carrot', resultAmount: 3, maxUses: 12 },
    ],
  },
}

interface VillagerState {
  profession: string
  cures: number
  heroLevel: number
  isLegacyCure: boolean
  customBaseCost: number
}

const state: VillagerState = {
  profession: 'librarian',
  cures: 1,
  heroLevel: 0,
  isLegacyCure: false,
  customBaseCost: 32,
}

export function mount(container: HTMLElement): void {
  function calculateDiscount(baseCost: number): number {
    const effectiveCures = state.isLegacyCure ? state.cures : Math.min(1, state.cures)
    const cureDiscount = effectiveCures * 20
    const heroMultiplier = state.heroLevel > 0 ? (0.05 + (state.heroLevel - 1) * 0.0625) : 0
    const heroDiscount = Math.floor(baseCost * heroMultiplier)

    const finalPrice = Math.max(1, baseCost - cureDiscount - heroDiscount)
    return finalPrice
  }

  function generateSummonCommand(): string {
    const prof = PROFESSIONS[state.profession]
    const trade = prof.trades[0]
    const discounted = calculateDiscount(trade.baseCost)

    const baseItemKey = trade.baseItem.toLowerCase().replace(/ /g, '_')
    const resultItemKey = trade.resultItem.toLowerCase().replace(/ /g, '_').split('(')[0].trim()

    return `/summon villager ~ ~ ~ {VillagerData:{profession:"minecraft:${state.profession}",level:5,type:"minecraft:plains"},Offers:{Recipes:[{buy:{id:"minecraft:${baseItemKey}",count:${discounted}},sell:{id:"minecraft:${resultItemKey}",count:${trade.resultAmount}},maxUses:999}]}}`
  }

  function update(): void {
    const prof = PROFESSIONS[state.profession]
    const tradesContainer = document.getElementById('v-trades-table')
    const commandEl = document.getElementById('v-command')
    const customResultEl = document.getElementById('v-custom-result')

    if (tradesContainer) {
      tradesContainer.innerHTML = prof.trades.map(trade => {
        const discounted = calculateDiscount(trade.baseCost)
        const savings = Math.max(0, trade.baseCost - discounted)
        const percent = Math.round((savings / trade.baseCost) * 100)

        return `
          <tr class="trade-row">
            <td class="trade-name">${trade.name}</td>
            <td class="trade-base">${trade.baseCost}× ${trade.baseItem}</td>
            <td class="trade-final ${discounted < trade.baseCost ? 'discounted' : ''}">${discounted}× ${trade.baseItem}</td>
            <td class="trade-savings"><span class="badge-green">-${percent}%</span></td>
          </tr>
        `
      }).join('')
    }

    if (customResultEl) {
      const discounted = calculateDiscount(state.customBaseCost)
      customResultEl.textContent = `${discounted} items (was ${state.customBaseCost})`
    }

    if (commandEl) {
      commandEl.textContent = generateSummonCommand()
    }
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Villager & Cure Setup</span>
          <span class="badge badge-accent">MC 1.14+ (1.20.2 Cure Cap)</span>
        </div>
        <div class="panel-body">
          <!-- Profession Selector -->
          <div class="form-group">
            <label class="form-label">Villager Profession</label>
            <div class="btn-grid-3">
              ${Object.keys(PROFESSIONS).map(k => `
                <button class="toggle-btn ${state.profession === k ? 'active' : ''}" data-prof="${k}">
                  ${PROFESSIONS[k].name}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Version Mechanics -->
          <div class="form-group">
            <label class="form-label">Minecraft Cure Mechanics</label>
            <div class="btn-grid-2">
              <button class="toggle-btn ${!state.isLegacyCure ? 'active' : ''}" data-mechanic="modern">
                MC 1.20.2+ (1-Cure Cap)
              </button>
              <button class="toggle-btn ${state.isLegacyCure ? 'active' : ''}" data-mechanic="legacy">
                MC 1.14 - 1.20.1 (5x Stack)
              </button>
            </div>
          </div>

          <!-- Zombie Cures Count -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="v-cures">Zombie Injections Cured</label>
              <span class="range-badge" id="v-cure-badge">${state.cures} Cure(s)</span>
            </div>
            <input type="range" id="v-cures" class="range-slider" min="0" max="5" value="${state.cures}" />
          </div>

          <!-- Hero of the Village -->
          <div class="form-group">
            <label class="form-label">Hero of the Village Level</label>
            <div class="btn-grid-4">
              <button class="toggle-btn ${state.heroLevel === 0 ? 'active' : ''}" data-hero="0">None</button>
              <button class="toggle-btn ${state.heroLevel === 1 ? 'active' : ''}" data-hero="1">Hero I</button>
              <button class="toggle-btn ${state.heroLevel === 3 ? 'active' : ''}" data-hero="3">Hero III</button>
              <button class="toggle-btn ${state.heroLevel === 5 ? 'active' : ''}" data-hero="5">Hero V</button>
            </div>
          </div>

          <!-- Custom Calculator Input -->
          <div class="form-group">
            <label class="form-label" for="v-custom-base">Custom Item Base Price</label>
            <div class="form-row-2">
              <input id="v-custom-base" class="input" type="number" value="${state.customBaseCost}" min="1" max="64" />
              <div class="stat-card" style="padding: 6px 12px;">
                <span class="stat-title">Discounted Price</span>
                <span class="stat-val highlight-red" id="v-custom-result">1 item</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trade Table & Command -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Calculated Discounted Trades</span>
        </div>
        <div class="panel-body">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trade Offer</th>
                  <th>Base Price</th>
                  <th>Discounted</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody id="v-trades-table"></tbody>
            </table>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Custom Discounted Villager /summon</span>
              <button class="btn btn-copy" id="v-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="v-command"></div>
          </div>
        </div>
      </div>
    </div>
  `

  container.querySelectorAll<HTMLButtonElement>('[data-prof]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-prof]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.profession = btn.dataset.prof || 'librarian'
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-mechanic]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-mechanic]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.isLegacyCure = btn.dataset.mechanic === 'legacy'
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-hero]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-hero]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.heroLevel = parseInt(btn.dataset.hero || '0', 10)
      update()
    })
  })

  const cureSlider = document.getElementById('v-cures') as HTMLInputElement
  const cureBadge = document.getElementById('v-cure-badge')
  cureSlider?.addEventListener('input', () => {
    state.cures = parseInt(cureSlider.value, 10)
    if (cureBadge) cureBadge.textContent = `${state.cures} Cure(s)`
    update()
  })

  const customInput = document.getElementById('v-custom-base') as HTMLInputElement
  customInput?.addEventListener('input', () => {
    state.customBaseCost = Math.max(1, parseInt(customInput.value, 10) || 1)
    debouncedUpdate()
  })

  document.getElementById('v-copy')?.addEventListener('click', async () => {
    const cmd = document.getElementById('v-command')?.textContent || ''
    await copyToClipboard(cmd)
    showToast('Villager /summon command copied!')
  })

  update()
}
