import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface SoundDef {
  id: string
  name: string
  category: string
  desc: string
}

const VANILLA_SOUNDS: SoundDef[] = [
  { id: 'entity.experience_orb.pickup', name: 'XP Orb Pickup', category: 'player', desc: 'Ding chime when collecting XP' },
  { id: 'entity.player.levelup', name: 'Level Up', category: 'player', desc: 'Triumphant level up trumpet' },
  { id: 'item.totem.use', name: 'Totem of Undying', category: 'player', desc: 'Totem resurrection blast' },
  { id: 'ui.toast.challenge_complete', name: 'Challenge Complete', category: 'master', desc: 'Advancement achievement fanfare' },
  { id: 'block.bell.resonate', name: 'Bell Resonate', category: 'block', desc: 'Raid bell pulse & glow' },
  { id: 'block.beacon.activate', name: 'Beacon Activate', category: 'block', desc: 'Pyramid power beam ignition' },
  { id: 'block.beacon.ambient', name: 'Beacon Hum', category: 'ambient', desc: 'Continuous beacon crystal drone' },
  { id: 'block.respawn_anchor.charge', name: 'Respawn Anchor Charge', category: 'block', desc: 'Glowstone charging sound' },
  { id: 'block.vault.open_shutter', name: 'Vault Open', category: 'block', desc: 'Trial vault lock opening (1.21)' },
  { id: 'block.trial_spawner.spawn_mob', name: 'Trial Spawner Spawn', category: 'hostile', desc: 'Trial mob spawn wave (1.21)' },
  { id: 'entity.warden.sonic_boom', name: 'Warden Sonic Boom', category: 'hostile', desc: 'Devastating warden beam attack' },
  { id: 'entity.warden.heartbeat', name: 'Warden Heartbeat', category: 'hostile', desc: 'Deep pulsating terror heartbeat' },
  { id: 'entity.wither.spawn', name: 'Wither Spawn', category: 'hostile', desc: 'Server-wide wither boss explosion' },
  { id: 'entity.wither.death', name: 'Wither Death', category: 'hostile', desc: 'Wither boss destruction roar' },
  { id: 'entity.ender_dragon.growl', name: 'Dragon Growl', category: 'hostile', desc: 'Ender Dragon swoop and roar' },
  { id: 'entity.lightning_bolt.thunder', name: 'Thunder Strike', category: 'weather', desc: 'Heavy lightning crack and rumble' },
  { id: 'ambient.cave', name: 'Cave Ambient Sound', category: 'ambient', desc: 'Spooky underground drone' },
  { id: 'music_disc.pigstep', name: 'Pigstep Music Disc', category: 'record', desc: 'Lena Raine Pigstep Nether track' },
  { id: 'music_disc.otherside', name: 'Otherside Music Disc', category: 'record', desc: 'Lena Raine Otherside track' },
  { id: 'entity.villager.trade', name: 'Villager Trade Yes', category: 'neutral', desc: 'Villager joyful trade sound' },
  { id: 'entity.villager.no', name: 'Villager No Trade', category: 'neutral', desc: 'Villager refuse trade sound' },
  { id: 'entity.creeper.primed', name: 'Creeper Hiss', category: 'hostile', desc: 'Ssssss fuse countdown' },
  { id: 'block.anvil.land', name: 'Anvil Crash', category: 'block', desc: 'Heavy anvil metallic clang' },
  { id: 'entity.firework_rocket.blast', name: 'Firework Blast', category: 'ambient', desc: 'Colorful firework pop explosion' },
  { id: 'entity.generic.explode', name: 'TNT Explosion', category: 'block', desc: 'Standard blast explosion' },
]

interface SoundState {
  search: string
  selectedSound: string
  source: string
  target: string
  pos: string
  volume: number
  pitch: number
  minVolume: number
}

const state: SoundState = {
  search: '',
  selectedSound: 'entity.experience_orb.pickup',
  source: 'player',
  target: '@a',
  pos: '~ ~ ~',
  volume: 1.0,
  pitch: 1.0,
  minVolume: 0.0,
}

function buildPlaysoundCommand(): string {
  const parts = [
    '/playsound',
    state.selectedSound,
    state.source,
    state.target || '@a',
    state.pos || '~ ~ ~',
    state.volume.toFixed(1),
    state.pitch.toFixed(1),
  ]
  if (state.minVolume > 0) parts.push(state.minVolume.toFixed(1))
  return parts.join(' ')
}

export function mount(container: HTMLElement): void {
  function renderOutput(): void {
    const outEl = document.getElementById('snd-cmd-out')
    if (outEl) outEl.textContent = buildPlaysoundCommand()
  }

  function renderList(): void {
    const listEl = document.getElementById('snd-catalog-list')
    if (!listEl) return

    const query = state.search.toLowerCase()
    const filtered = VANILLA_SOUNDS.filter(s =>
      s.id.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query) ||
      s.desc.toLowerCase().includes(query)
    )

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-tertiary); font-size:0.82rem;">No matching sound events found.</div>`
      return
    }

    listEl.innerHTML = filtered.map(s => {
      const isSelected = s.id === state.selectedSound
      return `
        <div class="sm-pin-item ${isSelected ? 'active' : ''}" style="cursor:pointer; padding:8px 10px; ${isSelected ? 'border-color:var(--accent-red); background:var(--bg-elevated);' : ''}" data-sound-id="${s.id}">
          <div>
            <div style="font-weight:600; font-size:0.85rem; color:${isSelected ? 'var(--accent-red)' : '#ffffff'};">${s.name}</div>
            <div class="font-mono" style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${s.id}</div>
            <div style="font-size:0.72rem; color:var(--text-tertiary); margin-top:2px;">${s.desc} • <span class="badge" style="font-size:0.68rem;">${s.category}</span></div>
          </div>
          <button class="btn btn-sm btn-secondary snd-select-btn">Select</button>
        </div>
      `
    }).join('')

    listEl.querySelectorAll<HTMLElement>('[data-sound-id]').forEach(item => {
      item.addEventListener('click', () => {
        state.selectedSound = item.dataset.soundId!
        const found = VANILLA_SOUNDS.find(s => s.id === state.selectedSound)
        if (found) state.source = found.category
        const selSource = document.getElementById('snd-source') as HTMLSelectElement
        if (selSource) selSource.value = state.source
        renderList()
        renderOutput()
      })
    })
  }

  container.innerHTML = `
    <div class="split-view" style="grid-template-columns: 1fr 1fr;">
      <!-- Catalog Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Minecraft Sound Events</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <input type="text" id="snd-search" class="form-input" placeholder="Search sounds (e.g. wither, beacon, levelup, totem, chest, warden)..." value="${escapeHtml(state.search)}" />
          </div>

          <div id="snd-catalog-list" class="sm-pins-container" style="max-height: 440px;"></div>
        </div>
      </div>

      <!-- Controls & Command Output Column -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">/playsound Parameters</span>
        </div>
        <div class="panel-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Sound Source Channel</label>
              <select id="snd-source" class="form-select">
                <option value="master" ${state.source === 'master' ? 'selected' : ''}>master</option>
                <option value="player" ${state.source === 'player' ? 'selected' : ''}>player</option>
                <option value="block" ${state.source === 'block' ? 'selected' : ''}>block</option>
                <option value="hostile" ${state.source === 'hostile' ? 'selected' : ''}>hostile</option>
                <option value="neutral" ${state.source === 'neutral' ? 'selected' : ''}>neutral</option>
                <option value="ambient" ${state.source === 'ambient' ? 'selected' : ''}>ambient</option>
                <option value="voice" ${state.source === 'voice' ? 'selected' : ''}>voice</option>
                <option value="record" ${state.source === 'record' ? 'selected' : ''}>record</option>
                <option value="weather" ${state.source === 'weather' ? 'selected' : ''}>weather</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Target Selector</label>
              <input type="text" id="snd-target" class="form-input font-mono" value="${escapeHtml(state.target)}" placeholder="@a, @p, @s..." />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Position (Coordinates)</label>
            <input type="text" id="snd-pos" class="form-input font-mono" value="${escapeHtml(state.pos)}" placeholder="~ ~ ~ or X Y Z" />
          </div>

          <!-- Volume & Pitch Steppers / Sliders -->
          <div class="form-row-2">
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">Volume: <span id="snd-vol-val" class="font-mono">${state.volume.toFixed(1)}</span></label>
              </div>
              <input type="range" id="snd-vol" class="form-range" min="0.1" max="4.0" step="0.1" value="${state.volume}" />
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">Pitch: <span id="snd-pitch-val" class="font-mono">${state.pitch.toFixed(1)}</span></label>
              </div>
              <input type="range" id="snd-pitch" class="form-range" min="0.0" max="2.0" step="0.1" value="${state.pitch}" />
            </div>
          </div>

          <div class="output-block" style="margin-top:20px;">
            <div class="output-header">
              <span class="output-label">Generated /playsound Command</span>
              <button class="btn btn-copy" id="snd-copy-btn">Copy Command</button>
            </div>
            <div class="output-code" id="snd-cmd-out"></div>
          </div>
        </div>
      </div>
    </div>
  `

  renderList()
  renderOutput()

  document.getElementById('snd-search')?.addEventListener('input', (e) => {
    state.search = (e.target as HTMLInputElement).value
    renderList()
  })

  document.getElementById('snd-source')?.addEventListener('change', (e) => {
    state.source = (e.target as HTMLSelectElement).value
    renderOutput()
  })

  document.getElementById('snd-target')?.addEventListener('input', (e) => {
    state.target = (e.target as HTMLInputElement).value
    renderOutput()
  })

  document.getElementById('snd-pos')?.addEventListener('input', (e) => {
    state.pos = (e.target as HTMLInputElement).value
    renderOutput()
  })

  document.getElementById('snd-vol')?.addEventListener('input', (e) => {
    state.volume = parseFloat((e.target as HTMLInputElement).value)
    const lbl = document.getElementById('snd-vol-val')
    if (lbl) lbl.textContent = state.volume.toFixed(1)
    renderOutput()
  })

  document.getElementById('snd-pitch')?.addEventListener('input', (e) => {
    state.pitch = parseFloat((e.target as HTMLInputElement).value)
    const lbl = document.getElementById('snd-pitch-val')
    if (lbl) lbl.textContent = state.pitch.toFixed(1)
    renderOutput()
  })

  document.getElementById('snd-copy-btn')?.addEventListener('click', async () => {
    await copyToClipboard(buildPlaysoundCommand())
    showToast('Copied /playsound command to clipboard!')
  })
}
