
interface EnchantItem {
  id: string
  name: string
  maxLevel: number
  weight: number
}

const ENCHANTMENTS_BY_GEAR: Record<string, EnchantItem[]> = {
  sword: [
    { id: 'sharpness', name: 'Sharpness V', maxLevel: 5, weight: 1 },
    { id: 'looting', name: 'Looting III', maxLevel: 3, weight: 2 },
    { id: 'unbreaking', name: 'Unbreaking III', maxLevel: 3, weight: 1 },
    { id: 'mending', name: 'Mending I', maxLevel: 1, weight: 2 },
    { id: 'sweeping_edge', name: 'Sweeping Edge III', maxLevel: 3, weight: 2 },
    { id: 'fire_aspect', name: 'Fire Aspect II', maxLevel: 2, weight: 2 },
    { id: 'knockback', name: 'Knockback II', maxLevel: 2, weight: 1 },
  ],
  mace: [
    { id: 'density', name: 'Density V', maxLevel: 5, weight: 1 },
    { id: 'breach', name: 'Breach IV', maxLevel: 4, weight: 2 },
    { id: 'wind_burst', name: 'Wind Burst III', maxLevel: 3, weight: 3 },
    { id: 'unbreaking', name: 'Unbreaking III', maxLevel: 3, weight: 1 },
    { id: 'mending', name: 'Mending I', maxLevel: 1, weight: 2 },
    { id: 'fire_aspect', name: 'Fire Aspect II', maxLevel: 2, weight: 2 },
  ],
  pickaxe: [
    { id: 'efficiency', name: 'Efficiency V', maxLevel: 5, weight: 1 },
    { id: 'fortune', name: 'Fortune III', maxLevel: 3, weight: 2 },
    { id: 'unbreaking', name: 'Unbreaking III', maxLevel: 3, weight: 1 },
    { id: 'mending', name: 'Mending I', maxLevel: 1, weight: 2 },
    { id: 'silk_touch', name: 'Silk Touch I', maxLevel: 1, weight: 4 },
  ],
  chestplate: [
    { id: 'protection', name: 'Protection IV', maxLevel: 4, weight: 1 },
    { id: 'unbreaking', name: 'Unbreaking III', maxLevel: 3, weight: 1 },
    { id: 'mending', name: 'Mending I', maxLevel: 1, weight: 2 },
    { id: 'thorns', name: 'Thorns III', maxLevel: 3, weight: 4 },
  ],
  boots: [
    { id: 'protection', name: 'Protection IV', maxLevel: 4, weight: 1 },
    { id: 'feather_falling', name: 'Feather Falling IV', maxLevel: 4, weight: 1 },
    { id: 'unbreaking', name: 'Unbreaking III', maxLevel: 3, weight: 1 },
    { id: 'mending', name: 'Mending I', maxLevel: 1, weight: 2 },
    { id: 'depth_strider', name: 'Depth Strider III', maxLevel: 3, weight: 2 },
    { id: 'soul_speed', name: 'Soul Speed III', maxLevel: 3, weight: 4 },
  ],
}

export function mount(container: HTMLElement): void {
  let selectedGear = 'sword'
  let selectedEnchants: string[] = ['sharpness', 'looting', 'unbreaking', 'mending', 'sweeping_edge']

  function generateOptimalSteps(): Array<{ step: number; left: string; right: string; cost: number; result: string }> {
    const list = selectedEnchants.slice()
    if (!list.length) return []

    const steps: Array<{ step: number; left: string; right: string; cost: number; result: string }> = []
    let stepNum = 1

    let currentPool = list.map(id => {
      const enc = ENCHANTMENTS_BY_GEAR[selectedGear]?.find(e => e.id === id)
      return { label: `Book (${enc ? enc.name : id})`, penalty: 0, weight: enc ? enc.weight : 1 }
    })

    while (currentPool.length > 1) {
      const nextPool: typeof currentPool = []
      for (let i = 0; i < currentPool.length; i += 2) {
        if (i + 1 < currentPool.length) {
          const l = currentPool[i]
          const r = currentPool[i + 1]
          const penalty = Math.pow(2, Math.max(l.penalty, r.penalty)) - 1
          const cost = Math.min(39, Math.max(1, Math.round(l.weight + r.weight + penalty)))
          const resLabel = `Combined Book [${stepNum}]`
          steps.push({
            step: stepNum++,
            left: l.label,
            right: r.label,
            cost,
            result: resLabel,
          })
          nextPool.push({ label: resLabel, penalty: Math.max(l.penalty, r.penalty) + 1, weight: l.weight + r.weight })
        } else {
          nextPool.push(currentPool[i])
        }
      }
      currentPool = nextPool
    }

    const finalBook = currentPool[0]
    if (finalBook) {
      const gearName = selectedGear.charAt(0).toUpperCase() + selectedGear.slice(1)
      const cost = Math.min(39, Math.max(2, finalBook.weight * 2 + 1))
      steps.push({
        step: stepNum,
        left: `Vanilla ${gearName}`,
        right: finalBook.label,
        cost,
        result: `Ultimate Max ${gearName}`,
      })
    }

    return steps
  }

  function render(): void {
    const available = ENCHANTMENTS_BY_GEAR[selectedGear] || []
    const steps = generateOptimalSteps()
    const totalCost = steps.reduce((acc, s) => acc + s.cost, 0)
    const maxStepCost = steps.length ? Math.max(...steps.map(s => s.cost)) : 0

    container.innerHTML = `
      <div class="split-view">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Anvil Combine Tree Optimizer</span>
            <span class="badge" style="font-size:0.72rem;">Prevent "Too Expensive!"</span>
          </div>

          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Select Equipment</label>
              <div class="toggle-group">
                <button class="toggle-btn ${selectedGear === 'sword' ? 'active' : ''}" data-gear="sword">Sword</button>
                <button class="toggle-btn ${selectedGear === 'mace' ? 'active' : ''}" data-gear="mace">Mace (1.21)</button>
                <button class="toggle-btn ${selectedGear === 'pickaxe' ? 'active' : ''}" data-gear="pickaxe">Pickaxe</button>
                <button class="toggle-btn ${selectedGear === 'chestplate' ? 'active' : ''}" data-gear="chestplate">Chestplate</button>
                <button class="toggle-btn ${selectedGear === 'boots' ? 'active' : ''}" data-gear="boots">Boots</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Desired Enchantments (${selectedEnchants.length} selected)</label>
              <div class="enchant-picker-list">
                ${available.map(enc => {
                  const isChecked = selectedEnchants.includes(enc.id)
                  return `
                    <label class="enchant-checkbox-row ${isChecked ? 'active' : ''}">
                      <input type="checkbox" class="enchant-check" data-id="${enc.id}" ${isChecked ? 'checked' : ''} />
                      <span class="enchant-name">${enc.name}</span>
                      <span class="enchant-weight">Weight: ${enc.weight}</span>
                    </label>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Optimal Step-by-Step Merge Plan</span>
            <span class="badge ${maxStepCost < 40 ? 'badge-green' : 'badge-red'}" style="font-size:0.72rem;">
              ${maxStepCost < 40 ? `Max Step: ${maxStepCost} Lvl (Safe)` : 'EXCEEDS 39 LVL'}
            </span>
          </div>

          <div class="panel-body">
            <div class="stat-card" style="margin-bottom:14px;">
              <span class="stat-label">Total Anvil Cost</span>
              <span class="stat-value">${totalCost} Levels</span>
              <span class="stat-sub">Across ${steps.length} anvil operations in binary tree order</span>
            </div>

            <div class="anvil-steps-timeline">
              ${steps.map(s => `
                <div class="anvil-step-card">
                  <div class="anvil-step-num">Step #${s.step}</div>
                  <div class="anvil-step-details">
                    <div class="anvil-merge-row">
                      <span class="anvil-item">${s.left}</span>
                      <span class="anvil-plus">+</span>
                      <span class="anvil-item">${s.right}</span>
                      <span class="anvil-arrow">→</span>
                      <span class="anvil-item result">${s.result}</span>
                    </div>
                  </div>
                  <div class="anvil-step-cost">
                    <span>${s.cost} XP</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    container.querySelectorAll<HTMLButtonElement>('[data-gear]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedGear = btn.dataset.gear || 'sword'
        selectedEnchants = (ENCHANTMENTS_BY_GEAR[selectedGear] || []).slice(0, 4).map(e => e.id)
        render()
      })
    })

    container.querySelectorAll<HTMLInputElement>('.enchant-check').forEach(box => {
      box.addEventListener('change', () => {
        const id = box.dataset.id!
        if (box.checked) {
          if (!selectedEnchants.includes(id)) selectedEnchants.push(id)
        } else {
          selectedEnchants = selectedEnchants.filter(e => e !== id)
        }
        render()
      })
    })
  }

  render()
}
