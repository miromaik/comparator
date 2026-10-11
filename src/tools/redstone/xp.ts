import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface XpState {
  currentLevel: number
  targetLevel: number
  selectedMob: string
}

interface MobSource {
  name: string
  xp: number
  category: 'mob' | 'farm' | 'item'
}

const MOB_SOURCES: Record<string, MobSource> = {
  enderman: { name: 'Enderman (End Farm)', xp: 5, category: 'farm' },
  blaze: { name: 'Blaze (Nether Fortress)', xp: 10, category: 'farm' },
  guardian: { name: 'Guardian (Monument Farm)', xp: 10, category: 'farm' },
  piglin: { name: 'Zombified Piglin (Gold Farm)', xp: 5, category: 'farm' },
  zombie: { name: 'Zombie / Skeleton (Dungeon)', xp: 5, category: 'mob' },
  bottle: { name: 'Bottle o\' Enchanting', xp: 7, category: 'item' },
  nether_quartz: { name: 'Nether Quartz Ore Mined', xp: 3.5, category: 'item' },
  dragon: { name: 'Ender Dragon (First Kill)', xp: 12000, category: 'mob' },
  wither: { name: 'Wither Boss', xp: 50, category: 'mob' },
}

const state: XpState = {
  currentLevel: 0,
  targetLevel: 30,
  selectedMob: 'enderman',
}

function totalXpForLevel(level: number): number {
  if (level <= 0) return 0
  if (level <= 16) {
    return Math.floor(level * level + 6 * level)
  }
  if (level <= 31) {
    return Math.floor(2.5 * level * level - 40.5 * level + 360)
  }
  return Math.floor(4.5 * level * level - 162.5 * level + 2220)
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const curXp = totalXpForLevel(state.currentLevel)
    const targetXp = totalXpForLevel(state.targetLevel)
    const neededXp = Math.max(0, targetXp - curXp)

    const neededXpEl = document.getElementById('xp-needed')
    const targetTotalEl = document.getElementById('xp-target-total')
    const currentTotalEl = document.getElementById('xp-current-total')
    const mobListEl = document.getElementById('xp-mob-list')
    const summaryEl = document.getElementById('xp-summary')

    if (neededXpEl) neededXpEl.textContent = `${neededXp.toLocaleString()} XP`
    if (targetTotalEl) targetTotalEl.textContent = `${targetXp.toLocaleString()} total XP (L${state.targetLevel})`
    if (currentTotalEl) currentTotalEl.textContent = `${curXp.toLocaleString()} current XP (L${state.currentLevel})`

    if (mobListEl) {
      mobListEl.innerHTML = Object.entries(MOB_SOURCES).map(([key, mob]) => {
        const count = Math.ceil(neededXp / mob.xp)
        const isSelected = key === state.selectedMob

        return `
          <div class="xp-mob-card ${isSelected ? 'selected' : ''}" data-mob-key="${key}">
            <div class="xp-mob-info">
              <span class="xp-mob-name">${mob.name}</span>
              <span class="xp-mob-rate">${mob.xp} XP per unit</span>
            </div>
            <div class="xp-mob-count highlight-red">${count.toLocaleString()} <small>needed</small></div>
          </div>
        `
      }).join('')

      mobListEl.querySelectorAll<HTMLElement>('.xp-mob-card').forEach(card => {
        card.addEventListener('click', () => {
          state.selectedMob = card.dataset.mobKey || 'enderman'
          update()
        })
      })
    }

    if (summaryEl) {
      const mob = MOB_SOURCES[state.selectedMob]
      const mobCount = Math.ceil(neededXp / mob.xp)

      summaryEl.textContent = [
        `# Minecraft Experience Calculation`,
        `Current Level: ${state.currentLevel} (${curXp.toLocaleString()} XP)`,
        `Target Level:  ${state.targetLevel} (${targetXp.toLocaleString()} XP)`,
        `XP Deficit:    ${neededXp.toLocaleString()} XP points needed`,
        `--- Selected Source: ${mob.name} ---`,
        `Required Actions/Kills: ${mobCount.toLocaleString()}`,
        `Death Recovery Cap: Only 100 XP (Level 7) drops on player death!`,
      ].join('\n')
    }
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">XP Target Levels</span>
        </div>
        <div class="panel-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="xp-cur-lvl">Current Level</label>
              <input id="xp-cur-lvl" class="input" type="number" value="${state.currentLevel}" min="0" max="1000" />
            </div>
            <div class="form-group">
              <label class="form-label" for="xp-tar-lvl">Target Level</label>
              <input id="xp-tar-lvl" class="input" type="number" value="${state.targetLevel}" min="1" max="1000" />
            </div>
          </div>

          <!-- Quick Level Presets -->
          <div class="form-group">
            <label class="form-label">Common Milestone Targets</label>
            <div class="btn-group-wrap">
              <button class="tag-btn" data-set-target="30">Level 30 (Enchanting Table)</button>
              <button class="tag-btn" data-set-target="40">Level 40 (Anvil Repairs)</button>
              <button class="tag-btn" data-set-target="50">Level 50</button>
              <button class="tag-btn" data-set-target="100">Level 100</button>
            </div>
          </div>

          <!-- XP Deficit Card -->
          <div class="stats-row" style="margin-top: 14px;">
            <div class="stat-card">
              <span class="stat-title">Experience Required</span>
              <span class="stat-val highlight-red" id="xp-needed">1,395 XP</span>
              <span class="stat-sub" id="xp-target-total">1,395 total XP (L30)</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Current Investment</span>
              <span class="stat-val" id="xp-current-total">0 current XP</span>
              <span class="stat-sub">From 0 to ${state.targetLevel}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mob Kill Breakdown -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Farming & Mob Kill Sources</span>
        </div>
        <div class="panel-body">
          <div class="xp-mob-grid" id="xp-mob-list"></div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">XP Plan Report</span>
              <button class="btn btn-copy" id="xp-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="xp-summary"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const curInput = document.getElementById('xp-cur-lvl') as HTMLInputElement
  const tarInput = document.getElementById('xp-tar-lvl') as HTMLInputElement

  curInput?.addEventListener('input', () => {
    state.currentLevel = Math.max(0, parseInt(curInput.value, 10) || 0)
    debouncedUpdate()
  })

  tarInput?.addEventListener('input', () => {
    state.targetLevel = Math.max(1, parseInt(tarInput.value, 10) || 1)
    debouncedUpdate()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-set-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = parseInt(btn.dataset.setTarget || '30', 10)
      state.targetLevel = lvl
      tarInput.value = String(lvl)
      update()
    })
  })

  document.getElementById('xp-copy')?.addEventListener('click', async () => {
    const text = document.getElementById('xp-summary')?.textContent || ''
    await copyToClipboard(text)
    showToast('XP Plan copied!')
  })

  update()
}
