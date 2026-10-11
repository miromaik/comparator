import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface Coords {
  x: number
  y: number
  z: number
}

function overworldToNether(coords: Coords): Coords {
  return { x: Math.floor(coords.x / 8), y: coords.y, z: Math.floor(coords.z / 8) }
}

function netherToOverworld(coords: Coords): Coords {
  return { x: coords.x * 8, y: coords.y, z: coords.z * 8 }
}

function portalSearchInfo(overworldCoords: Coords, netherCoords: Coords): string {
  const searchRadiusOverworld = 128
  const searchRadiusNether = 128

  const linkedNetherX = Math.floor(overworldCoords.x / 8)
  const linkedNetherZ = Math.floor(overworldCoords.z / 8)

  const distX = Math.abs(netherCoords.x - linkedNetherX)
  const distZ = Math.abs(netherCoords.z - linkedNetherZ)

  if (distX <= searchRadiusNether && distZ <= searchRadiusNether) {
    return `✓ Within safe linking range (${searchRadiusNether} blocks in Nether)`
  }

  return `⚠ Distance from ideal: ${distX}x, ${distZ}z - may link to wrong portal (search radius: ${searchRadiusOverworld} in Overworld, ${searchRadiusNether} in Nether)`
}

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="split-view">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Coordinates</span>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Direction</label>
            <div class="toggle-group">
              <button class="toggle-btn active" id="nether-dir-ow" data-dir="overworld-to-nether">Overworld → Nether</button>
              <button class="toggle-btn" id="nether-dir-neth" data-dir="nether-to-overworld">Nether → Overworld</button>
            </div>
          </div>

          <div class="form-group">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="form-label" style="margin:0" id="nether-source-label">
                <span class="dimension-tag overworld">🌿 Overworld</span>
              </span>
            </div>
            <div class="coord-grid">
              <div class="coord-input-group">
                <label class="form-label">X</label>
                <input id="nether-x" class="form-input" type="number" value="1000" />
              </div>
              <div class="coord-input-group">
                <label class="form-label">Y</label>
                <input id="nether-y" class="form-input" type="number" value="64" />
              </div>
              <div class="coord-input-group">
                <label class="form-label">Z</label>
                <input id="nether-z" class="form-input" type="number" value="-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Result</span>
        </div>
        <div class="panel-body">
          <div style="margin-bottom:12px" id="nether-target-label">
            <span class="dimension-tag nether">🔥 Nether</span>
          </div>

          <div class="result-grid" id="nether-results">
            <div class="result-card">
              <div class="result-label">X</div>
              <div class="result-value" id="nether-rx">125</div>
            </div>
            <div class="result-card">
              <div class="result-label">Y</div>
              <div class="result-value" id="nether-ry">64</div>
            </div>
            <div class="result-card">
              <div class="result-label">Z</div>
              <div class="result-value" id="nether-rz">-63</div>
            </div>
          </div>

          <div class="conversion-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5-5 5 5M7 14l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Teleport Command</span>
              <button class="btn btn-copy" id="nether-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="nether-command"></div>
          </div>

          <div id="nether-portal-info" class="warning-box" style="display:none"></div>
        </div>
      </div>
    </div>
  `

  let direction: 'overworld-to-nether' | 'nether-to-overworld' = 'overworld-to-nether'

  function calculate(): void {
    const x = parseFloat((document.getElementById('nether-x') as HTMLInputElement).value) || 0
    const y = parseFloat((document.getElementById('nether-y') as HTMLInputElement).value) || 64
    const z = parseFloat((document.getElementById('nether-z') as HTMLInputElement).value) || 0

    const source: Coords = { x, y, z }
    const result = direction === 'overworld-to-nether'
      ? overworldToNether(source)
      : netherToOverworld(source)

    document.getElementById('nether-rx')!.textContent = result.x.toString()
    document.getElementById('nether-ry')!.textContent = result.y.toString()
    document.getElementById('nether-rz')!.textContent = result.z.toString()

    const dim = direction === 'overworld-to-nether' ? 'the_nether' : 'overworld'
    document.getElementById('nether-command')!.textContent =
      `/execute in minecraft:${dim} run tp @s ${result.x} ${result.y} ${result.z}`

    const portalInfo = document.getElementById('nether-portal-info')!
    if (direction === 'overworld-to-nether') {
      const info = portalSearchInfo(source, result)
      portalInfo.textContent = info
      portalInfo.style.display = 'flex'
    } else {
      portalInfo.style.display = 'none'
    }
  }

  const debouncedCalc = debounce(calculate, 50)

  const dirOw = document.getElementById('nether-dir-ow')!
  const dirNeth = document.getElementById('nether-dir-neth')!
  const sourceLabel = document.getElementById('nether-source-label')!
  const targetLabel = document.getElementById('nether-target-label')!

  dirOw.addEventListener('click', () => {
    direction = 'overworld-to-nether'
    dirOw.classList.add('active')
    dirNeth.classList.remove('active')
    sourceLabel.innerHTML = '<span class="dimension-tag overworld">🌿 Overworld</span>'
    targetLabel.innerHTML = '<span class="dimension-tag nether">🔥 Nether</span>'
    calculate()
  })

  dirNeth.addEventListener('click', () => {
    direction = 'nether-to-overworld'
    dirNeth.classList.add('active')
    dirOw.classList.remove('active')
    sourceLabel.innerHTML = '<span class="dimension-tag nether">🔥 Nether</span>'
    targetLabel.innerHTML = '<span class="dimension-tag overworld">🌿 Overworld</span>'
    calculate()
  })

  document.querySelectorAll<HTMLInputElement>('#nether-x, #nether-y, #nether-z').forEach(input => {
    input.addEventListener('input', debouncedCalc)
  })

  document.getElementById('nether-copy')!.addEventListener('click', async () => {
    const cmd = document.getElementById('nether-command')!.textContent || ''
    await copyToClipboard(cmd)
    showToast('Command copied!')
  })

  calculate()
}
