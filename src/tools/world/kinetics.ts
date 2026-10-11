export function renderKinetics(container: HTMLElement) {
  container.innerHTML = `
    <div class="tool-content fade-in">
      <div class="tool-header">
        <div class="tool-badge">World & Geometry</div>
        <h2>Elytra Kinetics & Fall Physics</h2>
        <p class="tool-desc">Calculate fall damage, Feather Falling IV thresholds, Mace drop attack scaling, and Elytra kinetic crash impacts.</p>
      </div>

      <div class="generator-layout">
        <!-- Settings Column -->
        <div class="config-column">
          <!-- Fall Damage Calculator -->
          <div class="panel">
            <h3 class="panel-title">Fall Damage Simulation</h3>
            
            <div class="form-group">
              <label>Fall Height (blocks)</label>
              <div class="input-unit">
                <input type="number" id="kin-height" value="23" min="1" max="500" class="input">
                <span class="unit-label">blocks</span>
              </div>
              <div class="presets-row mt-2">
                <button class="btn-chip" data-h="4">Safe (4m)</button>
                <button class="btn-chip" data-h="23">Lethal (23m)</button>
                <button class="btn-chip" data-h="44">FF IV Lethal (44m)</button>
                <button class="btn-chip" data-h="100">Sky Drop (100m)</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Feather Falling</label>
                <select id="kin-ff" class="input">
                  <option value="0">None</option>
                  <option value="1">Feather Falling I (-12%)</option>
                  <option value="2">Feather Falling II (-24%)</option>
                  <option value="3">Feather Falling III (-36%)</option>
                  <option value="4" selected>Feather Falling IV (-48%)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Armor Protection EPF</label>
                <select id="kin-prot" class="input">
                  <option value="0">None</option>
                  <option value="4">Prot IV (1 piece -16%)</option>
                  <option value="8">Prot IV (2 pieces -32%)</option>
                  <option value="16">Prot IV (Full Set -64%)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Landing Surface</label>
                <select id="kin-surface" class="input">
                  <option value="normal" selected>Normal Solid Block</option>
                  <option value="hay">Hay Bale (-80% damage)</option>
                  <option value="honey">Honey Block (-80% damage)</option>
                  <option value="bed">Bed (-50% bounce damage)</option>
                  <option value="slime">Slime Block (100% bounce / 0 dmg)</option>
                  <option value="water">Water / Powder Snow (0 dmg)</option>
                  <option value="cobweb">Cobweb (0 dmg)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Resistance Effect</label>
                <select id="kin-res" class="input">
                  <option value="0">None</option>
                  <option value="1">Resistance I (-20%)</option>
                  <option value="2">Resistance II (-40%)</option>
                  <option value="3">Resistance III (-60%)</option>
                  <option value="4">Resistance IV (-80%)</option>
                </select>
              </div>
            </div>

            <div class="checkbox-row mt-2">
              <label class="checkbox-label">
                <input type="checkbox" id="kin-jumpboost">
                <span>Jump Boost Potion (adds height penalty)</span>
              </label>
            </div>
          </div>

          <!-- Mace Drop Scaling (1.21+) -->
          <div class="panel mt-4">
            <h3 class="panel-title">1.21+ Mace Smash Scaling</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Density Enchantment</label>
                <select id="kin-density" class="input">
                  <option value="0">None</option>
                  <option value="1">Density I (+0.5/blk)</option>
                  <option value="2">Density II (+1.0/blk)</option>
                  <option value="3">Density III (+1.5/blk)</option>
                  <option value="4">Density IV (+2.0/blk)</option>
                  <option value="5" selected>Density V (+2.5/blk)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fall Distance for Smash</label>
                <div class="input-unit">
                  <input type="number" id="kin-mace-drop" value="10" min="1.5" max="150" step="0.5" class="input">
                  <span class="unit-label">blocks</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Elytra Kinetic Impact -->
          <div class="panel mt-4">
            <h3 class="panel-title">Elytra Kinetic Crash</h3>
            <div class="form-group">
              <label>Horizontal Flight Speed</label>
              <div class="input-unit">
                <input type="number" id="kin-elytra-speed" value="35" min="0" max="100" class="input">
                <span class="unit-label">m/s (blocks/s)</span>
              </div>
              <div class="presets-row mt-2">
                <button class="btn-chip" data-speed="15">Cruising (15 m/s)</button>
                <button class="btn-chip" data-speed="33">Rocket 3 (33 m/s)</button>
                <button class="btn-chip" data-speed="65">Steep Dive (65 m/s)</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Verdict & Visualizer Column -->
        <div class="preview-column">
          <div class="panel">
            <h3 class="panel-title">Fall Damage Verdict</h3>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Raw Fall Damage</div>
                <div class="stat-value" id="stat-raw-dmg">20 pts (10 ♥)</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Final Damage Taken</div>
                <div class="stat-value font-highlight" id="stat-final-dmg">10.4 pts (5.2 ♥)</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Terminal Velocity</div>
                <div class="stat-value" id="stat-terminal">78.4 m/s</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Status</div>
                <div class="stat-value" id="stat-verdict" style="color: #4ade80;">SURVIVED</div>
              </div>
            </div>

            <!-- Heart Visualizer -->
            <div class="form-group mt-3">
              <label>Remaining Health (from 20 HP / 10 Hearts):</label>
              <div class="heart-bar" id="kin-hearts" style="display: flex; gap: 4px; padding: 10px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border-color); flex-wrap: wrap;"></div>
            </div>

            <div class="info-card mt-3">
              <div class="info-row">
                <span>Safe Fall Height with Current Setup:</span>
                <strong id="stat-safe-height">3 blocks (no damage)</strong>
              </div>
              <div class="info-row">
                <span>Maximum Survivable Fall (from 20 HP):</span>
                <strong id="stat-max-height">43 blocks</strong>
              </div>
            </div>
          </div>

          <!-- Mace Output -->
          <div class="panel mt-4">
            <h3 class="panel-title">Mace Strike Damage (1.21)</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Base Mace Damage</div>
                <div class="stat-value">6.0 pts (3.0 ♥)</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Bonus Smash Damage</div>
                <div class="stat-value font-highlight" id="stat-mace-bonus">+42 pts</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Single-Hit Damage</div>
                <div class="stat-value font-highlight" id="stat-mace-total">48 pts (24 ♥)</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">One-Shot Capability</div>
                <div class="stat-value" id="stat-mace-kill" style="color: #4ade80;">Insta-kills Iron Golem!</div>
              </div>
            </div>
          </div>

          <!-- Elytra Output -->
          <div class="panel mt-4">
            <h3 class="panel-title">Elytra Impact Damage</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Impact Kinetic Damage</div>
                <div class="stat-value font-highlight" id="stat-elytra-dmg">25 pts (12.5 ♥)</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Crash Outcome</div>
                <div class="stat-value" id="stat-elytra-outcome" style="color: #ef4444;">LETHAL CRASH</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const inputHeight = container.querySelector('#kin-height') as HTMLInputElement
  const selectFF = container.querySelector('#kin-ff') as HTMLSelectElement
  const selectProt = container.querySelector('#kin-prot') as HTMLSelectElement
  const selectSurface = container.querySelector('#kin-surface') as HTMLSelectElement
  const selectRes = container.querySelector('#kin-res') as HTMLSelectElement
  const checkJump = container.querySelector('#kin-jumpboost') as HTMLInputElement

  const selectDensity = container.querySelector('#kin-density') as HTMLSelectElement
  const inputMaceDrop = container.querySelector('#kin-mace-drop') as HTMLInputElement
  const inputElytraSpeed = container.querySelector('#kin-elytra-speed') as HTMLInputElement

  const statRawDmg = container.querySelector('#stat-raw-dmg') as HTMLElement
  const statFinalDmg = container.querySelector('#stat-final-dmg') as HTMLElement
  const statVerdict = container.querySelector('#stat-verdict') as HTMLElement
  const statSafeHeight = container.querySelector('#stat-safe-height') as HTMLElement
  const statMaxHeight = container.querySelector('#stat-max-height') as HTMLElement
  const heartsContainer = container.querySelector('#kin-hearts') as HTMLElement

  const statMaceBonus = container.querySelector('#stat-mace-bonus') as HTMLElement
  const statMaceTotal = container.querySelector('#stat-mace-total') as HTMLElement
  const statMaceKill = container.querySelector('#stat-mace-kill') as HTMLElement

  const statElytraDmg = container.querySelector('#stat-elytra-dmg') as HTMLElement
  const statElytraOutcome = container.querySelector('#stat-elytra-outcome') as HTMLElement

  function update() {
    const height = Math.max(0, parseFloat(inputHeight.value) || 0)
    const ffLvl = parseInt(selectFF.value) || 0
    const protEPF = parseInt(selectProt.value) || 0
    const surface = selectSurface.value
    const resLvl = parseInt(selectRes.value) || 0
    const jumpBoost = checkJump.checked

    let surfaceMultiplier = 1.0
    let surfaceImmune = false
    if (surface === 'slime' || surface === 'water' || surface === 'cobweb') {
      surfaceImmune = true
    } else if (surface === 'hay' || surface === 'honey') {
      surfaceMultiplier = 0.2
    } else if (surface === 'bed') {
      surfaceMultiplier = 0.5
    }

    const effectiveHeight = jumpBoost ? height + 1 : height
    const rawDamage = Math.max(0, effectiveHeight - 3)

    let finalDamage = 0
    if (!surfaceImmune && rawDamage > 0) {
      let dmg = rawDamage * surfaceMultiplier

      const ffEPF = ffLvl * 3
      const totalEPF = Math.min(20, ffEPF + protEPF)
      const epfReduction = (totalEPF * 4) / 100
      dmg = dmg * (1 - epfReduction)

      const resReduction = Math.min(1.0, resLvl * 0.2)
      dmg = dmg * (1 - resReduction)

      finalDamage = Math.max(0, Math.round(dmg * 10) / 10)
    }

    statRawDmg.textContent = `${rawDamage.toFixed(1)} pts (${(rawDamage / 2).toFixed(1)} ♥)`
    statFinalDmg.textContent = `${finalDamage.toFixed(1)} pts (${(finalDamage / 2).toFixed(1)} ♥)`

    const survivingHp = Math.max(0, 20 - finalDamage)
    if (survivingHp <= 0) {
      statVerdict.textContent = 'LETHAL IMPACT'
      statVerdict.style.color = '#ef4444'
    } else if (survivingHp < 6) {
      statVerdict.textContent = 'CRITICAL HEALTH'
      statVerdict.style.color = '#f59e0b'
    } else {
      statVerdict.textContent = 'SURVIVED'
      statVerdict.style.color = '#4ade80'
    }

    renderHearts(survivingHp)

    let maxSafeH = 3
    if (surfaceImmune) {
      statSafeHeight.textContent = 'Infinite (Surface immune)'
      statMaxHeight.textContent = 'Infinite'
    } else {
      const reductionRatio = (1 - Math.min(20, ffLvl * 3 + protEPF) * 0.04) * (1 - Math.min(1.0, resLvl * 0.2)) * surfaceMultiplier
      const maxH = Math.floor(20 / (reductionRatio || 0.01) + 3)
      statSafeHeight.textContent = `${maxSafeH} blocks (0 damage)`
      statMaxHeight.textContent = `${maxH} blocks (survives with 0.5 ♥)`
    }

    const maceDrop = Math.max(0, parseFloat(inputMaceDrop.value) || 0)
    const density = parseInt(selectDensity.value) || 0
    let bonusMace = 0
    if (maceDrop > 1.5) {
      const d = maceDrop
      let baseBonus = 0
      if (d <= 3) {
        baseBonus = d * 3
      } else if (d <= 8) {
        baseBonus = 3 * 3 + (d - 3) * 2
      } else {
        baseBonus = 3 * 3 + 5 * 2 + (d - 8) * 1
      }
      const densityBonus = d * (density * 0.5)
      bonusMace = baseBonus + densityBonus
    }
    const totalMace = 6 + bonusMace
    statMaceBonus.textContent = `+${bonusMace.toFixed(1)} pts`
    statMaceTotal.textContent = `${totalMace.toFixed(1)} pts (${(totalMace / 2).toFixed(1)} ♥)`
    if (totalMace >= 100) {
      statMaceKill.textContent = 'One-shots Iron Golem (100 HP)!'
      statMaceKill.style.color = '#a855f7'
    } else if (totalMace >= 50) {
      statMaceKill.textContent = 'One-shots Warden / Ravager!'
      statMaceKill.style.color = '#38bdf8'
    } else if (totalMace >= 20) {
      statMaceKill.textContent = 'One-shots standard player/mob (20 HP)'
      statMaceKill.style.color = '#4ade80'
    } else {
      statMaceKill.textContent = 'Moderate strike'
      statMaceKill.style.color = '#94a3b8'
    }

    const elytraSpeed = Math.max(0, parseFloat(inputElytraSpeed.value) || 0)
    let elytraDamage = 0
    if (elytraSpeed > 10) {
      elytraDamage = Math.round((elytraSpeed - 10) * 1.25 * 10) / 10
    }
    statElytraDmg.textContent = `${elytraDamage.toFixed(1)} pts (${(elytraDamage / 2).toFixed(1)} ♥)`
    if (elytraDamage >= 20) {
      statElytraOutcome.textContent = 'LETHAL CRASH'
      statElytraOutcome.style.color = '#ef4444'
    } else if (elytraDamage > 0) {
      statElytraOutcome.textContent = 'INJURED'
      statElytraOutcome.style.color = '#f59e0b'
    } else {
      statElytraOutcome.textContent = 'SAFE LANDING'
      statElytraOutcome.style.color = '#4ade80'
    }
  }

  function renderHearts(hp: number) {
    heartsContainer.innerHTML = ''
    const fullHearts = Math.floor(hp / 2)
    const halfHeart = hp % 2 >= 1 ? 1 : 0
    const emptyHearts = Math.max(0, 10 - fullHearts - halfHeart)

    for (let i = 0; i < fullHearts; i++) {
      heartsContainer.innerHTML += `<span style="color: #ef4444; font-size: 16px;">♥</span>`
    }
    if (halfHeart) {
      heartsContainer.innerHTML += `<span style="color: #f87171; font-size: 16px; opacity: 0.7;">♥</span>`
    }
    for (let i = 0; i < emptyHearts; i++) {
      heartsContainer.innerHTML += `<span style="color: #334155; font-size: 16px;">♥</span>`
    }
  }

  [inputHeight, selectFF, selectProt, selectSurface, selectRes, checkJump, selectDensity, inputMaceDrop, inputElytraSpeed].forEach(el => {
    el.addEventListener('input', update)
  })

  container.querySelectorAll('.btn-chip[data-h]').forEach(btn => {
    btn.addEventListener('click', () => {
      const h = btn.getAttribute('data-h')
      if (h) {
        inputHeight.value = h
        update()
      }
    })
  })

  container.querySelectorAll('.btn-chip[data-speed]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = btn.getAttribute('data-speed')
      if (s) {
        inputElytraSpeed.value = s
        update()
      }
    })
  })

  update()
}

export const mount = renderKinetics
