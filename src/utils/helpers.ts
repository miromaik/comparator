

export function $(selector: string, parent: Element | Document = document): HTMLElement | null {
  return parent.querySelector(selector)
}

export function $$(selector: string, parent: Element | Document = document): HTMLElement[] {
  return [...parent.querySelectorAll<HTMLElement>(selector)]
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function showToast(message: string): void {
  const existing = document.querySelectorAll('.toast')
  existing.forEach(el => el.remove())

  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>${message}</span>
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2200)
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

export function interpolateColors(colors: string[], steps: number): string[] {
  if (colors.length < 2 || steps < 2) return colors.length ? [colors[0]] : ['#ffffff']

  const result: string[] = []
  const segmentSize = (steps - 1) / (colors.length - 1)

  for (let i = 0; i < steps; i++) {
    const segment = Math.min(Math.floor(i / segmentSize), colors.length - 2)
    const t = (i - segment * segmentSize) / segmentSize

    const [r1, g1, b1] = hexToRgb(colors[segment])
    const [r2, g2, b2] = hexToRgb(colors[segment + 1])

    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    result.push(rgbToHex(r, g, b))
  }

  return result
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

