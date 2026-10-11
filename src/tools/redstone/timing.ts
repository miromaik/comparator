import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

interface TimingState {
  gameTicks: number
  itemCount: number
  hopperCount: number
  repeaterDelayTicks: number
  comparatorFaderLength: number
  hopperThroughputMode: 'standard' | 'double' | 'water'
}

const state: TimingState = {
  gameTicks: 20,
  itemCount: 64,
  hopperCount: 10,
  repeaterDelayTicks: 4,
  comparatorFaderLength: 2,
  hopperThroughputMode: 'standard',
}

export function mount(container: HTMLElement): void {
  function update(): void {
    const gt = state.gameTicks
    const rt = gt / 2
    const ms = gt * 50
    const sec = ms / 1000
    const hz = gt > 0 ? (20 / gt).toFixed(2) : '0'

    const msEl = document.getElementById('t-ms')
    const rtEl = document.getElementById('t-rt')
    const secEl = document.getElementById('t-sec')
    const hzEl = document.getElementById('t-hz')

    if (msEl) msEl.textContent = `${ms.toLocaleString()} ms`
    if (rtEl) rtEl.textContent = `${rt} RT`
    if (secEl) secEl.textContent = `${sec.toFixed(2)}s`
    if (hzEl) hzEl.textContent = `${hz} Hz`

    let speedItemsPerSec = 2.5
    if (state.hopperThroughputMode === 'double') speedItemsPerSec = 5.0
    if (state.hopperThroughputMode === 'water') speedItemsPerSec = 30.0

    const latencySec = (state.hopperCount * 8 * 50) / 1000
    const totalTransferSec = (state.itemCount / speedItemsPerSec) + (state.hopperThroughputMode === 'standard' ? (state.hopperCount * 0.4) : 0)
    const minutes = Math.floor(totalTransferSec / 60)
    const remSec = (totalTransferSec % 60).toFixed(1)

    const hopperTimeEl = document.getElementById('t-hopper-time')
    const hopperRateEl = document.getElementById('t-hopper-rate')
    const hopperSummaryEl = document.getElementById('t-hopper-summary')

    if (hopperTimeEl) hopperTimeEl.textContent = minutes > 0 ? `${minutes}m ${remSec}s` : `${remSec}s`
    if (hopperRateEl) hopperRateEl.textContent = `${speedItemsPerSec} items/sec (${(speedItemsPerSec * 3600).toLocaleString()} /hr)`

    if (hopperSummaryEl) {
      hopperSummaryEl.textContent = [
        `# Redstone & Hopper Analysis:`,
        `Input Items: ${state.itemCount.toLocaleString()} items (${(state.itemCount / 64).toFixed(1)} stacks)`,
        `Hopper Pipeline: ${state.hopperCount} hoppers in sequence`,
        `Throughput Speed: ${speedItemsPerSec} items/s`,
        `Pipeline Latency: ${latencySec.toFixed(2)}s (${state.hopperCount * 8} Game Ticks)`,
        `Total Processing Duration: ${minutes > 0 ? `${minutes}m ${remSec}s` : `${remSec}s`}`,
      ].join('\n')
    }
  }

  const debouncedUpdate = debounce(update, 40)

  container.innerHTML = `
    <div class="split-view">
      <!-- Controls -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Tick & Timing Parameters</span>
        </div>
        <div class="panel-body">
          <!-- Game Ticks Input -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="t-gt-input">Base Game Ticks (GT)</label>
              <span class="range-badge">20 GT = 1.0s</span>
            </div>
            <input id="t-gt-input" class="input" type="number" value="${state.gameTicks}" min="1" max="72000" />
          </div>

          <!-- Quick Presets -->
          <div class="form-group">
            <label class="form-label">Standard Minecraft Intervals</label>
            <div class="btn-group-wrap">
              <button class="tag-btn" data-set-gt="1">1 GT (50ms)</button>
              <button class="tag-btn" data-set-gt="2">1 RT / Repeater 1 (100ms)</button>
              <button class="tag-btn" data-set-gt="4">Repeater 2 (200ms)</button>
              <button class="tag-btn" data-set-gt="8">Hopper Tick (400ms)</button>
              <button class="tag-btn" data-set-gt="20">1 Second (1000ms)</button>
              <button class="tag-btn" data-set-gt="100">5 Seconds</button>
              <button class="tag-btn" data-set-gt="24000">1 MC Day (20 min)</button>
            </div>
          </div>

          <!-- Conversion Cards -->
          <div class="stats-row" style="margin-top: 12px; margin-bottom: 20px;">
            <div class="stat-card">
              <span class="stat-title">Milliseconds</span>
              <span class="stat-val highlight-red" id="t-ms">1,000 ms</span>
              <span class="stat-sub" id="t-sec">1.00s</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Redstone Ticks</span>
              <span class="stat-val" id="t-rt">10 RT</span>
              <span class="stat-sub" id="t-hz">1.00 Hz clock</span>
            </div>
          </div>

          <!-- Hopper Calculator Controls -->
          <div class="form-group">
            <label class="form-label">Hopper Transfer System</label>
            <div class="btn-grid-3">
              <button class="toggle-btn ${state.hopperThroughputMode === 'standard' ? 'active' : ''}" data-hopper-mode="standard">
                Single Line (2.5/s)
              </button>
              <button class="toggle-btn ${state.hopperThroughputMode === 'double' ? 'active' : ''}" data-hopper-mode="double">
                Double Speed (5.0/s)
              </button>
              <button class="toggle-btn ${state.hopperThroughputMode === 'water' ? 'active' : ''}" data-hopper-mode="water">
                Water + Ice (~30/s)
              </button>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="t-items">Item Volume</label>
              <input id="t-items" class="input" type="number" value="${state.itemCount}" min="1" max="100000" />
            </div>
            <div class="form-group">
              <label class="form-label" for="t-hoppers">Hopper Distance</label>
              <input id="t-hoppers" class="input" type="number" value="${state.hopperCount}" min="1" max="500" />
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis & Output -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Timing Analysis & Throughput</span>
        </div>
        <div class="panel-body">
          <div class="stats-row" style="margin-top: 0; margin-bottom: 18px;">
            <div class="stat-card">
              <span class="stat-title">Estimated Transfer Time</span>
              <span class="stat-val highlight-red" id="t-hopper-time">25.6s</span>
              <span class="stat-sub">From input to destination</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Item Throughput</span>
              <span class="stat-val" id="t-hopper-rate">2.5 items/sec</span>
              <span class="stat-sub">9,000 items / hour</span>
            </div>
          </div>

          <div class="output-block">
            <div class="output-header">
              <span class="output-label">Timing Report</span>
              <button class="btn btn-copy" id="t-copy">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" stroke="currentColor" stroke-width="1.2"/></svg>
                Copy
              </button>
            </div>
            <div class="output-code" id="t-hopper-summary"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const gtInput = document.getElementById('t-gt-input') as HTMLInputElement
  const itemsInput = document.getElementById('t-items') as HTMLInputElement
  const hoppersInput = document.getElementById('t-hoppers') as HTMLInputElement

  gtInput?.addEventListener('input', () => {
    state.gameTicks = Math.max(1, parseInt(gtInput.value, 10) || 1)
    debouncedUpdate()
  })

  itemsInput?.addEventListener('input', () => {
    state.itemCount = Math.max(1, parseInt(itemsInput.value, 10) || 1)
    debouncedUpdate()
  })

  hoppersInput?.addEventListener('input', () => {
    state.hopperCount = Math.max(1, parseInt(hoppersInput.value, 10) || 1)
    debouncedUpdate()
  })

  container.querySelectorAll<HTMLButtonElement>('[data-set-gt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.setGt || '20', 10)
      state.gameTicks = val
      gtInput.value = String(val)
      update()
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-hopper-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-hopper-mode]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.hopperThroughputMode = btn.dataset.hopperMode as TimingState['hopperThroughputMode']
      update()
    })
  })

  document.getElementById('t-copy')?.addEventListener('click', async () => {
    const text = document.getElementById('t-hopper-summary')?.textContent || ''
    await copyToClipboard(text)
    showToast('Timing report copied!')
  })

  update()
}
