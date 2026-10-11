interface CustomHead {
  name: string
  category: 'blocks' | 'food' | 'tech' | 'mobs' | 'misc'
  texture: string
  faceImg?: string
}

export function renderHeads(container: HTMLElement) {
  const HEADS_DATABASE: CustomHead[] = [
    { name: 'Mini Chest', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNjk2NWYxNmI2NmYxMTU2NDY3ZTFjODU2YMmYxMGJlNWNmNzNjMjQ1NmM2MmEzMmQ5NTZlZTZiNjc2YTk2In19fQ==' },
    { name: 'Oak Bookshelf', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMjc5MmQ2OWI0OTIxNWFjNmFlODBhNTY3YTY3YWI1YjBiNThmYjhkYTRhMjFjNzM1YjU3Mzg3Y2M0YmQzIn19fQ==' },
    { name: 'Crafting Table', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvODc5OWY3M2U0MmI0YWQ1OGFmNmY2Y2ViNDM4MGFkMTE5MWVlNWVjMTE3ZWFhYTI2M2U1MWM3ZmE4ZjgzIn19fQ==' },
    { name: 'Mini TNT', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNWJjNDg1MjM0OGI5Y2EwYzY4NWU2YjM4NWY3OGYwMjBhODk3N2EzMzY1OTQ4ZjQzOGRhODk5MTVhNjE2In19fQ==' },
    { name: 'Furnace', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNDdhOTBhMzVjMzRkOTg5M2IxNjk0ZWM3MThmZjY2YmE0Nzk1MzNlNzFjZjU5MGM4MmE3MDFjNjIzOGFkIn19fQ==' },
    { name: 'Lantern', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNWJmODMzMDc3YWIyNGRmNWZlZmRhY2M3NTdhMDFkYWY5ZDJhM2E3M2ViYjgxMWU5ZTY3ODlmMTkyNzE4In19fQ==' },
    { name: 'Globe / Earth', category: 'blocks', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYjFkZDRmZTRhNDk3NWNmMTIzNjZjMzZmMjllNDYxM2AyMTRlZGM1NmNzNzRjOWYzaTZiNDNmNjVjOTUifX19' },

    { name: 'Cheeseburger', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGZjNTM5NWZmMjhkODk3cGQ2M2E3Zjc2NGE1ZjRhZGJhYjM0ZDNjYjM2NzM0MjUyZTIyMjU4MWY0ZjE3In19fQ==' },
    { name: 'Pizza Slice', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNTJhY2U2ZGNkMzkwNzFlODVhMjMxYWYwY2Y4YTMyYmVjNWRjZjFmMTI4MWFmNWRlOWQ3OTIzZjRhZjkzIn19fQ==' },
    { name: 'Coffee Cup', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvM2E4MTZhNGE0ODg4ZTFhN2M4NzU1OTIzZTQ0ZjIzMWI5YjI3MDIzNWJkYmIxZGE3Y2Q2ZGJhYTUwNWIzIn19fQ==' },
    { name: 'Chocolate Cake', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvOTU1Yzg2NThjOTIzZTk1OWFkMWVhNTk1MGRkMmYxOTc0Yzc3ZWM4NWU3NzA0OWI0Y2Y0YmJiNmFiNDIifX19' },
    { name: 'Popcorn Tub', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMTc3MGE3MGNhNWNhOTFjNGI0NGI2NzZhZjE4M2VkOTZlOTk3OWY1ZjJkYzQ1YmM5MzUxMzM1OTJmNzI4In19fQ==' },
    { name: 'Taco', category: 'food', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvN2RmNmFkZmVmYjg0MDdiZWRlZDBjOGIxZDkzODdmMzc1NzBhYzgyOWU0NjU1OTkyY2UxMzExYjVkYjNhNCJ9fX0=' },

    { name: 'Computer PC Monitor', category: 'tech', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYzg0ZWYtY2EzZTY2YjcxNzgyNDU1MzM5OTYyNTk5MTYxMTM1NmY1NmI0YmE0MjdhODg2MjFjZTRmNmMyIn19fQ==' },
    { name: 'Retro GameBoy', category: 'tech', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMzRhODc5MWFlOTkyZDRjMDYzZTE1Y2Y3OTNmZjA2OWQ4YzU0ODlmMTkxODcyMmY3ZmQzNDFmNWYxNzYxIn19fQ==' },
    { name: 'Photo Camera', category: 'tech', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYjJmMTM4ZGM1MmY0YmI1MjkyNGE2MDZlYjBiYTA4ODkyNDAzODViM2VjZjUxOWFlYzljYjVkMjM0OGI4In19fQ==' },
    { name: 'Vintage Radio', category: 'tech', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYmI4Y2FlN2Q1OTExZDg1Y2JjOWIyMjA5NmRhMjY0MDQxYjQ1MzNhZjA4YjZhOGM1YjEyOGYxYjc4YjcifX19' },

    { name: 'Mini Warden', category: 'mobs', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvOGNjOWExMGY2NGNmYTY1NzBkMzk3YWM5MWIzYTllNmIxY2JhODU1YzNjYTk4ZTkzZTE4ZmI5MzFhMTkzIn19fQ==' },
    { name: 'Enderman', category: 'mobs', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvN2E1OWFiOTQ0MTExNDU3YmFlZDhlZDA2NTYxNmY5YTJkMmNkNmBlMmU3NWQ4OGRjMjU3MWY4NTY0In19fQ==' },
    { name: 'Pink Axolotl', category: 'mobs', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvOTc1NmI3MjFiYTNkMzc5ZjA1Yzc3NDI4YmM1ODc0NGQzYjI2Yzg3ZTg0MDlkN2FlNjE0MGFlMjYzIn19fQ==' },
    { name: 'Herobrine', category: 'mobs', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYzM1MmViZDFkYmNkOTliNDIxYTM4ODkyY2U4NWJjMTg4MGMwYzM1YWE0ZjA2YjE5NzQ2ZDM3Y2U5MmViIn19fQ==' },

    { name: 'Red Gift / Present', category: 'misc', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvNmNlZjlhYTE0ZTcxN2VjNzZmNWQ2MjBmNDM0ZmNmNUExMmY2M2U1MWM3ZmE4ZjgzIn19fQ==' },
    { name: 'Pokéball', category: 'misc', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZjMzMjg2ZjE1M2FmYjQyYzg1NThhMWNhYTIyYjMzOGVmYWNjYjFjNzY1NzA0NjFmMTMyMzk1ODFkZTU0In19fQ==' },
    { name: 'Mailbox', category: 'misc', texture: 'eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMzZhYzgwYjM0ZjA5ODc1OWU0Mzk4MGNlYTk2NTRiMDFhZTRhZDI2N2Q4MDc5ZjNmNzQzOTBkYWRhIn19fQ==' }
  ]

  let selectedHead: CustomHead = HEADS_DATABASE[0]

  container.innerHTML = `
    <div class="tool-content fade-in">
      <div class="tool-header">
        <div class="tool-badge">Items & Entities</div>
        <h2>Custom Head & Texture Database</h2>
        <p class="tool-desc">Browse 20+ decorative mini-blocks, foods, tech and mob heads, or input custom Base64 textures to generate modern 1.20.5+ / 1.21+ /give commands.</p>
      </div>

      <div class="generator-layout">
        <!-- Catalog Column -->
        <div class="config-column">
          <div class="panel">
            <h3 class="panel-title">Head Catalog</h3>
            
            <div class="form-row">
              <div class="form-group">
                <input type="text" id="head-search" placeholder="Search heads (e.g. chest, burger, pc)..." class="input">
              </div>
              <div class="form-group">
                <select id="head-cat-filter" class="input">
                  <option value="all">All Categories</option>
                  <option value="blocks">Blocks & Furniture</option>
                  <option value="food">Food & Drinks</option>
                  <option value="tech">Devices & Tech</option>
                  <option value="mobs">Mobs & Characters</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
            </div>

            <!-- Grid of Heads -->
            <div id="heads-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; max-height: 380px; overflow-y: auto; padding-right: 4px; margin-top: 12px;"></div>
          </div>

          <!-- Custom Texture Input -->
          <div class="panel mt-4">
            <h3 class="panel-title">Custom Base64 or Username</h3>
            <div class="form-group">
              <label>Custom Base64 Texture Value</label>
              <textarea id="custom-base64-val" rows="3" placeholder="eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6..." class="input" style="font-family: monospace; font-size: 11px;"></textarea>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-apply-custom">Apply Custom Texture</button>
          </div>
        </div>

        <!-- Preview & Command Output Column -->
        <div class="preview-column">
          <!-- Active Head Card -->
          <div class="panel">
            <h3 class="panel-title">Selected Decoration Head</h3>
            
            <div style="display: flex; gap: 16px; align-items: center; padding: 12px; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);">
              <div style="width: 64px; height: 64px; background: #000; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); position: relative;">
                <div id="active-head-cube" style="width: 40px; height: 40px; background: #222; border: 2px solid #555; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"></div>
              </div>
              <div>
                <div id="active-head-name" style="font-size: 16px; font-weight: 700; color: #fff;">Mini Chest</div>
                <div id="active-head-cat" style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">BLOCKS</div>
              </div>
            </div>
          </div>

          <!-- 1.20.5+ / 1.21.x Modern Command -->
          <div class="panel mt-4">
            <div class="panel-header-inline">
              <h3 class="panel-title">Modern Command (1.20.5+ / 1.21+)</h3>
              <button class="btn btn-primary btn-sm" id="btn-copy-modern">Copy Modern /give</button>
            </div>
            <pre class="code-preview" id="preview-modern-give"></pre>

            <!-- Legacy 1.20.4- Command -->
            <div class="panel-header-inline mt-3">
              <h3 class="panel-title">Legacy Command (1.13 - 1.20.4)</h3>
              <button class="btn btn-secondary btn-sm" id="btn-copy-legacy">Copy Legacy /give</button>
            </div>
            <pre class="code-preview" id="preview-legacy-give"></pre>
          </div>
        </div>
      </div>
    </div>
  `

  const searchInput = container.querySelector('#head-search') as HTMLInputElement
  const catFilter = container.querySelector('#head-cat-filter') as HTMLSelectElement
  const gridContainer = container.querySelector('#heads-grid') as HTMLElement
  const customInput = container.querySelector('#custom-base64-val') as HTMLTextAreaElement
  const activeName = container.querySelector('#active-head-name') as HTMLElement
  const activeCat = container.querySelector('#active-head-cat') as HTMLElement
  const previewModern = container.querySelector('#preview-modern-give') as HTMLElement
  const previewLegacy = container.querySelector('#preview-legacy-give') as HTMLElement

  function renderGrid() {
    const q = searchInput.value.toLowerCase().trim()
    const cat = catFilter.value

    gridContainer.innerHTML = ''
    const filtered = HEADS_DATABASE.filter(h => {
      const matchCat = cat === 'all' || h.category === cat
      const matchQuery = !q || h.name.toLowerCase().includes(q)
      return matchCat && matchQuery
    })

    if (filtered.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No heads found matching "${q}"</div>`
      return
    }

    filtered.forEach(h => {
      const card = document.createElement('div')
      card.className = 'panel'
      card.style.padding = '8px'
      card.style.cursor = 'pointer'
      card.style.display = 'flex'
      card.style.flexDirection = 'column'
      card.style.alignItems = 'center'
      card.style.textAlign = 'center'
      card.style.transition = 'all 0.15s ease'
      card.style.border = selectedHead === h ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
      if (selectedHead === h) card.style.background = 'var(--bg-tertiary)'

      card.innerHTML = `
        <div style="width: 36px; height: 36px; background: #1a1e2b; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="width: 20px; height: 20px; background: #475569; border-radius: 2px;"></div>
        </div>
        <div style="font-size: 11px; font-weight: 600; line-height: 1.2; word-break: break-word;">${h.name}</div>
      `

      card.addEventListener('click', () => {
        selectedHead = h
        updateSelected()
        renderGrid()
      })

      gridContainer.appendChild(card)
    })
  }

  function updateSelected() {
    activeName.textContent = selectedHead.name
    activeCat.textContent = selectedHead.category.toUpperCase()

    const b64 = selectedHead.texture
    const modernCmd = `/give @p player_head[profile={properties:[{name:"textures",value:"${b64}"}]}] 1`
    previewModern.textContent = modernCmd

    const legacyCmd = `/give @p player_head{SkullOwner:{Id:[I;1484191632,-1198572851,-1845171732,1542610738],Properties:{textures:[{Value:"${b64}"}]}}} 1`
    previewLegacy.textContent = legacyCmd
  }

  searchInput.addEventListener('input', renderGrid)
  catFilter.addEventListener('change', renderGrid)

  container.querySelector('#btn-apply-custom')?.addEventListener('click', () => {
    const val = customInput.value.trim()
    if (!val) return
    selectedHead = {
      name: 'Custom Texture Head',
      category: 'misc',
      texture: val
    }
    updateSelected()
    showToast('Custom texture applied!')
  })

  container.querySelector('#btn-copy-modern')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewModern.textContent || '')
    showToast('Modern /give command copied to clipboard!')
  })

  container.querySelector('#btn-copy-legacy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewLegacy.textContent || '')
    showToast('Legacy /give command copied to clipboard!')
  })

  function showToast(msg: string) {
    const toast = document.createElement('div')
    toast.className = 'toast show'
    toast.textContent = msg
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }

  renderGrid()
  updateSelected()
}

export const mount = renderHeads
