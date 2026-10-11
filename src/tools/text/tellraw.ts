import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface TellrawComponent {
  text: string
  color: string
  bold: boolean
  italic: boolean
  underlined: boolean
  strikethrough: boolean
  obfuscated: boolean
  clickAction: 'none' | 'run_command' | 'suggest_command' | 'open_url' | 'copy_to_clipboard'
  clickValue: string
  hoverAction: 'none' | 'show_text'
  hoverValue: string
}

interface TellrawState {
  target: string
  commandType: 'tellraw' | 'title' | 'subtitle' | 'actionbar'
  components: TellrawComponent[]
}

const state: TellrawState = {
  target: '@a',
  commandType: 'tellraw',
  components: [
    {
      text: 'Welcome to the server! ',
      color: '#55ff55',
      bold: true,
      italic: false,
      underlined: false,
      strikethrough: false,
      obfuscated: false,
      clickAction: 'none',
      clickValue: '',
      hoverAction: 'none',
      hoverValue: '',
    },
    {
      text: '[Click for Rules]',
      color: '#ffff55',
      bold: false,
      italic: false,
      underlined: true,
      strikethrough: false,
      obfuscated: false,
      clickAction: 'run_command',
      clickValue: '/rules',
      hoverAction: 'show_text',
      hoverValue: 'Click to display server rules!',
    },
  ],
}

function buildJsonPayload(): string {
  const parts = state.components.map(c => {
    const obj: Record<string, any> = { text: c.text }
    if (c.color) obj.color = c.color
    if (c.bold) obj.bold = true
    if (c.italic) obj.italic = true
    if (c.underlined) obj.underlined = true
    if (c.strikethrough) obj.strikethrough = true
    if (c.obfuscated) obj.obfuscated = true

    if (c.clickAction !== 'none' && c.clickValue) {
      obj.clickEvent = {
        action: c.clickAction,
        value: c.clickValue,
      }
    }

    if (c.hoverAction !== 'none' && c.hoverValue) {
      obj.hoverEvent = {
        action: c.hoverAction,
        contents: c.hoverValue,
      }
    }

    return obj
  })

  return JSON.stringify(['', ...parts])
}

function buildCommand(): string {
  const json = buildJsonPayload()
  const target = state.target || '@a'

  switch (state.commandType) {
    case 'tellraw':
      return `/tellraw ${target} ${json}`
    case 'title':
      return `/title ${target} title ${json}`
    case 'subtitle':
      return `/title ${target} subtitle ${json}`
    case 'actionbar':
      return `/title ${target} actionbar ${json}`
  }
}

export function mount(container: HTMLElement): void {
  function render(): void {
    const jsonStr = buildJsonPayload()
    const fullCmd = buildCommand()

    const outCmd = document.getElementById('tr-cmd-output')
    const outJson = document.getElementById('tr-json-output')
    const previewEl = document.getElementById('tr-preview-chat')

    if (outCmd) outCmd.textContent = fullCmd
    if (outJson) outJson.textContent = jsonStr

    if (previewEl) {
      previewEl.innerHTML = state.components.map(c => {
        let styles = `color: ${c.color};`
        if (c.bold) styles += 'font-weight:bold;'
        if (c.italic) styles += 'font-style:italic;'
        let decor = ''
        if (c.underlined) decor += 'underline '
        if (c.strikethrough) decor += 'line-through '
        if (decor) styles += `text-decoration:${decor.trim()};`

        const hoverTitle = c.hoverAction === 'show_text' ? ` title="${escapeHtml(c.hoverValue)}"` : ''
        const clickHint = c.clickAction !== 'none' ? ` data-click-hint="${escapeHtml(c.clickValue)}"` : ''

        return `<span style="${styles}" class="${c.obfuscated ? 'mc-char obfuscated' : ''} ${c.clickAction !== 'none' ? 'mc-clickable' : ''}"${hoverTitle}${clickHint}>${escapeHtml(c.text)}</span>`
      }).join('')
    }
  }

  function renderComponentList(): void {
    const listEl = document.getElementById('tr-components-list')
    if (!listEl) return

    listEl.innerHTML = state.components.map((c, i) => `
      <div class="stat-card" style="padding: 10px; margin-bottom: 8px;" data-comp-index="${i}">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary);">Part #${i + 1}</span>
          <button class="btn-remove-layer" data-remove-comp="${i}" title="Remove Part">×</button>
        </div>

        <div class="form-group" style="margin-bottom: 6px;">
          <input type="text" class="form-input comp-text" value="${escapeHtml(c.text)}" placeholder="Text content..." />
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <input type="color" class="comp-color" value="${c.color.startsWith('#') ? c.color : '#ffffff'}" style="width:28px; height:28px; border:none; background:none; cursor:pointer;" />
          <button class="tag-btn ${c.bold ? 'active' : ''}" data-style="bold">B</button>
          <button class="tag-btn ${c.italic ? 'active' : ''}" data-style="italic"><i>I</i></button>
          <button class="tag-btn ${c.underlined ? 'active' : ''}" data-style="underlined"><u>U</u></button>
          <button class="tag-btn ${c.strikethrough ? 'active' : ''}" data-style="strikethrough"><s>S</s></button>
          <button class="tag-btn ${c.obfuscated ? 'active' : ''}" data-style="obfuscated">?</button>
        </div>

        <div class="form-row-2">
          <div>
            <select class="form-select select-sm comp-click-action">
              <option value="none" ${c.clickAction === 'none' ? 'selected' : ''}>No Click Action</option>
              <option value="run_command" ${c.clickAction === 'run_command' ? 'selected' : ''}>Run Command</option>
              <option value="suggest_command" ${c.clickAction === 'suggest_command' ? 'selected' : ''}>Suggest Command</option>
              <option value="open_url" ${c.clickAction === 'open_url' ? 'selected' : ''}>Open URL</option>
              <option value="copy_to_clipboard" ${c.clickAction === 'copy_to_clipboard' ? 'selected' : ''}>Copy to Clipboard</option>
            </select>
            ${c.clickAction !== 'none' ? `<input type="text" class="form-input comp-click-val" style="margin-top:4px; font-size:0.75rem; padding:4px;" value="${escapeHtml(c.clickValue)}" placeholder="Command or URL..." />` : ''}
          </div>

          <div>
            <select class="form-select select-sm comp-hover-action">
              <option value="none" ${c.hoverAction === 'none' ? 'selected' : ''}>No Hover Tooltip</option>
              <option value="show_text" ${c.hoverAction === 'show_text' ? 'selected' : ''}>Show Tooltip Text</option>
            </select>
            ${c.hoverAction !== 'none' ? `<input type="text" class="form-input comp-hover-val" style="margin-top:4px; font-size:0.75rem; padding:4px;" value="${escapeHtml(c.hoverValue)}" placeholder="Tooltip text..." />` : ''}
          </div>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll<HTMLInputElement>('.comp-text').forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        state.components[idx].text = inp.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.comp-color').forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        state.components[idx].color = inp.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('[data-comp-index]') as HTMLElement
        const idx = parseInt(card.dataset.compIndex!)
        const styleProp = btn.dataset.style as 'bold' | 'italic' | 'underlined' | 'strikethrough' | 'obfuscated'
        state.components[idx][styleProp] = !state.components[idx][styleProp]
        btn.classList.toggle('active')
        render()
      })
    })

    listEl.querySelectorAll<HTMLSelectElement>('.comp-click-action').forEach((sel, idx) => {
      sel.addEventListener('change', () => {
        state.components[idx].clickAction = sel.value as any
        renderComponentList()
        render()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.comp-click-val').forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        state.components[idx].clickValue = inp.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLSelectElement>('.comp-hover-action').forEach((sel, idx) => {
      sel.addEventListener('change', () => {
        state.components[idx].hoverAction = sel.value as any
        renderComponentList()
        render()
      })
    })

    listEl.querySelectorAll<HTMLInputElement>('.comp-hover-val').forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        state.components[idx].hoverValue = inp.value
        render()
      })
    })

    listEl.querySelectorAll<HTMLButtonElement>('[data-remove-comp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeComp!)
        if (state.components.length > 1) {
          state.components.splice(idx, 1)
          renderComponentList()
          render()
        } else {
          showToast('Must keep at least 1 component part')
        }
      })
    })
  }

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Controls Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Tellraw & JSON Text Studio</span>
        </div>
        <div class="panel-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Command Type</label>
              <select id="tr-cmd-type" class="form-select">
                <option value="tellraw" ${state.commandType === 'tellraw' ? 'selected' : ''}>/tellraw (Chat Message)</option>
                <option value="title" ${state.commandType === 'title' ? 'selected' : ''}>/title title (Screen Title)</option>
                <option value="subtitle" ${state.commandType === 'subtitle' ? 'selected' : ''}>/title subtitle (Subtitle)</option>
                <option value="actionbar" ${state.commandType === 'actionbar' ? 'selected' : ''}>/title actionbar (Action Bar)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Target Selector</label>
              <input type="text" id="tr-target" class="form-input font-mono" value="${escapeHtml(state.target)}" placeholder="@a, @p, player..." />
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Components List -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">Text Components</label>
              <button class="btn btn-sm btn-primary" id="tr-add-part">+ Add Text Part</button>
            </div>
            <div id="tr-components-list"></div>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Live Preview & Commands</span>
        </div>
        <div class="panel-body">
          <!-- In-game Chat Preview -->
          <div class="form-group">
            <label class="form-label">In-Game Preview</label>
            <div class="mc-chat-preview" id="tr-preview-chat" style="min-height: 52px;"></div>
          </div>

          <!-- Generated Command Output -->
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Generated Command</span>
              <button class="btn btn-copy" id="tr-copy-cmd">Copy Command</button>
            </div>
            <div class="output-code" id="tr-cmd-output"></div>
          </div>

          <!-- Raw JSON Output -->
          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Raw JSON Component Array</span>
              <button class="btn btn-copy" id="tr-copy-json">Copy JSON</button>
            </div>
            <div class="output-code" id="tr-json-output"></div>
          </div>
        </div>
      </div>
    </div>
  `

  renderComponentList()
  render()

  document.getElementById('tr-cmd-type')?.addEventListener('change', (e) => {
    state.commandType = (e.target as HTMLSelectElement).value as any
    render()
  })

  document.getElementById('tr-target')?.addEventListener('input', (e) => {
    state.target = (e.target as HTMLInputElement).value
    render()
  })

  document.getElementById('tr-add-part')?.addEventListener('click', () => {
    state.components.push({
      text: 'New text ',
      color: '#ffffff',
      bold: false,
      italic: false,
      underlined: false,
      strikethrough: false,
      obfuscated: false,
      clickAction: 'none',
      clickValue: '',
      hoverAction: 'none',
      hoverValue: '',
    })
    renderComponentList()
    render()
  })

  document.getElementById('tr-copy-cmd')?.addEventListener('click', async () => {
    await copyToClipboard(buildCommand())
    showToast('Copied command to clipboard!')
  })

  document.getElementById('tr-copy-json')?.addEventListener('click', async () => {
    await copyToClipboard(buildJsonPayload())
    showToast('Copied JSON payload to clipboard!')
  })
}
