import { copyToClipboard, showToast, escapeHtml } from '../../utils/helpers'
import { SkinViewer3D, type BackAttachment } from './skin3d'

interface NameHistoryEntry {
  name: string
  changedToAt?: number
}

export interface PlayerCapeItem {
  id: string
  name: string
  provider: 'Mojang' | 'OptiFine' | 'LabyMod' | '5Zig' | 'MinecraftCapes' | 'Custom'
  url: string
  imageUrl: string
}

interface PlayerProfile {
  username: string
  onlineUuid: string | null
  trimmedUuid: string | null
  offlineUuid: string
  offlineTrimmedUuid: string
  intArray: string
  offlineIntArray: string
  skinUrl: string | null
  capeUrl: string | null
  capeName: string | null
  textureValue: string | null
  model: 'classic' | 'slim'
  nameHistory: NameHistoryEntry[]
  isOnline: boolean
  capes: PlayerCapeItem[]
}

const RECENT_KEY = 'comparator_recent_players_v1'

function getRecentPlayers(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const others = parsed.filter(n => typeof n === 'string' && !['jeb_', 'notch', 'miromaik'].includes(n.toLowerCase()))
        return ['jeb_', 'Notch', 'miromaik', ...others].slice(0, 8)
      }
    }
  } catch {}
  return ['jeb_', 'Notch', 'miromaik', 'Technoblade', 'MumboJumbo']
}

function saveRecentPlayer(name: string): void {
  try {
    const base = getRecentPlayers()
    const list = base.filter(n => n.toLowerCase() !== name.toLowerCase())
    list.unshift(name)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 10)))
  } catch {}
}

function md5(input: string): string {
  function rotateLeft(val: number, shift: number): number {
    return (val << shift) | (val >>> (32 - shift))
  }
  function addUnsigned(a: number, b: number): number {
    return (a + b) & 0xffffffff
  }

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]

  const K = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)
  )

  const bytes: number[] = []
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }

  const bitLen = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(
    bitLen & 0xff, (bitLen >> 8) & 0xff, (bitLen >> 16) & 0xff, (bitLen >> 24) & 0xff,
    0, 0, 0, 0
  )

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const M: number[] = []
    for (let j = 0; j < 16; j++) {
      const base = offset + j * 4
      M[j] = bytes[base] | (bytes[base + 1] << 8) | (bytes[base + 2] << 16) | (bytes[base + 3] << 24)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      const temp = D
      D = C
      C = B
      B = addUnsigned(B, rotateLeft(addUnsigned(addUnsigned(A, F), addUnsigned(K[i], M[g])), S[i]))
      A = temp
    }

    a0 = addUnsigned(a0, A)
    b0 = addUnsigned(b0, B)
    c0 = addUnsigned(c0, C)
    d0 = addUnsigned(d0, D)
  }

  const toHex = (n: number) => {
    let s = ''
    for (let i = 0; i < 4; i++) {
      s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0')
    }
    return s
  }

  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0)
}

function calculateOfflineUuid(username: string): string {
  const hash = md5(`OfflinePlayer:${username}`)
  const bytes = hash.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  if (bytes.length !== 16) return '00000000-0000-3000-8000-000000000000'

  bytes[6] = (bytes[6] & 0x0f) | 0x30
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-')
}

function uuidToTrimmed(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase()
}

function uuidToIntArray(uuid: string): string {
  const hex = uuidToTrimmed(uuid)
  if (hex.length !== 32) return '[I;0,0,0,0]'
  const ints: number[] = []
  for (let i = 0; i < 4; i++) {
    let val = parseInt(hex.substring(i * 8, (i + 1) * 8), 16)
    if (val > 0x7fffffff) val -= 0x100000000
    ints.push(val)
  }
  return `[I;${ints.join(',')}]`
}

function formatDashedUuid(trimmed: string): string {
  const clean = trimmed.replace(/-/g, '').toLowerCase()
  if (clean.length !== 32) return clean
  return [
    clean.substring(0, 8),
    clean.substring(8, 12),
    clean.substring(12, 16),
    clean.substring(16, 20),
    clean.substring(20, 32),
  ].join('-')
}

const LOCATOR_COLORS = [
  { name: 'Red', hex: '#B02E26', dye: 'red' },
  { name: 'Blue', hex: '#3C44AA', dye: 'blue' },
  { name: 'Green', hex: '#5E7C16', dye: 'green' },
  { name: 'Yellow', hex: '#FED83D', dye: 'yellow' },
  { name: 'Purple', hex: '#8932B8', dye: 'purple' },
  { name: 'Cyan', hex: '#169C9C', dye: 'cyan' },
  { name: 'Orange', hex: '#F9801D', dye: 'orange' },
  { name: 'Lime', hex: '#80C71F', dye: 'lime' },
  { name: 'Pink', hex: '#F38BAA', dye: 'pink' },
  { name: 'Light Blue', hex: '#3AB3DA', dye: 'light_blue' },
  { name: 'Magenta', hex: '#C74EBD', dye: 'magenta' },
  { name: 'Amber', hex: '#E59B2A', dye: 'orange' },
  { name: 'Teal', hex: '#1E7E7A', dye: 'cyan' },
  { name: 'Dark Blue', hex: '#242A68', dye: 'blue' },
  { name: 'Brown', hex: '#835432', dye: 'brown' },
  { name: 'White', hex: '#F9FFFE', dye: 'white' },
]

function getPlayerLocatorColor(uuid: string) {
  const clean = uuid.replace(/-/g, '').toLowerCase()
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % LOCATOR_COLORS.length
  const canonical = LOCATOR_COLORS[index]

  const lastHex = clean.substring(Math.max(0, clean.length - 6))
  const signatureHex = '#' + lastHex.toUpperCase()
  const sigDecimal = parseInt(lastHex, 16) || 0
  const r = (sigDecimal >> 16) & 255
  const g = (sigDecimal >> 8) & 255
  const b = sigDecimal & 255

  const markerDecimal = parseInt(canonical.hex.replace('#', ''), 16)

  return {
    markerIndex: index + 1,
    markerName: canonical.name,
    markerHex: canonical.hex,
    markerDye: canonical.dye,
    markerDecimal,
    signatureHex,
    signatureRgb: `rgb(${r}, ${g}, ${b})`,
    signatureDecimal: sigDecimal,
  }
}

function identifyCape(url: string): string {
  const hash = url.split('/').pop() || ''
  if (hash.startsWith('2c579968')) return "Builder's Cape (Movie)"
  if (hash.startsWith('cd9d82ab')) return '15th Anniversary Cape'
  if (hash.startsWith('1bf91499') || hash.includes('cherry')) return 'Cherry Blossom Cape'
  if (hash.startsWith('569b7f2a') || hash.startsWith('15a99d45')) return "Follower's Cape (TikTok)"
  if (hash.startsWith('cb40a92e') || hash.startsWith('61d0d970')) return 'Purple Heart Cape (Twitch)'
  if (hash.startsWith('f9a76537') || hash.startsWith('414f5261')) return 'Vanilla Cape'
  if (hash.startsWith('2340c0e0') || hash.startsWith('2340c2e3')) return 'Migrator Cape'
  if (hash.startsWith('9e507afc')) return 'Mojang Studios Cape'
  if (hash.startsWith('8f120319')) return 'Mojang Classic Cape'
  if (hash.startsWith('953cac8b') || hash.startsWith('b0503a53')) return 'Minecon 2011 Cape'
  if (hash.startsWith('a2e8d976')) return 'Minecon 2012 Cape'
  if (hash.startsWith('179127ba')) return 'Minecon 2013 Cape'
  if (hash.startsWith('b7c93cb6')) return 'Minecon 2015 Cape'
  if (hash.startsWith('ba77e682')) return 'Minecon 2016 Cape'
  if (hash.startsWith('5b5e39d5')) return 'MCC 15th Cape'
  return 'Official Mojang Cape'
}

const ICONIC_CAPES: PlayerCapeItem[] = [
  {
    id: 'builders-cape',
    name: "Builder's Cape (Movie)",
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/2c579968c64c1719740fd8c2a451461879b238002574fce48f7d1a7c36a1c7d4',
    imageUrl: 'https://crafthead.net/cape/2c579968c64c1719740fd8c2a451461879b238002574fce48f7d1a7c36a1c7d4',
  },
  {
    id: '15th-anniversary',
    name: '15th Anniversary Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
    imageUrl: 'https://crafthead.net/cape/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/1bf91499701404e21bd46b0191d63239a4ef76ebde88d27e4d430ac211df681e',
    imageUrl: 'https://crafthead.net/cape/1bf91499701404e21bd46b0191d63239a4ef76ebde88d27e4d430ac211df681e',
  },
  {
    id: 'follower-tiktok',
    name: "Follower's Cape (TikTok)",
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/569b7f2a1d00d26f30efe3f9ab9ac817b1e6d35f4f3cfb0324ef2d328223d350',
    imageUrl: 'https://crafthead.net/cape/569b7f2a1d00d26f30efe3f9ab9ac817b1e6d35f4f3cfb0324ef2d328223d350',
  },
  {
    id: 'twitch-purple',
    name: 'Purple Heart (Twitch)',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/cb40a92e32b57fd732a00fc325e7afb00a7ca74936ad50d8e860152e482cfbde',
    imageUrl: 'https://crafthead.net/cape/cb40a92e32b57fd732a00fc325e7afb00a7ca74936ad50d8e860152e482cfbde',
  },
  {
    id: 'vanilla-cape',
    name: 'Vanilla Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/f9a76537647989f9a0b6d001e320dac591c359e9e61a31f4ce11c88f207f0ad4',
    imageUrl: 'https://crafthead.net/cape/f9a76537647989f9a0b6d001e320dac591c359e9e61a31f4ce11c88f207f0ad4',
  },
  {
    id: 'migrator-cape',
    name: 'Migrator Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933',
    imageUrl: 'https://crafthead.net/cape/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933',
  },
  {
    id: 'mojang-studios',
    name: 'Mojang Studios Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/9e507afc56359978a3eb3e32367042b853cddd0995d17d0da995662913fb00f7',
    imageUrl: 'https://crafthead.net/cape/9e507afc56359978a3eb3e32367042b853cddd0995d17d0da995662913fb00f7',
  },
  {
    id: 'mojang-classic',
    name: 'Mojang Classic Cape',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/8f120319222a9f4a104e2f5cb97b2cda93199a2ee9e1585cb8d09d6f687cb761',
    imageUrl: 'https://crafthead.net/cape/8f120319222a9f4a104e2f5cb97b2cda93199a2ee9e1585cb8d09d6f687cb761',
  },
  {
    id: 'minecon-2011',
    name: 'Minecon 2011',
    provider: 'Mojang',
    url: 'https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
    imageUrl: 'https://crafthead.net/cape/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
  },
]

function drawElytra2D(canvas: HTMLCanvasElement, capeUrl: string | null): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const drawWingsWithImage = (img: HTMLImageElement | null) => {
    ctx.imageSmoothingEnabled = false
    const cx = canvas.width / 2
    const cy = 20

    ctx.save()
    ctx.translate(cx - 10, cy)
    ctx.rotate(0.32)
    if (img) {
      ctx.drawImage(img, 1, 1, 10, 16, -28, 0, 48, 92)
    } else {
      ctx.fillStyle = '#4c505c'
      ctx.fillRect(-28, 0, 48, 92)
      ctx.fillStyle = '#686f7f'
      ctx.fillRect(-24, 4, 40, 84)
    }
    ctx.restore()

    ctx.save()
    ctx.translate(cx + 10, cy)
    ctx.rotate(-0.32)
    if (img) {
      ctx.drawImage(img, 1, 1, 10, 16, -20, 0, 48, 92)
    } else {
      ctx.fillStyle = '#4c505c'
      ctx.fillRect(-20, 0, 48, 92)
      ctx.fillStyle = '#686f7f'
      ctx.fillRect(-16, 4, 40, 84)
    }
    ctx.restore()

    ctx.fillStyle = '#222329'
    ctx.fillRect(cx - 6, cy - 2, 12, 38)
    ctx.fillStyle = '#393b45'
    ctx.fillRect(cx - 4, cy, 8, 34)
  }

  if (capeUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = capeUrl
    img.onload = () => drawWingsWithImage(img)
    img.onerror = () => drawWingsWithImage(null)
  } else {
    drawWingsWithImage(null)
  }
}

export function mount(container: HTMLElement): void {
  let currentTarget = 'jeb_'
  let isLoading = false
  let profile: PlayerProfile | null = null
  let viewPerspective: '3d' | 'front' | 'head' | 'cape' | 'elytra' = '3d'
  let selectedCape: PlayerCapeItem | null = null

  let viewer3d: SkinViewer3D | null = null
  let isSpinning = true
  let showLayers = true
  let attachment: BackAttachment = 'cape'

  async function fetchProfile(target: string): Promise<void> {
    isLoading = true
    if (viewer3d) {
      viewer3d.destroy()
      viewer3d = null
    }
    render()

    const cleanInput = target.trim()
    const isUuid = /^[0-9a-fA-F-]{32,36}$/.test(cleanInput)
    const offlineUid = isUuid ? cleanInput : calculateOfflineUuid(cleanInput)
    const offlineTrim = uuidToTrimmed(offlineUid)

    let loadedProfile: PlayerProfile = {
      username: cleanInput,
      onlineUuid: null,
      trimmedUuid: null,
      offlineUuid: offlineUid,
      offlineTrimmedUuid: offlineTrim,
      intArray: uuidToIntArray(offlineUid),
      offlineIntArray: uuidToIntArray(offlineUid),
      skinUrl: null,
      capeUrl: null,
      capeName: null,
      textureValue: null,
      model: 'classic',
      nameHistory: [],
      isOnline: false,
      capes: [],
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`https://playerdb.co/api/player/minecraft/${cleanInput}`, {
        signal: controller.signal,
      }).catch(() => null)
      clearTimeout(timeout)

      if (res && res.ok) {
        const json = await res.json()
        if (json.code === 'player.found' && json.data?.player) {
          const p = json.data.player
          const rawId = p.raw_id || uuidToTrimmed(p.id)
          const dashed = formatDashedUuid(rawId)
          const texturesProp = p.properties?.find((prop: { name: string }) => prop.name === 'textures')

          let capeUrl: string | null = p.cape_texture || null
          let capeName: string | null = null
          let model: 'classic' | 'slim' = 'classic'

          if (texturesProp?.value) {
            try {
              const decoded = JSON.parse(atob(texturesProp.value))
              if (decoded.textures?.SKIN?.metadata?.model === 'slim') {
                model = 'slim'
              }
              if (!capeUrl && decoded.textures?.CAPE?.url) {
                capeUrl = decoded.textures.CAPE.url
              }
            } catch {}
          }

          if (capeUrl) {
            capeName = identifyCape(capeUrl)
          }

          const capesList: PlayerCapeItem[] = []

          if (capeUrl) {
            capesList.push({
              id: 'mojang-equipped',
              name: capeName || 'Official Mojang Cape',
              provider: 'Mojang',
              url: capeUrl,
              imageUrl: `https://crafthead.net/cape/${rawId}`,
            })
          }

          try {
            const capeCtrl = new AbortController()
            const cTimeout = setTimeout(() => capeCtrl.abort(), 3500)
            const capeRes = await fetch(`https://api.capes.dev/load/${p.username || cleanInput}`, {
              signal: capeCtrl.signal,
            }).catch(() => null)
            clearTimeout(cTimeout)

            if (capeRes && capeRes.ok) {
              const capeJson = await capeRes.json()

              if (capeJson.optifine?.exists && (capeJson.optifine.imageUrl || capeJson.optifine.capeUrl)) {
                const optiUrl = capeJson.optifine.imageUrl || capeJson.optifine.capeUrl
                capesList.push({
                  id: 'optifine',
                  name: 'OptiFine Cape',
                  provider: 'OptiFine',
                  url: optiUrl,
                  imageUrl: optiUrl,
                })
              }

              if (capeJson.labymod?.exists && (capeJson.labymod.imageUrl || capeJson.labymod.capeUrl)) {
                const labyUrl = capeJson.labymod.imageUrl || capeJson.labymod.capeUrl
                capesList.push({
                  id: 'labymod',
                  name: 'LabyMod Cape',
                  provider: 'LabyMod',
                  url: labyUrl,
                  imageUrl: labyUrl,
                })
              }

              if (capeJson.minecraftcapes?.exists && (capeJson.minecraftcapes.imageUrl || capeJson.minecraftcapes.capeUrl)) {
                const mcCapesUrl = capeJson.minecraftcapes.imageUrl || capeJson.minecraftcapes.capeUrl
                capesList.push({
                  id: 'minecraftcapes',
                  name: 'MinecraftCapes.net',
                  provider: 'MinecraftCapes',
                  url: mcCapesUrl,
                  imageUrl: mcCapesUrl,
                })
              }
            }
          } catch {}

          const lowerName = (p.username || cleanInput).toLowerCase()
          if (lowerName === 'miromaik') {
            const miroCapes: PlayerCapeItem[] = [
              {
                id: 'builders-cape',
                name: "Builder's Cape (Movie)",
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/2c579968c64c1719740fd8c2a451461879b238002574fce48f7d1a7c36a1c7d4',
                imageUrl: 'https://crafthead.net/cape/2c579968c64c1719740fd8c2a451461879b238002574fce48f7d1a7c36a1c7d4',
              },
              {
                id: '15th-anniversary',
                name: '15th Anniversary Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
                imageUrl: 'https://crafthead.net/cape/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
              },
              {
                id: 'cherry-blossom',
                name: 'Cherry Blossom Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/1bf91499701404e21bd46b0191d63239a4ef76ebde88d27e4d430ac211df681e',
                imageUrl: 'https://crafthead.net/cape/1bf91499701404e21bd46b0191d63239a4ef76ebde88d27e4d430ac211df681e',
              },
              {
                id: 'follower-tiktok',
                name: "Follower's Cape (TikTok)",
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/569b7f2a1d00d26f30efe3f9ab9ac817b1e6d35f4f3cfb0324ef2d328223d350',
                imageUrl: 'https://crafthead.net/cape/569b7f2a1d00d26f30efe3f9ab9ac817b1e6d35f4f3cfb0324ef2d328223d350',
              },
              {
                id: 'twitch-purple',
                name: 'Purple Heart (Twitch)',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/cb40a92e32b57fd732a00fc325e7afb00a7ca74936ad50d8e860152e482cfbde',
                imageUrl: 'https://crafthead.net/cape/cb40a92e32b57fd732a00fc325e7afb00a7ca74936ad50d8e860152e482cfbde',
              },
              {
                id: 'vanilla-cape',
                name: 'Vanilla Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/f9a76537647989f9a0b6d001e320dac591c359e9e61a31f4ce11c88f207f0ad4',
                imageUrl: 'https://crafthead.net/cape/f9a76537647989f9a0b6d001e320dac591c359e9e61a31f4ce11c88f207f0ad4',
              },
              {
                id: 'migrator-cape',
                name: 'Migrator Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933',
                imageUrl: 'https://crafthead.net/cape/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933',
              },
            ]
            for (const mc of miroCapes) {
              if (!capesList.some(c => c.id === mc.id || c.url === mc.url)) {
                capesList.push(mc)
              }
            }
          } else if (lowerName === 'jeb_') {
            const jebCapes: PlayerCapeItem[] = [
              {
                id: 'mojang-studios',
                name: 'Mojang Studios Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/9e507afc56359978a3eb3e32367042b853cddd0995d17d0da995662913fb00f7',
                imageUrl: 'https://crafthead.net/cape/9e507afc56359978a3eb3e32367042b853cddd0995d17d0da995662913fb00f7',
              },
              {
                id: 'minecon-2011',
                name: 'Minecon 2011 Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
                imageUrl: 'https://crafthead.net/cape/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
              },
              {
                id: '15th-anniversary',
                name: '15th Anniversary Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
                imageUrl: 'https://crafthead.net/cape/cd9d82ab17fd92022dbd4a86cde4c382a7540e117fae7b9a2853658505a80625',
              },
            ]
            for (const jc of jebCapes) {
              if (!capesList.some(c => c.id === jc.id || c.url === jc.url)) {
                capesList.push(jc)
              }
            }
          } else if (lowerName === 'notch') {
            const notchCapes: PlayerCapeItem[] = [
              {
                id: 'mojang-classic',
                name: 'Mojang Classic Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/8f120319222a9f4a104e2f5cb97b2cda93199a2ee9e1585cb8d09d6f687cb761',
                imageUrl: 'https://crafthead.net/cape/8f120319222a9f4a104e2f5cb97b2cda93199a2ee9e1585cb8d09d6f687cb761',
              },
              {
                id: 'minecon-2011',
                name: 'Minecon 2011 Cape',
                provider: 'Mojang',
                url: 'https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
                imageUrl: 'https://crafthead.net/cape/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
              },
            ]
            for (const nc of notchCapes) {
              if (!capesList.some(c => c.id === nc.id || c.url === nc.url)) {
                capesList.push(nc)
              }
            }
          }

          loadedProfile = {
            username: p.username || cleanInput,
            onlineUuid: dashed,
            trimmedUuid: rawId,
            offlineUuid: calculateOfflineUuid(p.username || cleanInput),
            offlineTrimmedUuid: uuidToTrimmed(calculateOfflineUuid(p.username || cleanInput)),
            intArray: uuidToIntArray(dashed),
            offlineIntArray: uuidToIntArray(calculateOfflineUuid(p.username || cleanInput)),
            skinUrl: p.skin_texture || `https://crafthead.net/skin/${rawId}`,
            capeUrl,
            capeName,
            textureValue: texturesProp ? texturesProp.value : null,
            model,
            nameHistory: p.meta?.name_history || [],
            isOnline: true,
            capes: capesList,
          }

          saveRecentPlayer(loadedProfile.username)
        }
      } else {
        loadedProfile.isOnline = false
      }
    } catch {
      loadedProfile.isOnline = false
    }

    profile = loadedProfile
    selectedCape = profile.capes[0] || (profile.capeUrl ? {
      id: 'default-equipped',
      name: profile.capeName || 'Equipped Cape',
      provider: 'Mojang',
      url: profile.capeUrl,
      imageUrl: profile.capeUrl,
    } : null)

    isLoading = false
    render()
  }

  function render(): void {
    if (viewer3d) {
      viewer3d.destroy()
      viewer3d = null
    }

    const recent = getRecentPlayers()
    const activeUuid = profile?.onlineUuid || profile?.offlineUuid || '069a79f4-44e9-4726-a5be-fca90e38aaf5'
    const trimmed = profile?.trimmedUuid || profile?.offlineTrimmedUuid || '069a79f444e94726a5befca90e38aaf5'
    const username = profile?.username || currentTarget

    const modernGive = `/give @p player_head[profile="${username}"] 1`
    const modernGiveId = profile?.intArray
      ? `/give @p player_head[profile={name:"${username}",id:${profile.intArray}}] 1`
      : modernGive
    const modernGiveBase64 = profile?.textureValue
      ? `/give @p player_head[profile={properties:[{name:"textures",value:"${profile.textureValue}"}]}] 1`
      : null
    const legacyGive = `/give @p player_head{SkullOwner:"${username}"} 1`

    const avatarUrl = `https://crafthead.net/avatar/${trimmed}/64`
    const skinDownloadUrl = profile?.skinUrl || `https://crafthead.net/skin/${trimmed}`
    const activeCapeUrl = selectedCape?.url || profile?.capeUrl

    const locator = getPlayerLocatorColor(activeUuid)

    container.innerHTML = `
      <div class="namemc-container">
        <header class="namemc-header">
          <div class="namemc-search-bar">
            <div class="namemc-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input id="namemc-input" type="text" placeholder="Search Minecraft username or UUID (e.g. jeb_, Notch, miromaik)..." value="${escapeHtml(currentTarget)}" autocomplete="off" spellcheck="false" />
              <button id="namemc-search-btn" class="btn btn-primary" ${isLoading ? 'disabled' : ''}>
                ${isLoading ? 'Searching...' : 'Lookup Profile'}
              </button>
            </div>
          </div>

          <div class="namemc-recent-strip">
            <span class="namemc-strip-label">Recent:</span>
            <div class="namemc-chips-wrap">
              ${recent.map(name => `
                <button class="namemc-chip-btn ${name.toLowerCase() === username.toLowerCase() ? 'active' : ''}" data-target="${escapeHtml(name)}">
                  <img class="namemc-chip-avatar" src="https://crafthead.net/avatar/${escapeHtml(name)}/16" alt="" onerror="this.style.display='none'" />
                  <span>${escapeHtml(name)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </header>

        <div class="namemc-profile-grid">
          <div class="namemc-card namemc-skin-card">
            <div class="namemc-card-header">
              <div class="namemc-card-title-group">
                <div class="namemc-avatar-ring">
                  <img src="${avatarUrl}" alt="${username}" onerror="this.onerror=null;this.src='https://mc-heads.net/avatar/${trimmed}/64';" />
                </div>
                <div>
                  <h2 class="namemc-player-name">${username}</h2>
                  <span class="namemc-status-badge ${profile?.isOnline ? 'online' : 'offline'}">
                    ${profile?.isOnline ? 'Official Mojang Account' : 'Offline / Unregistered'}
                  </span>
                </div>
              </div>

              <div class="toggle-group perspective-toggle">
                <button class="toggle-btn ${viewPerspective === '3d' ? 'active' : ''}" data-view="3d">3D</button>
                <button class="toggle-btn ${viewPerspective === 'front' ? 'active' : ''}" data-view="front">2D</button>
                <button class="toggle-btn ${viewPerspective === 'head' ? 'active' : ''}" data-view="head">Head</button>
                <button class="toggle-btn ${viewPerspective === 'cape' ? 'active' : ''}" data-view="cape">Capes (${profile?.capes?.length || 0})</button>
                <button class="toggle-btn ${viewPerspective === 'elytra' ? 'active' : ''}" data-view="elytra">Elytra</button>
              </div>
            </div>

            <div class="namemc-model-stage">
              ${isLoading ? `
                <div class="namemc-loader">
                  <div class="spinner"></div>
                  <span>Fetching Mojang skin & cape data...</span>
                </div>
              ` : viewPerspective === '3d' ? `
                <div class="namemc-3d-wrapper">
                  <canvas id="namemc-3d-canvas" class="namemc-3d-canvas"></canvas>
                  <div class="namemc-3d-hint">Drag to orbit 360° • Scroll to zoom</div>
                  <div class="namemc-3d-toolbar">
                    <button id="namemc-tool-spin" class="namemc-3d-toolbtn ${isSpinning ? 'active' : ''}" title="Toggle continuous auto-rotation">Spin</button>
                    <button id="namemc-tool-layer" class="namemc-3d-toolbtn ${showLayers ? 'active' : ''}" title="Toggle skin outer voxel layers">Outer Layers</button>
                    <button id="namemc-tool-cape" class="namemc-3d-toolbtn ${attachment === 'cape' ? 'active' : ''}" title="Equip cape on model">Cape</button>
                    <button id="namemc-tool-elytra" class="namemc-3d-toolbtn ${attachment === 'elytra' ? 'active' : ''}" title="Equip elytra wings on model">Elytra</button>
                    <button id="namemc-tool-none" class="namemc-3d-toolbtn ${attachment === 'none' ? 'active' : ''}" title="No back attachment">None</button>
                    <button id="namemc-tool-reset" class="namemc-3d-toolbtn" title="Reset camera angle">Reset</button>
                  </div>
                </div>
              ` : viewPerspective === 'cape' ? `
                <div class="namemc-capes-container">
                  <div class="namemc-capes-section-title">Player Capes (${profile?.capes?.length || 0})</div>
                  ${profile?.capes && profile.capes.length > 0 ? `
                    <div class="namemc-capes-grid">
                      ${profile.capes.map(cape => `
                        <div class="namemc-cape-card ${selectedCape?.id === cape.id ? 'active' : ''}" data-cape-id="${escapeHtml(cape.id)}">
                          <img class="namemc-cape-card-img" src="${escapeHtml(cape.imageUrl)}" alt="${escapeHtml(cape.name)}" onerror="this.onerror=null;this.src='${escapeHtml(cape.url)}';" />
                          <div class="namemc-cape-card-name">${escapeHtml(cape.name)}</div>
                          <span class="namemc-cape-card-provider">${escapeHtml(cape.provider)}</span>
                          <div style="display:flex;gap:4px;width:100%;margin-top:4px;">
                            <button class="btn btn-primary btn-sm namemc-equip-cape-btn" data-cape-id="${escapeHtml(cape.id)}" style="flex:1;padding:3px 6px;font-size:0.68rem;">
                              Equip in 3D
                            </button>
                            <a href="${escapeHtml(cape.url)}" download="${username}_${escapeHtml(cape.id)}.png" target="_blank" class="btn btn-secondary btn-sm" style="padding:3px 6px;text-decoration:none;" title="Download Cape PNG">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </a>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="namemc-empty-cape">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                      <p>No official Mojang cape equipped on this account.</p>
                    </div>
                  `}

                  <div class="namemc-capes-section-title" style="margin-top:14px;">Try Iconic Minecraft Capes in 3D</div>
                  <div class="namemc-capes-grid">
                    ${ICONIC_CAPES.map(cape => `
                      <div class="namemc-cape-card ${selectedCape?.id === cape.id ? 'active' : ''}" data-cape-id="${escapeHtml(cape.id)}">
                        <img class="namemc-cape-card-img" src="${escapeHtml(cape.imageUrl)}" alt="${escapeHtml(cape.name)}" />
                        <div class="namemc-cape-card-name">${escapeHtml(cape.name)}</div>
                        <span class="namemc-cape-card-provider">${escapeHtml(cape.provider)}</span>
                        <div style="display:flex;gap:4px;width:100%;margin-top:4px;">
                          <button class="btn btn-secondary btn-sm namemc-equip-cape-btn" data-cape-id="${escapeHtml(cape.id)}" style="flex:1;padding:3px 6px;font-size:0.68rem;">
                            Try in 3D
                          </button>
                          <a href="${escapeHtml(cape.url)}" download="${escapeHtml(cape.id)}.png" target="_blank" class="btn btn-secondary btn-sm" style="padding:3px 6px;text-decoration:none;" title="Download Cape PNG">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          </a>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : viewPerspective === 'elytra' ? `
                <div class="namemc-elytra-display">
                  <div class="namemc-elytra-badge">
                    ${selectedCape ? selectedCape.name + ' Elytra Wings' : (profile?.capeName ? profile.capeName + ' Elytra' : 'Default Phantom Elytra Wings')}
                  </div>
                  <div class="namemc-elytra-wings-preview">
                    <canvas id="namemc-elytra-canvas" class="namemc-elytra-canvas" width="240" height="140"></canvas>
                  </div>
                  <p style="font-size:0.8rem;color:var(--text-secondary);max-width:320px;line-height:1.4;">
                    Custom Elytra texture mapped from the active cape texture.
                  </p>
                  <div class="namemc-elytra-actions">
                    <button id="namemc-elytra-inspect-3d" class="btn btn-primary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                      <span>Inspect in 3D Orbit</span>
                    </button>
                    ${activeCapeUrl ? `
                      <a href="${activeCapeUrl}" download="${username}_cape_for_elytra.png" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none;">
                        Download Texture
                      </a>
                    ` : ''}
                  </div>
                </div>
              ` : `
                <img 
                  id="namemc-model-img" 
                  class="namemc-model-render ${viewPerspective === 'head' ? 'head-mode' : ''}" 
                  src="${viewPerspective === 'head' ? `https://mc-heads.net/avatar/${trimmed}/160` : `https://mc-heads.net/body/${trimmed}`}" 
                  alt="${username} Skin" 
                  onerror="this.onerror=null;this.src='https://mc-heads.net/body/069a79f4-44e9-4726-a5be-fca90e38aaf5';"
                />
              `}
            </div>

            <div class="namemc-skin-actions">
              <a href="${skinDownloadUrl}" download="${username}_skin.png" target="_blank" class="btn btn-secondary" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download Skin</span>
              </a>
              ${activeCapeUrl ? `
                <a href="${activeCapeUrl}" download="${username}_cape.png" target="_blank" class="btn btn-secondary" title="Download active Cape texture" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Download Cape</span>
                </a>
              ` : ''}
              <button id="namemc-copy-skinurl" class="btn btn-secondary" data-copy="${skinDownloadUrl}" title="Copy direct skin URL">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>

          <div class="namemc-details-col">
            <div class="namemc-card">
              <div class="namemc-card-header">
                <h3 class="namemc-card-title">Player Locator & Map Marker Color</h3>
                <span class="namemc-badge-pill" style="color:${locator.markerHex};border-color:${locator.markerHex}55;">
                  Marker #${locator.markerIndex}
                </span>
              </div>
              <div class="namemc-card-body">
                <div class="namemc-locator-widget">
                  <div class="namemc-locator-map-preview">
                    <div class="namemc-map-grid"></div>
                    <div class="namemc-map-arrow" style="color: ${locator.markerHex}; filter: drop-shadow(0 0 6px ${locator.markerHex});">
                      ▲
                    </div>
                  </div>

                  <div class="namemc-locator-bar-wrap">
                    <div class="namemc-locator-bar-track">
                      <div class="namemc-locator-bar-fill" style="background: linear-gradient(90deg, ${locator.markerHex}33, ${locator.markerHex});"></div>
                      <div class="namemc-locator-marker-dot" style="background: ${locator.markerHex}; box-shadow: 0 0 8px ${locator.markerHex}; left: ${((locator.markerIndex - 1) / 15) * 85 + 7}%;">
                        ▲
                      </div>
                    </div>
                    <div class="namemc-locator-bar-label">
                      <span>Bedrock & Java Locator Map Track</span>
                      <strong style="color: ${locator.markerHex};">${locator.markerName} (${locator.markerHex})</strong>
                    </div>
                  </div>
                </div>

                <div class="form-row-2 mt-2">
                  <div class="namemc-field-group">
                    <label class="namemc-label">
                      <span>Canonical Map Marker</span>
                      <span class="namemc-hint-tag">Palette 1-16</span>
                    </label>
                    <div class="namemc-input-copy">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="width:14px;height:14px;border-radius:3px;background:${locator.markerHex};border:1px solid rgba(255,255,255,0.2);display:inline-block;"></span>
                        <code>${locator.markerHex} (${locator.markerName})</code>
                      </div>
                      <button class="btn btn-copy" data-copy="${locator.markerHex}">Copy</button>
                    </div>
                  </div>

                  <div class="namemc-field-group">
                    <label class="namemc-label">
                      <span>Map Decoration Decimal Int</span>
                      <span class="namemc-hint-tag">1.20.5+ component</span>
                    </label>
                    <div class="namemc-input-copy">
                      <code>${locator.markerDecimal}</code>
                      <button class="btn btn-copy" data-copy="${locator.markerDecimal}">Copy</button>
                    </div>
                  </div>
                </div>

                <div class="namemc-field-group mt-1">
                  <label class="namemc-label">
                    <span>UUID Signature Tint</span>
                    <span class="namemc-hint-tag">Unique 24-bit RGB from UUID</span>
                  </label>
                  <div class="namemc-input-copy">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="width:14px;height:14px;border-radius:3px;background:${locator.signatureHex};border:1px solid rgba(255,255,255,0.2);display:inline-block;"></span>
                      <code>${locator.signatureHex} • ${locator.signatureRgb}</code>
                    </div>
                    <button class="btn btn-copy" data-copy="${locator.signatureHex}">Copy</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="namemc-card">
              <div class="namemc-card-header">
                <h3 class="namemc-card-title">Capes & Cosmetics</h3>
                <span class="namemc-badge-pill ${activeCapeUrl ? 'modern' : ''}">
                  ${selectedCape ? selectedCape.name : (profile?.capeName || 'No Cape')}
                </span>
              </div>
              <div class="namemc-card-body">
                ${profile?.capes && profile.capes.length > 0 ? `
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:var(--radius-md);border:1px solid var(--border-default);">
                      <div style="width:36px;height:48px;background:#18181b;border-radius:4px;overflow:hidden;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;">
                        <img src="${activeCapeUrl}" alt="Cape" style="height:100%;object-fit:cover;image-rendering:pixelated;" />
                      </div>
                      <div style="flex:1;">
                        <div style="font-weight:700;font-size:0.92rem;color:var(--text-primary);">${selectedCape ? selectedCape.name : (profile?.capeName || 'Equipped Cape')}</div>
                        <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">
                          ${selectedCape ? selectedCape.provider : 'Official Mojang'} • ${profile.capes.length} total owned
                        </div>
                      </div>
                      <button id="namemc-quick-view-capes" class="btn btn-secondary btn-sm">
                        View All (${profile.capes.length})
                      </button>
                    </div>

                    <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:4px;">
                      ${profile.capes.map(c => `
                        <button 
                          class="namemc-mini-cape-btn ${selectedCape?.id === c.id ? 'active' : ''}" 
                          data-cape-id="${escapeHtml(c.id)}"
                          title="${escapeHtml(c.name)} (${escapeHtml(c.provider)})"
                          style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:var(--radius-sm);background:${selectedCape?.id === c.id ? 'var(--accent-red-dim)' : 'var(--bg-surface)'};border:1px solid ${selectedCape?.id === c.id ? 'var(--accent-red)' : 'var(--border-subtle)'};cursor:pointer;color:var(--text-primary);font-size:0.72rem;white-space:nowrap;"
                        >
                          <img src="${escapeHtml(c.imageUrl)}" alt="" style="width:14px;height:20px;image-rendering:pixelated;object-fit:cover;" onerror="this.onerror=null;this.src='${escapeHtml(c.url)}';" />
                          <span>${escapeHtml(c.name)}</span>
                        </button>
                      `).join('')}
                    </div>
                  </div>
                ` : activeCapeUrl ? `
                  <div style="display:flex;align-items:center;gap:14px;padding:10px 14px;background:var(--bg-input);border-radius:var(--radius-md);border:1px solid var(--border-default);">
                    <div style="width:36px;height:48px;background:#18181b;border-radius:4px;overflow:hidden;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;">
                      <img src="${activeCapeUrl}" alt="Cape" style="height:100%;object-fit:cover;image-rendering:pixelated;" />
                    </div>
                    <div style="flex:1;">
                      <div style="font-weight:700;font-size:0.92rem;color:var(--text-primary);">${profile?.capeName || 'Equipped Cape'}</div>
                      <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">Official Mojang Cape</div>
                    </div>
                    <button id="namemc-quick-view-capes" class="btn btn-secondary btn-sm">
                      View All
                    </button>
                  </div>
                ` : `
                  <div style="font-size:0.82rem;color:var(--text-tertiary);line-height:1.5;">
                    This player has no official Mojang cape equipped. You can try iconic Minecraft capes in the Capes tab above.
                  </div>
                `}
              </div>
            </div>

            <div class="namemc-card">
              <div class="namemc-card-header">
                <h3 class="namemc-card-title">UUID & Profile Identifiers</h3>
                <span class="namemc-badge-pill">RFC 4122</span>
              </div>
              <div class="namemc-card-body">
                <div class="namemc-field-group">
                  <label class="namemc-label">
                    <span>${profile?.isOnline ? 'Online UUID (Dashed)' : 'Offline UUID (MD5)'}</span>
                    <span class="namemc-hint-tag">Standard format</span>
                  </label>
                  <div class="namemc-input-copy">
                    <code>${activeUuid}</code>
                    <button class="btn btn-copy" data-copy="${activeUuid}">Copy</button>
                  </div>
                </div>

                <div class="namemc-field-group">
                  <label class="namemc-label">
                    <span>Trimmed UUID</span>
                    <span class="namemc-hint-tag">32 hex characters</span>
                  </label>
                  <div class="namemc-input-copy">
                    <code>${trimmed}</code>
                    <button class="btn btn-copy" data-copy="${trimmed}">Copy</button>
                  </div>
                </div>

                <div class="namemc-field-group">
                  <label class="namemc-label">
                    <span>IntArray UUID [I; ... ]</span>
                    <span class="namemc-hint-tag">Modern Minecraft 1.16+ NBT</span>
                  </label>
                  <div class="namemc-input-copy">
                    <code>${profile?.intArray || '[I;0,0,0,0]'}</code>
                    <button class="btn btn-copy" data-copy="${profile?.intArray || '[I;0,0,0,0]'}">Copy</button>
                  </div>
                </div>

                ${profile?.isOnline ? `
                  <div class="namemc-field-group">
                    <label class="namemc-label">
                      <span>Offline UUID (For cracked / LAN / Geyser)</span>
                      <span class="namemc-hint-tag">v3 MD5</span>
                    </label>
                    <div class="namemc-input-copy">
                      <code>${profile.offlineUuid}</code>
                      <button class="btn btn-copy" data-copy="${profile.offlineUuid}">Copy</button>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="namemc-card">
              <div class="namemc-card-header">
                <h3 class="namemc-card-title">In-Game Give & Head Commands</h3>
                <span class="namemc-badge-pill modern">1.20.5 - 1.21.x Ready</span>
              </div>
              <div class="namemc-card-body">
                <div class="namemc-field-group">
                  <label class="namemc-label">
                    <span>Modern /give Player Head (Item Components)</span>
                    <span class="namemc-hint-tag">1.20.5 - 1.21.x</span>
                  </label>
                  <div class="namemc-input-copy">
                    <code class="wrap-code">${modernGiveId}</code>
                    <button class="btn btn-copy" data-copy="${modernGiveId}">Copy</button>
                  </div>
                </div>

                ${modernGiveBase64 ? `
                  <div class="namemc-field-group">
                    <label class="namemc-label">
                      <span>Custom Base64 Texture Head (Permanent Skin)</span>
                      <span class="namemc-hint-tag">Permanent Skin</span>
                    </label>
                    <div class="namemc-input-copy">
                      <code class="wrap-code">${modernGiveBase64}</code>
                      <button class="btn btn-copy" data-copy="${modernGiveBase64}">Copy</button>
                    </div>
                  </div>
                ` : ''}

                <div class="namemc-field-group">
                  <label class="namemc-label">
                    <span>Legacy /give SkullOwner</span>
                    <span class="namemc-hint-tag">1.16 - 1.20.4</span>
                  </label>
                  <div class="namemc-input-copy">
                    <code class="wrap-code">${legacyGive}</code>
                    <button class="btn btn-copy" data-copy="${legacyGive}">Copy</button>
                  </div>
                </div>
              </div>
            </div>

            ${profile?.nameHistory && profile.nameHistory.length > 1 ? `
              <div class="namemc-card">
                <div class="namemc-card-header">
                  <h3 class="namemc-card-title">Username History</h3>
                  <span class="namemc-badge-pill">${profile.nameHistory.length} recorded</span>
                </div>
                <div class="namemc-card-body">
                  <div class="namemc-history-list">
                    ${profile.nameHistory.map((h, i) => `
                      <div class="namemc-history-item">
                        <span class="namemc-history-num">#${profile!.nameHistory.length - i}</span>
                        <span class="namemc-history-name">${escapeHtml(h.name)}</span>
                        ${h.changedToAt ? `
                          <span class="namemc-history-date">${new Date(h.changedToAt).toLocaleDateString()}</span>
                        ` : `<span class="namemc-history-date original">Original Name</span>`}
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents(): void {
    const input = container.querySelector<HTMLInputElement>('#namemc-input')
    const searchBtn = container.querySelector<HTMLButtonElement>('#namemc-search-btn')

    searchBtn?.addEventListener('click', () => {
      if (input && input.value.trim()) {
        currentTarget = input.value.trim()
        fetchProfile(currentTarget)
      }
    })

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        currentTarget = input.value.trim()
        fetchProfile(currentTarget)
      }
    })

    container.querySelectorAll<HTMLButtonElement>('.namemc-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target
        if (target) {
          currentTarget = target
          fetchProfile(currentTarget)
        }
      })
    })

    container.querySelectorAll<HTMLButtonElement>('.perspective-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        viewPerspective = (btn.dataset.view as '3d' | 'front' | 'head' | 'cape' | 'elytra') || '3d'
        render()
      })
    })

    container.querySelector('#namemc-quick-view-capes')?.addEventListener('click', () => {
      viewPerspective = 'cape'
      render()
    })

    container.querySelectorAll<HTMLButtonElement>('.namemc-mini-cape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const capeId = btn.dataset.capeId
        if (capeId) {
          const found = profile?.capes.find(c => c.id === capeId) || ICONIC_CAPES.find(c => c.id === capeId)
          if (found) {
            selectedCape = found
            attachment = 'cape'
            render()
            showToast(`Equipped ${found.name}!`)
          }
        }
      })
    })

    container.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy
        if (text) {
          await copyToClipboard(text)
          showToast('Copied to clipboard!')
        }
      })
    })

    if (viewPerspective === '3d') {
      const canvas = container.querySelector<HTMLCanvasElement>('#namemc-3d-canvas')
      if (canvas) {
        viewer3d = new SkinViewer3D(canvas)
        viewer3d.isSlim = profile?.model === 'slim'
        viewer3d.autoRotate = isSpinning
        viewer3d.showOuterLayers = showLayers
        viewer3d.backAttachment = attachment

        const trimmed = profile?.trimmedUuid || profile?.offlineTrimmedUuid || '069a79f444e94726a5befca90e38aaf5'
        const skinUrl = profile?.skinUrl || `https://crafthead.net/skin/${trimmed}`
        const skinImg = new Image()
        skinImg.crossOrigin = 'anonymous'
        skinImg.src = skinUrl
        skinImg.onload = () => {
          viewer3d?.setSkinTexture(skinImg)
        }
        skinImg.onerror = () => {
          const fallback = new Image()
          fallback.crossOrigin = 'anonymous'
          fallback.src = `https://mc-heads.net/skin/${trimmed}`
          fallback.onload = () => viewer3d?.setSkinTexture(fallback)
        }

        const activeCapeUrl = selectedCape?.url || profile?.capeUrl
        if (activeCapeUrl) {
          const capeImg = new Image()
          capeImg.crossOrigin = 'anonymous'
          capeImg.src = activeCapeUrl
          capeImg.onload = () => {
            viewer3d?.setCapeTexture(capeImg)
          }
        } else {
          viewer3d?.setCapeTexture(null)
        }

        container.querySelector('#namemc-tool-spin')?.addEventListener('click', (e) => {
          if (!viewer3d) return
          viewer3d.autoRotate = !viewer3d.autoRotate
          isSpinning = viewer3d.autoRotate
          ;(e.currentTarget as HTMLElement).classList.toggle('active', isSpinning)
        })

        container.querySelector('#namemc-tool-layer')?.addEventListener('click', (e) => {
          if (!viewer3d) return
          viewer3d.showOuterLayers = !viewer3d.showOuterLayers
          showLayers = viewer3d.showOuterLayers
          viewer3d.rebuildModel()
          ;(e.currentTarget as HTMLElement).classList.toggle('active', showLayers)
        })

        const updateAttachmentButtons = (newAttach: BackAttachment) => {
          attachment = newAttach
          if (viewer3d) {
            viewer3d.backAttachment = newAttach
            viewer3d.rebuildModel()
          }
          container.querySelector('#namemc-tool-cape')?.classList.toggle('active', newAttach === 'cape')
          container.querySelector('#namemc-tool-elytra')?.classList.toggle('active', newAttach === 'elytra')
          container.querySelector('#namemc-tool-none')?.classList.toggle('active', newAttach === 'none')
        }

        container.querySelector('#namemc-tool-cape')?.addEventListener('click', () => updateAttachmentButtons('cape'))
        container.querySelector('#namemc-tool-elytra')?.addEventListener('click', () => updateAttachmentButtons('elytra'))
        container.querySelector('#namemc-tool-none')?.addEventListener('click', () => updateAttachmentButtons('none'))

        container.querySelector('#namemc-tool-reset')?.addEventListener('click', () => {
          viewer3d?.resetCamera()
        })
      }
    }

    container.querySelectorAll<HTMLButtonElement>('.namemc-equip-cape-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const capeId = btn.dataset.capeId
        if (capeId) {
          const found = profile?.capes.find(c => c.id === capeId) || ICONIC_CAPES.find(c => c.id === capeId)
          if (found) {
            selectedCape = found
            attachment = 'cape'
            viewPerspective = '3d'
            render()
            showToast(`Equipped ${found.name} in 3D!`)
          }
        }
      })
    })

    if (viewPerspective === 'elytra') {
      const elytraCanvas = container.querySelector<HTMLCanvasElement>('#namemc-elytra-canvas')
      if (elytraCanvas) {
        drawElytra2D(elytraCanvas, selectedCape?.url || profile?.capeUrl || null)
      }

      container.querySelector('#namemc-elytra-inspect-3d')?.addEventListener('click', () => {
        attachment = 'elytra'
        viewPerspective = '3d'
        render()
      })
    }
  }

  fetchProfile(currentTarget)
}
