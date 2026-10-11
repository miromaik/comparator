

export type ThemeMode = 'dark' | 'light' | 'system'
export type SyntaxVersion = 'modern' | 'legacy'
export type McVersion = '1.21' | '1.20.5' | '1.20' | '1.16'

export interface UserPreferences {
  theme: ThemeMode
  pinnedTools: string[]
  syntaxVersion: SyntaxVersion
  mcVersion?: McVersion

  recentTools: string[]
}

const STORAGE_KEY = 'comparator_preferences_v1'

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  pinnedTools: ['minimessage', 'villager', 'beacon', 'itembuilder'],
  syntaxVersion: 'modern',
  mcVersion: '1.21',

  recentTools: ['minimessage'],
}

class Store {
  private prefs: UserPreferences
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.prefs = this.loadFromStorage()
    this.applyTheme(this.prefs.theme)
    this.listenSystemTheme()
  }

  private loadFromStorage(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Migration: If user previously had mcVersion set to older versions, map to legacy syntax
        if (!parsed.syntaxVersion) {
          parsed.syntaxVersion = (parsed.mcVersion === '1.20' || parsed.mcVersion === '1.16') ? 'legacy' : 'modern'
        }
        return { ...defaultPreferences, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load preferences from storage', e)
    }
    return { ...defaultPreferences }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs))
      this.notify()
    } catch (e) {
      console.warn('Failed to save preferences to storage', e)
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(): void {
    this.listeners.forEach(fn => fn())
  }

  public getPreferences(): UserPreferences {
    return { ...this.prefs }
  }

  public getSyntaxVersion(): SyntaxVersion {
    return this.prefs.syntaxVersion || 'modern'
  }

  public setSyntaxVersion(syntax: SyntaxVersion): void {
    this.prefs.syntaxVersion = syntax
    this.prefs.mcVersion = syntax === 'modern' ? '1.21' : '1.20'
    this.saveToStorage()
  }

  public isPinned(toolId: string): boolean {
    return this.prefs.pinnedTools.includes(toolId)
  }

  public togglePin(toolId: string): boolean {
    const isNowPinned = !this.isPinned(toolId)
    if (isNowPinned) {
      this.prefs.pinnedTools = [toolId, ...this.prefs.pinnedTools.filter(id => id !== toolId)]
    } else {
      this.prefs.pinnedTools = this.prefs.pinnedTools.filter(id => id !== toolId)
    }
    this.saveToStorage()
    return isNowPinned
  }

  public setTheme(theme: ThemeMode): void {
    this.prefs.theme = theme
    this.saveToStorage()
    this.applyTheme(theme)
  }

  public setMcVersion(version: McVersion): void {
    this.prefs.mcVersion = version
    this.prefs.syntaxVersion = (version === '1.20' || version === '1.16') ? 'legacy' : 'modern'
    this.saveToStorage()
  }



  public addRecent(toolId: string): void {
    this.prefs.recentTools = [toolId, ...this.prefs.recentTools.filter(id => id !== toolId)].slice(0, 8)
    this.saveToStorage()
  }

  public exportBackup(): string {
    return JSON.stringify({
      app: 'comparator',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      preferences: this.prefs,
    }, null, 2)
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)
      if (data && data.preferences) {
        this.prefs = { ...defaultPreferences, ...data.preferences }
        this.saveToStorage()
        this.applyTheme(this.prefs.theme)
        return true
      }
    } catch {
      return false
    }
    return false
  }

  public applyTheme(theme: ThemeMode): void {
    const root = document.documentElement
    let effectiveTheme = theme
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    if (effectiveTheme === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    }
  }

  private listenSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.prefs.theme === 'system') {
          this.applyTheme('system')
        }
      })
    }
  }
}

export const store = new Store()
