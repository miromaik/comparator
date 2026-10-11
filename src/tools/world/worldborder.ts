export function renderWorldBorder(container: HTMLElement) {
  container.innerHTML = `
    <div class="tool-content fade-in">
      <div class="tool-header">
        <div class="tool-badge">World & Geometry</div>
        <h2>WorldBorder & Pre-gen Planner</h2>
        <p class="tool-desc">Configure Minecraft world borders, calculate chunk & region storage requirements, and generate vanilla & Chunky pre-generation commands.</p>
      </div>

      <div class="generator-layout">
        <!-- Settings Column -->
        <div class="config-column">
          <div class="panel">
            <h3 class="panel-title">Border Parameters</h3>

            <div class="form-row">
              <div class="form-group">
                <label>Center X</label>
                <input type="number" id="wb-center-x" value="0" class="input">
              </div>
              <div class="form-group">
                <label>Center Z</label>
                <input type="number" id="wb-center-z" value="0" class="input">
              </div>
            </div>

            <div class="form-group">
              <label>Border Size / Diameter (blocks)</label>
              <div class="input-unit">
                <input type="number" id="wb-size" value="10000" min="1" max="60000000" class="input">
                <span class="unit-label">blocks</span>
              </div>
              <div class="presets-row mt-2">
                <button class="btn-chip" data-size="2000">Small (2k)</button>
                <button class="btn-chip" data-size="10000">Medium (10k)</button>
                <button class="btn-chip" data-size="25000">Large (25k)</button>
                <button class="btn-chip" data-size="50000">SMP (50k)</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Warning Distance</label>
                <input type="number" id="wb-warning-dist" value="5" min="0" class="input">
              </div>
              <div class="form-group">
                <label>Warning Time (sec)</label>
                <input type="number" id="wb-warning-time" value="15" min="0" class="input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Damage Buffer (blocks)</label>
                <input type="number" id="wb-dmg-buffer" value="5" min="0" class="input">
              </div>
              <div class="form-group">
                <label>Damage Rate (pts/blk)</label>
                <input type="number" id="wb-dmg-amount" value="0.2" min="0" step="0.1" class="input">
              </div>
            </div>
          </div>

          <div class="panel mt-4">
            <h3 class="panel-title">Pre-generation Estimator</h3>
            <div class="form-group">
              <label>Avg Chunk Disk Footprint</label>
              <select id="wb-chunk-size" class="input">
                <option value="5.2">Standard Overworld (1.18+ Caves & Cliffs ~ 5.2 KB)</option>
                <option value="3.5">Nether Dimension (~ 3.5 KB)</option>
                <option value="2.1">The End Dimension (~ 2.1 KB)</option>
                <option value="8.0">Modded / Heavy Biomes (~ 8.0 KB)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Server Gen Speed</label>
              <select id="wb-gen-speed" class="input">
                <option value="150">Budget VPS (~ 150 chunks/sec)</option>
                <option value="350" selected>Modern Dedicated CPU (~ 350 chunks/sec)</option>
                <option value="750">High-End Threadripper/Ryzen 9 (~ 750 chunks/sec)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Output & Visualizer Column -->
        <div class="preview-column">
          <div class="panel">
            <h3 class="panel-title">Border Boundaries & Storage Math</h3>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Radius</div>
                <div class="stat-value" id="stat-radius">5,000 blocks</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Area</div>
                <div class="stat-value" id="stat-area">100 km²</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Chunks</div>
                <div class="stat-value" id="stat-chunks">390,625</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Region Files (.mca)</div>
                <div class="stat-value" id="stat-regions">382 files</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Est. Disk Space</div>
                <div class="stat-value font-highlight" id="stat-disk">1.94 GB</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Est. Pre-gen Time</div>
                <div class="stat-value" id="stat-time">~18 mins</div>
              </div>
            </div>

            <div class="info-card mt-3">
              <div class="info-row">
                <span>Coordinate Bounds:</span>
                <strong id="stat-bounds">X: -5,000 to +5,000 | Z: -5,000 to +5,000</strong>
              </div>
              <div class="info-row">
                <span>Chunk Bounds:</span>
                <strong id="stat-chunk-bounds">CX: -313 to +312 | CZ: -313 to +312</strong>
              </div>
              <div class="info-row">
                <span>Region Bounds:</span>
                <strong id="stat-mca-bounds">r.-10.-10.mca to r.9.9.mca</strong>
              </div>
            </div>

            <!-- Visual Minimap -->
            <div class="canvas-wrapper mt-3" style="height: 200px; display: flex; justify-content: center; align-items: center; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color); position: relative; overflow: hidden;">
              <canvas id="wb-canvas" width="360" height="190" style="width: 100%; height: 100%;"></canvas>
            </div>
          </div>

          <div class="panel mt-4">
            <div class="panel-header-inline">
              <h3 class="panel-title">Vanilla Commands</h3>
              <button class="btn btn-secondary btn-sm" id="btn-copy-vanilla">Copy Commands</button>
            </div>
            <pre class="code-preview" id="preview-vanilla"></pre>

            <div class="panel-header-inline mt-3">
              <h3 class="panel-title">Chunky Plugin Commands</h3>
              <button class="btn btn-secondary btn-sm" id="btn-copy-chunky">Copy Chunky</button>
            </div>
            <pre class="code-preview" id="preview-chunky"></pre>
          </div>
        </div>
      </div>
    </div>
  `

  const inputCenterX = container.querySelector('#wb-center-x') as HTMLInputElement
  const inputCenterZ = container.querySelector('#wb-center-z') as HTMLInputElement
  const inputSize = container.querySelector('#wb-size') as HTMLInputElement
  const inputWarningDist = container.querySelector('#wb-warning-dist') as HTMLInputElement
  const inputWarningTime = container.querySelector('#wb-warning-time') as HTMLInputElement
  const inputDmgBuffer = container.querySelector('#wb-dmg-buffer') as HTMLInputElement
  const inputDmgAmount = container.querySelector('#wb-dmg-amount') as HTMLInputElement
  const selectChunkSize = container.querySelector('#wb-chunk-size') as HTMLSelectElement
  const selectGenSpeed = container.querySelector('#wb-gen-speed') as HTMLSelectElement

  const statRadius = container.querySelector('#stat-radius') as HTMLElement
  const statArea = container.querySelector('#stat-area') as HTMLElement
  const statChunks = container.querySelector('#stat-chunks') as HTMLElement
  const statRegions = container.querySelector('#stat-regions') as HTMLElement
  const statDisk = container.querySelector('#stat-disk') as HTMLElement
  const statTime = container.querySelector('#stat-time') as HTMLElement
  const statBounds = container.querySelector('#stat-bounds') as HTMLElement
  const statChunkBounds = container.querySelector('#stat-chunk-bounds') as HTMLElement
  const statMcaBounds = container.querySelector('#stat-mca-bounds') as HTMLElement
  const previewVanilla = container.querySelector('#preview-vanilla') as HTMLElement
  const previewChunky = container.querySelector('#preview-chunky') as HTMLElement
  const canvas = container.querySelector('#wb-canvas') as HTMLCanvasElement

  function update() {
    const cx = parseInt(inputCenterX.value) || 0
    const cz = parseInt(inputCenterZ.value) || 0
    const size = Math.max(1, parseInt(inputSize.value) || 1000)
    const warnDist = Math.max(0, parseInt(inputWarningDist.value) || 5)
    const warnTime = Math.max(0, parseInt(inputWarningTime.value) || 15)
    const dmgBuffer = Math.max(0, parseInt(inputDmgBuffer.value) || 5)
    const dmgAmt = parseFloat(inputDmgAmount.value) || 0.2
    const chunkKb = parseFloat(selectChunkSize.value) || 5.2
    const genSpeed = parseInt(selectGenSpeed.value) || 350

    const radius = Math.floor(size / 2)
    const minX = cx - radius
    const maxX = cx + radius
    const minZ = cz - radius
    const maxZ = cz + radius

    const minChunkX = Math.floor(minX / 16)
    const maxChunkX = Math.floor(maxX / 16)
    const minChunkZ = Math.floor(minZ / 16)
    const maxChunkZ = Math.floor(maxZ / 16)

    const chunksX = Math.ceil(size / 16)
    const chunksZ = Math.ceil(size / 16)
    const totalChunks = chunksX * chunksZ

    const minRegX = Math.floor(minChunkX / 32)
    const maxRegX = Math.floor(maxChunkX / 32)
    const minRegZ = Math.floor(minChunkZ / 32)
    const maxRegZ = Math.floor(maxChunkZ / 32)
    const regionsCount = (maxRegX - minRegX + 1) * (maxRegZ - minRegZ + 1)

    const estBytes = totalChunks * chunkKb * 1024
    let diskText = ''
    if (estBytes > 1024 * 1024 * 1024) {
      diskText = `${(estBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else {
      diskText = `${(estBytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const totalSeconds = Math.round(totalChunks / genSpeed)
    let timeText = ''
    if (totalSeconds < 60) {
      timeText = `~${totalSeconds}s`
    } else if (totalSeconds < 3600) {
      timeText = `~${Math.round(totalSeconds / 60)} min`
    } else {
      const hrs = Math.floor(totalSeconds / 3600)
      const mins = Math.round((totalSeconds % 3600) / 60)
      timeText = `~${hrs}h ${mins}m`
    }

    statRadius.textContent = `${radius.toLocaleString()} blocks`
    statArea.textContent = `${((size * size) / 1_000_000).toFixed(1)} km²`
    statChunks.textContent = totalChunks.toLocaleString()
    statRegions.textContent = `${regionsCount.toLocaleString()} files`
    statDisk.textContent = diskText
    statTime.textContent = timeText

    statBounds.textContent = `X: [${minX.toLocaleString()} .. ${maxX.toLocaleString()}] | Z: [${minZ.toLocaleString()} .. ${maxZ.toLocaleString()}]`
    statChunkBounds.textContent = `CX: [${minChunkX} .. ${maxChunkX}] | CZ: [${minChunkZ} .. ${maxChunkZ}]`
    statMcaBounds.textContent = `r.${minRegX}.${minRegZ}.mca to r.${maxRegX}.${maxRegZ}.mca`

    const vanillaCmds = [
      `/worldborder center ${cx} ${cz}`,
      `/worldborder set ${size}`,
      `/worldborder warning distance ${warnDist}`,
      `/worldborder warning time ${warnTime}`,
      `/worldborder damage buffer ${dmgBuffer}`,
      `/worldborder damage amount ${dmgAmt}`
    ].join('\n')
    previewVanilla.textContent = vanillaCmds

    const chunkyCmds = [
      `# Chunky Pre-generation commands`,
      `chunky world overworld`,
      `chunky shape square`,
      `chunky center ${cx} ${cz}`,
      `chunky radius ${radius}`,
      `chunky start`
    ].join('\n')
    previewChunky.textContent = chunkyCmds

    drawMap(cx, cz, radius, warnDist)
  }

  function drawMap(cx: number, cz: number, r: number, warnDist: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0a0d13'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = '#1e2638'
    ctx.lineWidth = 1
    const gridSize = 30
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    const midX = w / 2
    const midY = h / 2

    const borderBoxSize = Math.min(w - 60, h - 40)
    const left = midX - borderBoxSize / 2
    const top = midY - borderBoxSize / 2

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'
    ctx.fillRect(0, 0, w, top)
    ctx.fillRect(0, top + borderBoxSize, w, h - (top + borderBoxSize))
    ctx.fillRect(0, top, left, borderBoxSize)
    ctx.fillRect(left + borderBoxSize, top, w - (left + borderBoxSize), borderBoxSize)

    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2
    ctx.strokeRect(left, top, borderBoxSize, borderBoxSize)

    const warnRatio = Math.min(20, Math.max(4, (warnDist / (r || 1)) * borderBoxSize))
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(left + warnRatio, top + warnRatio, borderBoxSize - warnRatio * 2, borderBoxSize - warnRatio * 2)
    ctx.setLineDash([])

    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(midX - 6, midY)
    ctx.lineTo(midX + 6, midY)
    ctx.moveTo(midX, midY - 6)
    ctx.lineTo(midX, midY + 6)
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Center (${cx}, ${cz})`, midX, midY + 16)
    ctx.fillText(`Border ${r * 2} x ${r * 2}`, midX, top - 6)
  }

  [inputCenterX, inputCenterZ, inputSize, inputWarningDist, inputWarningTime, inputDmgBuffer, inputDmgAmount, selectChunkSize, selectGenSpeed].forEach(el => {
    el.addEventListener('input', update)
  })

  container.querySelectorAll('.btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const sz = btn.getAttribute('data-size')
      if (sz) {
        inputSize.value = sz
        update()
      }
    })
  })

  container.querySelector('#btn-copy-vanilla')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewVanilla.textContent || '')
    showToast('Vanilla commands copied to clipboard!')
  })

  container.querySelector('#btn-copy-chunky')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewChunky.textContent || '')
    showToast('Chunky pregen commands copied!')
  })

  function showToast(msg: string) {
    const toast = document.createElement('div')
    toast.className = 'toast show'
    toast.textContent = msg
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }

  update()
}

export const mount = renderWorldBorder
