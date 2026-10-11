interface CommandStep {
  id: string
  type: 'impulse' | 'chain' | 'repeating'
  conditional: boolean
  needsRedstone: boolean
  command: string
}

export function renderCmdChain(container: HTMLElement) {
  let steps: CommandStep[] = [
    { id: '1', type: 'repeating', conditional: false, needsRedstone: false, command: 'execute as @a[gamemode=survival] at @s if block ~ ~-1 ~ slime_block run effect give @s jump_boost 2 2 true' },
    { id: '2', type: 'chain', conditional: true, needsRedstone: false, command: 'playsound minecraft:block.slime_block.fall master @a ~ ~ ~ 1 1' },
    { id: '3', type: 'chain', conditional: false, needsRedstone: false, command: 'particle minecraft:item_slime ~ ~ ~ 0.5 0.2 0.5 0.1 20 normal @a' }
  ]

  container.innerHTML = `
    <div class="tool-content fade-in">
      <div class="tool-header">
        <div class="tool-badge">Datapacks & Assets</div>
        <h2>Command Block Sequencer & Selector Validator</h2>
        <p class="tool-desc">Build command block chain sequences with conditional logic, validate target selectors (@e, @a, @n), and export to functions or setblock structures.</p>
      </div>

      <div class="generator-layout">
        <!-- Chain Editor Column -->
        <div class="config-column">
          <div class="panel">
            <div class="panel-header-inline">
              <h3 class="panel-title">Command Block Chain</h3>
              <button class="btn btn-primary btn-sm" id="btn-add-cmd">+ Add Block</button>
            </div>
            
            <div id="cmd-steps-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;"></div>
          </div>

          <!-- Target Selector Builder & Validator -->
          <div class="panel mt-4">
            <h3 class="panel-title">Target Selector Validator</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Selector Variable</label>
                <select id="sel-var" class="input">
                  <option value="@a">@a (All Players)</option>
                  <option value="@p">@p (Nearest Player)</option>
                  <option value="@r">@r (Random Player)</option>
                  <option value="@s">@s (Current Entity / Self)</option>
                  <option value="@e">@e (All Entities)</option>
                  <option value="@n">@n (Nearest Entity - 1.21.2+)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Entity Type filter</label>
                <input type="text" id="sel-type" placeholder="e.g. zombie or !player" class="input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Distance filter</label>
                <input type="text" id="sel-distance" placeholder="e.g. ..15 or 5..20" class="input">
              </div>
              <div class="form-group">
                <label>Required Tag</label>
                <input type="text" id="sel-tag" placeholder="e.g. boss_minion" class="input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Limit (count)</label>
                <input type="number" id="sel-limit" placeholder="e.g. 1" min="1" class="input">
              </div>
              <div class="form-group">
                <label>Sort order</label>
                <select id="sel-sort" class="input">
                  <option value="">Default</option>
                  <option value="nearest">nearest</option>
                  <option value="furthest">furthest</option>
                  <option value="random">random</option>
                  <option value="arbitrary">arbitrary</option>
                </select>
              </div>
            </div>

            <div class="info-card mt-2">
              <div style="font-size: 11px; color: var(--text-muted);">Compiled Selector:</div>
              <div id="sel-compiled" style="font-family: monospace; font-size: 13px; font-weight: 600; color: #38bdf8; word-break: break-all; margin-top: 4px;">@a</div>
              <div id="sel-feedback" style="font-size: 11px; color: #4ade80; margin-top: 4px;">Valid selector syntax</div>
            </div>
          </div>
        </div>

        <!-- Visual Flow & Export Column -->
        <div class="preview-column">
          <!-- Chain Visualizer -->
          <div class="panel">
            <h3 class="panel-title">Block Chain Flow Preview</h3>
            <div id="chain-visual-preview" style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);"></div>
          </div>

          <!-- mcfunction output -->
          <div class="panel mt-4">
            <div class="panel-header-inline">
              <h3 class="panel-title">Datapack .mcfunction</h3>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" id="btn-copy-func">Copy Function</button>
                <button class="btn btn-primary btn-sm" id="btn-dl-func">Download .mcfunction</button>
              </div>
            </div>
            <pre class="code-preview" id="preview-func"></pre>

            <!-- Setblock chain -->
            <div class="panel-header-inline mt-3">
              <h3 class="panel-title">Setblock Chain Installer (In-game)</h3>
              <button class="btn btn-secondary btn-sm" id="btn-copy-setblocks">Copy Commands</button>
            </div>
            <pre class="code-preview" id="preview-setblocks"></pre>
          </div>
        </div>
      </div>
    </div>
  `

  const listContainer = container.querySelector('#cmd-steps-list') as HTMLElement
  const visualPreview = container.querySelector('#chain-visual-preview') as HTMLElement
  const previewFunc = container.querySelector('#preview-func') as HTMLElement
  const previewSetblocks = container.querySelector('#preview-setblocks') as HTMLElement

  const selVar = container.querySelector('#sel-var') as HTMLSelectElement
  const selType = container.querySelector('#sel-type') as HTMLInputElement
  const selDist = container.querySelector('#sel-distance') as HTMLInputElement
  const selTag = container.querySelector('#sel-tag') as HTMLInputElement
  const selLimit = container.querySelector('#sel-limit') as HTMLInputElement
  const selSort = container.querySelector('#sel-sort') as HTMLSelectElement
  const selCompiled = container.querySelector('#sel-compiled') as HTMLElement
  const selFeedback = container.querySelector('#sel-feedback') as HTMLElement

  function renderList() {
    listContainer.innerHTML = ''
    steps.forEach((step, idx) => {
      const card = document.createElement('div')
      card.className = 'panel'
      card.style.padding = '12px'
      card.style.borderLeft = `4px solid ${getColor(step.type)}`
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 600; font-size: 13px;">#${idx + 1} &bull; ${step.type.toUpperCase()}</div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-sm btn-mv-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary btn-sm btn-mv-down" data-idx="${idx}" ${idx === steps.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-danger btn-sm btn-del" data-idx="${idx}">✕</button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Block Mode</label>
            <select class="input step-type" data-idx="${idx}">
              <option value="impulse" ${step.type === 'impulse' ? 'selected' : ''}>Impulse (Orange)</option>
              <option value="chain" ${step.type === 'chain' ? 'selected' : ''}>Chain (Green)</option>
              <option value="repeating" ${step.type === 'repeating' ? 'selected' : ''}>Repeating (Purple)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Condition</label>
            <select class="input step-cond" data-idx="${idx}">
              <option value="false" ${!step.conditional ? 'selected' : ''}>Unconditional</option>
              <option value="true" ${step.conditional ? 'selected' : ''}>Conditional</option>
            </select>
          </div>
          <div class="form-group">
            <label>Activation</label>
            <select class="input step-act" data-idx="${idx}">
              <option value="false" ${!step.needsRedstone ? 'selected' : ''}>Always Active</option>
              <option value="true" ${step.needsRedstone ? 'selected' : ''}>Needs Redstone</option>
            </select>
          </div>
        </div>

        <div class="form-group mt-2">
          <label>Command</label>
          <input type="text" class="input step-cmd" data-idx="${idx}" value="${escapeHtml(step.command)}" placeholder="say Hello or execute...">
        </div>
      `
      listContainer.appendChild(card)
    })

    bindListEvents()
    updateVisuals()
  }

  function getColor(type: string): string {
    switch (type) {
      case 'repeating': return '#9333ea'
      case 'chain': return '#16a34a'
      default: return '#ea580c'
    }
  }

  function bindListEvents() {
    listContainer.querySelectorAll('.step-type').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0')
        steps[idx].type = (e.target as HTMLSelectElement).value as any
        renderList()
      })
    })

    listContainer.querySelectorAll('.step-cond').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0')
        steps[idx].conditional = (e.target as HTMLSelectElement).value === 'true'
        renderList()
      })
    })

    listContainer.querySelectorAll('.step-act').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0')
        steps[idx].needsRedstone = (e.target as HTMLSelectElement).value === 'true'
        updateVisuals()
      })
    })

    listContainer.querySelectorAll('.step-cmd').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0')
        steps[idx].command = (e.target as HTMLInputElement).value
        updateVisuals()
      })
    })

    listContainer.querySelectorAll('.btn-mv-up').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0')
        if (idx > 0) {
          const tmp = steps[idx]
          steps[idx] = steps[idx - 1]
          steps[idx - 1] = tmp
          renderList()
        }
      })
    })

    listContainer.querySelectorAll('.btn-mv-down').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0')
        if (idx < steps.length - 1) {
          const tmp = steps[idx]
          steps[idx] = steps[idx + 1]
          steps[idx + 1] = tmp
          renderList()
        }
      })
    })

    listContainer.querySelectorAll('.btn-del').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0')
        steps.splice(idx, 1)
        renderList()
      })
    })
  }

  function updateVisuals() {
    visualPreview.innerHTML = ''
    steps.forEach((step, idx) => {
      const blockEl = document.createElement('div')
      blockEl.style.display = 'flex'
      blockEl.style.alignItems = 'center'
      blockEl.style.gap = '10px'
      blockEl.style.padding = '8px 12px'
      blockEl.style.background = 'var(--bg-secondary)'
      blockEl.style.borderRadius = '6px'
      blockEl.style.border = `1px solid ${getColor(step.type)}`

      const badge = `<span style="background: ${getColor(step.type)}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${step.type.toUpperCase()}${step.conditional ? ' (COND)' : ''}</span>`
      const redstoneBadge = `<span style="font-size: 10px; color: ${step.needsRedstone ? '#f87171' : '#4ade80'};">${step.needsRedstone ? 'Needs Redstone' : 'Always Active'}</span>`

      blockEl.innerHTML = `
        <div style="font-weight: 700; color: var(--text-muted); font-size: 12px;">#${idx + 1}</div>
        <div style="flex: 1; overflow: hidden;">
          <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
            ${badge}
            ${redstoneBadge}
          </div>
          <div style="font-family: monospace; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-normal);">
            /${step.command.replace(/^\//, '')}
          </div>
        </div>
      `
      visualPreview.appendChild(blockEl)

      if (idx < steps.length - 1) {
        const arrow = document.createElement('div')
        arrow.style.textAlign = 'center'
        arrow.style.color = 'var(--text-muted)'
        arrow.style.fontSize = '12px'
        arrow.innerHTML = '↓'
        visualPreview.appendChild(arrow)
      }
    })

    const funcLines = [
      '# Generated with COMPARATOR Command Block Sequencer',
      ...steps.map(s => s.command.replace(/^\//, ''))
    ]
    previewFunc.textContent = funcLines.join('\n')

    const setblockLines: string[] = ['# Run sequentially to place chain along +Y:']
    steps.forEach((s, i) => {
      let blockId = 'command_block'
      if (s.type === 'chain') blockId = 'chain_command_block'
      if (s.type === 'repeating') blockId = 'repeating_command_block'

      const facing = 'up'
      const cond = s.conditional ? 'true' : 'false'
      const auto = s.needsRedstone ? '0b' : '1b'
      const cleanCmd = s.command.replace(/^\//, '').replace(/"/g, '\\"')

      setblockLines.push(
        `/setblock ~ ~${i + 1} ~ minecraft:${blockId}[facing=${facing},conditional=${cond}]{Command:"${cleanCmd}",auto:${auto}} replace`
      )
    })
    previewSetblocks.textContent = setblockLines.join('\n')
  }

  function updateSelector() {
    const v = selVar.value
    const parts: string[] = []

    if (selType.value.trim()) parts.push(`type=${selType.value.trim()}`)
    if (selDist.value.trim()) parts.push(`distance=${selDist.value.trim()}`)
    if (selTag.value.trim()) parts.push(`tag=${selTag.value.trim()}`)
    if (selLimit.value.trim()) parts.push(`limit=${selLimit.value.trim()}`)
    if (selSort.value.trim()) parts.push(`sort=${selSort.value.trim()}`)

    const compiled = parts.length > 0 ? `${v}[${parts.join(',')}]` : v
    selCompiled.textContent = compiled

    let warning = ''
    if (selLimit.value && parseInt(selLimit.value) <= 0) {
      warning = 'Limit must be at least 1'
    } else if (selDist.value && /[^0-9.]/.test(selDist.value)) {
      warning = 'Distance must only contain numbers and dots (e.g. 5..10)'
    }

    if (warning) {
      selFeedback.textContent = warning
      selFeedback.style.color = '#ef4444'
    } else {
      selFeedback.textContent = 'Valid selector syntax'
      selFeedback.style.color = '#4ade80'
    }
  }

  [selVar, selType, selDist, selTag, selLimit, selSort].forEach(el => {
    el.addEventListener('input', updateSelector)
  })

  container.querySelector('#btn-add-cmd')?.addEventListener('click', () => {
    steps.push({
      id: Date.now().toString(),
      type: 'chain',
      conditional: false,
      needsRedstone: false,
      command: 'say Step executed'
    })
    renderList()
  })

  container.querySelector('#btn-copy-func')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewFunc.textContent || '')
    showToast('Function commands copied!')
  })

  container.querySelector('#btn-copy-setblocks')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewSetblocks.textContent || '')
    showToast('Setblock placement commands copied!')
  })

  container.querySelector('#btn-dl-func')?.addEventListener('click', () => {
    const blob = new Blob([previewFunc.textContent || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sequence.mcfunction'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded sequence.mcfunction!')
  })

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function showToast(msg: string) {
    const toast = document.createElement('div')
    toast.className = 'toast show'
    toast.textContent = msg
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }

  renderList()
  updateSelector()
}

export const mount = renderCmdChain
