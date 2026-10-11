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

  const gradientColors = interpolateColors(state.colors, chars.length)
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

  const gradientColors = interpolateColors(state.colors, chars.length)

  switch (state.outputFormat) {
    case 'minimessage': {
      const decorators: string[] = []
      if (state.bold) decorators.push('<bold>')
      if (state.italic) decorators.push('<italic>')
      if (state.underline) decorators.push('<underlined>')
      if (state.strikethrough) decorators.push('<strikethrough>')
      if (state.obfuscated) decorators.push('<obfuscated>')

      const colorHexes = state.colors.map(c => c.replace('#', ''))
      const gradientTag = `<gradient:${colorHexes.join(':')}>`
      const closingGradient = '</gradient>'

      const closingDecorators = decorators.map(d => d.replace('<', '</')).reverse().join('')
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

function renderColorStops(container: HTMLElement): void {
  container.innerHTML = ''
  state.colors.forEach((color, i) => {
    const stop = document.createElement('div')
    stop.className = 'color-stop'
    stop.innerHTML = `
      <input type="color" value="${color}" data-index="${i}" />
      <span class="color-stop-hex">${color}</span>
      ${state.colors.length > 2 ? `<button class="color-stop-remove" data-index="${i}">&times;</button>` : ''}
    `
    container.appendChild(stop)
  })

  const addBtn = document.createElement('button')
  addBtn.className = 'btn-add-color'
  addBtn.textContent = '+ Add'
  addBtn.addEventListener('click', () => {
    const lastColor = state.colors[state.colors.length - 1]
    state.colors.push(lastColor)
    renderColorStops(container)
    update()
  })
  container.appendChild(addBtn)

  container.querySelectorAll<HTMLInputElement>('input[type="color"]').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.index!)
      state.colors[idx] = input.value
      const hex = input.parentElement?.querySelector('.color-stop-hex')
      if (hex) hex.textContent = input.value
      debouncedUpdate()
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
          <span class="panel-title">Input</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Text</label>
            <textarea id="mm-text" class="form-textarea" rows="3" placeholder="Enter your text...">${state.text}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Gradient Colors</label>
            <div id="mm-colors" class="color-stops"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Decorations</label>
            <div class="toggle-group">
              <button class="toggle-btn ${state.bold ? 'active' : ''}" data-deco="bold" style="font-weight:700">B</button>
              <button class="toggle-btn ${state.italic ? 'active' : ''}" data-deco="italic" style="font-style:italic">I</button>
              <button class="toggle-btn ${state.underline ? 'active' : ''}" data-deco="underline" style="text-decoration:underline">U</button>
              <button class="toggle-btn ${state.strikethrough ? 'active' : ''}" data-deco="strikethrough" style="text-decoration:line-through">S</button>
              <button class="toggle-btn ${state.obfuscated ? 'active' : ''}" data-deco="obfuscated">Magic</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Preview & Output</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Live Preview</label>
            <div class="mc-chat-preview" id="mm-preview"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Output Format</label>
            <div class="output-tabs" id="mm-format-tabs">
              <button class="output-tab active" data-format="minimessage">MiniMessage</button>
              <button class="output-tab" data-format="legacy-section">§ Legacy</button>
              <button class="output-tab" data-format="legacy-ampersand">& Legacy</button>
              <button class="output-tab" data-format="json">JSON</button>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Generated Code</span>
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
