import './style.css'
import { $ } from './utils/helpers'
import { store } from './utils/store'
import { openSettingsModal } from './components/settings'

import { TOOL_ICONS } from './utils/icons'

export type ToolId =
  | 'home'
  | 'minimessage'
  | 'tellraw'
  | 'gradient'
  | 'motd'
  | 'signs'
  | 'itembuilder'
  | 'trim'
  | 'banner'
  | 'summon'
  | 'firework'
  | 'potion'
  | 'armorstand'
  | 'heads'
  | 'uuid'
  | 'villager'
  | 'recipe'
  | 'loottable'
  | 'scoreboard'
  | 'advancement'
  | 'cmdchain'
  | 'nether'
  | 'beacon'
  | 'circle'
  | 'chunkcoords'
  | 'seedmap'
  | 'worldborder'
  | 'kinetics'
  | 'biomecolor'
  | 'schematic'
  | 'anvil'
  | 'timing'
  | 'xp'
  | 'combat'
  | 'enchant'
  | 'serverprops'
  | 'sound'
  | 'particle'
  | 'bossbar'

let currentTool: ToolId = 'home'

export const toolRegistry: Record<ToolId, { name: string; section: string; icon: string; desc: string; versionBadge: string }> = {
  home: {
    name: 'Dashboard',
    section: 'Overview',
    icon: '⌂',
    desc: 'Instant tool search, categorized tiles, pinned favorites & quick launch',
    versionBadge: '',
  },
  minimessage: {
    name: 'MiniMessage Editor',
    section: 'Text & Formatting',
    icon: 'T',
    desc: 'RGB gradients, text decorations, MiniMessage & legacy formats',
    versionBadge: 'Universal • MiniMessage',
  },
  tellraw: {
    name: 'Tellraw & JSON Studio',
    section: 'Text & Formatting',
    icon: '💬',
    desc: 'Interactive /tellraw, /title, actionbar, hover tooltips & click events',
    versionBadge: 'Universal - 1.13 - 1.21',
  },
  gradient: {
    name: 'Hex Gradient Generator',
    section: 'Text & Formatting',
    icon: '🌈',
    desc: 'Multi-stop RGB gradients for MiniMessage, Spigot, CMI & JSON',
    versionBadge: 'Universal • Hex RGB',
  },
  motd: {
    name: 'MOTD & Server List',
    section: 'Text & Formatting',
    icon: 'M',
    desc: '2-line MOTD live preview with ping and player counter',
    versionBadge: 'Universal • All Servers',
  },
  signs: {
    name: 'Signs & Books Studio',
    section: 'Text & Formatting',
    icon: '📜',
    desc: 'Hanging & standing signs, 12 woods, front/back text, glow ink & written books',
    versionBadge: 'Universal • 1.20+ Woods',
  },
  itembuilder: {
    name: 'Item Builder Studio',
    section: 'Items & Entities',
    icon: '⚔',
    desc: 'Custom /give items, enchantments, lore, attributes & modern/legacy syntax',
    versionBadge: '1.20.5+ & Legacy 1.14+',
  },
  trim: {
    name: 'Armor Trim Studio',
    section: 'Items & Entities',
    icon: '🛡️',
    desc: '18 armor trim templates, 10 minerals, mannequin preview & /give commands',
    versionBadge: 'MC 1.20+ & 1.21',
  },
  banner: {
    name: 'Banner Pattern Studio',
    section: 'Items & Entities',
    icon: '🚩',
    desc: 'Interactive loom layers, saltire, borders, skulls & /give commands',
    versionBadge: 'Universal • All Versions',
  },
  summon: {
    name: 'Mob & Boss Creator',
    section: 'Items & Entities',
    icon: '👾',
    desc: 'Custom /summon boss mobs, health, damage, equipment & attributes',
    versionBadge: '1.20.5+ & Legacy 1.14+',
  },
  firework: {
    name: 'Firework Rocket Studio',
    section: 'Items & Entities',
    icon: '🎆',
    desc: 'Custom shapes, primary & fade RGB colors, trail, twinkle & particle canvas',
    versionBadge: 'Universal • All Versions',
  },
  potion: {
    name: 'Potion & Arrow Brewer',
    section: 'Items & Entities',
    icon: '🧪',
    desc: 'Custom duration, amplifier, ambient particles, RGB liquid colors & tipped arrows',
    versionBadge: '1.20.5+ & Legacy 1.14+',
  },
  armorstand: {
    name: 'Armor Stand & Pose Studio',
    section: 'Items & Entities',
    icon: '🗿',
    desc: 'Interactive Minecraft wooden model posing, armor overlays & /summon',
    versionBadge: '1.20.5+ & Legacy 1.14+',
  },
  heads: {
    name: 'Custom Head Database',
    section: 'Items & Entities',
    icon: '👤',
    desc: 'Decorative mini-block heads, food, tech, custom Base64 & dual give formats',
    versionBadge: '1.20.5+ & Legacy 1.14+',
  },
  uuid: {
    name: 'Player & Skin Studio',
    section: 'Players & Identity',
    icon: 'U',
    desc: 'NameMC-level player lookup, 3D skins, online/offline UUID & head commands',
    versionBadge: 'Universal • Java & Bedrock',
  },
  villager: {
    name: 'Villager Trade & Cures',
    section: 'Players & Economy',
    icon: 'V',
    desc: 'Zombie infection discount calculator, Hero of Village & 1.20.2+ cap switch',
    versionBadge: 'MC 1.14+ (1.20.2 Cure Cap)',
  },
  recipe: {
    name: '3×3 Recipe Studio',
    section: 'Datapacks & Assets',
    icon: 'R',
    desc: 'Interactive 3x3 crafting grid, shaped, shapeless, furnace recipes',
    versionBadge: 'Universal - 1.13 - 1.21',
  },
  loottable: {
    name: 'Loot Table Designer',
    section: 'Datapacks & Assets',
    icon: '📦',
    desc: 'Chests, entities, rolls, weight pools, functions & JSON export',
    versionBadge: 'Universal - 1.14 - 1.21',
  },
  scoreboard: {
    name: 'Scoreboard & Teams Studio',
    section: 'Datapacks & Assets',
    icon: '📋',
    desc: 'Objectives, display slots, teams, friendly fire & .mcfunction exporter',
    versionBadge: 'Universal - 1.13 - 1.21',
  },
  advancement: {
    name: 'Advancements & Criteria',
    section: 'Datapacks & Assets',
    icon: 'A',
    desc: 'Custom advancements, icons, frames, triggers, criteria & JSON exporter',
    versionBadge: 'Universal - 1.13 - 1.21',
  },
  cmdchain: {
    name: 'Command Block Sequencer',
    section: 'Datapacks & Assets',
    icon: '⚡',
    desc: 'Chain/repeating sequences, conditional flow & target selector validator',
    versionBadge: 'Universal • All Versions',
  },
  nether: {
    name: 'Nether Coordinates',
    section: 'World & Geometry',
    icon: 'N',
    desc: 'Overworld ↔ Nether 1:8 coordinate math & portal linking',
    versionBadge: 'Universal • 1:8 Math',
  },
  beacon: {
    name: 'Beacon Calculator',
    section: 'World & Geometry',
    icon: 'B',
    desc: 'Tiers I-IV, multi-beacon clusters, mineral stacks & blueprints',
    versionBadge: 'Universal • All Versions',
  },
  circle: {
    name: 'Circle & Sphere Grid',
    section: 'World & Geometry',
    icon: 'C',
    desc: 'Bresenham voxel canvas for 2D circles, ellipses, 3D spheres and domes',
    versionBadge: 'Universal • Voxel Math',
  },
  chunkcoords: {
    name: 'Chunk & Slime Radar',
    section: 'World & Geometry',
    icon: '🧭',
    desc: 'Block ↔ Chunk ↔ Region file math and Java RNG Slime chunk radar',
    versionBadge: 'Universal • Chunk Physics',
  },
  seedmap: {
    name: 'Seed Map & Biome Explorer',
    section: 'World & Geometry',
    icon: '🗺️',
    desc: 'Biome climate noise, structures locator, coordinates & interactive map',
    versionBadge: '1.18+ (Caves & Cliffs) - 1.21',
  },
  worldborder: {
    name: 'WorldBorder & Pre-gen',
    section: 'World & Geometry',
    icon: 'W',
    desc: 'Border boundaries, chunk math, .mca region counts & Chunky commands',
    versionBadge: 'Java 1.8+ / Chunky',
  },
  kinetics: {
    name: 'Elytra Kinetics & Fall',
    section: 'World & Geometry',
    icon: 'K',
    desc: 'Fall physics, Feather Falling IV, Mace smash & Elytra kinetic damage',
    versionBadge: 'Universal • 1.21 Mace',
  },
  biomecolor: {
    name: 'Biome Tint & Colormap',
    section: 'World & Geometry',
    icon: '🎨',
    desc: 'Temperature & downfall colormap curves, grass/foliage tint & biome JSON',
    versionBadge: 'Universal • Data-Driven',
  },
  schematic: {
    name: 'Schematic & Litematica 3D',
    section: 'World & Geometry',
    icon: '🏗️',
    desc: 'Interactive 3D & 2D slice viewer for .litematic & .schem files with material list',
    versionBadge: 'Universal • .litematic & .schem',
  },
  anvil: {
    name: 'Anvil & Penalty Optimizer',
    section: 'Calculators & Redstone',
    icon: '🔨',
    desc: 'Prior work penalties, repair costs and optimal book combination order',
    versionBadge: 'Universal • All Versions',
  },
  timing: {
    name: 'Redstone & Hopper Timing',
    section: 'Calculators & Redstone',
    icon: '⏱',
    desc: 'Game ticks, repeater delays, hopper pipeline throughput simulator',
    versionBadge: 'Universal • Redstone Physics',
  },
  xp: {
    name: 'XP & Mob Farm Calculator',
    section: 'Calculators & Redstone',
    icon: '✨',
    desc: 'Level milestones, experience deficits, Enderman and Blaze kills needed',
    versionBadge: 'Universal • Java & Bedrock',
  },
  combat: {
    name: 'Combat & Armor Calculator',
    section: 'Calculators & Redstone',
    icon: '⚔',
    desc: '1.21+ damage scaling, armor toughness, Prot IV EPF & Mace breach',
    versionBadge: 'MC 1.21+ (Mace & Modern)',
  },
  enchant: {
    name: 'Enchant Tree Optimizer',
    section: 'Calculators & Redstone',
    icon: '✨',
    desc: 'Optimal binary merge tree to avoid "Too Expensive!" 39-level anvil penalty',
    versionBadge: 'Universal • 1.21 Mace',
  },
  serverprops: {
    name: 'server.properties Studio',
    section: 'Server Configuration',
    icon: '⚙',
    desc: 'Visual editor for gameplay, world performance, whitelist and security',
    versionBadge: 'Universal • Server Config',
  },
  sound: {
    name: 'Sound Events & /playsound',
    section: 'Server Configuration',
    icon: '🔊',
    desc: 'Search 800+ vanilla sound events, categories, pitch, volume & command builder',
    versionBadge: 'Universal • 800+ Sounds',
  },
  particle: {
    name: 'Particle Studio & FX',
    section: 'Server Configuration',
    icon: 'P',
    desc: 'RGB dust, particle rings, spirals, spheres & /particle command builder',
    versionBadge: 'Universal • /particle',
  },
  bossbar: {
    name: 'BossBar & HUD Studio',
    section: 'Server Configuration',
    icon: 'B',
    desc: 'Visual boss health bar, notches, colors, players & /bossbar commands',
    versionBadge: 'Universal - 1.13 - 1.21',
  },
}

async function loadTool(id: ToolId): Promise<(container: HTMLElement) => void> {
  switch (id) {
    case 'home': return (await import('./tools/home')).mount
    case 'minimessage': return (await import('./tools/text/minimessage')).mount
    case 'tellraw': return (await import('./tools/text/tellraw')).mount
    case 'gradient': return (await import('./tools/text/gradient')).mount
    case 'motd': return (await import('./tools/text/motd')).mount
    case 'signs': return (await import('./tools/text/signs')).mount
    case 'itembuilder': return (await import('./tools/items/itembuilder')).mount
    case 'trim': return (await import('./tools/items/trim')).mount
    case 'banner': return (await import('./tools/items/banner')).mount
    case 'summon': return (await import('./tools/items/summon')).mount
    case 'firework': return (await import('./tools/items/firework')).mount
    case 'potion': return (await import('./tools/items/potion')).mount
    case 'armorstand': return (await import('./tools/items/armorstand')).mount
    case 'heads': return (await import('./tools/items/heads')).mount
    case 'uuid': return (await import('./tools/players/uuid')).mount
    case 'villager': return (await import('./tools/players/villager')).mount
    case 'recipe': return (await import('./tools/datapacks/recipe')).mount
    case 'loottable': return (await import('./tools/datapacks/loottable')).mount
    case 'scoreboard': return (await import('./tools/datapacks/scoreboard')).mount
    case 'advancement': return (await import('./tools/datapacks/advancement')).mount
    case 'cmdchain': return (await import('./tools/datapacks/cmdchain')).mount
    case 'nether': return (await import('./tools/world/nether')).mount
    case 'beacon': return (await import('./tools/world/beacon')).mount
    case 'circle': return (await import('./tools/world/circle')).mount
    case 'chunkcoords': return (await import('./tools/world/chunkcoords')).mount
    case 'seedmap': return (await import('./tools/world/seedmap')).mount
    case 'worldborder': return (await import('./tools/world/worldborder')).mount
    case 'kinetics': return (await import('./tools/world/kinetics')).mount
    case 'biomecolor': return (await import('./tools/world/biomecolor')).mount
    case 'schematic': return (await import('./tools/world/schematic')).mount
    case 'anvil': return (await import('./tools/redstone/anvil')).mount
    case 'timing': return (await import('./tools/redstone/timing')).mount
    case 'xp': return (await import('./tools/redstone/xp')).mount
    case 'combat': return (await import('./tools/redstone/combat')).mount
    case 'enchant': return (await import('./tools/redstone/enchant')).mount
    case 'serverprops': return (await import('./tools/server/serverprops')).mount
    case 'sound': return (await import('./tools/server/sound')).mount
    case 'particle': return (await import('./tools/server/particle')).mount
    case 'bossbar': return (await import('./tools/server/bossbar')).mount
  }
}

export async function switchTool(id: ToolId): Promise<void> {
  if (!toolRegistry[id]) return
  currentTool = id
  if (id !== 'home') {
    store.addRecent(id)
  }

  const container = document.getElementById('tool-container')!
  const title = document.getElementById('tool-title')!
  const pinBtn = document.getElementById('header-pin-btn')!

  container.style.opacity = '0'
  container.style.transform = 'translateY(6px)'

  await new Promise(r => setTimeout(r, 80))

  const mount = await loadTool(id)
  container.innerHTML = ''
  mount(container)

  title.textContent = id === 'home' ? 'Dashboard' : toolRegistry[id].name
  
  const verBadge = document.getElementById('tool-ver-badge')
  if (verBadge) {
    if (id === 'home' || !toolRegistry[id].versionBadge) {
      verBadge.style.display = 'none'
    } else {
      verBadge.style.display = 'inline-flex'
      verBadge.textContent = toolRegistry[id].versionBadge
      const isUniv = toolRegistry[id].versionBadge.toLowerCase().includes('universal')
      verBadge.className = `tool-version-pill ${isUniv ? 'pill-universal' : 'pill-version'}`
    }
  }
  
  if (pinBtn) {
    if (id === 'home') {
      pinBtn.style.display = 'none'
    } else {
      pinBtn.style.display = 'inline-flex'
      const isPinned = store.isPinned(id)
      pinBtn.classList.toggle('active', isPinned)
      pinBtn.innerHTML = isPinned
        ? `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z" stroke="currentColor" stroke-width="1.4"/></svg>`
    }
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', (item as HTMLElement).dataset.tool === id)
  })

  container.scrollTop = 0

  requestAnimationFrame(() => {
    container.style.transition = 'opacity 180ms ease, transform 180ms ease'
    container.style.opacity = '1'
    container.style.transform = 'translateY(0)'
  })
}

function renderPinnedSection(): void {
  const container = document.getElementById('pinned-nav-items')
  if (!container) return

  const pinnedIds = (store.getPreferences().pinnedTools as ToolId[]).filter(id => id !== 'home')

  if (pinnedIds.length === 0) {
    container.innerHTML = `<span class="empty-pinned-hint">Star tools to pin them here</span>`
    return
  }

  container.innerHTML = pinnedIds.map(id => {
    const info = toolRegistry[id]
    if (!info) return ''
    const isActive = id === currentTool
    const iconSvg = TOOL_ICONS[id] || TOOL_ICONS.home

    return `
      <div class="pinned-nav-wrapper">
        <button class="nav-item ${isActive ? 'active' : ''}" data-tool="${id}">
          <span class="nav-item-icon-svg">${iconSvg}</span>
          <span class="nav-item-name">${info.name}</span>
        </button>
        <button class="nav-item-unpin-btn" data-unpin="${id}" title="Unpin tool">×</button>
      </div>
    `
  }).join('')

  container.querySelectorAll<HTMLButtonElement>('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.tool as ToolId
      if (toolId && toolId !== currentTool) switchTool(toolId)
      const sidebar = document.getElementById('sidebar')!
      if (sidebar.classList.contains('open')) sidebar.classList.remove('open')
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-unpin]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const toolId = btn.dataset.unpin!
      store.togglePin(toolId)
      renderPinnedSection()
      updateHeaderPinState()
    })
  })
}

function updateHeaderPinState(): void {
  const pinBtn = document.getElementById('header-pin-btn')
  if (pinBtn && currentTool !== 'home') {
    const isPinned = store.isPinned(currentTool)
    pinBtn.classList.toggle('active', isPinned)
    pinBtn.innerHTML = isPinned
      ? `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5z" stroke="currentColor" stroke-width="1.4"/></svg>`
  }
}

function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar')!
  const isCollapsed = sidebar.classList.toggle('collapsed')
  const toggleBtn = document.getElementById('topbar-sidebar-toggle')
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isCollapsed)
    toggleBtn.setAttribute('title', isCollapsed ? 'Expand Sidebar (⌘B)' : 'Collapse Sidebar (⌘B)')
  }

}

function initSidebar(): void {
  document.querySelectorAll<HTMLButtonElement>('.sidebar-nav .nav-item').forEach(item => {
    const toolId = item.dataset.tool as ToolId
    if (toolId && TOOL_ICONS[toolId]) {
      const iconContainer = item.querySelector('.nav-item-icon-svg')
      if (iconContainer) {
        iconContainer.innerHTML = TOOL_ICONS[toolId]
      }
    }
  })

  renderPinnedSection()

  const handleLogoToHome = () => {
    if (currentTool !== 'home') {
      switchTool('home')
    }
    const sidebar = document.getElementById('sidebar')
    if (sidebar?.classList.contains('open')) sidebar.classList.remove('open')
  }

  document.querySelector('.sidebar-header .logo')?.addEventListener('click', handleLogoToHome)
  document.querySelector('.sidebar-header .logo-text')?.addEventListener('click', (e) => {
    e.stopPropagation()
    handleLogoToHome()
  })
  document.querySelector('.sidebar-header .logo')?.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key
    if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      handleLogoToHome()
    }
  })
  document.querySelector('.sidebar-header .logo-text')?.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key
    if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      handleLogoToHome()
    }
  })

  $('#nav-home-btn')?.addEventListener('click', () => {
    if (currentTool !== 'home') {

      switchTool('home')
    }
    const sidebar = document.getElementById('sidebar')!
    if (sidebar.classList.contains('open')) sidebar.classList.remove('open')
  })

  document.querySelectorAll<HTMLButtonElement>('.nav-section .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const toolId = item.dataset.tool as ToolId
      if (toolId && toolId !== currentTool) switchTool(toolId)

      const sidebar = document.getElementById('sidebar')!
      if (sidebar.classList.contains('open')) sidebar.classList.remove('open')
    })
  })

  document.querySelectorAll<HTMLButtonElement>('.nav-section-title:not(.static)').forEach(title => {
    title.addEventListener('click', () => {
      const section = title.dataset.section!
      const items = document.querySelector(`[data-section-items="${section}"]`) as HTMLElement
      if (!items) return

      const isNowCollapsed = items.classList.toggle('collapsed')
      title.classList.toggle('collapsed', isNowCollapsed)

    })
  })

  $('#topbar-sidebar-toggle')?.addEventListener('click', () => {
    toggleSidebar()
  })

  $('#mobile-menu')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar')!
    sidebar.classList.toggle('open')
  })

  $('#header-pin-btn')?.addEventListener('click', () => {
    if (currentTool === 'home') return
    store.togglePin(currentTool)
    renderPinnedSection()
    updateHeaderPinState()
  })

  $('#sidebar-settings-btn')?.addEventListener('click', () => openSettingsModal('general'))
  $('#sidebar-about-btn')?.addEventListener('click', () => openSettingsModal('about'))
  $('#topbar-settings-btn')?.addEventListener('click', () => openSettingsModal('general'))

  store.subscribe(() => {
    renderPinnedSection()
    updateHeaderPinState()
  })

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      toggleSidebar()
    }
  })
}

function initCommandPalette(): void {
  const overlay = document.getElementById('cmd-palette-overlay')!
  const input = document.getElementById('cmd-input') as HTMLInputElement
  const results = document.getElementById('cmd-results')!
  let selectedIndex = 0

  function getSortedTools(): Array<{ id: ToolId; name: string; section: string; iconSvg: string; desc: string; isPinned: boolean }> {
    return Object.entries(toolRegistry).map(([id, info]) => ({
      id: id as ToolId,
      name: info.name,
      section: info.section,
      iconSvg: TOOL_ICONS[id] || TOOL_ICONS.home,
      desc: info.desc,
      isPinned: id !== 'home' && store.isPinned(id),
    })).sort((a, b) => {
      if (a.id === 'home') return -1
      if (b.id === 'home') return 1
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }

  function open(): void {
    overlay.classList.remove('hidden')
    input.value = ''
    input.focus()
    selectedIndex = 0
    renderResults(getSortedTools())

  }

  function close(): void {
    overlay.classList.add('hidden')
  }

  function renderResults(items: ReturnType<typeof getSortedTools>): void {
    results.innerHTML = items.map((tool, i) => `
      <div class="cmd-result-item ${i === selectedIndex ? 'selected' : ''}" data-tool="${tool.id}">
        <div class="cmd-result-icon-svg">${tool.iconSvg}</div>
        <div class="cmd-result-text">
          <div class="cmd-result-title-row">
            <span class="cmd-result-name">${tool.name}</span>
            ${tool.isPinned ? `<span class="cmd-pinned-badge">★ Pinned</span>` : ''}
          </div>
          <div class="cmd-result-section">${tool.section} • ${tool.desc}</div>
        </div>
      </div>
    `).join('')

    results.querySelectorAll<HTMLElement>('.cmd-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const toolId = item.dataset.tool as ToolId
        switchTool(toolId)
        close()
      })
    })
  }

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase()
    const all = getSortedTools()
    const filtered = all.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.section.toLowerCase().includes(query) ||
      t.desc.toLowerCase().includes(query) ||
      t.id.includes(query)
    )
    selectedIndex = 0
    renderResults(filtered)
  })

  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.cmd-result-item')
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1)
      items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
      items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = items[selectedIndex] as HTMLElement
      if (selected) {
        switchTool(selected.dataset.tool as ToolId)
        close()
      }
    } else if (e.key === 'Escape') {
      close()
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (overlay.classList.contains('hidden')) {
        open()
      } else {
        close()
      }
    }
  })

  $('#cmd-palette-trigger')?.addEventListener('click', open)
}

async function init(): Promise<void> {
  initSidebar()
  initCommandPalette()
  await switchTool('home')

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
}

init()
