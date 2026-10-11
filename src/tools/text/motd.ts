import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface MotdState {
  line1: string
  line2: string
  serverName: string
  playerCount: string
  maxPlayers: string
  ping: number
  serverIcon: string
  outputFormat: 'server-properties' | 'bungeecord' | 'legacy-section' | 'legacy-ampersand' | 'minimessage'
}

const MC_COLORS: Record<string, { name: string; hex: string; code: string }> = {
  '0': { name: 'Black', hex: '#000000', code: '0' },
  '1': { name: 'Dark Blue', hex: '#0000AA', code: '1' },
  '2': { name: 'Dark Green', hex: '#00AA00', code: '2' },
  '3': { name: 'Dark Aqua', hex: '#00AAAA', code: '3' },
  '4': { name: 'Dark Red', hex: '#AA0000', code: '4' },
  '5': { name: 'Dark Purple', hex: '#AA00AA', code: '5' },
  '6': { name: 'Gold', hex: '#FFAA00', code: '6' },
  '7': { name: 'Gray', hex: '#AAAAAA', code: '7' },
  '8': { name: 'Dark Gray', hex: '#555555', code: '8' },
  '9': { name: 'Blue', hex: '#5555FF', code: '9' },
  'a': { name: 'Green', hex: '#55FF55', code: 'a' },
  'b': { name: 'Aqua', hex: '#55FFFF', code: 'b' },
  'c': { name: 'Red', hex: '#FF5555', code: 'c' },
  'd': { name: 'Light Purple', hex: '#FF55FF', code: 'd' },
  'e': { name: 'Yellow', hex: '#FFFF55', code: 'e' },
  'f': { name: 'White', hex: '#FFFFFF', code: 'f' },
}

const PRESETS = [
  {
    name: 'Featured Network',
    l1: '&b&lMYTHIC NETWORK &7[1.8-1.21] &8» &6&lSKYBLOCK 2.0',
    l2: '&e&lSEASON 5 &7• &a&nstore.mythic.net&r &7• &d&l+50% XP WEEKEND',
  },
  {
    name: 'Survival SMP',
    l1: '&a&lARCADIA SMP &8┃ &7Pure Vanilla 1.21 &8[EU]',
    l2: '&f&oCustom Terrain &8• &bNo Land Claims &8• &d/discord',
  },
  {
    name: 'Maintenance Mode',
    l1: '&c&lSERVER UNDER MAINTENANCE &8┃ &7Updating to 1.21.4',
    l2: '&7We will be back shortly &8[&fdiscord.gg/myserver&8]',
  },
  {
    name: 'Hardcore Factions',
    l1: '&4&lFACTIONS RPG &8» &c&lRAID TIME &7Tonight 20:00 UTC',
    l2: '&6Season 12 &7| &e$500 F-TOP Prize &7| &aplay.factions.org',
  },
]

const state: MotdState = {
  line1: '&b&lMYTHIC NETWORK &7[1.8-1.21] &8» &6&lSKYBLOCK 2.0',
  line2: '&e&lSEASON 5 &7• &a&nstore.mythic.net&r &7• &d&l+50% XP WEEKEND',
  serverName: 'Minecraft Server',
  playerCount: '48',
  maxPlayers: '150',
  ping: 28,
  serverIcon: 'default',
  outputFormat: 'server-properties',
}

function parseFormattedTextToHtml(raw: string): string {
  if (!raw) return '&nbsp;'

  let html = ''
  let currentColor = '#FFFFFF'
  let bold = false
  let italic = false
  let underline = false
  let strikethrough = false
  let obfuscated = false

  const tokens = raw.split(/(&[0-9a-fk-or]|§[0-9a-fk-or]|&#[0-9a-fA-F]{6}|<#[0-9a-fA-F]{6}>)/g)

  for (const token of tokens) {
    if (!token) continue

    if (token.startsWith('&') || token.startsWith('§')) {
      const code = token.charAt(1).toLowerCase()
      if (token.length > 2 && token.startsWith('&#')) {
        currentColor = token.substring(1)
      } else if (MC_COLORS[code]) {
        currentColor = MC_COLORS[code].hex
        bold = false
        italic = false
        underline = false
        strikethrough = false
        obfuscated = false
      } else {
        switch (code) {
          case 'l': bold = true; break
          case 'o': italic = true; break
          case 'n': underline = true; break
          case 'm': strikethrough = true; break
          case 'k': obfuscated = true; break
          case 'r':
            currentColor = '#FFFFFF'
            bold = false
            italic = false
            underline = false
            strikethrough = false
            obfuscated = false
            break
        }
      }
    } else if (token.startsWith('<#') && token.endsWith('>')) {
      currentColor = token.substring(1, 8)
    } else {
      const classes: string[] = ['mc-char']
      if (bold) classes.push('bold')
      if (italic) classes.push('italic')
      if (underline) classes.push('underline')
      if (strikethrough) classes.push('strikethrough')
      if (obfuscated) classes.push('obfuscated')

      const escaped = token
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/ /g, '&nbsp;')

      html += `<span class="${classes.join(' ')}" style="color: ${currentColor};">${escaped}</span>`
    }
  }

  return html || '&nbsp;'
}

function stripFormatting(raw: string): string {
  return raw
    .replace(/(&[0-9a-fk-or]|§[0-9a-fk-or])/gi, '')
    .replace(/&#[0-9a-fA-F]{6}/gi, '')
    .replace(/<#[0-9a-fA-F]{6}>/gi, '')
}

function generateOutput(): string {
  const l1 = state.line1
  const l2 = state.line2

  switch (state.outputFormat) {
    case 'server-properties': {
      const sectionFormatted = `${l1}\n${l2}`.replace(/&([0-9a-fk-or])/g, '§$1')
      const unicodeEscaped = sectionFormatted
        .split('')
        .map(char => {
          const code = char.charCodeAt(0)
          return code > 127 ? '\\u' + code.toString(16).padStart(4, '0') : char
        })
        .join('')
        .replace(/\n/g, '\\n')
      return `motd=${unicodeEscaped}`
    }

    case 'bungeecord': {
      return `motd: |-\n  ${l1}\n  ${l2}`
    }

    case 'legacy-section': {
      return `${l1}\n${l2}`.replace(/&([0-9a-fk-or])/g, '§$1')
    }

    case 'legacy-ampersand': {
      return `${l1}\n${l2}`.replace(/§([0-9a-fk-or])/g, '&$1')
    }

    case 'minimessage': {
      return `${l1}\n${l2}`
    }
  }
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const pLine1 = document.getElementById('motd-preview-l1')
    const pLine2 = document.getElementById('motd-preview-l2')
    const pPlayers = document.getElementById('motd-preview-players')
    const pName = document.getElementById('motd-preview-name')
    const outEl = document.getElementById('motd-output')

    if (pLine1) pLine1.innerHTML = parseFormattedTextToHtml(state.line1)
    if (pLine2) pLine2.innerHTML = parseFormattedTextToHtml(state.line2)
    if (pPlayers) pPlayers.textContent = `${state.playerCount}/${state.maxPlayers}`
    if (pName) pName.textContent = state.serverName || 'Minecraft Server'
    if (outEl) outEl.textContent = generateOutput()

    const count1 = stripFormatting(state.line1).length
    const count2 = stripFormatting(state.line2).length
    const l1CountEl = document.getElementById('l1-count')
    const l2CountEl = document.getElementById('l2-count')

    if (l1CountEl) {
      l1CountEl.textContent = `${count1}/59`
      l1CountEl.classList.toggle('warning', count1 > 59)
    }
    if (l2CountEl) {
      l2CountEl.textContent = `${count2}/59`
      l2CountEl.classList.toggle('warning', count2 > 59)
    }
  }

  const debouncedUpdate = debounce(update, 50)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">MOTD Editor</span>
          <select id="motd-presets" class="select-sm">
            <option value="" disabled selected>Load Preset...</option>
            ${PRESETS.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="motd-l1">Line 1</label>
              <span class="char-counter" id="l1-count">0/59</span>
            </div>
            <input id="motd-l1" class="input" type="text" value="${state.line1}" placeholder="&b&lServer &7Name..." />
          </div>

          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="motd-l2">Line 2</label>
              <span class="char-counter" id="l2-count">0/59</span>
            </div>
            <input id="motd-l2" class="input" type="text" value="${state.line2}" placeholder="&eJoin now &7• &fdiscord.gg..." />
          </div>

          <!-- Minecraft Colors Palette -->
          <div class="form-group">
            <label class="form-label">Quick Color Codes</label>
            <div class="mc-color-grid">
              ${Object.entries(MC_COLORS).map(([code, info]) => `
                <button type="button" class="mc-color-btn" data-insert="&${code}" title="&${code} ${info.name}" style="background-color: ${info.hex};">
                  <span class="mc-color-code">&${code}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Quick Formatting Codes -->
          <div class="form-group">
            <label class="form-label">Formatting Tags</label>
            <div class="btn-group-wrap">
              <button type="button" class="tag-btn" data-insert="&l"><strong>&l Bold</strong></button>
              <button type="button" class="tag-btn" data-insert="&o"><em>&o Italic</em></button>
              <button type="button" class="tag-btn" data-insert="&n"><u>&n Underline</u></button>
              <button type="button" class="tag-btn" data-insert="&m"><del>&m Strike</del></button>
              <button type="button" class="tag-btn" data-insert="&k">&k Magic</button>
              <button type="button" class="tag-btn" data-insert="&r">&r Reset</button>
            </div>
          </div>

          <!-- Server Details -->
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label" for="motd-name">Server Title</label>
              <input id="motd-name" class="input" type="text" value="${state.serverName}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="motd-players">Online</label>
              <input id="motd-players" class="input" type="number" value="${state.playerCount}" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="motd-max">Max Players</label>
              <input id="motd-max" class="input" type="number" value="${state.maxPlayers}" min="1" />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview & Output -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Server List Live Preview</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">In-Game Server List Appearance</label>
            
            <!-- Exact Minecraft Server List GUI Row -->
            <div class="mc-server-card">
              <div class="mc-server-icon">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="4" fill="#181824"/>
                  <rect x="6" y="6" width="20" height="20" rx="3" fill="#ff3333" opacity="0.8"/>
                  <path d="M16 10v12M10 16h12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="mc-server-details">
                <div class="mc-server-header">
                  <span class="mc-server-title" id="motd-preview-name">Minecraft Server</span>
                  <div class="mc-server-meta">
                    <span class="mc-server-players" id="motd-preview-players">48/150</span>
                    <div class="mc-ping-bars" title="28ms">
                      <span class="bar bar-1"></span>
                      <span class="bar bar-2"></span>
                      <span class="bar bar-3"></span>
                      <span class="bar bar-4"></span>
                      <span class="bar bar-5"></span>
                    </div>
                  </div>
                </div>
                <div class="mc-motd-lines">
                  <div class="mc-motd-line" id="motd-preview-l1"></div>
                  <div class="mc-motd-line" id="motd-preview-l2"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Output Target</label>
            <div class="output-tabs" id="motd-format-tabs">
              <button class="output-tab active" data-format="server-properties">server.properties</button>
              <button class="output-tab" data-format="bungeecord">Bungee / Velocity</button>
              <button class="output-tab" data-format="legacy-section">§ Section</button>
              <button class="output-tab" data-format="legacy-ampersand">& Ampersand</button>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Configuration Output</span>
              <button class="btn btn-copy" id="motd-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="motd-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  let activeInput: HTMLInputElement | null = document.getElementById('motd-l1') as HTMLInputElement

  const l1Input = document.getElementById('motd-l1') as HTMLInputElement
  const l2Input = document.getElementById('motd-l2') as HTMLInputElement
  const nameInput = document.getElementById('motd-name') as HTMLInputElement
  const playersInput = document.getElementById('motd-players') as HTMLInputElement
  const maxInput = document.getElementById('motd-max') as HTMLInputElement

  l1Input.addEventListener('focus', () => { activeInput = l1Input })
  l2Input.addEventListener('focus', () => { activeInput = l2Input })

  l1Input.addEventListener('input', () => {
    state.line1 = l1Input.value
    debouncedUpdate()
  })

  l2Input.addEventListener('input', () => {
    state.line2 = l2Input.value
    debouncedUpdate()
  })

  nameInput.addEventListener('input', () => {
    state.serverName = nameInput.value
    debouncedUpdate()
  })

  playersInput.addEventListener('input', () => {
    state.playerCount = playersInput.value
    debouncedUpdate()
  })

  maxInput.addEventListener('input', () => {
    state.maxPlayers = maxInput.value
    debouncedUpdate()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => {
      const insertText = btn.dataset.insert || ''
      const target = activeInput || l1Input
      const start = target.selectionStart || target.value.length
      const end = target.selectionEnd || target.value.length
      const current = target.value
      target.value = current.slice(0, start) + insertText + current.slice(end)
      target.selectionStart = target.selectionEnd = start + insertText.length
      target.focus()

      if (target === l1Input) state.line1 = target.value
      else state.line2 = target.value

      update()
    })
  })

  document.getElementById('motd-presets')?.addEventListener('change', (e) => {
    const idx = parseInt((e.target as HTMLSelectElement).value, 10)
    const preset = PRESETS[idx]
    if (preset) {
      state.line1 = preset.l1
      state.line2 = preset.l2
      l1Input.value = preset.l1
      l2Input.value = preset.l2
      update()
    }
  })

  container.querySelectorAll<HTMLButtonElement>('#motd-format-tabs .output-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('#motd-format-tabs .output-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      state.outputFormat = tab.dataset.format as MotdState['outputFormat']
      update()
    })
  })

  document.getElementById('motd-copy')?.addEventListener('click', async () => {
    const output = document.getElementById('motd-output')?.textContent || ''
    await copyToClipboard(output)
    showToast('MOTD copied to clipboard!')
  })

  update()
}
