import { copyToClipboard, showToast, debounce } from '../../utils/helpers'

class FastNoise {
  private perm: Uint8Array = new Uint8Array(512)

  constructor(seed: bigint) {
    const p = new Uint8Array(256)
    for (let i = 0; i < 256; i++) p[i] = i

    let s = (seed ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn
    for (let i = 255; i > 0; i--) {
      s = (s * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn
      const j = Number(s >> 24n) % (i + 1)
      const tmp = p[i]
      p[i] = p[j]
      p[j] = tmp
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
    }
  }

  private grad2d(hash: number, x: number, y: number): number {
    const h = hash & 7
    const u = h < 4 ? x : y
    const v = h < 4 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v)
  }

  public noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
    const s = (x + y) * F2
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)

    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0
    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = x - X0
    const y0 = y - Y0

    let i1 = 0
    let j1 = 0
    if (x0 > y0) { i1 = 1; j1 = 0 } else { i1 = 0; j1 = 1 }

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1.0 + 2.0 * G2
    const y2 = y0 - 1.0 + 2.0 * G2

    const ii = i & 255
    const jj = j & 255

    let n0 = 0
    let n1 = 0
    let n2 = 0

    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 > 0) {
      t0 *= t0
      n0 = t0 * t0 * this.grad2d(this.perm[ii + this.perm[jj]], x0, y0)
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 > 0) {
      t1 *= t1
      n1 = t1 * t1 * this.grad2d(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1)
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 > 0) {
      t2 *= t2
      n2 = t2 * t2 * this.grad2d(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2)
    }

    return 70.0 * (n0 + n1 + n2)
  }

  public octaveNoise(x: number, y: number, octaves: number = 3): number {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2.0
    }

    return total / maxValue
  }
}

export interface BiomeDef {
  id: string
  name: string
  color: string
}

export const BIOMES: Record<string, BiomeDef> = {
  deep_ocean: { id: 'deep_ocean', name: 'Deep Ocean', color: '#000048' },
  ocean: { id: 'ocean', name: 'Ocean', color: '#001868' },
  warm_ocean: { id: 'warm_ocean', name: 'Warm Ocean', color: '#006c9a' },
  lukewarm_ocean: { id: 'lukewarm_ocean', name: 'Lukewarm Ocean', color: '#005882' },
  cold_ocean: { id: 'cold_ocean', name: 'Cold Ocean', color: '#203870' },
  deep_frozen_ocean: { id: 'deep_frozen_ocean', name: 'Deep Frozen Ocean', color: '#404090' },
  frozen_ocean: { id: 'frozen_ocean', name: 'Frozen Ocean', color: '#7070a6' },
  
  plains: { id: 'plains', name: 'Plains', color: '#8db360' },
  sunflower_plains: { id: 'sunflower_plains', name: 'Sunflower Plains', color: '#b5db60' },
  meadow: { id: 'meadow', name: 'Meadow', color: '#68a45c' },
  cherry_grove: { id: 'cherry_grove', name: 'Cherry Grove', color: '#f8a3bc' },
  mushroom_fields: { id: 'mushroom_fields', name: 'Mushroom Fields', color: '#907080' },

  forest: { id: 'forest', name: 'Forest', color: '#056621' },
  flower_forest: { id: 'flower_forest', name: 'Flower Forest', color: '#2d8e49' },
  birch_forest: { id: 'birch_forest', name: 'Birch Forest', color: '#307444' },
  dark_forest: { id: 'dark_forest', name: 'Dark Forest', color: '#143307' },

  taiga: { id: 'taiga', name: 'Taiga', color: '#0b4d2c' },
  snowy_taiga: { id: 'snowy_taiga', name: 'Snowy Taiga', color: '#31554a' },
  snowy_plains: { id: 'snowy_plains', name: 'Snowy Plains', color: '#f0f4f8' },
  ice_spikes: { id: 'ice_spikes', name: 'Ice Spikes', color: '#b0e0e6' },
  jagged_peaks: { id: 'jagged_peaks', name: 'Jagged Peaks', color: '#e0e0e0' },
  frozen_peaks: { id: 'frozen_peaks', name: 'Frozen Peaks', color: '#c0d8e0' },
  stony_peaks: { id: 'stony_peaks', name: 'Stony Peaks', color: '#888888' },

  jungle: { id: 'jungle', name: 'Jungle', color: '#537b09' },
  bamboo_jungle: { id: 'bamboo_jungle', name: 'Bamboo Jungle', color: '#768e14' },
  swamp: { id: 'swamp', name: 'Swamp', color: '#2fa672' },
  mangrove_swamp: { id: 'mangrove_swamp', name: 'Mangrove Swamp', color: '#6a7834' },

  desert: { id: 'desert', name: 'Desert', color: '#fa9418' },
  badlands: { id: 'badlands', name: 'Badlands', color: '#d94515' },
  eroded_badlands: { id: 'eroded_badlands', name: 'Eroded Badlands', color: '#ff6622' },
  savanna: { id: 'savanna', name: 'Savanna', color: '#bdb25f' },

  nether_wastes: { id: 'nether_wastes', name: 'Nether Wastes', color: '#682020' },
  crimson_forest: { id: 'crimson_forest', name: 'Crimson Forest', color: '#981a1a' },
  warped_forest: { id: 'warped_forest', name: 'Warped Forest', color: '#1b5c5e' },
  soul_sand_valley: { id: 'soul_sand_valley', name: 'Soul Sand Valley', color: '#4d3a2e' },
  basalt_deltas: { id: 'basalt_deltas', name: 'Basalt Deltas', color: '#403636' },

  the_end: { id: 'the_end', name: 'The End', color: '#8b8f60' },
  end_highlands: { id: 'end_highlands', name: 'End Highlands', color: '#c3c78d' },
  end_midlands: { id: 'end_midlands', name: 'End Midlands', color: '#b0b47b' },
  end_barrens: { id: 'end_barrens', name: 'End Barrens', color: '#7d8056' },
}

export type StructureType =
  | 'spawn'
  | 'village'
  | 'spawner'
  | 'mineshaft'
  | 'stronghold'
  | 'ancient_city'
  | 'monument'
  | 'desert_temple'
  | 'jungle_temple'
  | 'witch_hut'
  | 'outpost'
  | 'mansion'
  | 'shipwreck'
  | 'buried_treasure'
  | 'ruined_portal'
  | 'trial_chambers'
  | 'fortress'
  | 'bastion'
  | 'nether_fossil'
  | 'end_city'
  | 'end_gateway'

export interface StructureDef {
  id: StructureType
  name: string
  symbol: string
  color: string
  dim: 'overworld' | 'nether' | 'end'
}

export const STRUCTURE_CATALOG: Record<StructureType, StructureDef> = {
  spawn: { id: 'spawn', name: 'Spawn Point', symbol: 'SP', color: '#ff3333', dim: 'overworld' },
  village: { id: 'village', name: 'Village', symbol: 'VL', color: '#f59e0b', dim: 'overworld' },
  spawner: { id: 'spawner', name: 'Dungeon Spawner', symbol: 'DS', color: '#94a3b8', dim: 'overworld' },
  mineshaft: { id: 'mineshaft', name: 'Mineshaft', symbol: 'MS', color: '#854d0e', dim: 'overworld' },
  stronghold: { id: 'stronghold', name: 'Stronghold', symbol: 'SH', color: '#10b981', dim: 'overworld' },
  ancient_city: { id: 'ancient_city', name: 'Ancient City', symbol: 'AC', color: '#06b6d4', dim: 'overworld' },
  monument: { id: 'monument', name: 'Ocean Monument', symbol: 'OM', color: '#38bdf8', dim: 'overworld' },
  desert_temple: { id: 'desert_temple', name: 'Desert Pyramid', symbol: 'DT', color: '#eab308', dim: 'overworld' },
  jungle_temple: { id: 'jungle_temple', name: 'Jungle Temple', symbol: 'JT', color: '#22c55e', dim: 'overworld' },
  witch_hut: { id: 'witch_hut', name: 'Witch Hut', symbol: 'WH', color: '#a855f7', dim: 'overworld' },
  outpost: { id: 'outpost', name: 'Pillager Outpost', symbol: 'PO', color: '#ef4444', dim: 'overworld' },
  mansion: { id: 'mansion', name: 'Woodland Mansion', symbol: 'WM', color: '#4d7c0f', dim: 'overworld' },
  shipwreck: { id: 'shipwreck', name: 'Shipwreck', symbol: 'SW', color: '#0284c7', dim: 'overworld' },
  buried_treasure: { id: 'buried_treasure', name: 'Buried Treasure', symbol: 'BT', color: '#fbbf24', dim: 'overworld' },
  ruined_portal: { id: 'ruined_portal', name: 'Ruined Portal', symbol: 'RP', color: '#c084fc', dim: 'overworld' },
  trial_chambers: { id: 'trial_chambers', name: 'Trial Chamber', symbol: 'TC', color: '#f97316', dim: 'overworld' },
  
  fortress: { id: 'fortress', name: 'Nether Fortress', symbol: 'NF', color: '#dc2626', dim: 'nether' },
  bastion: { id: 'bastion', name: 'Bastion Remnant', symbol: 'BR', color: '#78716c', dim: 'nether' },
  nether_fossil: { id: 'nether_fossil', name: 'Nether Fossil', symbol: 'FO', color: '#f5f5f4', dim: 'nether' },

  end_city: { id: 'end_city', name: 'End City', symbol: 'EC', color: '#e879f9', dim: 'end' },
  end_gateway: { id: 'end_gateway', name: 'End Gateway', symbol: 'EG', color: '#818cf8', dim: 'end' },
}

export interface PlacedStructure {
  id: StructureType
  name: string
  symbol: string
  color: string
  x: number
  z: number
  y?: number
  subType?: string
}

interface SeedMapState {
  seedInput: string
  dimension: 'overworld' | 'nether' | 'end'
  centerX: number
  centerZ: number
  zoom: number
  showSlimeChunks: boolean
  showGrid: boolean
  highlightBiome: string
  selectedStructure: PlacedStructure | null
  activeFilters: Record<StructureType, boolean>
  showFiltersDrawer: boolean
}

const state: SeedMapState = {
  seedInput: '1234567890',
  dimension: 'overworld',
  centerX: 0,
  centerZ: 0,
  zoom: 1.0,
  showSlimeChunks: false,
  showGrid: true,
  highlightBiome: 'none',
  selectedStructure: null,
  activeFilters: {
    spawn: true,
    village: true,
    spawner: true,
    mineshaft: true,
    stronghold: true,
    ancient_city: true,
    monument: true,
    desert_temple: true,
    jungle_temple: true,
    witch_hut: true,
    outpost: true,
    mansion: true,
    shipwreck: true,
    buried_treasure: true,
    ruined_portal: true,
    trial_chambers: true,
    fortress: true,
    bastion: true,
    nether_fossil: true,
    end_city: true,
    end_gateway: true,
  },
  showFiltersDrawer: false,
}

function parseSeed(input: string): bigint {
  try {
    const trimmed = input.trim()
    if (/^-?\d+$/.test(trimmed)) {
      return BigInt(trimmed)
    }
    let hash = 0n
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash * 31n + BigInt(trimmed.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn
    }
    return hash
  } catch {
    return 1234567890n
  }
}

function isSlimeChunk(seed: bigint, chunkX: number, chunkZ: number): boolean {
  let s = (seed +
    BigInt(chunkX * chunkX * 4987142) +
    BigInt(chunkX * 5947611) +
    BigInt(chunkZ * chunkZ) * 4392871n +
    BigInt(chunkZ * 389711) ^ 0x3AD8025Fn) & 0xFFFFFFFFFFFFFFFFn
  let rng = (s ^ 0x5DEECE66Dn) & 0xFFFFFFFFFFFFn
  rng = (rng * 0x5DEECE66Dn + 0xBn) & 0xFFFFFFFFFFFFn
  return Number(rng >> 17n) % 10 === 0
}

function sampleOverworldBiome(nTemp: FastNoise, nHum: FastNoise, nCont: FastNoise, nEro: FastNoise, nWeird: FastNoise, x: number, z: number): BiomeDef {
  const scale = 0.0011
  const cont = nCont.octaveNoise(x * scale, z * scale, 3)
  const temp = nTemp.octaveNoise(x * scale, z * scale, 3)
  const hum = nHum.octaveNoise(x * scale, z * scale, 3)
  const ero = nEro.octaveNoise(x * scale, z * scale, 3)
  const weird = nWeird.octaveNoise(x * scale, z * scale, 3)

  if (cont < -0.38) {
    if (temp < -0.3) return BIOMES.deep_frozen_ocean
    if (temp < 0.0) return BIOMES.cold_ocean
    return BIOMES.deep_ocean
  }
  if (cont < -0.12) {
    if (temp < -0.3) return BIOMES.frozen_ocean
    if (temp > 0.35) return BIOMES.warm_ocean
    if (temp > 0.1) return BIOMES.lukewarm_ocean
    return BIOMES.ocean
  }

  if (cont > -0.12 && cont < 0.05 && weird > 0.65 && ero < -0.3) {
    return BIOMES.mushroom_fields
  }

  if (cont > 0.52) {
    if (temp < -0.3) return BIOMES.jagged_peaks
    if (temp < -0.05) return BIOMES.frozen_peaks
    if (temp < 0.15) {
      if (hum > 0.25) return BIOMES.cherry_grove
      return BIOMES.meadow
    }
    return BIOMES.stony_peaks
  }

  if (temp < -0.38) {
    if (hum < -0.15 && ero < 0.0) return BIOMES.ice_spikes
    if (hum < 0.15) return BIOMES.snowy_plains
    return BIOMES.snowy_taiga
  }

  if (temp < -0.05) {
    if (hum > 0.0) return BIOMES.taiga
    return BIOMES.plains
  }

  if (temp > 0.38) {
    if (hum < -0.3) return ero > 0.2 ? BIOMES.eroded_badlands : BIOMES.badlands
    if (hum < -0.1) return BIOMES.desert
    if (hum < 0.25) return BIOMES.savanna
    if (weird > 0.3) return BIOMES.bamboo_jungle
    return BIOMES.jungle
  }

  if (hum > 0.45) return BIOMES.mangrove_swamp
  if (hum > 0.25) return BIOMES.swamp
  if (hum < -0.3) return BIOMES.sunflower_plains
  if (hum < 0.0) return BIOMES.birch_forest
  if (weird > 0.4) return BIOMES.flower_forest
  return BIOMES.dark_forest
}

function sampleNetherBiome(nTemp: FastNoise, nHum: FastNoise, x: number, z: number): BiomeDef {
  const scale = 0.002
  const temp = nTemp.octaveNoise(x * scale, z * scale, 2)
  const hum = nHum.octaveNoise(x * scale, z * scale, 2)

  if (temp < -0.3) return BIOMES.soul_sand_valley
  if (temp > 0.3 && hum < -0.1) return BIOMES.basalt_deltas
  if (hum > 0.25) return BIOMES.warped_forest
  if (hum < -0.25) return BIOMES.crimson_forest
  return BIOMES.nether_wastes
}

function sampleEndBiome(x: number, z: number): BiomeDef {
  const dist = Math.hypot(x, z)
  if (dist < 1000) return BIOMES.the_end

  const ring = Math.floor(dist / 300)
  if (ring % 3 === 0) return BIOMES.end_highlands
  if (ring % 3 === 1) return BIOMES.end_midlands
  return BIOMES.end_barrens
}

function generateVisibleStructures(seed: bigint, minX: number, maxX: number, minZ: number, maxZ: number): PlacedStructure[] {
  const structures: PlacedStructure[] = []
  const filters = state.activeFilters

  if (state.dimension === 'overworld') {
    if (filters.spawn && minX <= 0 && maxX >= 0 && minZ <= 0 && maxZ >= 0) {
      structures.push({ id: 'spawn', name: 'Spawn Point', symbol: 'SP', color: '#ff3333', x: 0, z: 0, y: 64 })
    }

    const step = 280
    const startGX = Math.floor(minX / step) * step
    const endGX = Math.ceil(maxX / step) * step
    const startGZ = Math.floor(minZ / step) * step
    const endGZ = Math.ceil(maxZ / step) * step

    for (let gx = startGX; gx <= endGX; gx += step) {
      for (let gz = startGZ; gz <= endGZ; gz += step) {
        const h = Number(((seed + BigInt(gx * 341873128712 + gz * 132897987541)) ^ 0x5DEECE66Dn) & 0xFFFFF7n)
        const ox = gx + (h % 220)
        const oz = gz + ((h >> 4) % 220)
        const typePick = h % 14

        if (typePick === 0 && filters.village) {
          structures.push({ id: 'village', name: 'Village', symbol: 'VL', color: '#f59e0b', x: ox, z: oz, y: 70 })
        } else if (typePick === 1 && filters.ancient_city) {
          structures.push({ id: 'ancient_city', name: 'Ancient City', symbol: 'AC', color: '#06b6d4', x: ox, z: oz, y: -51 })
        } else if (typePick === 2 && filters.monument) {
          structures.push({ id: 'monument', name: 'Ocean Monument', symbol: 'OM', color: '#38bdf8', x: ox, z: oz, y: 45 })
        } else if (typePick === 3 && filters.desert_temple) {
          structures.push({ id: 'desert_temple', name: 'Desert Pyramid', symbol: 'DT', color: '#eab308', x: ox, z: oz, y: 65 })
        } else if (typePick === 4 && filters.jungle_temple) {
          structures.push({ id: 'jungle_temple', name: 'Jungle Temple', symbol: 'JT', color: '#22c55e', x: ox, z: oz, y: 68 })
        } else if (typePick === 5 && filters.witch_hut) {
          structures.push({ id: 'witch_hut', name: 'Witch Hut', symbol: 'WH', color: '#a855f7', x: ox, z: oz, y: 64 })
        } else if (typePick === 6 && filters.outpost) {
          structures.push({ id: 'outpost', name: 'Pillager Outpost', symbol: 'PO', color: '#ef4444', x: ox, z: oz, y: 80 })
        } else if (typePick === 7 && filters.spawner) {
          const mType = (h % 3 === 0) ? 'Skeleton' : (h % 3 === 1) ? 'Zombie' : 'Spider'
          structures.push({ id: 'spawner', name: `${mType} Spawner`, symbol: 'DS', color: '#94a3b8', x: ox, z: oz, y: 32, subType: mType })
        } else if (typePick === 8 && filters.mineshaft) {
          structures.push({ id: 'mineshaft', name: 'Mineshaft', symbol: 'MS', color: '#854d0e', x: ox, z: oz, y: 24 })
        } else if (typePick === 9 && filters.trial_chambers) {
          structures.push({ id: 'trial_chambers', name: 'Trial Chamber', symbol: 'TC', color: '#f97316', x: ox, z: oz, y: -15 })
        } else if (typePick === 10 && filters.shipwreck) {
          structures.push({ id: 'shipwreck', name: 'Shipwreck', symbol: 'SW', color: '#0284c7', x: ox, z: oz, y: 52 })
        } else if (typePick === 11 && filters.buried_treasure) {
          structures.push({ id: 'buried_treasure', name: 'Buried Treasure', symbol: 'BT', color: '#fbbf24', x: ox, z: oz, y: 60 })
        } else if (typePick === 12 && filters.ruined_portal) {
          structures.push({ id: 'ruined_portal', name: 'Ruined Portal', symbol: 'RP', color: '#c084fc', x: ox, z: oz, y: 65 })
        } else if (typePick === 13 && filters.mansion && (h % 4 === 0)) {
          structures.push({ id: 'mansion', name: 'Woodland Mansion', symbol: 'WM', color: '#4d7c0f', x: ox, z: oz, y: 72 })
        }
      }
    }

    if (filters.stronghold) {
      for (let i = 0; i < 3; i++) {
        const baseAngle = (i * (2 * Math.PI / 3)) + Number((seed ^ 12345n) % 1000n) * 0.005
        const dist = 1600 + Number((seed ^ BigInt(i * 997)) % 400n)
        const sx = Math.round(Math.cos(baseAngle) * dist)
        const sz = Math.round(Math.sin(baseAngle) * dist)
        if (sx >= minX - 80 && sx <= maxX + 80 && sz >= minZ - 80 && sz <= maxZ + 80) {
          structures.push({ id: 'stronghold', name: `Stronghold (Ring 1 #${i + 1})`, symbol: 'SH', color: '#10b981', x: sx, z: sz, y: 28 })
        }
      }
    }
  } else if (state.dimension === 'nether') {
    const step = 384
    const startGX = Math.floor(minX / step) * step
    const endGX = Math.ceil(maxX / step) * step
    const startGZ = Math.floor(minZ / step) * step
    const endGZ = Math.ceil(maxZ / step) * step

    for (let gx = startGX; gx <= endGX; gx += step) {
      for (let gz = startGZ; gz <= endGZ; gz += step) {
        const h = Number(((seed + BigInt(gx * 5187123 + gz * 9871625)) ^ 0x5DEECE66Dn) & 0xFFFFF7n)
        const ox = gx + (h % 300)
        const oz = gz + ((h >> 4) % 300)

        const typePick = h % 3
        if (typePick === 0 && filters.fortress) {
          structures.push({ id: 'fortress', name: 'Nether Fortress', symbol: 'NF', color: '#dc2626', x: ox, z: oz, y: 64 })
        } else if (typePick === 1 && filters.bastion) {
          structures.push({ id: 'bastion', name: 'Bastion Remnant', symbol: 'BR', color: '#78716c', x: ox, z: oz, y: 55 })
        } else if (typePick === 2 && filters.ruined_portal) {
          structures.push({ id: 'ruined_portal', name: 'Ruined Portal', symbol: 'RP', color: '#c084fc', x: ox, z: oz, y: 60 })
        }
      }
    }
  } else if (state.dimension === 'end') {
    if (minX <= 0 && maxX >= 0 && minZ <= 0 && maxZ >= 0) {
      structures.push({ id: 'spawn', name: 'Dragon Fight & Exit Portal', symbol: 'DP', color: '#818cf8', x: 0, z: 0, y: 65 })
    }

    if (filters.end_gateway) {
      for (let i = 0; i < 20; i++) {
        const ang = (i * (2 * Math.PI / 20))
        const gx = Math.round(Math.cos(ang) * 1000)
        const gz = Math.round(Math.sin(ang) * 1000)
        if (gx >= minX - 80 && gx <= maxX + 80 && gz >= minZ - 80 && gz <= maxZ + 80) {
          structures.push({ id: 'end_gateway', name: `End Gateway #${i + 1}`, symbol: 'EG', color: '#a855f7', x: gx, z: gz, y: 75 })
        }
      }
    }

    if (filters.end_city) {
      const step = 320
      const startGX = Math.floor(minX / step) * step
      const endGX = Math.ceil(maxX / step) * step
      const startGZ = Math.floor(minZ / step) * step
      const endGZ = Math.ceil(maxZ / step) * step

      for (let gx = startGX; gx <= endGX; gx += step) {
        for (let gz = startGZ; gz <= endGZ; gz += step) {
          if (Math.hypot(gx, gz) < 1000) continue
          const h = Number(((seed + BigInt(gx * 761234 + gz * 349812)) ^ 0x5DEECE66Dn) & 0xFFFFF7n)
          if (h % 3 === 0) {
            const ox = gx + (h % 220)
            const oz = gz + ((h >> 4) % 220)
            structures.push({
              id: 'end_city',
              name: (h % 2 === 0) ? 'End City & Elytra Ship' : 'End City',
              symbol: 'EC',
              color: '#e879f9',
              x: ox,
              z: oz,
              y: 80,
            })
          }
        }
      }
    }
  }

  return structures
}

let cachedStructures: PlacedStructure[] = []

export function mount(container: HTMLElement): void {
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let mapStartX = 0
  let mapStartZ = 0

  function renderMap(): void {
    const canvas = document.getElementById('seed-canvas') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const seed = parseSeed(state.seedInput)

    const nTemp = new FastNoise(seed)
    const nHum = new FastNoise(seed + 1000n)
    const nCont = new FastNoise(seed + 2000n)
    const nEro = new FastNoise(seed + 3000n)
    const nWeird = new FastNoise(seed + 4000n)

    const blockSize = 4 / state.zoom
    const blocksWide = w * blockSize
    const blocksHigh = h * blockSize

    const minX = state.centerX - blocksWide / 2
    const maxX = state.centerX + blocksWide / 2
    const minZ = state.centerZ - blocksHigh / 2
    const maxZ = state.centerZ + blocksHigh / 2

    const imgData = ctx.createImageData(w, h)
    const data = imgData.data

    const step = 2
    const highlight = state.highlightBiome

    for (let py = 0; py < h; py += step) {
      for (let px = 0; px < w; px += step) {
        const bx = minX + (px / w) * blocksWide
        const bz = minZ + (py / h) * blocksHigh

        let biome: BiomeDef
        if (state.dimension === 'overworld') {
          biome = sampleOverworldBiome(nTemp, nHum, nCont, nEro, nWeird, bx, bz)
        } else if (state.dimension === 'nether') {
          biome = sampleNetherBiome(nTemp, nHum, bx, bz)
        } else {
          biome = sampleEndBiome(bx, bz)
        }

        const hex = biome.color
        let r = parseInt(hex.slice(1, 3), 16)
        let g = parseInt(hex.slice(3, 5), 16)
        let b = parseInt(hex.slice(5, 7), 16)

        if (highlight !== 'none') {
          if (biome.id === highlight) {
            r = Math.min(255, Math.round(r * 1.35))
            g = Math.min(255, Math.round(g * 1.35))
            b = Math.min(255, Math.round(b * 1.35))
          } else {
            r = Math.round(r * 0.18)
            g = Math.round(g * 0.18)
            b = Math.round(b * 0.18)
          }
        }

        for (let dy = 0; dy < step && py + dy < h; dy++) {
          for (let dx = 0; dx < step && px + dx < w; dx++) {
            const idx = ((py + dy) * w + (px + dx)) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
            data[idx + 3] = 255
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0)

    if (state.dimension === 'overworld' && state.showSlimeChunks) {
      ctx.fillStyle = 'rgba(85, 255, 85, 0.3)'
      ctx.strokeStyle = 'rgba(85, 255, 85, 0.65)'
      ctx.lineWidth = 1

      const minChunkX = Math.floor(minX / 16)
      const maxChunkX = Math.ceil(maxX / 16)
      const minChunkZ = Math.floor(minZ / 16)
      const maxChunkZ = Math.ceil(maxZ / 16)

      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        for (let cz = minChunkZ; cz <= maxChunkZ; cz++) {
          if (isSlimeChunk(seed, cx, cz)) {
            const sx = ((cx * 16 - minX) / blocksWide) * w
            const sz = ((cz * 16 - minZ) / blocksHigh) * h
            const sw = (16 / blocksWide) * w
            const sh = (16 / blocksHigh) * h
            ctx.fillRect(sx, sz, sw, sh)
            ctx.strokeRect(sx, sz, sw, sh)
          }
        }
      }
    }

    if (state.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'

      const gridInterval = state.zoom < 0.5 ? 1024 : state.zoom > 1.5 ? 256 : 512
      const firstGridX = Math.ceil(minX / gridInterval) * gridInterval
      for (let gx = firstGridX; gx <= maxX; gx += gridInterval) {
        const cx = ((gx - minX) / blocksWide) * w
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
        ctx.fillText(`X:${gx}`, cx + 4, 12)
      }

      const firstGridZ = Math.ceil(minZ / gridInterval) * gridInterval
      for (let gz = firstGridZ; gz <= maxZ; gz += gridInterval) {
        const cy = ((gz - minZ) / blocksHigh) * h
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
        ctx.fillText(`Z:${gz}`, 4, cy - 4)
      }
    }

    if (minX <= 0 && maxX >= 0 && minZ <= 0 && maxZ >= 0) {
      const ox = ((0 - minX) / blocksWide) * w
      const oz = ((0 - minZ) / blocksHigh) * h
      ctx.fillStyle = '#ff3333'
      ctx.beginPath()
      ctx.arc(ox, oz, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    cachedStructures = generateVisibleStructures(seed, minX, maxX, minZ, maxZ)
    cachedStructures.forEach(st => {
      const sx = ((st.x - minX) / blocksWide) * w
      const sz = ((st.z - minZ) / blocksHigh) * h

      ctx.save()
      ctx.translate(sx, sz)

      ctx.fillStyle = st.color
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.2

      if (st.id === 'stronghold' || st.id === 'monument' || st.id === 'end_city') {
        ctx.beginPath()
        ctx.moveTo(0, -6); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0); ctx.closePath()
        ctx.fill(); ctx.stroke()
      } else if (st.id === 'village' || st.id === 'ancient_city' || st.id === 'fortress') {
        ctx.fillRect(-5, -5, 10, 10)
        ctx.strokeRect(-5, -5, 10, 10)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, 5, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      }

      ctx.restore()

      if (state.selectedStructure && state.selectedStructure.x === st.x && state.selectedStructure.z === st.z) {
        ctx.strokeStyle = '#ff3333'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(sx, sz, 10, 0, Math.PI * 2)
        ctx.stroke()
      }
    })

    const crossX = w / 2
    const crossY = h / 2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(crossX - 6, crossY); ctx.lineTo(crossX + 6, crossY)
    ctx.moveTo(crossX, crossY - 6); ctx.lineTo(crossX, crossY + 6)
    ctx.stroke()
  }

  const debouncedRender = debounce(renderMap, 60)

  function updateSelectedPopup(st: PlacedStructure | null): void {
    const popup = document.getElementById('sm-selected-popup')
    if (!popup) return

    if (!st) {
      popup.classList.add('hidden')
      return
    }

    const dist = Math.round(Math.hypot(st.x, st.z))
    const chunkX = Math.floor(st.x / 16)
    const chunkZ = Math.floor(st.z / 16)

    popup.classList.remove('hidden')
    popup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div>
          <span style="font-weight: 600; font-size: 0.86rem; color: #ffffff;">${st.name}</span>
          <span class="font-mono" style="font-size: 0.76rem; color: var(--text-secondary); margin-left: 8px;">X:${st.x} Z:${st.z} (Y:${st.y ?? 64}) • Chunk [${chunkX}, ${chunkZ}] • ${dist}m from origin</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-sm btn-primary" id="sm-popup-tp">Copy /tp</button>
          <button class="btn btn-sm btn-secondary" id="sm-popup-close">Close</button>
        </div>
      </div>
    `

    document.getElementById('sm-popup-tp')?.addEventListener('click', async () => {
      await copyToClipboard(`/tp @p ${st.x} ${st.y ?? '~'} ${st.z}`)
      showToast(`Copied /tp @p ${st.x} ${st.y ?? '~'} ${st.z}`)
    })

    document.getElementById('sm-popup-close')?.addEventListener('click', () => {
      state.selectedStructure = null
      updateSelectedPopup(null)
      renderMap()
    })
  }

  container.innerHTML = `
    <div class="panel" style="position: relative; display: flex; flex-direction: column; min-height: 640px;">
      <!-- Clean Single Top Toolbar -->
      <div class="panel-header" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: var(--bg-surface);">
        <!-- Left: Seed & Dimension -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Seed:</span>
          <input type="text" id="sm-seed" class="form-input font-mono" value="${state.seedInput}" style="width: 155px; padding: 4px 8px; font-size: 0.82rem;" placeholder="Seed..." />
          <button class="btn btn-sm btn-secondary" id="sm-rnd-seed">Random</button>
          <button class="btn btn-sm btn-secondary" id="sm-copy-seed-btn">Copy</button>

          <div class="form-divider" style="height: 16px; margin: 0 4px; border-left: 1px solid var(--border-default);"></div>

          <!-- Dimension Tabs -->
          <div class="output-tabs" style="margin: 0; padding: 2px;">
            <button class="output-tab ${state.dimension === 'overworld' ? 'active' : ''}" data-sm-dim="overworld">Overworld</button>
            <button class="output-tab ${state.dimension === 'nether' ? 'active' : ''}" data-sm-dim="nether">Nether</button>
            <button class="output-tab ${state.dimension === 'end' ? 'active' : ''}" data-sm-dim="end">The End</button>
          </div>
        </div>

        <!-- Right: Filter Drawer Toggle, Biome Filter & Coords -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-secondary" id="sm-toggle-filters-btn">
            <span>Structures</span>
            <span class="badge badge-accent" id="sm-filters-count" style="font-size: 0.68rem; padding: 1px 5px;">Filters</span>
          </button>

          <select id="sm-biome-highlight" class="form-select select-sm" style="max-width: 140px;">
            <option value="none">All Biomes</option>
            <option value="cherry_grove">Cherry Grove</option>
            <option value="mushroom_fields">Mushroom Fields</option>
            <option value="ice_spikes">Ice Spikes</option>
            <option value="eroded_badlands">Eroded Badlands</option>
            <option value="mangrove_swamp">Mangrove Swamp</option>
            <option value="bamboo_jungle">Bamboo Jungle</option>
            <option value="plains">Plains</option>
            <option value="dark_forest">Dark Forest</option>
            <option value="jagged_peaks">Jagged Peaks</option>
            <option value="desert">Desert</option>
            <option value="badlands">Badlands</option>
            <option value="crimson_forest">Crimson Forest</option>
            <option value="warped_forest">Warped Forest</option>
            <option value="the_end">The End</option>
          </select>

          <div class="number-stepper" style="max-width: 85px;">
            <span class="axis-label" style="padding-left: 6px;">X:</span>
            <input type="number" id="sm-pos-x" class="form-input text-center" value="${state.centerX}" />
          </div>
          <div class="number-stepper" style="max-width: 85px;">
            <span class="axis-label" style="padding-left: 6px;">Z:</span>
            <input type="number" id="sm-pos-z" class="form-input text-center" value="${state.centerZ}" />
          </div>
          <button class="btn btn-sm btn-secondary" id="sm-go-coords">Go</button>
          <button class="btn btn-sm btn-secondary" id="sm-export-png">Export</button>
        </div>
      </div>

      <!-- Collapsible Filters Drawer -->
      <div id="sm-filters-drawer" class="sm-filters-drawer ${state.showFiltersDrawer ? '' : 'hidden'}">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Visible Structures</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" id="sm-filter-all-on" style="font-size: 0.72rem; padding: 2px 6px;">All</button>
            <button class="btn btn-sm btn-secondary" id="sm-filter-all-off" style="font-size: 0.72rem; padding: 2px 6px;">None</button>
            <button class="btn btn-sm btn-secondary" id="sm-close-filters-btn" style="font-size: 0.72rem; padding: 2px 6px;">Close</button>
          </div>
        </div>
        <div class="seed-filter-grid" id="sm-structures-filter-grid"></div>
        <div style="margin-top: 8px; display: flex; gap: 16px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
          <label class="form-checkbox" style="font-size: 0.78rem;">
            <input type="checkbox" id="sm-chk-slime" ${state.showSlimeChunks ? 'checked' : ''} />
            <span>Slime Chunks Overlay</span>
          </label>
          <label class="form-checkbox" style="font-size: 0.78rem;">
            <input type="checkbox" id="sm-chk-grid" ${state.showGrid ? 'checked' : ''} />
            <span>Coordinate Grid</span>
          </label>
        </div>
      </div>

      <!-- Map Viewport -->
      <div class="panel-body" style="padding: 0; flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #050508; position: relative;">
        <canvas id="seed-canvas" width="880" height="560" class="seed-map-canvas"></canvas>

        <!-- Clean HUD (Bottom Left) -->
        <div id="sm-hover-hud" class="sm-map-hud">
          <div id="sm-hud-biome" style="font-weight: 600; font-size: 0.82rem; color: #ffffff;">Plains</div>
          <div id="sm-hud-coords" class="font-mono" style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;">X: 0, Z: 0 (Y: ~64)</div>
          <div id="sm-hud-chunk" class="font-mono" style="font-size: 0.7rem; color: var(--text-tertiary);">Chunk [0, 0] • Region r.0.0.mca</div>
          <div id="sm-hud-near" style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 2px;"></div>
        </div>

        <!-- Selected Structure Floating Bottom Card -->
        <div id="sm-selected-popup" class="sm-selected-popup hidden"></div>

        <!-- Floating Zoom Controls (Bottom Right) -->
        <div class="sm-map-zoom-hud">
          <button class="btn btn-sm btn-secondary" id="sm-go-spawn" title="Center Origin">Center (0,0)</button>
          <div class="form-divider" style="margin: 0 4px; height: 16px; border-left: 1px solid var(--border-default);"></div>
          <button class="btn btn-sm btn-secondary" id="sm-zoom-out">-</button>
          <span id="sm-zoom-label" class="badge" style="min-width: 42px; text-align: center;">${(1 / state.zoom).toFixed(1)}:1</span>
          <button class="btn btn-sm btn-secondary" id="sm-zoom-in">+</button>
        </div>

        <!-- Tooltip on Hover -->
        <div id="seed-tooltip" class="seed-map-tooltip hidden"></div>
      </div>
    </div>
  `

  function renderFilterCheckboxes(): void {
    const grid = document.getElementById('sm-structures-filter-grid')
    if (!grid) return

    const dim = state.dimension
    const activeEntries = Object.entries(STRUCTURE_CATALOG).filter(([_, def]) => def.dim === dim || (dim === 'overworld' && def.dim === 'overworld'))

    grid.innerHTML = activeEntries.map(([id, def]) => {
      const isChecked = state.activeFilters[id as StructureType] !== false
      return `
        <label class="seed-filter-item">
          <input type="checkbox" data-filter-id="${id}" ${isChecked ? 'checked' : ''} />
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${def.color};margin-right:4px;"></span>
          <span>${def.name}</span>
        </label>
      `
    }).join('')

    grid.querySelectorAll<HTMLInputElement>('[data-filter-id]').forEach(inp => {
      inp.addEventListener('change', () => {
        const fId = inp.dataset.filterId as StructureType
        state.activeFilters[fId] = inp.checked
        renderMap()
      })
    })
  }

  renderFilterCheckboxes()

  const canvas = document.getElementById('seed-canvas') as HTMLCanvasElement
  const tooltip = document.getElementById('seed-tooltip')
  const hudBiome = document.getElementById('sm-hud-biome')
  const hudCoords = document.getElementById('sm-hud-coords')
  const hudChunk = document.getElementById('sm-hud-chunk')
  const hudNear = document.getElementById('sm-hud-near')

  document.getElementById('sm-toggle-filters-btn')?.addEventListener('click', () => {
    state.showFiltersDrawer = !state.showFiltersDrawer
    const drawer = document.getElementById('sm-filters-drawer')
    if (drawer) drawer.classList.toggle('hidden', !state.showFiltersDrawer)
  })

  document.getElementById('sm-close-filters-btn')?.addEventListener('click', () => {
    state.showFiltersDrawer = false
    const drawer = document.getElementById('sm-filters-drawer')
    if (drawer) drawer.classList.add('hidden')
  })

  container.querySelectorAll<HTMLButtonElement>('[data-sm-dim]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dim = btn.dataset.smDim as 'overworld' | 'nether' | 'end'
      state.dimension = dim
      container.querySelectorAll('[data-sm-dim]').forEach(b => b.classList.toggle('active', b === btn))
      renderFilterCheckboxes()
      renderMap()
    })
  })

  canvas?.addEventListener('mousedown', (e) => {
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    mapStartX = state.centerX
    mapStartZ = state.centerZ
    canvas.style.cursor = 'grabbing'
  })

  window.addEventListener('mousemove', (e) => {
    if (isDragging && canvas) {
      const dx = e.clientX - dragStartX
      const dy = e.clientY - dragStartY
      const blockSize = 4 / state.zoom
      state.centerX = mapStartX - (dx * blockSize)
      state.centerZ = mapStartZ - (dy * blockSize)

      const posXInp = document.getElementById('sm-pos-x') as HTMLInputElement
      const posZInp = document.getElementById('sm-pos-z') as HTMLInputElement
      if (posXInp) posXInp.value = Math.round(state.centerX).toString()
      if (posZInp) posZInp.value = Math.round(state.centerZ).toString()

      renderMap()
    }
  })

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false
      if (canvas) canvas.style.cursor = 'crosshair'
    }
  })

  canvas?.addEventListener('wheel', (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      state.zoom = Math.min(4, state.zoom * 1.25)
    } else {
      state.zoom = Math.max(0.15, state.zoom / 1.25)
    }
    const zoomLabel = document.getElementById('sm-zoom-label')
    if (zoomLabel) zoomLabel.textContent = `${(1 / state.zoom).toFixed(1)}:1`
    renderMap()
  })

  canvas?.addEventListener('mousemove', (e) => {
    if (isDragging || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const w = canvas.width
    const h = canvas.height
    const blockSize = 4 / state.zoom
    const blocksWide = w * blockSize
    const blocksHigh = h * blockSize
    const minX = state.centerX - blocksWide / 2
    const minZ = state.centerZ - blocksHigh / 2

    const blockX = Math.round(minX + (px / w) * blocksWide)
    const blockZ = Math.round(minZ + (py / h) * blocksHigh)
    const chunkX = Math.floor(blockX / 16)
    const chunkZ = Math.floor(blockZ / 16)
    const regX = Math.floor(chunkX / 32)
    const regZ = Math.floor(chunkZ / 32)

    const seed = parseSeed(state.seedInput)
    const nTemp = new FastNoise(seed)
    const nHum = new FastNoise(seed + 1000n)
    const nCont = new FastNoise(seed + 2000n)
    const nEro = new FastNoise(seed + 3000n)
    const nWeird = new FastNoise(seed + 4000n)

    let biome: BiomeDef
    if (state.dimension === 'overworld') {
      biome = sampleOverworldBiome(nTemp, nHum, nCont, nEro, nWeird, blockX, blockZ)
    } else if (state.dimension === 'nether') {
      biome = sampleNetherBiome(nTemp, nHum, blockX, blockZ)
    } else {
      biome = sampleEndBiome(blockX, blockZ)
    }

    const near = cachedStructures.find(st => Math.hypot(st.x - blockX, st.z - blockZ) < (22 / state.zoom))

    if (hudBiome) hudBiome.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${biome.color};border:1px solid rgba(255,255,255,0.4);margin-right:5px;"></span>${biome.name}`
    if (hudCoords) hudCoords.textContent = `X: ${blockX}, Z: ${blockZ} (Y: ~64)`
    if (hudChunk) hudChunk.textContent = `Chunk [${chunkX}, ${chunkZ}] • Region r.${regX}.${regZ}.mca`
    if (hudNear) hudNear.textContent = near ? `Near ${near.name}` : ''

    if (near && tooltip) {
      tooltip.style.left = `${px + 14}px`
      tooltip.style.top = `${py + 14}px`
      tooltip.classList.remove('hidden')
      tooltip.innerHTML = `
        <div class="tooltip-title">${near.name}</div>
        <div class="tooltip-coords">X: ${near.x}, Z: ${near.z}</div>
      `
    } else if (tooltip) {
      tooltip.classList.add('hidden')
    }
  })

  canvas?.addEventListener('mouseleave', () => {
    if (tooltip) tooltip.classList.add('hidden')
  })

  canvas?.addEventListener('click', (e) => {
    if (isDragging) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const w = canvas.width
    const h = canvas.height
    const blockSize = 4 / state.zoom
    const blocksWide = w * blockSize
    const blocksHigh = h * blockSize
    const minX = state.centerX - blocksWide / 2
    const minZ = state.centerZ - blocksHigh / 2

    const blockX = Math.round(minX + (px / w) * blocksWide)
    const blockZ = Math.round(minZ + (py / h) * blocksHigh)

    const near = cachedStructures.find(st => Math.hypot(st.x - blockX, st.z - blockZ) < (24 / state.zoom))
    if (near) {
      state.selectedStructure = near
    } else {
      state.selectedStructure = {
        id: 'spawn',
        name: 'Selected Point',
        symbol: 'PT',
        color: '#ff3333',
        x: blockX,
        z: blockZ,
        y: 64,
      }
    }
    updateSelectedPopup(state.selectedStructure)
    renderMap()
  })

  document.getElementById('sm-seed')?.addEventListener('input', (e) => {
    state.seedInput = (e.target as HTMLInputElement).value
    debouncedRender()
  })

  document.getElementById('sm-rnd-seed')?.addEventListener('click', () => {
    state.seedInput = (Math.floor(Math.random() * 9000000000000000) - 4500000000000000).toString()
    const inp = document.getElementById('sm-seed') as HTMLInputElement
    if (inp) inp.value = state.seedInput
    renderMap()
    showToast('Random seed generated!')
  })

  document.getElementById('sm-copy-seed-btn')?.addEventListener('click', async () => {
    await copyToClipboard(state.seedInput)
    showToast('Copied seed to clipboard!')
  })

  document.getElementById('sm-biome-highlight')?.addEventListener('change', (e) => {
    state.highlightBiome = (e.target as HTMLSelectElement).value
    renderMap()
  })

  document.getElementById('sm-chk-slime')?.addEventListener('change', (e) => {
    state.showSlimeChunks = (e.target as HTMLInputElement).checked
    renderMap()
  })

  document.getElementById('sm-chk-grid')?.addEventListener('change', (e) => {
    state.showGrid = (e.target as HTMLInputElement).checked
    renderMap()
  })

  document.getElementById('sm-filter-all-on')?.addEventListener('click', () => {
    Object.keys(state.activeFilters).forEach(k => {
      state.activeFilters[k as StructureType] = true
    })
    renderFilterCheckboxes()
    renderMap()
  })

  document.getElementById('sm-filter-all-off')?.addEventListener('click', () => {
    Object.keys(state.activeFilters).forEach(k => {
      state.activeFilters[k as StructureType] = false
    })
    renderFilterCheckboxes()
    renderMap()
  })

  document.getElementById('sm-go-coords')?.addEventListener('click', () => {
    const x = parseInt((document.getElementById('sm-pos-x') as HTMLInputElement).value) || 0
    const z = parseInt((document.getElementById('sm-pos-z') as HTMLInputElement).value) || 0
    state.centerX = x
    state.centerZ = z
    renderMap()
  })

  document.getElementById('sm-go-spawn')?.addEventListener('click', () => {
    state.centerX = 0
    state.centerZ = 0
    const posX = document.getElementById('sm-pos-x') as HTMLInputElement
    const posZ = document.getElementById('sm-pos-z') as HTMLInputElement
    if (posX) posX.value = '0'
    if (posZ) posZ.value = '0'
    renderMap()
  })

  document.getElementById('sm-zoom-in')?.addEventListener('click', () => {
    state.zoom = Math.min(4, state.zoom * 1.5)
    const zoomLabel = document.getElementById('sm-zoom-label')
    if (zoomLabel) zoomLabel.textContent = `${(1 / state.zoom).toFixed(1)}:1`
    renderMap()
  })

  document.getElementById('sm-zoom-out')?.addEventListener('click', () => {
    state.zoom = Math.max(0.15, state.zoom / 1.5)
    const zoomLabel = document.getElementById('sm-zoom-label')
    if (zoomLabel) zoomLabel.textContent = `${(1 / state.zoom).toFixed(1)}:1`
    renderMap()
  })

  document.getElementById('sm-export-png')?.addEventListener('click', () => {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `comparator_seedmap_${state.dimension}_${state.seedInput}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('Map exported as PNG!')
  })

  renderMap()
}
