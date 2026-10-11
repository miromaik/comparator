import { debounce } from '../../utils/helpers'

type ShapeMode = 'circle' | 'ellipse' | 'sphere' | 'dome'
type FillMode = 'hollow' | 'filled' | 'thick'

interface CircleState {
  mode: ShapeMode
  fill: FillMode
  dimX: number
  dimZ: number
  dimY: number
  currentLayer: number
  zoom: number
  linkXZ: boolean
}

const state: CircleState = {
  mode: 'circle',
  fill: 'hollow',
  dimX: 21,
  dimZ: 21,
  dimY: 21,
  currentLayer: 11,
  zoom: 1,
  linkXZ: true,
}

function generateSliceGrid(width: number, depth: number, fill: FillMode): boolean[][] {
  const rx = width / 2
  const rz = depth / 2
  const grid: boolean[][] = []

  for (let z = 0; z < depth; z++) {
    grid[z] = []
    for (let x = 0; x < width; x++) {
      const dx = (x + 0.5) - rx
      const dz = (z + 0.5) - rz

      const dist = (dx * dx) / (rx * rx) + (dz * dz) / (rz * rz)

      if (dist <= 1.0) {
        if (fill === 'filled') {
          grid[z][x] = true
        } else {
          const innerMargin = fill === 'thick' ? 2 : 1
          const innerRx = Math.max(0.5, rx - innerMargin)
          const innerRz = Math.max(0.5, rz - innerMargin)
          const innerDist = (dx * dx) / (innerRx * innerRx) + (dz * dz) / (innerRz * innerRz)

          grid[z][x] = innerDist > 1.0
        }
      } else {
        grid[z][x] = false
      }
    }
  }

  return grid
}

function getLayerDimensions(state: CircleState): { width: number; depth: number; totalLayers: number } {
  if (state.mode === 'circle' || state.mode === 'ellipse') {
    return { width: state.dimX, depth: state.dimZ, totalLayers: 1 }
  }

  const height = state.mode === 'dome' ? Math.ceil(state.dimX / 2) : state.dimX
  const totalLayers = height
  const layerIndex = Math.min(Math.max(1, state.currentLayer), totalLayers)

  const radius = state.dimX / 2
  let dy: number

  if (state.mode === 'dome') {
    dy = (layerIndex - 0.5)
  } else {
    dy = (layerIndex - 0.5) - radius
  }

  const radSliceSq = Math.max(0, radius * radius - dy * dy)
  const radSlice = Math.sqrt(radSliceSq)
  const sliceDiameter = Math.max(1, Math.round(radSlice * 2))

  return { width: sliceDiameter, depth: sliceDiameter, totalLayers }
}

export function mount(container: HTMLElement): void {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  function countLayerBlocks(grid: boolean[][]): number {
    let count = 0
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) count++
      }
    }
    return count
  }

  function renderCanvas(): void {
    if (!canvas || !ctx) return

    const { width: sliceW, depth: sliceD, totalLayers } = getLayerDimensions(state)
    const grid = generateSliceGrid(sliceW, sliceD, state.fill)
    const count = countLayerBlocks(grid)

    const countEl = document.getElementById('c-layer-blocks')
    const layerNumEl = document.getElementById('c-layer-num')
    const slider = document.getElementById('c-layer-slider') as HTMLInputElement

    if (countEl) countEl.textContent = `${count} blocks`
    if (layerNumEl) layerNumEl.textContent = `Layer ${state.currentLayer} / ${totalLayers}`
    if (slider) {
      slider.max = String(totalLayers)
      slider.value = String(state.currentLayer)
    }

    const maxDim = Math.max(state.dimX, state.dimZ)
    const cellSize = Math.max(8, Math.min(28, Math.floor(380 / maxDim))) * state.zoom
    const canvasWidth = (maxDim + 4) * cellSize
    const canvasHeight = (maxDim + 4) * cellSize

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.fillStyle = '#0f0f16'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const offsetX = Math.floor((maxDim - sliceW) / 2 + 2) * cellSize
    const offsetZ = Math.floor((maxDim - sliceD) / 2 + 2) * cellSize

    ctx.strokeStyle = '#1b1b28'
    ctx.lineWidth = 1

    for (let x = 0; x <= maxDim + 4; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize, 0)
      ctx.lineTo(x * cellSize, canvasHeight)
      ctx.stroke()
    }
    for (let z = 0; z <= maxDim + 4; z++) {
      ctx.beginPath()
      ctx.moveTo(0, z * cellSize)
      ctx.lineTo(canvasWidth, z * cellSize)
      ctx.stroke()
    }

    const centerX = ((maxDim + 4) / 2) * cellSize
    const centerZ = ((maxDim + 4) / 2) * cellSize

    ctx.strokeStyle = '#ff333340'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, canvasHeight)
    ctx.moveTo(0, centerZ)
    ctx.lineTo(canvasWidth, centerZ)
    ctx.stroke()

    for (let z = 0; z < sliceD; z++) {
      for (let x = 0; x < sliceW; x++) {
        if (grid[z][x]) {
          const px = offsetX + x * cellSize
          const pz = offsetZ + z * cellSize

          ctx.fillStyle = '#ff3333'
          ctx.fillRect(px + 1, pz + 1, cellSize - 2, cellSize - 2)

          ctx.fillStyle = '#ff8888'
          ctx.fillRect(px + 1, pz + 1, cellSize - 2, Math.max(1, (cellSize - 2) * 0.25))
        }
      }
    }
  }

  const debouncedRender = debounce(renderCanvas, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Voxel Geometry Builder</span>
        </div>
        <div class="panel-body">
          <!-- Shape Selector -->
          <div class="form-group">
            <label class="form-label">Structure Geometry</label>
            <div class="btn-grid-4">
              <button class="toggle-btn ${state.mode === 'circle' ? 'active' : ''}" data-mode="circle">Circle 2D</button>
              <button class="toggle-btn ${state.mode === 'ellipse' ? 'active' : ''}" data-mode="ellipse">Ellipse 2D</button>
              <button class="toggle-btn ${state.mode === 'sphere' ? 'active' : ''}" data-mode="sphere">Sphere 3D</button>
              <button class="toggle-btn ${state.mode === 'dome' ? 'active' : ''}" data-mode="dome">Dome 3D</button>
            </div>
          </div>

          <!-- Dimensions -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="c-dim-x">Width / Diameter X</label>
              <input id="c-dim-x" class="input" type="number" value="${state.dimX}" min="3" max="128" />
            </div>
            <div class="form-group" id="c-group-dim-z">
              <label class="form-label" for="c-dim-z">Depth / Diameter Z</label>
              <input id="c-dim-z" class="input" type="number" value="${state.dimZ}" min="3" max="128" ${state.mode !== 'ellipse' ? 'disabled' : ''} />
            </div>
          </div>

          <!-- Fill Mode -->
          <div class="form-group">
            <label class="form-label">Fill & Wall Thickness</label>
            <div class="btn-grid-3">
              <button class="toggle-btn ${state.fill === 'hollow' ? 'active' : ''}" data-fill="hollow">Hollow (1-Wide)</button>
              <button class="toggle-btn ${state.fill === 'thick' ? 'active' : ''}" data-fill="thick">Thick (2-Wide)</button>
              <button class="toggle-btn ${state.fill === 'filled' ? 'active' : ''}" data-fill="filled">Solid Filled</button>
            </div>
          </div>

          <!-- 3D Layer Slider (visible for 3D) -->
          <div class="form-group" id="c-layer-group" style="${state.mode === 'circle' || state.mode === 'ellipse' ? 'display:none;' : ''}">
            <div class="form-label-row">
              <label class="form-label" for="c-layer-slider">3D Layer-by-Layer</label>
              <span class="range-badge" id="c-layer-num">Layer 11 / 21</span>
            </div>
            <div class="slider-row">
              <button class="btn btn-sm" id="c-prev-layer">◀</button>
              <input type="range" id="c-layer-slider" class="range-slider" min="1" max="21" value="${state.currentLayer}" />
              <button class="btn btn-sm" id="c-next-layer">▶</button>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-title">Current Layer Blocks</span>
              <span class="stat-val highlight-red" id="c-layer-blocks">56 blocks</span>
              <span class="stat-sub">Redstone outline</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Grid Canvas Size</span>
              <span class="stat-val">${state.dimX} × ${state.dimZ}</span>
              <span class="stat-sub">Voxel resolution</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Canvas -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Interactive Voxel Canvas</span>
          <div class="zoom-controls">
            <button class="btn btn-sm" id="c-zoom-out">−</button>
            <button class="btn btn-sm" id="c-zoom-reset">100%</button>
            <button class="btn btn-sm" id="c-zoom-in">+</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="canvas-container">
            <canvas id="c-canvas" class="voxel-canvas"></canvas>
          </div>
          <div class="canvas-footer-hint">
            <span>🔴 Red blocks = place blocks here • Center grid lines = coordinate (0,0)</span>
          </div>
        </div>
      </div>
    </div>
  `

  canvas = document.getElementById('c-canvas') as HTMLCanvasElement
  ctx = canvas?.getContext('2d')!

  const dimXInput = document.getElementById('c-dim-x') as HTMLInputElement
  const dimZInput = document.getElementById('c-dim-z') as HTMLInputElement
  const layerSlider = document.getElementById('c-layer-slider') as HTMLInputElement
  const layerGroup = document.getElementById('c-layer-group')!

  dimXInput.addEventListener('input', () => {
    const val = Math.max(3, Math.min(128, parseInt(dimXInput.value, 10) || 21))
    state.dimX = val
    if (state.mode !== 'ellipse') {
      state.dimZ = val
      dimZInput.value = String(val)
    }
    state.dimY = val
    state.currentLayer = Math.ceil(val / 2)
    debouncedRender()
  })

  dimZInput.addEventListener('input', () => {
    state.dimZ = Math.max(3, Math.min(128, parseInt(dimZInput.value, 10) || 21))
    debouncedRender()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.mode = btn.dataset.mode as ShapeMode

      const is3D = state.mode === 'sphere' || state.mode === 'dome'
      layerGroup.style.display = is3D ? 'block' : 'none'

      const isEllipse = state.mode === 'ellipse'
      dimZInput.disabled = !isEllipse
      if (!isEllipse) {
        state.dimZ = state.dimX
        dimZInput.value = String(state.dimX)
      }

      state.currentLayer = state.mode === 'dome' ? 1 : Math.ceil(state.dimX / 2)
      renderCanvas()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-fill]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.fill = btn.dataset.fill as FillMode
      renderCanvas()
    })
  })

  layerSlider?.addEventListener('input', () => {
    state.currentLayer = parseInt(layerSlider.value, 10)
    renderCanvas()
  })

  document.getElementById('c-prev-layer')?.addEventListener('click', () => {
    state.currentLayer = Math.max(1, state.currentLayer - 1)
    renderCanvas()
  })

  document.getElementById('c-next-layer')?.addEventListener('click', () => {
    const { totalLayers } = getLayerDimensions(state)
    state.currentLayer = Math.min(totalLayers, state.currentLayer + 1)
    renderCanvas()
  })

  document.getElementById('c-zoom-in')?.addEventListener('click', () => {
    state.zoom = Math.min(2.5, state.zoom + 0.25)
    renderCanvas()
  })
  document.getElementById('c-zoom-out')?.addEventListener('click', () => {
    state.zoom = Math.max(0.5, state.zoom - 0.25)
    renderCanvas()
  })
  document.getElementById('c-zoom-reset')?.addEventListener('click', () => {
    state.zoom = 1
    renderCanvas()
  })

  renderCanvas()
}
