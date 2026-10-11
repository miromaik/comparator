import { escapeHtml } from '../utils/helpers'
import { TOOL_ICONS } from '../utils/icons'
import { store } from '../utils/store'
import { toolRegistry, switchTool, type ToolId } from '../main'

export interface CategoryInfo {
  id: string
  name: string
  iconSvg: string
  toolIds: ToolId[]
}

export function getCategories(): CategoryInfo[] {
  return [
    {
      id: 'text',
      name: 'Text & Formatting',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 3h10M6 3v10M10 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['minimessage', 'tellraw', 'gradient', 'motd', 'signs'],
    },
    {
      id: 'items',
      name: 'Items & Entities',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 12.5L12.5 3.5M3.5 3.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['itembuilder', 'trim', 'banner', 'summon', 'firework', 'potion', 'armorstand', 'heads'],
    },
    {
      id: 'players',
      name: 'Players & Identity',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['uuid', 'villager'],
    },
    {
      id: 'datapacks',
      name: 'Datapacks & Assets',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5L8 1.5l5.5 3v7L8 14.5l-5.5-3v-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 1.5v13M2.5 4.5l5.5 3 5.5-3" stroke="currentColor" stroke-width="1.5"/></svg>`,
      toolIds: ['recipe', 'loottable', 'scoreboard', 'advancement', 'cmdchain'],
    },
    {
      id: 'world',
      name: 'World & Geometry',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['nether', 'beacon', 'circle', 'chunkcoords', 'seedmap', 'worldborder', 'kinetics', 'biomecolor', 'schematic'],
    },
    {
      id: 'redstone',
      name: 'Redstone & Timing',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['anvil', 'timing', 'xp', 'combat', 'enchant'],
    },
    {
      id: 'server',
      name: 'Server Management',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h6M5 10h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      toolIds: ['serverprops', 'sound', 'particle', 'bossbar'],
    },
  ]
}

export function mount(container: HTMLElement): void {
  let activeCategory = 'all'
  let searchQuery = ''

  function render(): void {
    const categories = getCategories()
    const allToolEntries = Object.entries(toolRegistry).filter(([id]) => id !== 'home') as [ToolId, (typeof toolRegistry)[ToolId]][]
    const totalCount = allToolEntries.length
    const pinnedTools = store.getPreferences().pinnedTools.filter(id => id !== 'home' && toolRegistry[id as ToolId]) as ToolId[]

    const query = searchQuery.trim().toLowerCase()
    const filteredTools = allToolEntries.filter(([id, info]) => {
      if (activeCategory !== 'all') {
        const cat = categories.find(c => c.id === activeCategory)
        if (!cat || !cat.toolIds.includes(id)) return false
      }
      if (query) {
        const matchName = info.name.toLowerCase().includes(query)
        const matchDesc = info.desc.toLowerCase().includes(query)
        const matchSection = info.section.toLowerCase().includes(query)
        const matchBadge = (info.versionBadge || '').toLowerCase().includes(query)
        const matchId = id.toLowerCase().includes(query)
        return matchName || matchDesc || matchSection || matchBadge || matchId
      }
      return true
    })

    container.innerHTML = `
      <div class="home-page-container">
        <!-- Hero Section -->
        <header class="home-hero">
          <div class="home-badge-pill">
            <span class="home-badge-dot"></span>
            <span>COMPARATOR v1.0 • ALPHA • ${totalCount} MINECRAFT TOOLS</span>
          </div>
          <h1 class="home-hero-title">Craft, Calculate & Configure</h1>
          <p class="home-hero-subtitle">
            Minecraft utility toolbox built for server owners, datapack creators, technical redstoners, and builders.
          </p>

          <!-- Search Box -->
          <div class="home-search-container">
            <div class="home-search-box">
              <svg class="home-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                id="home-search-input" 
                type="text" 
                placeholder="Search 38 tools by name, command, or topic (e.g. tellraw, trim, seed, sound, bossbar)..." 
                value="${escapeHtml(searchQuery)}"
                autocomplete="off"
                spellcheck="false"
              />
              ${searchQuery ? `<button id="home-clear-search" class="home-search-clear" title="Clear search">×</button>` : ''}
              <div class="home-search-hint">
                <kbd class="home-kbd">⌘K</kbd>
              </div>
            </div>
          </div>

          <!-- Category Filter Pills -->
          <div class="home-category-bar">
            <button class="home-cat-pill ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
              <span>All Tools</span>
              <span class="home-cat-count">${totalCount}</span>
            </button>
            ${categories.map(cat => `
              <button class="home-cat-pill ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                ${cat.iconSvg}
                <span>${cat.name}</span>
                <span class="home-cat-count">${cat.toolIds.length}</span>
              </button>
            `).join('')}
          </div>
        </header>

        <!-- Pinned Section (if any and not actively searching) -->
        ${!searchQuery && activeCategory === 'all' && pinnedTools.length > 0 ? `
          <section class="home-section pinned-section-wrapper">
            <div class="home-section-header">
              <div class="home-section-title-wrap">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color: var(--accent-gold);"><path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z"/></svg>
                <h2 class="home-section-title">Pinned Favorites</h2>
              </div>
              <span class="home-section-sub">${pinnedTools.length} pinned</span>
            </div>
            <div class="home-grid home-pinned-grid">
              ${pinnedTools.map(id => renderToolCard(id, toolRegistry[id], true)).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Main Tools Grid Section -->
        <section class="home-section">
          <div class="home-section-header">
            <div class="home-section-title-wrap">
              <h2 class="home-section-title">
                ${searchQuery ? `Search Results for "${escapeHtml(searchQuery)}"` : activeCategory === 'all' ? 'All Tools Catalog' : categories.find(c => c.id === activeCategory)?.name || 'Tools'}
              </h2>
            </div>
            <span class="home-section-sub">${filteredTools.length} of ${totalCount} available</span>
          </div>

          ${filteredTools.length === 0 ? `
            <div class="home-empty-state">
              <div class="home-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h3>No matching tools found</h3>
              <p>We couldn't find any tool matching "<strong>${escapeHtml(searchQuery)}</strong>". Try checking for typos or searching by keyword.</p>
              <button id="home-empty-reset" class="btn btn-secondary">Clear Filter</button>
            </div>
          ` : `
            <div class="home-grid">
              ${filteredTools.map(([id, info]) => renderToolCard(id, info, store.isPinned(id))).join('')}
            </div>
          `}
        </section>


      </div>
    `

    bindEvents()
  }

  function renderToolCard(id: ToolId, info: (typeof toolRegistry)[ToolId], isPinned: boolean): string {
    const iconSvg = TOOL_ICONS[id] || TOOL_ICONS.home
    const isUniv = (info.versionBadge || '').toLowerCase().includes('universal')

    return `
      <div class="home-tool-card" data-tool="${id}" tabindex="0" role="button" aria-label="${info.name}">
        <div class="home-card-header">
          <div class="home-card-icon-box">
            ${iconSvg}
          </div>
          <div class="home-card-meta">
            <span class="home-card-category">${info.section}</span>
            ${info.versionBadge ? `
              <span class="home-card-ver-badge ${isUniv ? 'univ' : 'ver'}">${info.versionBadge}</span>
            ` : ''}
          </div>
          <button class="home-card-star ${isPinned ? 'active' : ''}" data-pin="${id}" title="${isPinned ? 'Unpin from favorites' : 'Pin to favorites'}" aria-label="Pin">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="${isPinned ? 'currentColor' : 'none'}">
              <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </button>
        </div>

        <div class="home-card-body">
          <h3 class="home-card-title">${info.name}</h3>
          <p class="home-card-desc">${info.desc}</p>
        </div>

        <div class="home-card-footer">
          <span class="home-card-action">
            <span>Open Tool</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    `
  }

  function bindEvents(): void {
    const input = container.querySelector<HTMLInputElement>('#home-search-input')
    if (input) {
      input.addEventListener('input', () => {
        searchQuery = input.value
        render()
        const reInput = container.querySelector<HTMLInputElement>('#home-search-input')
        if (reInput) {
          reInput.focus()
          reInput.setSelectionRange(searchQuery.length, searchQuery.length)
        }
      })
    }

    container.querySelector('#home-clear-search')?.addEventListener('click', () => {
      searchQuery = ''
      render()
      container.querySelector<HTMLInputElement>('#home-search-input')?.focus()
    })

    container.querySelector('#home-empty-reset')?.addEventListener('click', () => {
      searchQuery = ''
      activeCategory = 'all'
      render()
    })

    container.querySelectorAll<HTMLButtonElement>('.home-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat || 'all'
        render()
      })
    })

    container.querySelectorAll<HTMLElement>('.home-tool-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.home-card-star')) return
        const toolId = card.dataset.tool as ToolId
        if (toolId) {
          switchTool(toolId)
        }
      })

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          const toolId = card.dataset.tool as ToolId
          if (toolId) {
            switchTool(toolId)
          }
        }
      })
    })

    container.querySelectorAll<HTMLButtonElement>('.home-card-star').forEach(starBtn => {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const toolId = starBtn.dataset.pin!
        store.togglePin(toolId)
        render()
      })
    })
  }

  render()
}
