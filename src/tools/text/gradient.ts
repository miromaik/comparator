import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

type ExportFormat = 'minimessage' | 'bungee' | 'cmi' | 'legacy_hex' | 'json'

interface GradientState {
  text: string
  colors: string[]
  format: ExportFormat
  bold: boolean
  italic: boolean
  underlined: boolean
  strikethrough: boolean
}

const PRESET_GRADIENTS: Record<string, string[]> = {
  sunset: ['#ff4b1f', '#ff9068'],
  cyberpunk: ['#ff007f', '#7928ca', '#00dfd8'],
  fire: ['#ff0844', '#ffb199', '#f6d365'],
  emerald: ['#0ba360', '#3cba92', '#30dd8a'],
  prismarine: ['#13547a', '#80d0c7'],
  amethyst: ['#8e2de2', '#4a00e0'],
  netherite: ['#3e3535', '#7a6f6f', '#3e3535'],
  gold_glow: ['#f6d365', '#fda085'],
}

const state: GradientState = {
  text: 'COMPARATOR MINECRAFT',
  colors: ['#ff007f', '#7928ca', '#00dfd8'],
  format: 'minimessage',
  bold: true,
  italic: false,
  underlined: false,
  strikethrough: false,
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function interpolateColors(colors: string[], steps: number): string[] {
  if (steps <= 0) return []
  if (steps === 1) return [colors[0]]
  if (colors.length === 1) return Array(steps).fill(colors[0])

  const result: string[] = []
  const segments = colors.length - 1
  const stepsPerSegment = (steps - 1) / segments

  for (let i = 0; i < steps; i++) {
    const globalT = i / (steps - 1)
    const segIndex = Math.min(Math.floor(globalT * segments), segments - 1)
    const localT = (i - segIndex * stepsPerSegment) / stepsPerSegment

    const c1 = hexToRgb(colors[segIndex])
    const c2 = hexToRgb(colors[segIndex + 1])

    const r = c1[0] + (c2[0] - c1[0]) * localT
    const g = c1[1] + (c2[1] - c1[1]) * localT
    const b = c1[2] + (c2[2] - c1[2]) * localT

    result.push(rgbToHex(r, g, b))
  }

  return result
}

function generateOutput(): string {
  const text = state.text || ' '
  const colors = interpolateColors(state.colors, text.length)

  switch (state.format) {
    case 'minimessage': {
      const gradStops = state.colors.join(':')
      let openTags = `<gradient:${gradStops}>`
      let closeTags = '</gradient>'
      if (state.bold) { openTags += '<bold>'; closeTags = '</bold>' + closeTags }
      if (state.italic) { openTags += '<italic>'; closeTags = '</italic>' + closeTags }
      if (state.underlined) { openTags += '<underlined>'; closeTags = '</underlined>' + closeTags }
      if (state.strikethrough) { openTags += '<strikethrough>'; closeTags = '</strikethrough>' + closeTags }
      return `${openTags}${text}${closeTags}`
    }

    case 'bungee': {
      let res = ''
      for (let i = 0; i < text.length; i++) {
        res += `&${colors[i]}${text[i]}`
      }
      return res
    }

    case 'cmi': {
      let res = ''
      for (let i = 0; i < text.length; i++) {
        res += `{${colors[i]}}${text[i]}`
      }
      return res
    }

    case 'legacy_hex': {
      let res = ''
      for (let i = 0; i < text.length; i++) {
        const h = colors[i].replace('#', '')
        res += `§x§${h[0]}§${h[1]}§${h[2]}§${h[3]}§${h[4]}§${h[5]}${text[i]}`
      }
      return res
    }

    case 'json': {
      const parts = []
      for (let i = 0; i < text.length; i++) {
        const obj: Record<string, any> = {
          text: text[i],
          color: colors[i],
        }
        if (state.bold) obj.bold = true
        if (state.italic) obj.italic = true
        if (state.underlined) obj.underlined = true
        if (state.strikethrough) obj.strikethrough = true
        parts.push(obj)
      }
      return JSON.stringify(['', ...parts])
    }
  }
}

export function mount(container: HTMLElement): void {
  function render(): void {
    const text = state.text || ' '
    const colors = interpolateColors(state.colors, text.length)
    const out = generateOutput()

    const outEl = document.getElementById('grad-out-code')
    const previewEl = document.getElementById('grad-preview-box')
    if (outEl) outEl.textContent = out

    if (previewEl) {
      previewEl.innerHTML = text.split('').map((char, i) => {
        let styles = `color: ${colors[i]};`
        if (state.bold) styles += 'font-weight:bold;'
        if (state.italic) styles += 'font-style:italic;'
        let decor = ''
        if (state.underlined) decor += 'underline '
        if (state.strikethrough) decor += 'line-through '
        if (decor) styles += `text-decoration:${decor.trim()};`

        return `<span style="${styles}">${escapeHtml(char)}</span>`
      }).join('')
    }
  }

  function renderColorStops(): void {
    const container = document.getElementById('grad-color-stops')
    if (!container) return

    container.innerHTML = `
      ${state.colors.map((c, i) => `
        <div class="color-stop" data-color-idx="${i}">
          <input type="color" value="${c}" data-stop-input="${i}" />
          <span class="color-stop-hex">${c.toUpperCase()}</span>
          ${state.colors.length > 2 ? `<button class="color-stop-remove" data-remove-stop="${i}">×</button>` : ''}
        </div>
      `).join('')}
      ${state.colors.length < 8 ? `<button class="btn-add-color" id="grad-add-stop">+ Add Color</button>` : ''}
    `

    container.querySelectorAll<HTMLInputElement>('[data-stop-input]').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.stopInput!)
        state.colors[idx] = inp.value
        renderColorStops()
        render()
      })
    })

    container.querySelectorAll<HTMLButtonElement>('[data-remove-stop]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeStop!)
        state.colors.splice(idx, 1)
        renderColorStops()
        render()
      })
    })

    document.getElementById('grad-add-stop')?.addEventListener('click', () => {
      state.colors.push('#ffffff')
      renderColorStops()
      render()
    })
  }

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Controls Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">RGB Hex Gradient Generator</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Input Text</label>
            <input type="text" id="grad-text-input" class="form-input" value="${escapeHtml(state.text)}" placeholder="Type text to gradient..." />
          </div>

          <!-- Color Stops -->
          <div class="form-group">
            <label class="form-label">Gradient Color Stops</label>
            <div id="grad-color-stops" class="color-stops"></div>
          </div>

          <!-- Presets -->
          <div class="form-group">
            <label class="form-label">Color Presets</label>
            <div class="btn-grid-4">
              <button class="btn btn-sm btn-secondary" data-grad-preset="sunset">Sunset</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="cyberpunk">Cyberpunk</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="fire">Fire</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="emerald">Emerald</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="prismarine">Prismarine</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="amethyst">Amethyst</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="netherite">Netherite</button>
              <button class="btn btn-sm btn-secondary" data-grad-preset="gold_glow">Gold Glow</button>
            </div>
          </div>

          <!-- Formatting Toggles -->
          <div class="form-group">
            <label class="form-label">Text Formatting</label>
            <div style="display:flex; gap:8px;">
              <button class="tag-btn ${state.bold ? 'active' : ''}" id="grad-btn-bold">Bold</button>
              <button class="tag-btn ${state.italic ? 'active' : ''}" id="grad-btn-italic">Italic</button>
              <button class="tag-btn ${state.underlined ? 'active' : ''}" id="grad-btn-under">Underline</button>
              <button class="tag-btn ${state.strikethrough ? 'active' : ''}" id="grad-btn-strike">Strikethrough</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Live Preview & Output</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">In-Game Chat Preview</label>
            <div class="mc-chat-preview" id="grad-preview-box"></div>
          </div>

          <!-- Format Selector Tabs -->
          <div class="output-tabs" style="margin-top:14px;">
            <button class="output-tab ${state.format === 'minimessage' ? 'active' : ''}" data-fmt="minimessage">MiniMessage</button>
            <button class="output-tab ${state.format === 'bungee' ? 'active' : ''}" data-fmt="bungee">BungeeCord (&#hex)</button>
            <button class="output-tab ${state.format === 'cmi' ? 'active' : ''}" data-fmt="cmi">CMI ({#hex})</button>
            <button class="output-tab ${state.format === 'legacy_hex' ? 'active' : ''}" data-fmt="legacy_hex">§x Legacy</button>
            <button class="output-tab ${state.format === 'json' ? 'active' : ''}" data-fmt="json">JSON Array</button>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Generated Code</span>
              <button class="btn btn-copy" id="grad-copy-btn">Copy</button>
            </div>
            <div class="output-code" id="grad-out-code"></div>
          </div>
        </div>
      </div>
    </div>
  `

  renderColorStops()
  render()

  document.getElementById('grad-text-input')?.addEventListener('input', (e) => {
    state.text = (e.target as HTMLInputElement).value
    render()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-grad-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.gradPreset!
      if (PRESET_GRADIENTS[presetKey]) {
        state.colors = [...PRESET_GRADIENTS[presetKey]]
        renderColorStops()
        render()
      }
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-fmt]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.format = btn.dataset.fmt as ExportFormat
      container.querySelectorAll('[data-fmt]').forEach(b => b.classList.toggle('active', b === btn))
      render()
    })
  })

  document.getElementById('grad-btn-bold')?.addEventListener('click', (e) => {
    state.bold = !state.bold
    ;(e.target as HTMLElement).classList.toggle('active', state.bold)
    render()
  })

  document.getElementById('grad-btn-italic')?.addEventListener('click', (e) => {
    state.italic = !state.italic
    ;(e.target as HTMLElement).classList.toggle('active', state.italic)
    render()
  })

  document.getElementById('grad-btn-under')?.addEventListener('click', (e) => {
    state.underlined = !state.underlined
    ;(e.target as HTMLElement).classList.toggle('active', state.underlined)
    render()
  })

  document.getElementById('grad-btn-strike')?.addEventListener('click', (e) => {
    state.strikethrough = !state.strikethrough
    ;(e.target as HTMLElement).classList.toggle('active', state.strikethrough)
    render()
  })

  document.getElementById('grad-copy-btn')?.addEventListener('click', async () => {
    await copyToClipboard(generateOutput())
    showToast('Copied gradient output!')
  })
}
