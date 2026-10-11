import { copyToClipboard, showToast, debounce, escapeHtml } from '../../utils/helpers'

interface SignState {
  signVariant: 'standing' | 'hanging'
  woodType: string
  activeSide: 'front' | 'back'
  frontLines: [string, string, string, string]
  backLines: [string, string, string, string]
  frontGlowing: boolean
  backGlowing: boolean
  frontColor: string
  backColor: string
  isWaxed: boolean
  mode: 'sign' | 'book'
  bookTitle: string
  bookAuthor: string
  bookGeneration: 'original' | 'copy_of_original' | 'copy_of_copy' | 'tattered'
  bookPages: string[]
  currentBookPage: number
}

const state: SignState = {
  signVariant: 'standing',
  woodType: 'oak',
  activeSide: 'front',
  frontLines: ['Welcome to the', 'Server Spawn!', '§cRules: No Grief', '§aEnjoy your stay!'],
  backLines: ['Back of Sign', 'Created with', 'Comparator Hub', '1.21+ Ready'],
  frontGlowing: true,
  backGlowing: false,
  frontColor: 'black',
  backColor: 'black',
  isWaxed: false,
  mode: 'sign',
  bookTitle: 'Guide of the Realm',
  bookAuthor: 'Comparator',
  bookGeneration: 'original',
  bookPages: [
    'Welcome, traveler.\n\nThis realm is governed by ancient redstone machines.\n\nTurn the page to learn more.',
    'Chapter II:\n\nNether portals link at a 1:8 coordinate scale.\n\nKeep your coordinates safe!',
    'Chapter III:\n\nSigns and hanging signs now support front and back text, dye colors, and glow ink sacs.',
  ],
  currentBookPage: 0,
}

const WOOD_TYPES = [
  { id: 'oak', name: 'Oak', bg: '#b38e56', textColor: '#000000' },
  { id: 'spruce', name: 'Spruce', bg: '#6d4c2b', textColor: '#ffffff' },
  { id: 'birch', name: 'Birch', bg: '#d6c88f', textColor: '#000000' },
  { id: 'jungle', name: 'Jungle', bg: '#9d704d', textColor: '#000000' },
  { id: 'acacia', name: 'Acacia', bg: '#ba5c2f', textColor: '#000000' },
  { id: 'dark_oak', name: 'Dark Oak', bg: '#3e2714', textColor: '#ffffff' },
  { id: 'mangrove', name: 'Mangrove', bg: '#6b3030', textColor: '#ffffff' },
  { id: 'cherry', name: 'Cherry', bg: '#d48892', textColor: '#000000' },
  { id: 'bamboo', name: 'Bamboo', bg: '#baa64a', textColor: '#000000' },
  { id: 'crimson', name: 'Crimson', bg: '#742a3a', textColor: '#ffffff' },
  { id: 'warped', name: 'Warped', bg: '#2b6863', textColor: '#ffffff' },
  { id: 'pale_oak', name: 'Pale Oak', bg: '#ece8e1', textColor: '#000000' },
]

const MC_COLORS = [
  { id: 'black', name: 'Black', hex: '#000000' },
  { id: 'white', name: 'White', hex: '#ffffff' },
  { id: 'red', name: 'Red', hex: '#b02e26' },
  { id: 'green', name: 'Green', hex: '#5e7c16' },
  { id: 'blue', name: 'Blue', hex: '#3c44aa' },
  { id: 'yellow', name: 'Yellow', hex: '#fed83d' },
  { id: 'cyan', name: 'Cyan', hex: '#169c9c' },
  { id: 'orange', name: 'Orange', hex: '#f9801d' },
  { id: 'purple', name: 'Purple', hex: '#8932b8' },
  { id: 'light_blue', name: 'Light Blue', hex: '#3ab3da' },
  { id: 'pink', name: 'Pink', hex: '#f38baa' },
  { id: 'lime', name: 'Lime', hex: '#80c71f' },
]

export function mount(container: HTMLElement): void {
  function generateCommand(): string {
    if (state.mode === 'sign') {
      const signType = state.signVariant === 'hanging' ? `${state.woodType}_hanging_sign` : `${state.woodType}_sign`
      const frontMsg = state.frontLines.map(l => `'{"text":"${escapeQuotes(l)}"}'`).join(',')
      const backMsg = state.backLines.map(l => `'{"text":"${escapeQuotes(l)}"}'`).join(',')

      return `/give @p minecraft:${signType}[block_entity_data={id:"minecraft:sign",is_waxed:${state.isWaxed ? '1b' : '0b'},front_text:{has_glowing_text:${state.frontGlowing ? '1b' : '0b'},color:"${state.frontColor}",messages:[${frontMsg}]},back_text:{has_glowing_text:${state.backGlowing ? '1b' : '0b'},color:"${state.backColor}",messages:[${backMsg}]}}] 1`
    } else {
      const pagesJson = state.bookPages.map(p => `'{"text":"${escapeQuotes(p.replace(/\n/g, '\\n'))}"}'`).join(',')
      return `/give @p minecraft:written_book[written_book_content={title:"${escapeQuotes(state.bookTitle)}",author:"${escapeQuotes(state.bookAuthor)}",generation:"${state.bookGeneration}",pages:[${pagesJson}]}] 1`
    }
  }

  function escapeQuotes(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }

  function render(): void {
    const isSign = state.mode === 'sign'
    const currentWood = WOOD_TYPES.find(w => w.id === state.woodType) || WOOD_TYPES[0]
    const activeLines = state.activeSide === 'front' ? state.frontLines : state.backLines
    const activeGlowing = state.activeSide === 'front' ? state.frontGlowing : state.backGlowing
    const activeColor = state.activeSide === 'front' ? state.frontColor : state.backColor
    const activeColorHex = MC_COLORS.find(c => c.id === activeColor)?.hex || '#000000'

    container.innerHTML = `
      <div class="split-view">
        <!-- Controls Panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Sign & Book Studio</span>
            <div class="toggle-group" style="width: 200px;">
              <button class="toggle-btn ${isSign ? 'active' : ''}" id="sg-tab-sign">Signs</button>
              <button class="toggle-btn ${!isSign ? 'active' : ''}" id="sg-tab-book">Written Books</button>
            </div>
          </div>

          <div class="panel-body">
            ${isSign ? `
              <!-- Sign Mode Controls -->
              <div class="form-group">
                <label class="form-label">Sign Format</label>
                <div class="toggle-group">
                  <button class="toggle-btn ${state.signVariant === 'standing' ? 'active' : ''}" id="sg-var-standing">Standard Sign</button>
                  <button class="toggle-btn ${state.signVariant === 'hanging' ? 'active' : ''}" id="sg-var-hanging">Hanging Sign (1.20+)</button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Wood Type (${WOOD_TYPES.length} Woods)</label>
                <div class="wood-picker-grid">
                  ${WOOD_TYPES.map(w => `
                    <button class="wood-pill-btn ${w.id === state.woodType ? 'active' : ''}" data-wood="${w.id}" style="--wood-col: ${w.bg};">
                      <span class="wood-dot" style="background:${w.bg};"></span>
                      <span>${w.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Side Toggle: Front vs Back -->
              <div class="form-group">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label class="form-label" style="margin:0">Active Side to Edit</label>
                  <label class="toggle-label" style="font-size:0.78rem;">
                    <input type="checkbox" id="sg-waxed" ${state.isWaxed ? 'checked' : ''} />
                    <span>Waxed (Honeycomb 🔒)</span>
                  </label>
                </div>
                <div class="toggle-group">
                  <button class="toggle-btn ${state.activeSide === 'front' ? 'active' : ''}" id="sg-side-front">Front Text</button>
                  <button class="toggle-btn ${state.activeSide === 'back' ? 'active' : ''}" id="sg-side-back">Back Text</button>
                </div>
              </div>

              <!-- 4 Lines Input -->
              <div class="form-group">
                <label class="form-label">Lines for ${state.activeSide === 'front' ? 'Front Side' : 'Back Side'}</label>
                <div class="sign-lines-input-group">
                  ${[0, 1, 2, 3].map(i => `
                    <div class="sign-line-input-row">
                      <span class="sign-line-num">${i + 1}</span>
                      <input 
                        type="text" 
                        class="form-input sign-line-input" 
                        data-line="${i}" 
                        value="${escapeHtml(activeLines[i])}" 
                        placeholder="Line ${i + 1} text (supports § colors)..."
                      />
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Glowing ink & Color for active side -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Text Dye Color</label>
                  <select id="sg-color-select" class="form-select">
                    ${MC_COLORS.map(c => `
                      <option value="${c.id}" ${c.id === activeColor ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group" style="display:flex;align-items:flex-end;">
                  <label class="toggle-label" style="padding-bottom:10px;">
                    <input type="checkbox" id="sg-glow-ink" ${activeGlowing ? 'checked' : ''} />
                    <span>Glow Ink Sac (✨ Glowing)</span>
                  </label>
                </div>
              </div>
            ` : `
              <!-- Written Book Controls -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Book Title</label>
                  <input id="sg-book-title" type="text" class="form-input" value="${escapeHtml(state.bookTitle)}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Author Name</label>
                  <input id="sg-book-author" type="text" class="form-input" value="${escapeHtml(state.bookAuthor)}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Generation Level</label>
                <select id="sg-book-gen" class="form-select">
                  <option value="original" ${state.bookGeneration === 'original' ? 'selected' : ''}>Original</option>
                  <option value="copy_of_original" ${state.bookGeneration === 'copy_of_original' ? 'selected' : ''}>Copy of Original</option>
                  <option value="copy_of_copy" ${state.bookGeneration === 'copy_of_copy' ? 'selected' : ''}>Copy of Copy</option>
                  <option value="tattered" ${state.bookGeneration === 'tattered' ? 'selected' : ''}>Tattered</option>
                </select>
              </div>

              <!-- Book Pages Management -->
              <div class="form-group">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label class="form-label" style="margin:0">Page ${state.currentBookPage + 1} of ${state.bookPages.length}</label>
                  <div style="display:flex;gap:6px;">
                    <button id="sg-page-prev" class="btn btn-secondary" style="padding:2px 8px;" ${state.currentBookPage === 0 ? 'disabled' : ''}>←</button>
                    <button id="sg-page-next" class="btn btn-secondary" style="padding:2px 8px;" ${state.currentBookPage >= state.bookPages.length - 1 ? 'disabled' : ''}>→</button>
                    <button id="sg-page-add" class="btn btn-secondary" style="padding:2px 8px;">+ Add Page</button>
                    ${state.bookPages.length > 1 ? `<button id="sg-page-del" class="btn btn-secondary" style="padding:2px 8px;color:var(--accent-red)">Delete</button>` : ''}
                  </div>
                </div>
                <textarea id="sg-page-text" class="form-textarea" rows="8" placeholder="Type page contents here...">${escapeHtml(state.bookPages[state.currentBookPage] || '')}</textarea>
              </div>
            `}
          </div>
        </div>

        <!-- Preview & Output Panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Live Preview & Commands</span>
            ${isSign ? `
              <span class="badge" style="font-size:0.72rem;">${state.signVariant === 'hanging' ? 'Hanging Sign' : 'Standing Sign'} (${state.activeSide})</span>
            ` : `
              <span class="badge" style="font-size:0.72rem;">Page ${state.currentBookPage + 1}</span>
            `}
          </div>

          <div class="panel-body">
            <!-- Stage Canvas -->
            <div class="sign-book-preview-stage">
              ${isSign ? `
                <div class="mc-sign-wrapper ${state.signVariant === 'hanging' ? 'hanging' : ''}">
                  ${state.signVariant === 'hanging' ? `
                    <div class="mc-hanging-chains">
                      <div class="chain left"></div>
                      <div class="chain right"></div>
                    </div>
                  ` : ''}
                  <div class="mc-sign-board" style="background-color: ${currentWood.bg};">
                    <div class="mc-sign-text ${activeGlowing ? 'glowing' : ''}" style="color: ${activeColorHex};">
                      ${activeLines.map(l => `<div class="sign-line">${escapeHtml(l) || '&nbsp;'}</div>`).join('')}
                    </div>
                    ${state.isWaxed ? `<span class="waxed-icon" title="Waxed">🔒</span>` : ''}
                  </div>
                  ${state.signVariant === 'standing' ? `
                    <div class="mc-sign-post" style="background-color: ${currentWood.bg};"></div>
                  ` : ''}
                </div>
              ` : `
                <div class="mc-book-page">
                  <div class="mc-book-header">
                    <span class="mc-book-title">${escapeHtml(state.bookTitle)}</span>
                    <span class="mc-book-pagenum">Page ${state.currentBookPage + 1} of ${state.bookPages.length}</span>
                  </div>
                  <div class="mc-book-content">${escapeHtml(state.bookPages[state.currentBookPage] || '').replace(/\n/g, '<br/>')}</div>
                  <div class="mc-book-author-footer">By: ${escapeHtml(state.bookAuthor)}</div>
                </div>
              `}
            </div>

            <!-- Command Output -->
            <div class="output-section" style="margin-top:16px;">
              <div class="output-header">
                <span class="output-title">Minecraft /give Command (Modern Components)</span>
                <button id="sg-copy-cmd" class="btn btn-copy" data-copy="${escapeHtml(generateCommand())}">Copy Command</button>
              </div>
              <pre class="code-preview"><code id="sg-cmd-text">${escapeHtml(generateCommand())}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    container.querySelector('#sg-tab-sign')?.addEventListener('click', () => {
      state.mode = 'sign'
      render()
    })
    container.querySelector('#sg-tab-book')?.addEventListener('click', () => {
      state.mode = 'book'
      render()
    })

    container.querySelector('#sg-var-standing')?.addEventListener('click', () => {
      state.signVariant = 'standing'
      render()
    })
    container.querySelector('#sg-var-hanging')?.addEventListener('click', () => {
      state.signVariant = 'hanging'
      render()
    })

    container.querySelectorAll<HTMLButtonElement>('.wood-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.woodType = btn.dataset.wood || 'oak'
        render()
      })
    })

    container.querySelector('#sg-side-front')?.addEventListener('click', () => {
      state.activeSide = 'front'
      render()
    })
    container.querySelector('#sg-side-back')?.addEventListener('click', () => {
      state.activeSide = 'back'
      render()
    })

    container.querySelectorAll<HTMLInputElement>('.sign-line-input').forEach(input => {
      input.addEventListener('input', () => {
        const lineIdx = parseInt(input.dataset.line || '0', 10)
        if (state.activeSide === 'front') {
          state.frontLines[lineIdx] = input.value
        } else {
          state.backLines[lineIdx] = input.value
        }
        debouncedUpdateOutput()
      })
    })

    const colorSelect = container.querySelector<HTMLSelectElement>('#sg-color-select')
    colorSelect?.addEventListener('change', () => {
      if (state.activeSide === 'front') {
        state.frontColor = colorSelect.value
      } else {
        state.backColor = colorSelect.value
      }
      render()
    })

    const glowCheck = container.querySelector<HTMLInputElement>('#sg-glow-ink')
    glowCheck?.addEventListener('change', () => {
      if (state.activeSide === 'front') {
        state.frontGlowing = glowCheck.checked
      } else {
        state.backGlowing = glowCheck.checked
      }
      render()
    })

    const waxCheck = container.querySelector<HTMLInputElement>('#sg-waxed')
    waxCheck?.addEventListener('change', () => {
      state.isWaxed = waxCheck.checked
      render()
    })

    const bookTitleInput = container.querySelector<HTMLInputElement>('#sg-book-title')
    bookTitleInput?.addEventListener('input', () => {
      state.bookTitle = bookTitleInput.value
      debouncedUpdateOutput()
    })

    const bookAuthorInput = container.querySelector<HTMLInputElement>('#sg-book-author')
    bookAuthorInput?.addEventListener('input', () => {
      state.bookAuthor = bookAuthorInput.value
      debouncedUpdateOutput()
    })

    const bookGenSelect = container.querySelector<HTMLSelectElement>('#sg-book-gen')
    bookGenSelect?.addEventListener('change', () => {
      state.bookGeneration = bookGenSelect.value as any
      debouncedUpdateOutput()
    })

    const pageTextArea = container.querySelector<HTMLTextAreaElement>('#sg-page-text')
    pageTextArea?.addEventListener('input', () => {
      state.bookPages[state.currentBookPage] = pageTextArea.value
      debouncedUpdateOutput()
    })

    container.querySelector('#sg-page-prev')?.addEventListener('click', () => {
      if (state.currentBookPage > 0) {
        state.currentBookPage--
        render()
      }
    })
    container.querySelector('#sg-page-next')?.addEventListener('click', () => {
      if (state.currentBookPage < state.bookPages.length - 1) {
        state.currentBookPage++
        render()
      }
    })
    container.querySelector('#sg-page-add')?.addEventListener('click', () => {
      state.bookPages.push('')
      state.currentBookPage = state.bookPages.length - 1
      render()
    })
    container.querySelector('#sg-page-del')?.addEventListener('click', () => {
      if (state.bookPages.length > 1) {
        state.bookPages.splice(state.currentBookPage, 1)
        state.currentBookPage = Math.min(state.currentBookPage, state.bookPages.length - 1)
        render()
      }
    })

    container.querySelector('#sg-copy-cmd')?.addEventListener('click', async () => {
      await copyToClipboard(generateCommand())
      showToast('Command copied!')
    })
  }

  function updateOutputOnly(): void {
    const cmdEl = container.querySelector('#sg-cmd-text')
    const copyBtn = container.querySelector('#sg-copy-cmd')
    const cmd = generateCommand()
    if (cmdEl) cmdEl.textContent = cmd
    if (copyBtn) copyBtn.setAttribute('data-copy', cmd)

    if (state.mode === 'sign') {
      const activeLines = state.activeSide === 'front' ? state.frontLines : state.backLines
      const signText = container.querySelector('.mc-sign-text')
      if (signText) {
        signText.innerHTML = activeLines.map(l => `<div class="sign-line">${escapeHtml(l) || '&nbsp;'}</div>`).join('')
      }
    } else {
      const contentEl = container.querySelector('.mc-book-content')
      if (contentEl) {
        contentEl.innerHTML = escapeHtml(state.bookPages[state.currentBookPage] || '').replace(/\n/g, '<br/>')
      }
    }
  }

  const debouncedUpdateOutput = debounce(updateOutputOnly, 50)

  render()
}
