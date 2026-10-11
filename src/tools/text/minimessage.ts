import { interpolateColors, copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface MiniMessageState {
  text: string
  colors: string[]
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  obfuscated: boolean
  outputFormat: 'minimessage' | 'legacy-section' | 'legacy-ampersand' | 'json'
}

const PRESET_GRADIENTS: Record<string, string[]> = {
  sunset: ['#ff4b1f', '#ff9068'],
  cyberpunk: ['#ff007f', '#7928ca', '#00dfd8'],
  fire: ['#ff0844', '#ffb199', '#f6d365'],
  emerald: ['#0ba360', '#3cba92', '#30dd8a'],
  prismarine: ['#13547a', '#80d0c7'],
  amethyst: ['#8e2de2', '#4a00e0'],
  gold_glow: ['#f6d365', '#fda085'],
  rainbow: ['#ff3333', '#ffaa00', '#ffff33', '#33ff33', '#3399ff', '#aa33ff'],
}

const MC_16_COLORS = [
  { name: 'Dark Red', hex: '#aa0000' },
  { name: 'Red', hex: '#ff5555' },
  { name: 'Gold', hex: '#ffaa00' },
  { name: 'Yellow', hex: '#ffff55' },
  { name: 'Dark Green', hex: '#00aa00' },
  { name: 'Green', hex: '#55ff55' },
  { name: 'Aqua', hex: '#55ffff' },
  { name: 'Dark Aqua', hex: '#00aaaa' },
  { name: 'Dark Blue', hex: '#0000aa' },
  { name: 'Blue', hex: '#5555ff' },
  { name: 'Light Purple', hex: '#ff55ff' },
  { name: 'Dark Purple', hex: '#aa00aa' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#aaaaaa' },
  { name: 'Dark Gray', hex: '#555555' },
  { name: 'Black', hex: '#000000' },
]

const FRESH_HUES = ['#ff3333', '#ffaa00', '#55ff55', '#00d2ff', '#9d4edd', '#ff758c', '#38bdf8', '#f59e0b']

const state: MiniMessageState = {
  text: 'Hello Minecraft World!',
  colors: ['#ff3333', '#ffaa00', '#55ff55'],
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  obfuscated: false,
  outputFormat: 'minimessage',
}

function renderPreview(container: HTMLElement): void {
  const chars = state.text.split('')
  if (!chars.length) {
    container.innerHTML = '<span style="color:var(--text-tertiary)">Type something...</span>'
    return
  }

  const gradientColors = state.colors.length === 1
    ? Array(chars.length).fill(state.colors[0])
    : interpolateColors(state.colors, chars.length)

  let html = ''

  for (let i = 0; i < chars.length; i++) {
    const color = gradientColors[i] || '#ffffff'
    const classes: string[] = ['mc-char']
    if (state.bold) classes.push('bold')
    if (state.italic) classes.push('italic')
    if (state.underline) classes.push('underline')
    if (state.strikethrough) classes.push('strikethrough')
    if (state.obfuscated) classes.push('obfuscated')

    const char = chars[i] === ' ' ? '&nbsp;' : chars[i].replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html += `<span class="${classes.join(' ')}" style="color:${color}">${char}</span>`
  }

  container.innerHTML = html
}

function generateOutput(): string {
  const chars = state.text.split('')
  if (!chars.length) return ''

  const gradientColors = state.colors.length === 1
    ? Array(chars.length).fill(state.colors[0])
    : interpolateColors(state.colors, chars.length)

  switch (state.outputFormat) {
    case 'minimessage': {
      const decorators: string[] = []
      if (state.bold) decorators.push('<bold>')
      if (state.italic) decorators.push('<italic>')
      if (state.underline) decorators.push('<underlined>')
      if (state.strikethrough) decorators.push('<strikethrough>')
      if (state.obfuscated) decorators.push('<obfuscated>')

      const closingDecorators = decorators.map(d => d.replace('<', '</')).reverse().join('')

      if (state.colors.length === 1) {
        const hex = state.colors[0]
        return `${decorators.join('')}<${hex}>${state.text}</${hex}>${closingDecorators}`
      }

      const gradientTag = `<gradient:${state.colors.join(':')}>`
      const closingGradient = '</gradient>'

      return decorators.join('') + gradientTag + state.text + closingGradient + closingDecorators
    }

    case 'legacy-section': {
      let result = ''
      for (let i = 0; i < chars.length; i++) {
        const hex = gradientColors[i].replace('#', '')
        result += `§x§${hex.split('').join('§')}`
        if (state.bold) result += '§l'
        if (state.italic) result += '§o'
        if (state.underline) result += '§n'
        if (state.strikethrough) result += '§m'
        if (state.obfuscated) result += '§k'
        result += chars[i]
      }
      return result
    }

    case 'legacy-ampersand': {
      let result = ''
      for (let i = 0; i < chars.length; i++) {
        const hex = gradientColors[i].replace('#', '')
        result += `&x&${hex.split('').join('&')}`
        if (state.bold) result += '&l'
        if (state.italic) result += '&o'
        if (state.underline) result += '&n'
        if (state.strikethrough) result += '&m'
        if (state.obfuscated) result += '&k'
        result += chars[i]
      }
      return result
    }

    case 'json': {
      if (state.colors.length === 1) {
        const obj: Record<string, unknown> = {
          text: state.text,
          color: state.colors[0],
        }
        if (state.bold) obj.bold = true
        if (state.italic) obj.italic = true
        if (state.underline) obj.underlined = true
        if (state.strikethrough) obj.strikethrough = true
        if (state.obfuscated) obj.obfuscated = true
        return JSON.stringify([obj], null, 2)
      }

      const components = chars.map((char, i) => {
        const obj: Record<string, unknown> = {
          text: char,
          color: gradientColors[i],
        }
        if (state.bold) obj.bold = true
        if (state.italic) obj.italic = true
        if (state.underline) obj.underlined = true
        if (state.strikethrough) obj.strikethrough = true
        if (state.obfuscated) obj.obfuscated = true
        return obj
      })
      return JSON.stringify(components, null, 2)
    }
  }
}

function update(): void {
  const preview = document.getElementById('mm-preview')
  const output = document.getElementById('mm-output')
  if (preview) renderPreview(preview)
  if (output) output.textContent = generateOutput()
}

const debouncedUpdate = debounce(update, 30)

let nextAddColor = '#38bdf8'

function renderColorStops(container: HTMLElement): void {
  container.innerHTML = ''
  state.colors.forEach((color, i) => {
    const stop = document.createElement('div')
    stop.className = 'color-stop'
    stop.innerHTML = `
      <input type="color" value="${color}" data-index="${i}" title="Open Color Picker" />
      <input type="text" class="color-stop-hex-input" value="${color.toUpperCase()}" maxlength="7" spellcheck="false" data-index="${i}" title="Edit HEX code" />
      ${state.colors.length > 1 ? `<button class="color-stop-remove" data-index="${i}" title="Remove color">&times;</button>` : ''}
    `
    container.appendChild(stop)
  })

  if (state.colors.length < 8) {
    const addControl = document.createElement('div')
    addControl.className = 'color-add-control'
    addControl.innerHTML = `
      <input type="color" id="mm-next-color-picker" value="${nextAddColor}" title="Choose color to add" />
      <button type="button" class="btn btn-sm btn-secondary" id="mm-add-btn">+ Add Color</button>
    `
    container.appendChild(addControl)

    const nextColorPicker = addControl.querySelector<HTMLInputElement>('#mm-next-color-picker')
    nextColorPicker?.addEventListener('input', () => {
      nextAddColor = nextColorPicker.value
    })
    nextColorPicker?.addEventListener('change', () => {
      nextAddColor = nextColorPicker.value
      if (state.colors.length < 8) {
        state.colors.push(nextAddColor)
        const unused = FRESH_HUES.find(h => !state.colors.includes(h) && h !== nextAddColor)
        if (unused) nextAddColor = unused
        renderColorStops(container)
        update()
      }
    })

    addControl.querySelector('#mm-add-btn')?.addEventListener('click', () => {
      if (state.colors.length >= 8) return
      state.colors.push(nextAddColor)
      const unused = FRESH_HUES.find(h => !state.colors.includes(h) && h !== nextAddColor)
      if (unused) nextAddColor = unused
      renderColorStops(container)
      update()
    })
  }

  container.querySelectorAll<HTMLInputElement>('input[type="color"][data-index]').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.index!)
      state.colors[idx] = input.value
      const hexInput = input.parentElement?.querySelector<HTMLInputElement>('.color-stop-hex-input')
      if (hexInput) hexInput.value = input.value.toUpperCase()
      debouncedUpdate()
    })
  })

  container.querySelectorAll<HTMLInputElement>('.color-stop-hex-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.index!)
      let val = input.value.trim()
      if (!val.startsWith('#')) val = '#' + val
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        state.colors[idx] = val.toLowerCase()
        const colorPicker = input.parentElement?.querySelector<HTMLInputElement>('input[type="color"]')
        if (colorPicker) colorPicker.value = val.toLowerCase()
        debouncedUpdate()
      }
    })
  })

  container.querySelectorAll<HTMLButtonElement>('.color-stop-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index!)
      state.colors.splice(idx, 1)
      renderColorStops(container)
      update()
    })
  })
}

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="split-view">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">MiniMessage & Gradient Input</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Message Text</label>
            <textarea id="mm-text" class="form-textarea" rows="3" placeholder="Enter text to format...">${state.text}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Color Stops (${state.colors.length})</label>
            <div id="mm-colors" class="color-stops"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Gradient Presets</label>
            <div class="btn-grid-4">
              <button class="btn btn-sm btn-secondary" data-mm-preset="sunset">Sunset</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="cyberpunk">Cyberpunk</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="fire">Fire</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="emerald">Emerald</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="prismarine">Prismarine</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="amethyst">Amethyst</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="gold_glow">Gold Glow</button>
              <button class="btn btn-sm btn-secondary" data-mm-preset="rainbow">Rainbow</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Minecraft 16 Palette Swatches</label>
            <div class="mc-palette-strip" id="mm-mc-swatches">
              ${MC_16_COLORS.map(c => `
                <button class="mc-color-chip" data-hex="${c.hex}" title="${c.name} (${c.hex})" style="background:${c.hex};"></button>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Decorations & Styles</label>
            <div class="toggle-group">
              <button class="toggle-btn ${state.bold ? 'active' : ''}" data-deco="bold" style="font-weight:700">Bold</button>
              <button class="toggle-btn ${state.italic ? 'active' : ''}" data-deco="italic" style="font-style:italic">Italic</button>
              <button class="toggle-btn ${state.underline ? 'active' : ''}" data-deco="underline" style="text-decoration:underline">Underline</button>
              <button class="toggle-btn ${state.strikethrough ? 'active' : ''}" data-deco="strikethrough" style="text-decoration:line-through">Strike</button>
              <button class="toggle-btn ${state.obfuscated ? 'active' : ''}" data-deco="obfuscated">Magic</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Live Preview & Generated Syntax</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">In-Game Chat Preview</label>
            <div class="mc-chat-preview" id="mm-preview"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Output Format</label>
            <div class="output-tabs" id="mm-format-tabs">
              <button class="output-tab active" data-format="minimessage">MiniMessage</button>
              <button class="output-tab" data-format="legacy-section">§ Section</button>
              <button class="output-tab" data-format="legacy-ampersand">& Ampersand</button>
              <button class="output-tab" data-format="json">JSON Components</button>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Generated Tag Output</span>
              <button class="btn btn-copy" id="mm-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="mm-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const colorsContainer = document.getElementById('mm-colors')!
  renderColorStops(colorsContainer)

  document.getElementById('mm-text')!.addEventListener('input', (e) => {
    state.text = (e.target as HTMLTextAreaElement).value
    debouncedUpdate()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-mm-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.mmPreset!
      if (PRESET_GRADIENTS[presetKey]) {
        state.colors = [...PRESET_GRADIENTS[presetKey]]
        renderColorStops(colorsContainer)
        update()
      }
    })
  })

  document.querySelectorAll<HTMLButtonElement>('#mm-mc-swatches .mc-color-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const hex = chip.dataset.hex!
      if (state.colors.length < 8) {
        state.colors.push(hex)
      } else {
        state.colors[state.colors.length - 1] = hex
      }
      nextAddColor = hex
      renderColorStops(colorsContainer)
      update()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-deco]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.deco as 'bold' | 'italic' | 'underline' | 'strikethrough' | 'obfuscated'
      state[key] = !state[key]
      btn.classList.toggle('active')
      update()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('#mm-format-tabs .output-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#mm-format-tabs .output-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      state.outputFormat = tab.dataset.format as MiniMessageState['outputFormat']
      update()
    })
  })

  document.getElementById('mm-copy')!.addEventListener('click', async () => {
    const output = document.getElementById('mm-output')!.textContent || ''
    await copyToClipboard(output)
    showToast('Copied to clipboard!')
  })

  update()
}
