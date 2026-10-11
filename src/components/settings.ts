import { store, type ThemeMode, type SyntaxVersion } from '../utils/store'

export function renderSettingsModal(): void {
  let modalEl = document.getElementById('settings-modal-overlay')
  if (!modalEl) {
    modalEl = document.createElement('div')
    modalEl.id = 'settings-modal-overlay'
    modalEl.className = 'cmd-overlay hidden'
    document.body.appendChild(modalEl)
  }

  const prefs = store.getPreferences()

  modalEl.innerHTML = `
    <div class="settings-modal" role="dialog" aria-label="Settings and Preferences">
      <div class="settings-header">
        <div class="settings-title-group">
          <!-- Minimalist Vector Logo -->
          <svg class="settings-logo-icon" width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="3" y="3" width="26" height="26" rx="6" fill="#18181b" stroke="#27272a" stroke-width="1.5" />
            <path d="M16 10 L9 22 M16 10 L23 22 M9 22 L23 22" stroke="#ff3333" stroke-width="1.2" opacity="0.3" />
            <circle cx="9" cy="22" r="2.8" fill="#ff3333" class="torch-dot" />
            <circle cx="23" cy="22" r="2.8" fill="#ff3333" class="torch-dot" />
            <circle cx="16" cy="10" r="3.2" fill="#ff2222" class="torch-dot front" />
          </svg>
          <h2>COMPARATOR Settings</h2>
        </div>
        <button id="settings-close" class="settings-close-btn" aria-label="Close settings">×</button>
      </div>

      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="general">Preferences</button>
        <button class="settings-tab" data-tab="about">About</button>
      </div>

      <div class="settings-body">
        <!-- Tab 1: General Preferences -->
        <div class="settings-section active" id="tab-general">
          <!-- Theme Switcher -->
          <div class="settings-field">
            <div class="field-label-group">
              <span class="field-title">Interface Theme</span>
              <span class="field-desc">Choose between dark mode, light mode, or system default</span>
            </div>
            <div class="btn-grid-3">
              <button class="toggle-btn ${prefs.theme === 'dark' ? 'active' : ''}" data-set-theme="dark">
                Dark Mode
              </button>
              <button class="toggle-btn ${prefs.theme === 'light' ? 'active' : ''}" data-set-theme="light">
                Light Mode
              </button>
              <button class="toggle-btn ${prefs.theme === 'system' ? 'active' : ''}" data-set-theme="system">
                System OS
              </button>
            </div>
          </div>

          <!-- Command & Item Syntax Profile -->
          <div class="settings-field">
            <div class="field-label-group">
              <span class="field-title">Command & Item Syntax Profile</span>
              <span class="field-desc">Default syntax for item, entity, head, and potion generators. Synchronizes automatically with in-tool version switches.</span>
            </div>
            <div class="btn-grid-2">
              <button class="toggle-btn ${prefs.syntaxVersion === 'modern' ? 'active' : ''}" data-set-syntax="modern">
                Modern 1.20.5+ / 1.21 (Components)
              </button>
              <button class="toggle-btn ${prefs.syntaxVersion === 'legacy' ? 'active' : ''}" data-set-syntax="legacy">
                Legacy 1.14 - 1.20.4 (Classic NBT)
              </button>
            </div>
          </div>


        </div>

        <!-- Tab 2: About -->
        <div class="settings-section" id="tab-about">
          <div class="about-minimal-card">
            <div class="about-top-row">
              <div class="about-title-wrap">
                <span class="about-name">COMPARATOR</span>
                <span class="about-badge-ver">v1.0</span>
                <span class="about-badge-alpha">ALPHA</span>
              </div>
              <span class="about-author-tag">Made by Miro</span>
            </div>

            <p class="about-desc">
              Minecraft utility toolbox for server owners, datapack developers, builders, and technical players.
            </p>

            <div class="about-links-grid">
              <a href="https://github.com/miromaik" target="_blank" rel="noopener noreferrer" class="about-link-btn github">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub: miromaik</span>
              </a>

              <a href="https://ko-fi.com/miromaik" target="_blank" rel="noopener noreferrer" class="about-link-btn kofi">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.047 3.977-4.047 3.977s-2.8-2.524-4.049-3.977c-1.22-1.42-1.378-3.053-.332-4.099 1.444-1.444 3.737-.584 4.381 1.109.645-1.693 2.938-2.553 4.38-1.109 1.047 1.046.889 2.679-.333 4.099zm7.114-1.503c-.489 2.583-2.511 2.768-2.511 2.768v-5.59s2.022.24 2.511 2.822z"/>
                </svg>
                <span>Support on Ko-fi</span>
              </a>
            </div>

            <div class="about-footer-row">
              <span class="about-meta-text">Crafted for Minecraft server admins & technical players</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  modalEl.querySelectorAll<HTMLButtonElement>('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modalEl!.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'))
      modalEl!.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'))
      tab.classList.add('active')
      const targetId = `tab-${tab.dataset.tab}`
      document.getElementById(targetId)?.classList.add('active')
    })
  })

  modalEl.querySelectorAll<HTMLButtonElement>('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.setTheme as ThemeMode
      store.setTheme(theme)
      renderSettingsModal()
    })
  })

  modalEl.querySelectorAll<HTMLButtonElement>('[data-set-syntax]').forEach(btn => {
    btn.addEventListener('click', () => {
      const syntax = btn.dataset.setSyntax as SyntaxVersion
      store.setSyntaxVersion(syntax)
      renderSettingsModal()
    })
  })

  document.getElementById('settings-close')?.addEventListener('click', closeSettingsModal)
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeSettingsModal()
  })
}

export function openSettingsModal(tabName: string = 'general'): void {
  renderSettingsModal()
  const modalEl = document.getElementById('settings-modal-overlay')
  if (modalEl) {
    modalEl.classList.remove('hidden')
    const targetTab = modalEl.querySelector<HTMLButtonElement>(`[data-tab="${tabName}"]`)
    if (targetTab) targetTab.click()
  }
}

export function closeSettingsModal(): void {
  const modalEl = document.getElementById('settings-modal-overlay')
  if (modalEl) modalEl.classList.add('hidden')
}
