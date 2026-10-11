import { copyToClipboard, showToast } from '../../utils/helpers'

interface AnvilState {
  anvilUsesLeft: number
  anvilUsesRight: number
  isRename: boolean
  repairUnits: number
  enchantCost: number
}

const state: AnvilState = {
  anvilUsesLeft: 0,
  anvilUsesRight: 0,
  isRename: true,
  repairUnits: 0,
  enchantCost: 4,
}

function getPriorWorkPenalty(uses: number): number {
  return Math.pow(2, uses) - 1
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const penaltyLeft = getPriorWorkPenalty(state.anvilUsesLeft)
    const penaltyRight = getPriorWorkPenalty(state.anvilUsesRight)

    let totalLevelCost = penaltyLeft + penaltyRight

    if (state.isRename) totalLevelCost += 1
    if (state.repairUnits > 0) totalLevelCost += state.repairUnits * 1
    totalLevelCost += state.enchantCost

    const isTooExpensive = totalLevelCost >= 40

    const costEl = document.getElementById('an-cost')
    const subCostEl = document.getElementById('an-subcost')
    const summaryEl = document.getElementById('an-summary')

    if (costEl) {
      if (isTooExpensive) {
        costEl.textContent = 'Too Expensive!'
        costEl.classList.add('highlight-red')
      } else {
        costEl.textContent = `${totalLevelCost} Levels`
        costEl.classList.remove('highlight-red')
      }
    }

    if (subCostEl) {
      const nextUses = Math.max(state.anvilUsesLeft, state.anvilUsesRight) + 1
      const nextPenalty = getPriorWorkPenalty(nextUses)
      subCostEl.textContent = `Result item will have ${nextUses} prior uses (Penalty: +${nextPenalty} lvls)`
    }

    if (summaryEl) {
      summaryEl.textContent = [
        `# Anvil Mechanics & Penalty Breakdown:`,
        `Left Item Prior Work Penalty:  +${penaltyLeft} levels (${state.anvilUsesLeft} uses)`,
        `Right Item Prior Work Penalty: +${penaltyRight} levels (${state.anvilUsesRight} uses)`,
        `Rename Cost:                  ${state.isRename ? '+1 level' : '+0 levels'}`,
        `Repair Cost:                  +${state.repairUnits} levels (${state.repairUnits} units)`,
        `Enchantment Base Cost:        +${state.enchantCost} levels`,
        `----------------------------------------`,
        `Total Anvil Requirement:      ${isTooExpensive ? 'TOO EXPENSIVE (>= 40 Levels in Survival!)' : `${totalLevelCost} XP Levels`}`,
        ``,
        `💡 Pro-Tip: To enchant gear with 6+ books without hitting the 40-level cap, use a Binary Tree order: combine books into pairs (A+B, C+D), then combine pairs, rather than adding books 1-by-1 sequentially!`,
      ].join('\n')
    }
  }

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Anvil Repair & Penalty Calculator</span>
        </div>
        <div class="panel-body">
          <!-- Left Item Prior Uses -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="an-left-uses">Target Item Prior Uses (Left Slot)</label>
              <span class="range-badge" id="an-badge-left">0 uses (+0 lvl)</span>
            </div>
            <input type="range" id="an-left-uses" class="range-slider" min="0" max="6" value="${state.anvilUsesLeft}" />
          </div>

          <!-- Right Item Prior Uses -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="an-right-uses">Sacrifice / Book Prior Uses (Right Slot)</label>
              <span class="range-badge" id="an-badge-right">0 uses (+0 lvl)</span>
            </div>
            <input type="range" id="an-right-uses" class="range-slider" min="0" max="6" value="${state.anvilUsesRight}" />
          </div>

          <!-- Operations -->
          <div class="form-group">
            <label class="form-label">Anvil Operations</label>
            <div class="form-row-2">
              <label class="form-checkbox">
                <input type="checkbox" id="an-rename" ${state.isRename ? 'checked' : ''} />
                <span>Rename Item (+1 lvl)</span>
              </label>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" for="an-repair">Material Repair Units</label>
                <input id="an-repair" class="input" type="number" value="${state.repairUnits}" min="0" max="4" />
              </div>
            </div>
          </div>

          <!-- Enchant Transfer Cost -->
          <div class="form-group">
            <label class="form-label" for="an-ench-cost">Enchantment Transfer Multiplier Cost</label>
            <input id="an-ench-cost" class="input" type="number" value="${state.enchantCost}" min="0" max="30" />
          </div>
        </div>
      </div>

      <!-- Analysis & Result -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Anvil Experience Cost</span>
        </div>
        <div class="panel-body">
          <div class="stats-row" style="margin-top: 0; margin-bottom: 18px;">
            <div class="stat-card">
              <span class="stat-title">Experience Level Cost</span>
              <span class="stat-val highlight-red" id="an-cost">5 Levels</span>
              <span class="stat-sub" id="an-subcost">Valid in Survival</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Survival Anvil Cap</span>
              <span class="stat-val">39 Levels</span>
              <span class="stat-sub">Cap is 40 (Too Expensive!)</span>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Penalty Breakdown & Tips</span>
              <button class="btn btn-copy" id="an-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="an-summary" style="max-height: 220px;"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const leftSlider = document.getElementById('an-left-uses') as HTMLInputElement
  const rightSlider = document.getElementById('an-right-uses') as HTMLInputElement
  const badgeLeft = document.getElementById('an-badge-left')
  const badgeRight = document.getElementById('an-badge-right')
  const renameCheck = document.getElementById('an-rename') as HTMLInputElement
  const repairInput = document.getElementById('an-repair') as HTMLInputElement
  const enchCostInput = document.getElementById('an-ench-cost') as HTMLInputElement

  leftSlider?.addEventListener('input', () => {
    state.anvilUsesLeft = parseInt(leftSlider.value, 10)
    if (badgeLeft) badgeLeft.textContent = `${state.anvilUsesLeft} uses (+${getPriorWorkPenalty(state.anvilUsesLeft)} lvl)`
    update()
  })

  rightSlider?.addEventListener('input', () => {
    state.anvilUsesRight = parseInt(rightSlider.value, 10)
    if (badgeRight) badgeRight.textContent = `${state.anvilUsesRight} uses (+${getPriorWorkPenalty(state.anvilUsesRight)} lvl)`
    update()
  })

  renameCheck?.addEventListener('change', () => {
    state.isRename = renameCheck.checked
    update()
  })

  repairInput?.addEventListener('input', () => {
    state.repairUnits = Math.max(0, parseInt(repairInput.value, 10) || 0)
    update()
  })

  enchCostInput?.addEventListener('input', () => {
    state.enchantCost = Math.max(0, parseInt(enchCostInput.value, 10) || 0)
    update()
  })

  document.getElementById('an-copy')?.addEventListener('click', async () => {
    const text = document.getElementById('an-summary')?.textContent || ''
    await copyToClipboard(text)
    showToast('Anvil report copied!')
  })

  update()
}
