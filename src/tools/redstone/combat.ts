
interface CombatState {
  rawDamage: number
  armor: number
  toughness: number
  protectionEpf: number
  resistanceLevel: number
  breachLevel: number
  isCritical: boolean
  isShieldBlocked: boolean
  preset: string
}

const state: CombatState = {
  rawDamage: 15,
  armor: 20,
  toughness: 8,
  protectionEpf: 16,
  resistanceLevel: 0,
  breachLevel: 0,
  isCritical: false,
  isShieldBlocked: false,
  preset: 'custom',
}

const PRESETS: Record<string, { label: string; dmg: number; crit: boolean }> = {
  netherite_sword_crit: { label: 'Netherite Sword (Sharpness V + Crit)', dmg: 16.5, crit: true },
  netherite_axe_crit: { label: 'Netherite Axe (Crit hit)', dmg: 15, crit: true },
  mace_smash: { label: 'Mace Heavy Smash (Falling 15 blocks)', dmg: 48, crit: false },
  warden_boom: { label: 'Warden Sonic Boom (Ignores armor/shields)', dmg: 10, crit: false },
  charged_creeper: { label: 'Charged Creeper Point-Blank', dmg: 85, crit: false },
  end_crystal: { label: 'End Crystal Explosion (Close range)', dmg: 55, crit: false },
}

export function mount(container: HTMLElement): void {
  function calculate(): {
    effectiveDamage: number
    reductionPct: number
    heartsLost: number
    survived: boolean
    heartsRemaining: number
  } {
    if (state.isShieldBlocked) {
      return { effectiveDamage: 0, reductionPct: 100, heartsLost: 0, survived: true, heartsRemaining: 10 }
    }

    let initial = state.rawDamage
    if (state.isCritical) initial *= 1.5

    const isWarden = state.preset === 'warden_boom'
    let afterArmor = initial

    if (!isWarden) {
      const effectiveArmor = Math.max(0, state.armor * (1 - state.breachLevel * 0.15))
      const defense = Math.min(20, Math.max(effectiveArmor / 5, effectiveArmor - initial / (2 + state.toughness / 4)))
      afterArmor = initial * (1 - defense / 25)
    }

    const effectiveEpf = Math.min(20, state.protectionEpf)
    const afterProt = afterArmor * (1 - (effectiveEpf * 0.04))

    const resReduction = Math.min(1, state.resistanceLevel * 0.2)
    const finalDamage = Math.max(0, afterProt * (1 - resReduction))

    const reduction = initial > 0 ? ((initial - finalDamage) / initial) * 100 : 0
    const heartsLost = Math.round((finalDamage / 2) * 10) / 10
    const heartsRemaining = Math.max(0, Math.round((10 - heartsLost) * 10) / 10)
    const survived = finalDamage < 20

    return {
      effectiveDamage: Math.round(finalDamage * 10) / 10,
      reductionPct: Math.round(reduction * 10) / 10,
      heartsLost,
      survived,
      heartsRemaining,
    }
  }

  function render(): void {
    const res = calculate()

    container.innerHTML = `
      <div class="split-view">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Combat & Armor Mechanics</span>
            <span class="badge badge-accent" style="font-size:0.72rem;">MC 1.21+ (Mace & Modern)</span>
          </div>

          <div class="panel-body">
            <!-- Preset selector -->
            <div class="form-group">
              <label class="form-label">Incoming Attack Preset</label>
              <select id="cb-preset" class="form-select">
                <option value="custom">-- Custom Damage --</option>
                ${Object.entries(PRESETS).map(([k, p]) => `
                  <option value="${k}" ${k === state.preset ? 'selected' : ''}>${p.label} (${p.dmg} HP)</option>
                `).join('')}
              </select>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Raw Incoming Damage: ${state.rawDamage} HP (${(state.rawDamage / 2).toFixed(1)} ❤)</label>
                <input id="cb-raw" type="range" class="form-range" min="1" max="100" step="0.5" value="${state.rawDamage}" />
              </div>
              <div class="form-group">
                <label class="form-label">Defender Armor: ${state.armor} / 30</label>
                <input id="cb-armor" type="range" class="form-range" min="0" max="30" step="1" value="${state.armor}" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Armor Toughness: ${state.toughness} / 20</label>
                <input id="cb-tough" type="range" class="form-range" min="0" max="20" step="1" value="${state.toughness}" />
              </div>
              <div class="form-group">
                <label class="form-label">Protection EPF: ${state.protectionEpf} / 20</label>
                <input id="cb-epf" type="range" class="form-range" min="0" max="20" step="1" value="${state.protectionEpf}" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Resistance Effect (0-4)</label>
                <select id="cb-res" class="form-select">
                  <option value="0" ${state.resistanceLevel === 0 ? 'selected' : ''}>None (0%)</option>
                  <option value="1" ${state.resistanceLevel === 1 ? 'selected' : ''}>Resistance I (-20%)</option>
                  <option value="2" ${state.resistanceLevel === 2 ? 'selected' : ''}>Resistance II (-40%)</option>
                  <option value="3" ${state.resistanceLevel === 3 ? 'selected' : ''}>Resistance III (-60%)</option>
                  <option value="4" ${state.resistanceLevel === 4 ? 'selected' : ''}>Resistance IV (-80%)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Mace Breach Enchantment (1.21+)</label>
                <select id="cb-breach" class="form-select">
                  <option value="0" ${state.breachLevel === 0 ? 'selected' : ''}>None</option>
                  <option value="1" ${state.breachLevel === 1 ? 'selected' : ''}>Breach I (-15% Armor)</option>
                  <option value="2" ${state.breachLevel === 2 ? 'selected' : ''}>Breach II (-30% Armor)</option>
                  <option value="3" ${state.breachLevel === 3 ? 'selected' : ''}>Breach III (-45% Armor)</option>
                  <option value="4" ${state.breachLevel === 4 ? 'selected' : ''}>Breach IV (-60% Armor)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="display:flex;gap:18px;margin-top:6px;">
              <label class="toggle-label">
                <input id="cb-crit" type="checkbox" ${state.isCritical ? 'checked' : ''} />
                <span>Critical Hit (×1.5)</span>
              </label>
              <label class="toggle-label">
                <input id="cb-shield" type="checkbox" ${state.isShieldBlocked ? 'checked' : ''} />
                <span>Shield Block (100% Redirection)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Result Verdict Card -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Survival Verdict</span>
            <span class="badge ${res.survived ? 'badge-green' : 'badge-red'}" style="font-size:0.75rem;">
              ${res.survived ? 'SURVIVED' : 'LETHAL DAMAGE'}
            </span>
          </div>

          <div class="panel-body">
            <div class="combat-verdict-box ${res.survived ? 'survived' : 'lethal'}">
              <div class="combat-verdict-header">
                <h3>${res.survived ? `Player Survives with ${res.heartsRemaining} ❤` : `Lethal Hit! Overkill by ${Math.abs(res.heartsRemaining)} ❤`}</h3>
                <p>Incoming damage reduced by <strong>${res.reductionPct}%</strong> through armor, toughness & enchantments.</p>
              </div>

              <!-- Hearts Bar Visual -->
              <div class="combat-hearts-row">
                ${Array.from({ length: 10 }).map((_, i) => {
                  const heartVal = (i + 1);
                  const isLost = heartVal > res.heartsRemaining;
                  return `<span class="mc-heart ${isLost ? 'lost' : 'full'}">❤</span>`;
                }).join('')}
              </div>
            </div>

            <div class="combat-stats-grid" style="margin-top:16px;">
              <div class="stat-card">
                <span class="stat-label">Final Damage</span>
                <span class="stat-value">${res.effectiveDamage} HP</span>
                <span class="stat-sub">${res.heartsLost} Hearts</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Total Reduction</span>
                <span class="stat-value">${res.reductionPct}%</span>
                <span class="stat-sub">${(state.rawDamage - res.effectiveDamage).toFixed(1)} HP soaked</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Armor Points</span>
                <span class="stat-value">${state.armor}</span>
                <span class="stat-sub">+${state.toughness} Toughness</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    container.querySelector('#cb-preset')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value
      state.preset = val
      if (PRESETS[val]) {
        state.rawDamage = PRESETS[val].dmg
        state.isCritical = PRESETS[val].crit
      }
      render()
    })

    container.querySelector('#cb-raw')?.addEventListener('input', (e) => {
      state.rawDamage = parseFloat((e.target as HTMLInputElement).value)
      state.preset = 'custom'
      render()
    })

    container.querySelector('#cb-armor')?.addEventListener('input', (e) => {
      state.armor = parseInt((e.target as HTMLInputElement).value, 10)
      render()
    })

    container.querySelector('#cb-tough')?.addEventListener('input', (e) => {
      state.toughness = parseInt((e.target as HTMLInputElement).value, 10)
      render()
    })

    container.querySelector('#cb-epf')?.addEventListener('input', (e) => {
      state.protectionEpf = parseInt((e.target as HTMLInputElement).value, 10)
      render()
    })

    container.querySelector('#cb-res')?.addEventListener('change', (e) => {
      state.resistanceLevel = parseInt((e.target as HTMLSelectElement).value, 10)
      render()
    })

    container.querySelector('#cb-breach')?.addEventListener('change', (e) => {
      state.breachLevel = parseInt((e.target as HTMLSelectElement).value, 10)
      render()
    })

    container.querySelector('#cb-crit')?.addEventListener('change', (e) => {
      state.isCritical = (e.target as HTMLInputElement).checked
      render()
    })

    container.querySelector('#cb-shield')?.addEventListener('change', (e) => {
      state.isShieldBlocked = (e.target as HTMLInputElement).checked
      render()
    })
  }

  render()
}
