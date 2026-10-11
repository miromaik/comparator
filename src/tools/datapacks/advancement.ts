import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'

interface AdvancementState {
  title: string
  description: string
  icon: string
  frame: 'task' | 'goal' | 'challenge'
  background: string
  showToast: boolean
  announceChat: boolean
  hidden: boolean
  parent: string
  trigger: 'inventory_changed' | 'killed_by_player' | 'location' | 'impossible' | 'tick'
  rewardXp: number
  rewardFunction: string
}

const state: AdvancementState = {
  title: 'Heart of the Nether',
  description: 'Uncover ancient debris beneath the scorching lava oceans.',
  icon: 'minecraft:ancient_debris',
  frame: 'challenge',
  background: 'minecraft:textures/gui/advancements/backgrounds/nether.png',
  showToast: true,
  announceChat: true,
  hidden: false,
  parent: 'minecraft:nether/root',
  trigger: 'inventory_changed',
  rewardXp: 100,
  rewardFunction: '',
}

export function mount(container: HTMLElement): void {
  function generateJson(): string {
    const display: Record<string, any> = {
      icon: { id: state.icon },
      title: { text: state.title },
      description: { text: state.description },
      frame: state.frame,
      show_toast: state.showToast,
      announce_to_chat: state.announceChat,
      hidden: state.hidden,
    }

    if (state.background) {
      display.background = state.background
    }

    const criteria: Record<string, any> = {}
    if (state.trigger === 'inventory_changed') {
      criteria['has_item'] = {
        trigger: 'minecraft:inventory_changed',
        conditions: {
          items: [{ items: state.icon }],
        },
      }
    } else if (state.trigger === 'killed_by_player') {
      criteria['killed_mob'] = {
        trigger: 'minecraft:player_killed_entity',
        conditions: {},
      }
    } else if (state.trigger === 'impossible') {
      criteria['manual_trigger'] = {
        trigger: 'minecraft:impossible',
      }
    } else {
      criteria['tick_trigger'] = {
        trigger: 'minecraft:tick',
      }
    }

    const rewards: Record<string, any> = {}
    if (state.rewardXp > 0) rewards.experience = state.rewardXp
    if (state.rewardFunction.trim()) rewards.function = state.rewardFunction.trim()

    const obj: Record<string, any> = {
      display,
      parent: state.parent.trim() || undefined,
      criteria,
    }

    if (Object.keys(rewards).length > 0) {
      obj.rewards = rewards
    }

    return JSON.stringify(obj, null, 2)
  }

  function render(): void {
    const jsonOutput = generateJson()

    container.innerHTML = `
      <div class="split-view">
        <!-- Controls -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Advancement Designer</span>
            <span class="badge" style="font-size:0.72rem;">Datapack JSON</span>
          </div>

          <div class="panel-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Advancement Title</label>
                <input id="adv-title" type="text" class="form-input" value="${escapeHtml(state.title)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Frame</label>
                <select id="adv-frame" class="form-select">
                  <option value="task" ${state.frame === 'task' ? 'selected' : ''}>Task (Normal square)</option>
                  <option value="goal" ${state.frame === 'goal' ? 'selected' : ''}>Goal (Rounded star)</option>
                  <option value="challenge" ${state.frame === 'challenge' ? 'selected' : ''}>Challenge (Ornate border)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description Lore</label>
              <textarea id="adv-desc" class="form-textarea" rows="2">${escapeHtml(state.description)}</textarea>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Icon Item ID</label>
                <input id="adv-icon" type="text" class="form-input" value="${escapeHtml(state.icon)}" placeholder="minecraft:diamond" />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Advancement</label>
                <input id="adv-parent" type="text" class="form-input" value="${escapeHtml(state.parent)}" placeholder="minecraft:story/root" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Root Background (Optional)</label>
              <input id="adv-bg" type="text" class="form-input" value="${escapeHtml(state.background)}" placeholder="minecraft:textures/gui/advancements/backgrounds/stone.png" />
            </div>

            <div class="form-group">
              <label class="form-label">Trigger Condition</label>
              <select id="adv-trigger" class="form-select">
                <option value="inventory_changed" ${state.trigger === 'inventory_changed' ? 'selected' : ''}>inventory_changed (Player picks up icon item)</option>
                <option value="killed_by_player" ${state.trigger === 'killed_by_player' ? 'selected' : ''}>player_killed_entity (Combat kill)</option>
                <option value="tick" ${state.trigger === 'tick' ? 'selected' : ''}>tick (Instant / tick check)</option>
                <option value="impossible" ${state.trigger === 'impossible' ? 'selected' : ''}>impossible (Only granted via /advancement grant command)</option>
              </select>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Reward Experience (XP)</label>
                <input id="adv-xp" type="number" class="form-input" min="0" max="10000" value="${state.rewardXp}" />
              </div>
              <div class="form-group">
                <label class="form-label">Reward Function (Optional)</label>
                <input id="adv-func" type="text" class="form-input" value="${escapeHtml(state.rewardFunction)}" placeholder="namespace:reward_loot" />
              </div>
            </div>

            <div class="form-group" style="display:flex;gap:18px;flex-wrap:wrap;margin-top:4px;">
              <label class="toggle-label">
                <input id="adv-toast" type="checkbox" ${state.showToast ? 'checked' : ''} />
                <span>Show Toast Popup</span>
              </label>
              <label class="toggle-label">
                <input id="adv-chat" type="checkbox" ${state.announceChat ? 'checked' : ''} />
                <span>Announce to Chat</span>
              </label>
              <label class="toggle-label">
                <input id="adv-hidden" type="checkbox" ${state.hidden ? 'checked' : ''} />
                <span>Hidden until completed</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Output Panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Generated JSON</span>
            <div style="display:flex;gap:6px;">
              <button id="adv-copy-btn" class="btn btn-copy">Copy JSON</button>
              <button id="adv-dl-btn" class="btn btn-secondary">Download .json</button>
            </div>
          </div>
          <div class="panel-body">
            <!-- In-Game Toast Card Preview -->
            <div class="adv-preview-card ${state.frame}">
              <div class="adv-icon-box">🏆</div>
              <div class="adv-text-group">
                <span class="adv-frame-tag">${state.frame.toUpperCase()}</span>
                <span class="adv-card-title">${escapeHtml(state.title)}</span>
                <span class="adv-card-desc">${escapeHtml(state.description)}</span>
              </div>
            </div>

            <div class="output-section" style="margin-top:14px;">
              <pre class="code-preview" style="max-height:360px;"><code id="adv-code">${escapeHtml(jsonOutput)}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    container.querySelector('#adv-title')?.addEventListener('input', (e) => {
      state.title = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#adv-frame')?.addEventListener('change', (e) => {
      state.frame = (e.target as HTMLSelectElement).value as any
      render()
    })
    container.querySelector('#adv-desc')?.addEventListener('input', (e) => {
      state.description = (e.target as HTMLTextAreaElement).value
      render()
    })
    container.querySelector('#adv-icon')?.addEventListener('input', (e) => {
      state.icon = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#adv-parent')?.addEventListener('input', (e) => {
      state.parent = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#adv-bg')?.addEventListener('input', (e) => {
      state.background = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#adv-trigger')?.addEventListener('change', (e) => {
      state.trigger = (e.target as HTMLSelectElement).value as any
      render()
    })
    container.querySelector('#adv-xp')?.addEventListener('input', (e) => {
      state.rewardXp = parseInt((e.target as HTMLInputElement).value, 10) || 0
      render()
    })
    container.querySelector('#adv-func')?.addEventListener('input', (e) => {
      state.rewardFunction = (e.target as HTMLInputElement).value
      render()
    })
    container.querySelector('#adv-toast')?.addEventListener('change', (e) => {
      state.showToast = (e.target as HTMLInputElement).checked
      render()
    })
    container.querySelector('#adv-chat')?.addEventListener('change', (e) => {
      state.announceChat = (e.target as HTMLInputElement).checked
      render()
    })
    container.querySelector('#adv-hidden')?.addEventListener('change', (e) => {
      state.hidden = (e.target as HTMLInputElement).checked
      render()
    })

    container.querySelector('#adv-copy-btn')?.addEventListener('click', async () => {
      await copyToClipboard(generateJson())
      showToast('Advancement JSON copied!')
    })

    container.querySelector('#adv-dl-btn')?.addEventListener('click', () => {
      const blob = new Blob([generateJson()], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Advancement file downloaded!')
    })
  }

  render()
}
