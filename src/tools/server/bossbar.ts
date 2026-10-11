import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface BossbarState {
  id: string
  name: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'white'
  style: 'progress' | 'notches_6' | 'notches_10' | 'notches_12' | 'notches_20'
  value: number
  max: number
  visible: boolean
  darkenSky: boolean
  createFog: boolean
  players: string
}

const state: BossbarState = {
  id: 'custom:dragon_health',
  name: 'Ancient Corrupted Dragon',
  color: 'purple',
  style: 'notches_10',
  value: 75,
  max: 100,
  visible: true,
  darkenSky: true,
  createFog: false,
  players: '@a',
}

const COLORS = [
  { id: 'red', name: 'Red', hex: '#ff3333' },
  { id: 'blue', name: 'Blue', hex: '#3388ff' },
  { id: 'green', name: 'Green', hex: '#55ff55' },
  { id: 'yellow', name: 'Yellow', hex: '#ffff55' },
  { id: 'purple', name: 'Purple', hex: '#aa00aa' },
  { id: 'pink', name: 'Pink', hex: '#ff55ff' },
  { id: 'white', name: 'White', hex: '#ffffff' },
]

export function mount(container: HTMLElement): void {
  function generateCommands(): string[] {
    const id = state.id.trim() || 'custom:bar'
    const nameJson = JSON.stringify({ text: state.name })
    return [
      `# 1. Create bossbar`,
      `/bossbar add ${id} ${nameJson}`,
      `# 2. Configure visual properties`,
      `/bossbar set ${id} color ${state.color}`,
      `/bossbar set ${id} style ${state.style}`,
      `/bossbar set ${id} max ${state.max}`,
      `/bossbar set ${id} value ${state.value}`,
      `/bossbar set ${id} visible ${state.visible}`,
      `# 3. Assign target players`,
      `/bossbar set ${id} players ${state.players || '@a'}`,
    ]
  }

  function render(): void {
    const percent = Math.min(100, Math.max(0, Math.round((state.value / state.max) * 100)))
    const activeColorHex = COLORS.find(c => c.id === state.color)?.hex || '#ff3333'
    const notchesCount = state.style === 'notches_6' ? 6 : state.style === 'notches_10' ? 10 : state.style === 'notches_12' ? 12 : state.style === 'notches_20' ? 20 : 0

    container.innerHTML = `
      <div class="split-view">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">BossBar Studio</span>
            <span class="badge" style="font-size:0.72rem;">/bossbar command</span>
          </div>

          <div class="panel-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">BossBar Identifier</label>
                <input id="bb-id" type="text" class="form-input" value="${escapeHtml(state.id)}" placeholder="namespace:bar_id" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Title</label>
                <input id="bb-name" type="text" class="form-input" value="${escapeHtml(state.name)}" placeholder="Display Name..." />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Color Theme</label>
                <select id="bb-color" class="form-select">
                  ${COLORS.map(c => `
                    <option value="${c.id}" ${c.id === state.color ? 'selected' : ''}>${c.name}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Notches / Segments</label>
                <select id="bb-style" class="form-select">
                  <option value="progress" ${state.style === 'progress' ? 'selected' : ''}>Continuous (No Notches)</option>
                  <option value="notches_6" ${state.style === 'notches_6' ? 'selected' : ''}>6 Notches</option>
                  <option value="notches_10" ${state.style === 'notches_10' ? 'selected' : ''}>10 Notches</option>
                  <option value="notches_12" ${state.style === 'notches_12' ? 'selected' : ''}>12 Notches</option>
                  <option value="notches_20" ${state.style === 'notches_20' ? 'selected' : ''}>20 Notches</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Current Value: ${state.value}</label>
                <input id="bb-val" type="range" class="form-range" min="0" max="${state.max}" value="${state.value}" />
              </div>
              <div class="form-group">
                <label class="form-label">Max Value: ${state.max}</label>
                <input id="bb-max" type="number" class="form-input" min="1" max="10000" value="${state.max}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Target Selector</label>
              <input id="bb-players" type="text" class="form-input" value="${escapeHtml(state.players)}" placeholder="@a or @p[distance=..30]" />
            </div>

            <div class="form-group" style="display:flex;gap:18px;margin-top:6px;">
              <label class="toggle-label">
                <input id="bb-visible" type="checkbox" ${state.visible ? 'checked' : ''} />
                <span>Visible</span>
              </label>
              <label class="toggle-label">
                <input id="bb-darken" type="checkbox" ${state.darkenSky ? 'checked' : ''} />
                <span>Darken Sky</span>
              </label>
              <label class="toggle-label">
                <input id="bb-fog" type="checkbox" ${state.createFog ? 'checked' : ''} />
                <span>Create Fog</span>
              </label>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">In-Game Live Preview</span>
            <button id="bb-copy-btn" class="btn btn-copy">Copy Commands</button>
          </div>

          <div class="panel-body">
            <!-- Game HUD Screen Mockup -->
            <div class="bb-hud-preview">
              <div class="bb-hud-inner">
                <span class="bb-title">${escapeHtml(state.name)}</span>
                <div class="bb-bar-frame">
                  <div class="bb-bar-fill" style="width: ${percent}%; background: ${activeColorHex};"></div>
                  ${notchesCount > 0 ? `
                    <div class="bb-notches-overlay">
                      ${Array.from({ length: notchesCount - 1 }).map(() => `<div class="bb-notch"></div>`).join('')}
                    </div>
                  ` : ''}
                </div>
                <span class="bb-stat">${state.value} / ${state.max} (${percent}%)</span>
              </div>
            </div>

            <div class="output-section" style="margin-top:14px;">
              <span class="output-title">Complete Setup Sequence:</span>
              <pre class="code-preview" style="max-height:220px;"><code id="bb-code">${escapeHtml(generateCommands().join('\n'))}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    container.querySelector('#bb-id')?.addEventListener('input', (e) => {
      state.id = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#bb-name')?.addEventListener('input', (e) => {
      state.name = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#bb-color')?.addEventListener('change', (e) => {
      state.color = (e.target as HTMLSelectElement).value as any
      render()
    })
    container.querySelector('#bb-style')?.addEventListener('change', (e) => {
      state.style = (e.target as HTMLSelectElement).value as any
      render()
    })
    container.querySelector('#bb-val')?.addEventListener('input', (e) => {
      state.value = parseInt((e.target as HTMLInputElement).value, 10) || 0
      render()
    })
    container.querySelector('#bb-max')?.addEventListener('input', (e) => {
      state.max = Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 100)
      state.value = Math.min(state.value, state.max)
      render()
    })
    container.querySelector('#bb-players')?.addEventListener('input', (e) => {
      state.players = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#bb-visible')?.addEventListener('change', (e) => {
      state.visible = (e.target as HTMLInputElement).checked
      render()
    })
    container.querySelector('#bb-darken')?.addEventListener('change', (e) => {
      state.darkenSky = (e.target as HTMLInputElement).checked
      render()
    })
    container.querySelector('#bb-fog')?.addEventListener('change', (e) => {
      state.createFog = (e.target as HTMLInputElement).checked
      render()
    })

    container.querySelector('#bb-copy-btn')?.addEventListener('click', async () => {
      const code = generateCommands().filter(l => !l.startsWith('#')).join('\n')
      await copyToClipboard(code)
      showToast('Bossbar commands copied!')
    })
  }

  render()
}
