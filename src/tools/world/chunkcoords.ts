import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

class JavaRandom {
  private seed: bigint

  constructor(seed: bigint) {
    this.seed = (seed ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n)
  }

  private next(bits: number): number {
    this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n)
    return Number(this.seed >> BigInt(48 - bits))
  }

  public nextInt(n: number): number {
    return Math.floor(Math.abs(this.next(31)) % n)
  }
}

export function isSlimeChunk(worldSeed: bigint, chunkX: number, chunkZ: number): boolean {
  const cX = BigInt(chunkX)
  const cZ = BigInt(chunkZ)
  
  const term1 = (cX * cX * 4987142n)
  const term2 = (cX * 5947611n)
  const term3 = (cZ * cZ * 4392871n)
  const term4 = (cZ * 389711n)
  
  const combinedSeed = (worldSeed + term1 + term2 + term3 + term4) ^ 987234911n
  const rng = new JavaRandom(combinedSeed)
  return rng.nextInt(10) === 0
}

interface ChunkCoordsState {
  blockX: number
  blockY: number
  blockZ: number
  seedInput: string
}

const state: ChunkCoordsState = {
  blockX: 1240,
  blockY: 64,
  blockZ: -850,
  seedInput: '1234567890',
}

export function mount(container: HTMLElement): void {
  function getMath() {
    const bx = state.blockX
    const by = state.blockY
    const bz = state.blockZ

    const cx = Math.floor(bx / 16)
    const cy = Math.floor(by / 16)
    const cz = Math.floor(bz / 16)

    const rx = Math.floor(cx / 32)
    const rz = Math.floor(cz / 32)
    const regionFile = `r.${rx}.${rz}.mca`

    const chunkInRegionX = ((cx % 32) + 32) % 32
    const chunkInRegionZ = ((cz % 32) + 32) % 32

    const blockInChunkX = ((bx % 16) + 16) % 16
    const blockInChunkZ = ((bz % 16) + 16) % 16

    let worldSeed = 0n
    try {
      worldSeed = BigInt(state.seedInput.trim())
    } catch {
      let hash = 0n
      for (let i = 0; i < state.seedInput.length; i++) {
        hash = (hash * 31n + BigInt(state.seedInput.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn
      }
      worldSeed = hash
    }

    const isCurrentSlime = isSlimeChunk(worldSeed, cx, cz)

    return {
      bx, by, bz,
      cx, cy, cz,
      rx, rz, regionFile,
      chunkInRegionX, chunkInRegionZ,
      blockInChunkX, blockInChunkZ,
      worldSeed,
      isCurrentSlime,
    }
  }

  function renderRadar(m: ReturnType<typeof getMath>): string {
    const range = 2
    let gridHtml = ''

    for (let dz = -range; dz <= range; dz++) {
      for (let dx = -range; dx <= range; dx++) {
        const curCx = m.cx + dx
        const curCz = m.cz + dz
        const isSlime = isSlimeChunk(m.worldSeed, curCx, curCz)
        const isCenter = dx === 0 && dz === 0

        gridHtml += `
          <div class="chunk-radar-cell ${isSlime ? 'slime' : ''} ${isCenter ? 'center' : ''}" title="Chunk [${curCx}, ${curCz}]: ${isSlime ? 'SLIME CHUNK' : 'Normal'}">
            ${isCenter ? '<span class="player-dot">●</span>' : isSlime ? '🟩' : ''}
          </div>
        `
      }
    }

    return gridHtml
  }

  function update(): void {
    const m = getMath()

    const chunkVal = document.getElementById('cc-chunk-val')
    const regionVal = document.getElementById('cc-region-val')
    const offsetVal = document.getElementById('cc-offset-val')
    const slimeStatus = document.getElementById('cc-slime-status')
    const radarGrid = document.getElementById('cc-radar-grid')

    if (chunkVal) chunkVal.textContent = `[${m.cx}, ${m.cy}, ${m.cz}]`
    if (regionVal) regionVal.textContent = m.regionFile
    if (offsetVal) offsetVal.textContent = `Chunk in Region: [${m.chunkInRegionX}, ${m.chunkInRegionZ}] | Block in Chunk: [${m.blockInChunkX}, ${m.blockInChunkZ}]`

    if (slimeStatus) {
      slimeStatus.innerHTML = m.isCurrentSlime
        ? `<span class="badge badge-success" style="font-size: 0.85rem; padding: 4px 10px;">🟩 SLIME CHUNK DETECTED (Below Y=40)</span>`
        : `<span class="badge badge-subtle" style="font-size: 0.85rem; padding: 4px 10px;">❌ Regular Chunk (No Slime Spawns)</span>`
    }

    if (radarGrid) {
      radarGrid.innerHTML = renderRadar(m)
    }
  }

  const debouncedUpdate = debounce(update, 30)

  container.innerHTML = `
    <div class="split-view">
      <!-- Input Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Chunk & Region Coordinates Math</span>
        </div>
        <div class="panel-body">
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Block X</label>
              <input type="number" id="cc-bx" class="form-input" value="${state.blockX}" />
            </div>
            <div class="form-group">
              <label class="form-label">Block Y</label>
              <input type="number" id="cc-by" class="form-input" value="${state.blockY}" />
            </div>
            <div class="form-group">
              <label class="form-label">Block Z</label>
              <input type="number" id="cc-bz" class="form-input" value="${state.blockZ}" />
            </div>
          </div>

          <div class="form-divider"></div>

          <div class="form-group">
            <label class="form-label">World Seed (For Slime Chunk Detection)</label>
            <input type="text" id="cc-seed" class="form-input" value="${state.seedInput}" placeholder="Enter numerical seed or text phrase" />
            <span class="field-desc" style="font-size: 0.74rem; color: var(--text-tertiary); margin-top: 4px; display: block;">Java Edition uses world seed + chunk coordinates with standard 10% RNG probability.</span>
          </div>

          <div class="output-block" style="margin-top: 14px;">
            <div class="output-header">
              <span class="output-label">Slime Chunk Radar (5×5 Area)</span>
            </div>
            <div class="chunk-radar-container" id="cc-radar-grid"></div>
          </div>
        </div>
      </div>

      <!-- Calculation Results -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Calculated File & Memory Offsets</span>
        </div>
        <div class="panel-body">
          <div id="cc-slime-status" style="margin-bottom: 16px;"></div>

          <div class="stat-card" style="margin-bottom: 12px; cursor: pointer;" id="cc-copy-chunk" title="Click to copy chunk coordinates">
            <span class="stat-label">Chunk Coordinates [cX, cY, cZ] (Click to copy)</span>
            <span class="stat-value text-accent-red" id="cc-chunk-val">[77, 4, -54]</span>
          </div>

          <div class="stat-card" style="margin-bottom: 12px; cursor: pointer;" id="cc-copy-region" title="Click to copy region file name">
            <span class="stat-label">Anvil Region File (Click to copy)</span>
            <span class="stat-value text-accent-gold" id="cc-region-val">r.2.-2.mca</span>
          </div>

          <div class="stat-card" style="margin-bottom: 12px;">
            <span class="stat-label">Offsets (Within Region & Chunk)</span>
            <span class="stat-value" id="cc-offset-val" style="font-size: 0.88rem; font-family: var(--font-mono);">-</span>
          </div>

          <div class="about-hero" style="margin-top: 18px; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <strong style="font-size: 0.82rem; color: var(--text-primary); display: block; margin-bottom: 4px;">💡 Technical Insights:</strong>
            <p style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
              • Each <strong>Region file (.mca)</strong> contains 32×32 = 1,024 chunks (512×512 blocks).<br/>
              • Slimes spawn in slime chunks below <strong>Y = 40</strong> regardless of light levels.<br/>
              • Inhabited time accumulates when players load chunks, scaling local mob difficulty.
            </p>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('cc-bx')?.addEventListener('input', (e) => {
    state.blockX = parseInt((e.target as HTMLInputElement).value) || 0
    debouncedUpdate()
  })

  document.getElementById('cc-by')?.addEventListener('input', (e) => {
    state.blockY = parseInt((e.target as HTMLInputElement).value) || 0
    debouncedUpdate()
  })

  document.getElementById('cc-bz')?.addEventListener('input', (e) => {
    state.blockZ = parseInt((e.target as HTMLInputElement).value) || 0
    debouncedUpdate()
  })

  document.getElementById('cc-seed')?.addEventListener('input', (e) => {
    state.seedInput = (e.target as HTMLInputElement).value
    debouncedUpdate()
  })

  document.getElementById('cc-copy-chunk')?.addEventListener('click', async () => {
    const chunkText = document.getElementById('cc-chunk-val')?.textContent || ''
    await copyToClipboard(chunkText)
    showToast('Chunk coordinates copied!')
  })

  document.getElementById('cc-copy-region')?.addEventListener('click', async () => {
    const regionText = document.getElementById('cc-region-val')?.textContent || ''
    await copyToClipboard(regionText)
    showToast('Region filename copied!')
  })

  update()
}
