import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface Objective {
  name: string
  criteria: string
  displayName: string
  slot: 'sidebar' | 'list' | 'belowname' | 'none'
}

interface Team {
  name: string
  displayName: string
  color: string
  friendlyFire: boolean
  nametagVisibility: 'always' | 'never' | 'hideForOtherTeams' | 'hideForOwnTeam'
}

interface ScoreboardState {
  objectives: Objective[]
  teams: Team[]
}

const state: ScoreboardState = {
  objectives: [
    {
      name: 'Kills',
      criteria: 'playerKillCount',
      displayName: 'Player Kills',
      slot: 'sidebar',
    },
    {
      name: 'Deaths',
      criteria: 'deathCount',
      displayName: 'Total Deaths',
      slot: 'list',
    },
  ],
  teams: [
    {
      name: 'RedTeam',
      displayName: 'Red Team',
      color: 'red',
      friendlyFire: false,
      nametagVisibility: 'always',
    },
    {
      name: 'BlueTeam',
      displayName: 'Blue Team',
      color: 'blue',
      friendlyFire: false,
      nametagVisibility: 'always',
    },
  ],
}

function generateCommands(): string {
  const lines: string[] = []

  lines.push('# === Objectives Setup ===')
  state.objectives.forEach(obj => {
    const disp = obj.displayName ? ` '{"text":"${obj.displayName}"}'` : ''
    lines.push(`scoreboard objectives add ${obj.name} ${obj.criteria}${disp}`)
    if (obj.slot !== 'none') {
      lines.push(`scoreboard objectives setdisplay ${obj.slot} ${obj.name}`)
    }
  })

  if (state.teams.length > 0) {
    lines.push('\n# === Teams Setup ===')
    state.teams.forEach(t => {
      lines.push(`team add ${t.name} '{"text":"${t.displayName}"}'`)
      lines.push(`team modify ${t.name} color ${t.color}`)
      lines.push(`team modify ${t.name} friendlyFire ${t.friendlyFire}`)
      lines.push(`team modify ${t.name} nametagVisibility ${t.nametagVisibility}`)
    })
  }

  return lines.join('\n')
}

export function mount(container: HTMLElement): void {
  function render(): void {
    const outEl = document.getElementById('sc-cmd-out')
    if (outEl) outEl.textContent = generateCommands()
  }

  function renderObjectives(): void {
    const listEl = document.getElementById('sc-obj-list')
    if (!listEl) return

    listEl.innerHTML = state.objectives.map((obj, i) => `
      <div class="stat-card" style="padding:10px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:0.8rem; font-weight:700; color:#ffffff;">${escapeHtml(obj.name)}</span>
          <button class="btn-remove-layer" data-del-obj="${i}">×</button>
        </div>
        <div class="form-row-2">
          <div>
            <label class="form-label" style="font-size:0.72rem;">Criteria</label>
            <select class="form-select select-sm obj-crit" data-obj-idx="${i}">
              <option value="dummy" ${obj.criteria === 'dummy' ? 'selected' : ''}>dummy (Manual/Script)</option>
              <option value="playerKillCount" ${obj.criteria === 'playerKillCount' ? 'selected' : ''}>playerKillCount (PvP Kills)</option>
              <option value="totalKillCount" ${obj.criteria === 'totalKillCount' ? 'selected' : ''}>totalKillCount (All Mob Kills)</option>
              <option value="deathCount" ${obj.criteria === 'deathCount' ? 'selected' : ''}>deathCount (Deaths)</option>
              <option value="health" ${obj.criteria === 'health' ? 'selected' : ''}>health (Hearts)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.72rem;">Display Slot</label>
            <select class="form-select select-sm obj-slot" data-obj-idx="${i}">
              <option value="sidebar" ${obj.slot === 'sidebar' ? 'selected' : ''}>Sidebar (Right)</option>
              <option value="list" ${obj.slot === 'list' ? 'selected' : ''}>Player List (Tab)</option>
              <option value="belowname" ${obj.slot === 'belowname' ? 'selected' : ''}>Below Name</option>
              <option value="none" ${obj.slot === 'none' ? 'selected' : ''}>None (Background)</option>
            </select>
          </div>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLSelectElement>('.obj-crit').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.objIdx!)
        state.objectives[idx].criteria = sel.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLSelectElement>('.obj-slot').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.objIdx!)
        state.objectives[idx].slot = sel.value as any
        render()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('[data-del-obj]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delObj!)
        state.objectives.splice(idx, 1)
        renderObjectives()
        render()
      })
    })
  }

  function renderTeams(): void {
    const listEl = document.getElementById('sc-team-list')
    if (!listEl) return

    listEl.innerHTML = state.teams.map((t, i) => `
      <div class="stat-card" style="padding:10px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:0.8rem; font-weight:700; color:#ffffff;">${escapeHtml(t.name)}</span>
          <button class="btn-remove-layer" data-del-team="${i}">×</button>
        </div>
        <div class="form-row-2">
          <div>
            <label class="form-label" style="font-size:0.72rem;">Team Color</label>
            <select class="form-select select-sm team-color" data-team-idx="${i}">
              <option value="red" ${t.color === 'red' ? 'selected' : ''}>Red</option>
              <option value="blue" ${t.color === 'blue' ? 'selected' : ''}>Blue</option>
              <option value="green" ${t.color === 'green' ? 'selected' : ''}>Green</option>
              <option value="gold" ${t.color === 'gold' ? 'selected' : ''}>Gold</option>
              <option value="aqua" ${t.color === 'aqua' ? 'selected' : ''}>Aqua</option>
              <option value="light_purple" ${t.color === 'light_purple' ? 'selected' : ''}>Purple</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.72rem;">Friendly Fire</label>
            <select class="form-select select-sm team-ff" data-team-idx="${i}">
              <option value="false" ${!t.friendlyFire ? 'selected' : ''}>Disabled (No PvP)</option>
              <option value="true" ${t.friendlyFire ? 'selected' : ''}>Enabled (PvP On)</option>
            </select>
          </div>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLSelectElement>('.team-color').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.teamIdx!)
        state.teams[idx].color = sel.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLSelectElement>('.team-ff').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.teamIdx!)
        state.teams[idx].friendlyFire = sel.value === 'true'
        render()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('[data-del-team]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delTeam!)
        state.teams.splice(idx, 1)
        renderTeams()
        render()
      })
    })
  }

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Controls Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Scoreboard & Objective Studio</span>
        </div>
        <div class="panel-body">
          <!-- Objectives Section -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Scoreboard Objectives</label>
              <button class="btn btn-sm btn-primary" id="sc-add-obj">+ Add Objective</button>
            </div>
            <div id="sc-obj-list"></div>
          </div>

          <div class="form-divider"></div>

          <!-- Teams Section -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Teams & Friendly Fire</label>
              <button class="btn btn-sm btn-primary" id="sc-add-team">+ Add Team</button>
            </div>
            <div id="sc-team-list"></div>
          </div>
        </div>
      </div>

      <!-- Preview & Output Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Generated Commands & .mcfunction</span>
        </div>
        <div class="panel-body">
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Command Batch Output</span>
              <button class="btn btn-copy" id="sc-copy-btn">Copy Batch</button>
            </div>
            <div class="output-code" id="sc-cmd-out" style="max-height: 420px;"></div>
          </div>
        </div>
      </div>
    </div>
  `

  renderObjectives()
  renderTeams()
  render()

  document.getElementById('sc-add-obj')?.addEventListener('click', () => {
    const name = prompt('Enter objective name (no spaces):', 'Coins')
    if (name) {
      state.objectives.push({
        name: name.replace(/\s+/g, '_'),
        criteria: 'dummy',
        displayName: name,
        slot: 'sidebar',
      })
      renderObjectives()
      render()
    }
  })

  document.getElementById('sc-add-team')?.addEventListener('click', () => {
    const name = prompt('Enter team name (no spaces):', 'GreenTeam')
    if (name) {
      state.teams.push({
        name: name.replace(/\s+/g, '_'),
        displayName: name,
        color: 'green',
        friendlyFire: false,
        nametagVisibility: 'always',
      })
      renderTeams()
      render()
    }
  })

  document.getElementById('sc-copy-btn')?.addEventListener('click', async () => {
    await copyToClipboard(generateCommands())
    showToast('Copied scoreboard commands to clipboard!')
  })
}
