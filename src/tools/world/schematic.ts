import { copyToClipboard, showToast, formatNumber } from '../../utils/helpers'

export interface ParsedBlock {
  name: string
  properties?: Record<string, string>
}

export interface MaterialItem {
  id: string
  name: string
  count: number
  stacks: string
  pct: number
}

export interface ParsedSchematic {
  format: 'litematic' | 'sponge' | 'classic'
  name: string
  author: string
  description: string
  width: number
  height: number
  length: number
  totalBlocks: number
  volume: number
  blocks: (ParsedBlock | null)[][][]
  materials: MaterialItem[]
}

export class NbtReader {
  private view: DataView
  private offset = 0
  private decoder = new TextDecoder('utf-8')

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
  }

  public readRoot(): { name: string; value: any } {
    if (this.offset >= this.view.byteLength) throw new Error('Empty NBT payload')
    const type = this.readByte()
    if (type === 0) return { name: '', value: null }
    const name = this.readString()
    const value = this.readTagValue(type)
    return { name, value }
  }

  private readByte(): number {
    const v = this.view.getInt8(this.offset)
    this.offset += 1
    return v
  }

  private readShort(): number {
    const v = this.view.getInt16(this.offset, false)
    this.offset += 2
    return v
  }

  private readInt(): number {
    const v = this.view.getInt32(this.offset, false)
    this.offset += 4
    return v
  }

  private readLong(): bigint {
    const v = this.view.getBigInt64(this.offset, false)
    this.offset += 8
    return v
  }

  private readFloat(): number {
    const v = this.view.getFloat32(this.offset, false)
    this.offset += 4
    return v
  }

  private readDouble(): number {
    const v = this.view.getFloat64(this.offset, false)
    this.offset += 8
    return v
  }

  private readString(): string {
    const len = this.view.getUint16(this.offset, false)
    this.offset += 2
    if (len === 0) return ''
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len)
    this.offset += len
    return this.decoder.decode(bytes)
  }

  private readTagValue(type: number): any {
    switch (type) {
      case 0: return null
      case 1: return this.readByte()
      case 2: return this.readShort()
      case 3: return this.readInt()
      case 4: return this.readLong()
      case 5: return this.readFloat()
      case 6: return this.readDouble()
      case 7: {
        const len = this.readInt()
        const arr = new Int8Array(this.view.buffer, this.view.byteOffset + this.offset, len)
        this.offset += len
        return arr
      }
      case 8: return this.readString()
      case 9: {
        const elemType = this.readByte()
        const len = this.readInt()
        const list: any[] = []
        for (let i = 0; i < len; i++) {
          list.push(this.readTagValue(elemType))
        }
        return list
      }
      case 10: {
        const compound: Record<string, any> = {}
        while (true) {
          const itemType = this.readByte()
          if (itemType === 0) break
          const name = this.readString()
          compound[name] = this.readTagValue(itemType)
        }
        return compound
      }
      case 11: {
        const len = this.readInt()
        const arr: number[] = []
        for (let i = 0; i < len; i++) {
          arr.push(this.readInt())
        }
        return arr
      }
      case 12: {
        const len = this.readInt()
        const arr: bigint[] = []
        for (let i = 0; i < len; i++) {
          arr.push(this.readLong())
        }
        return arr
      }
      default:
        throw new Error(`Unknown NBT Tag ID: ${type} at offset ${this.offset}`)
    }
  }
}

export async function decompressGzipIfNeeded(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buffer)
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip')
      const writer = ds.writable.getWriter()
      writer.write(bytes)
      writer.close()
      const resp = new Response(ds.readable)
      return await resp.arrayBuffer()
    }
  }
  return buffer
}

export function normalizeBlockName(raw: string): string {
  if (!raw) return 'Air'
  let id = raw.startsWith('minecraft:') ? raw.slice(10) : raw
  const bracketIdx = id.indexOf('[')
  if (bracketIdx !== -1) id = id.slice(0, bracketIdx)
  return id
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function isAir(name: string): boolean {
  if (!name) return true
  const lower = name.toLowerCase()
  return lower === 'minecraft:air' || lower === 'minecraft:cave_air' || lower === 'minecraft:void_air' || lower === 'air'
}

export function calculateMaterials(blocks: (ParsedBlock | null)[][][]): MaterialItem[] {
  const counts: Record<string, { rawId: string; name: string; count: number }> = {}
  let totalNonAir = 0

  for (let y = 0; y < blocks.length; y++) {
    for (let z = 0; z < blocks[y].length; z++) {
      for (let x = 0; x < blocks[y][z].length; x++) {
        const b = blocks[y][z][x]
        if (!b || isAir(b.name)) continue
        totalNonAir++
        const rawId = b.name.startsWith('minecraft:') ? b.name.slice(10) : b.name
        const normName = normalizeBlockName(rawId)
        if (!counts[normName]) {
          counts[normName] = { rawId, name: normName, count: 0 }
        }
        counts[normName].count++
      }
    }
  }

  const items = Object.values(counts).sort((a, b) => b.count - a.count)
  return items.map(it => {
    const fullStacks = Math.floor(it.count / 64)
    const remainder = it.count % 64
    let stacksStr = ''
    if (fullStacks > 0 && remainder > 0) {
      stacksStr = `${fullStacks} st + ${remainder}`
    } else if (fullStacks > 0) {
      stacksStr = `${fullStacks} stack${fullStacks > 1 ? 's' : ''}`
    } else {
      stacksStr = `${remainder}`
    }

    return {
      id: it.rawId,
      name: it.name,
      count: it.count,
      stacks: stacksStr,
      pct: totalNonAir > 0 ? (it.count / totalNonAir) * 100 : 0,
    }
  })
}

export function parseLitematica(nbt: Record<string, any>): ParsedSchematic {
  const meta = nbt.Metadata || {}
  const regionsObj = nbt.Regions || {}
  const regionKeys = Object.keys(regionsObj)

  if (regionKeys.length === 0) {
    throw new Error('Litematica file contains no Regions data.')
  }

  const regionName = regionKeys[0]
  const region = regionsObj[regionName]
  const size = region.Size || meta.EnclosingSize || { x: 1, y: 1, z: 1 }

  const width = Math.abs(size.x || 1)
  const height = Math.abs(size.y || 1)
  const length = Math.abs(size.z || 1)
  const volume = width * height * length

  const rawPalette: any[] = region.BlockStatePalette || []
  const palette: ParsedBlock[] = rawPalette.map(entry => {
    if (typeof entry === 'string') return { name: entry }
    return {
      name: entry.Name || 'minecraft:air',
      properties: entry.Properties || undefined,
    }
  })

  const blocks: (ParsedBlock | null)[][][] = []
  for (let y = 0; y < height; y++) {
    blocks[y] = []
    for (let z = 0; z < length; z++) {
      blocks[y][z] = new Array(width).fill(null)
    }
  }

  const rawLongs: bigint[] = region.BlockStates || []
  if (rawLongs.length > 0 && palette.length > 0) {
    const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(palette.length)))
    const mask = (1n << BigInt(bitsPerBlock)) - 1n
    const totalBlocksCount = width * height * length

    for (let index = 0; index < totalBlocksCount; index++) {
      const bitIndex = BigInt(index * bitsPerBlock)
      const startLong = Number(bitIndex / 64n)
      const startOffset = Number(bitIndex % 64n)

      if (startLong >= rawLongs.length) break

      let paletteIndex = 0
      const lowPart = BigInt.asUintN(64, rawLongs[startLong]) >> BigInt(startOffset)

      if (startOffset + bitsPerBlock <= 64) {
        paletteIndex = Number(lowPart & mask)
      } else {
        const nextLong = startLong + 1 < rawLongs.length ? BigInt.asUintN(64, rawLongs[startLong + 1]) : 0n
        const bitsFromLow = 64 - startOffset
        const highPart = nextLong << BigInt(bitsFromLow)
        paletteIndex = Number((lowPart | highPart) & mask)
      }

      const x = index % width
      const rem = Math.floor(index / width)
      const z = rem % length
      const y = Math.floor(rem / length)

      if (y < height && z < length && x < width && paletteIndex < palette.length) {
        blocks[y][z][x] = palette[paletteIndex]
      }
    }
  }

  const materials = calculateMaterials(blocks)
  const totalBlocks = materials.reduce((acc, m) => acc + m.count, 0)

  return {
    format: 'litematic',
    name: meta.Name || regionName || 'Litematica Build',
    author: meta.Author || 'Unknown Creator',
    description: meta.Description || '',
    width,
    height,
    length,
    volume,
    totalBlocks,
    blocks,
    materials,
  }
}

export function parseSpongeSchematic(nbt: Record<string, any>): ParsedSchematic {
  const root = nbt.Schematic || nbt
  const width = root.Width || 1
  const height = root.Height || 1
  const length = root.Length || 1
  const volume = width * height * length

  const paletteObj = root.Palette || {}
  const palette: ParsedBlock[] = []
  for (const [blockString, idx] of Object.entries(paletteObj)) {
    const numIdx = Number(idx)
    palette[numIdx] = { name: blockString }
  }

  const blocks: (ParsedBlock | null)[][][] = []
  for (let y = 0; y < height; y++) {
    blocks[y] = []
    for (let z = 0; z < length; z++) {
      blocks[y][z] = new Array(width).fill(null)
    }
  }

  const rawBytes: Int8Array = root.BlockData || new Int8Array(0)
  if (rawBytes.length > 0) {
    let byteOffset = 0
    let blockIdx = 0

    while (byteOffset < rawBytes.length && blockIdx < volume) {
      let value = 0
      let shift = 0
      while (true) {
        if (byteOffset >= rawBytes.length) break
        const b = rawBytes[byteOffset++] & 0xff
        value |= (b & 0x7f) << shift
        if ((b & 0x80) === 0) break
        shift += 7
      }

      const x = blockIdx % width
      const rem = Math.floor(blockIdx / width)
      const z = rem % length
      const y = Math.floor(rem / length)

      if (y < height && z < length && x < width && value < palette.length) {
        blocks[y][z][x] = palette[value] || null
      }
      blockIdx++
    }
  }

  const materials = calculateMaterials(blocks)
  const totalBlocks = materials.reduce((acc, m) => acc + m.count, 0)

  return {
    format: 'sponge',
    name: root.Metadata?.Name || 'Sponge Schematic',
    author: root.Metadata?.Author || 'Unknown',
    description: '',
    width,
    height,
    length,
    volume,
    totalBlocks,
    blocks,
    materials,
  }
}

export function createDemoRedstoneClock(): ParsedSchematic {
  const width = 5
  const height = 3
  const length = 5
  const blocks: (ParsedBlock | null)[][][] = []

  for (let y = 0; y < height; y++) {
    blocks[y] = []
    for (let z = 0; z < length; z++) {
      blocks[y][z] = new Array(width).fill(null)
    }
  }

  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      blocks[0][z][x] = { name: 'minecraft:smooth_stone' }
    }
  }

  blocks[1][1][1] = { name: 'minecraft:redstone_wire' }
  blocks[1][1][2] = { name: 'minecraft:repeater', properties: { delay: '2', facing: 'east' } }
  blocks[1][1][3] = { name: 'minecraft:redstone_wire' }
  blocks[1][2][3] = { name: 'minecraft:comparator', properties: { mode: 'subtract', facing: 'south' } }
  blocks[1][3][3] = { name: 'minecraft:redstone_wire' }
  blocks[1][3][2] = { name: 'minecraft:repeater', properties: { delay: '4', facing: 'west' } }
  blocks[1][3][1] = { name: 'minecraft:redstone_wire' }
  blocks[1][2][1] = { name: 'minecraft:redstone_lamp' }

  blocks[1][2][0] = { name: 'minecraft:target' }
  blocks[1][2][4] = { name: 'minecraft:lever' }

  blocks[2][2][1] = { name: 'minecraft:redstone_lamp' }

  const materials = calculateMaterials(blocks)
  const totalBlocks = materials.reduce((acc, m) => acc + m.count, 0)

  return {
    format: 'litematic',
    name: 'Compact Comparator Clock (Demo)',
    author: 'Miro (Technical Redstone)',
    description: 'Adjustable tick redstone pulse generator with comparator decay loop & lamp indicators.',
    width,
    height,
    length,
    volume: width * height * length,
    totalBlocks,
    blocks,
    materials,
  }
}

export function createDemoSurvivalCottage(): ParsedSchematic {
  const width = 7
  const height = 6
  const length = 7
  const blocks: (ParsedBlock | null)[][][] = []

  for (let y = 0; y < height; y++) {
    blocks[y] = []
    for (let z = 0; z < length; z++) {
      blocks[y][z] = new Array(width).fill(null)
    }
  }

  for (let x = 0; x < 7; x++) {
    for (let z = 0; z < 7; z++) {
      blocks[0][z][x] = { name: 'minecraft:cobblestone' }
    }
  }

  for (let y = 1; y <= 3; y++) {
    blocks[y][0][0] = { name: 'minecraft:oak_log' }
    blocks[y][0][6] = { name: 'minecraft:oak_log' }
    blocks[y][6][0] = { name: 'minecraft:oak_log' }
    blocks[y][6][6] = { name: 'minecraft:oak_log' }

    for (let x = 1; x < 6; x++) {
      blocks[y][0][x] = { name: 'minecraft:oak_planks' }
      blocks[y][6][x] = { name: 'minecraft:oak_planks' }
    }
    for (let z = 1; z < 6; z++) {
      blocks[y][z][0] = { name: 'minecraft:oak_planks' }
      blocks[y][z][6] = { name: 'minecraft:oak_planks' }
    }
  }

  blocks[1][6][3] = { name: 'minecraft:oak_door' }
  blocks[2][6][3] = null
  blocks[2][0][3] = { name: 'minecraft:glass_pane' }
  blocks[2][3][0] = { name: 'minecraft:glass_pane' }
  blocks[2][3][6] = { name: 'minecraft:glass_pane' }

  blocks[1][1][1] = { name: 'minecraft:crafting_table' }
  blocks[1][1][2] = { name: 'minecraft:furnace' }
  blocks[1][1][5] = { name: 'minecraft:chest' }
  blocks[1][2][5] = { name: 'minecraft:chest' }
  blocks[1][5][1] = { name: 'minecraft:red_bed' }
  blocks[1][5][2] = { name: 'minecraft:red_bed' }
  blocks[1][5][5] = { name: 'minecraft:lantern' }

  for (let x = 0; x < 7; x++) {
    for (let z = 0; z < 7; z++) {
      blocks[4][z][x] = { name: 'minecraft:spruce_planks' }
    }
  }

  for (let z = 0; z < 7; z++) {
    blocks[5][z][1] = { name: 'minecraft:spruce_stairs' }
    blocks[5][z][2] = { name: 'minecraft:spruce_stairs' }
    blocks[5][z][3] = { name: 'minecraft:spruce_slab' }
    blocks[5][z][4] = { name: 'minecraft:spruce_stairs' }
    blocks[5][z][5] = { name: 'minecraft:spruce_stairs' }
  }

  const materials = calculateMaterials(blocks)
  const totalBlocks = materials.reduce((acc, m) => acc + m.count, 0)

  return {
    format: 'sponge',
    name: 'Starter Survival Cottage (Demo)',
    author: 'Survival Builder',
    description: 'Cozy 7x7 cottage with cobblestone base, oak walls, spruce roof, and furnished interior.',
    width,
    height,
    length,
    volume: width * height * length,
    totalBlocks,
    blocks,
    materials,
  }
}

export function getBlockVoxelColor(rawName: string): string {
  if (!rawName) return '#000000'
  const id = rawName.toLowerCase()

  if (id.includes('redstone') || id.includes('repeater') || id.includes('comparator')) return '#ef4444'
  if (id.includes('log') || id.includes('wood')) return '#965527'
  if (id.includes('plank') || id.includes('door') || id.includes('slab')) return '#c28b57'
  if (id.includes('glass')) return '#38bdf8'
  if (id.includes('cobblestone')) return '#64748b'
  if (id.includes('stone') || id.includes('smooth')) return '#94a3b8'
  if (id.includes('deepslate')) return '#334155'
  if (id.includes('iron') || id.includes('hopper')) return '#cbd5e1'
  if (id.includes('gold')) return '#eab308'
  if (id.includes('diamond')) return '#2dd4bf'
  if (id.includes('emerald')) return '#10b981'
  if (id.includes('leaves') || id.includes('grass')) return '#22c55e'
  if (id.includes('chest') || id.includes('barrel') || id.includes('crafting')) return '#b45309'
  if (id.includes('bed')) return '#dc2626'
  if (id.includes('lamp') || id.includes('lantern') || id.includes('glow')) return '#fde047'
  if (id.includes('water')) return '#3b82f6'
  if (id.includes('lava')) return '#f97316'
  if (id.includes('wool') || id.includes('concrete')) return '#e2e8f0'

  return '#71717a'
}

function hexToNormalizedRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

class Mat4 {
  static create(): Float32Array {
    const out = new Float32Array(16)
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1
    return out
  }

  static perspective(out: Float32Array, fovRad: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1.0 / Math.tan(fovRad / 2)
    const nf = 1 / (near - far)
    out.fill(0)
    out[0] = f / aspect
    out[5] = f
    out[10] = (far + near) * nf
    out[11] = -1
    out[14] = 2 * far * near * nf
    return out
  }

  static lookAt(out: Float32Array, eye: [number, number, number], center: [number, number, number], up: [number, number, number]): Float32Array {
    let z0 = eye[0] - center[0]
    let z1 = eye[1] - center[1]
    let z2 = eye[2] - center[2]
    let len = Math.hypot(z0, z1, z2) || 1
    z0 /= len; z1 /= len; z2 /= len

    let x0 = up[1] * z2 - up[2] * z1
    let x1 = up[2] * z0 - up[0] * z2
    let x2 = up[0] * z1 - up[1] * z0
    len = Math.hypot(x0, x1, x2) || 1
    x0 /= len; x1 /= len; x2 /= len

    const y0 = z1 * x2 - z2 * x1
    const y1 = z2 * x0 - z0 * x2
    const y2 = z0 * x1 - z1 * x0

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2])
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2])
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2])
    out[15] = 1
    return out
  }

  static multiply(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3]
      out[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
      out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
      out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
      out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
    }
    return out
  }
}

class WebGLVoxelViewer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private vbo: WebGLBuffer | null = null
  private gridVbo: WebGLBuffer | null = null
  private vertexCount = 0
  private gridVertexCount = 0

  private uMVP: WebGLUniformLocation | null = null
  private aPos = -1
  private aNormal = -1
  private aColor = -1

  public yaw = 0.785
  public pitch = 0.42
  public distance = 20
  public panX = 0
  public panY = 0
  public autoRotate = false
  public maxLayer = 9999

  private isDragging = false
  private dragMode: 'orbit' | 'pan' = 'orbit'
  private lastMouseX = 0
  private lastMouseY = 0
  private animFrameId: number | null = null
  private schematic: ParsedSchematic

  constructor(canvas: HTMLCanvasElement, schematic: ParsedSchematic) {
    this.canvas = canvas
    this.schematic = schematic
    this.initGL()
    this.initEvents()
    this.setSchematic(schematic)
  }

  private initGL(): void {
    const gl = this.canvas.getContext('webgl', { antialias: true, alpha: false }) ||
               this.canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return
    this.gl = gl

    const vsSource = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
      attribute vec3 aColor;

      uniform mat4 uMVP;

      varying vec3 vColor;
      varying float vLight;

      void main() {
        vec3 norm = normalize(aNormal);
        vec3 lightDir = normalize(vec3(0.5, 0.85, 0.65));
        float diff = max(dot(norm, lightDir), 0.0);

        float ambient = 0.50;
        if (norm.y > 0.5) ambient += 0.25;
        else if (norm.y < -0.5) ambient -= 0.18;
        else if (norm.x > 0.5 || norm.x < -0.5) ambient += 0.08;

        vLight = clamp(ambient + diff * 0.45, 0.25, 1.0);
        vColor = aColor;
        gl_Position = uMVP * vec4(aPos, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      varying vec3 vColor;
      varying float vLight;

      void main() {
        gl_FragColor = vec4(vColor * vLight, 1.0);
      }
    `

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, vsSource)
    gl.compileShader(vs)

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, fsSource)
    gl.compileShader(fs)

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Shader link error', gl.getProgramInfoLog(prog))
      return
    }

    this.program = prog
    this.uMVP = gl.getUniformLocation(prog, 'uMVP')
    this.aPos = gl.getAttribLocation(prog, 'aPos')
    this.aNormal = gl.getAttribLocation(prog, 'aNormal')
    this.aColor = gl.getAttribLocation(prog, 'aColor')

    this.vbo = gl.createBuffer()
    this.gridVbo = gl.createBuffer()

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.clearColor(0.04, 0.04, 0.06, 1.0)
  }

  public setSchematic(s: ParsedSchematic): void {
    this.schematic = s
    const maxDim = Math.max(s.width, s.height, s.length)
    this.distance = Math.max(12, maxDim * 1.9)
    this.panX = 0
    this.panY = 0
    this.rebuildMesh()
    this.rebuildGrid()
    this.render()
  }

  public setLayerCut(layer: number): void {
    this.maxLayer = layer
    this.rebuildMesh()
    this.render()
  }

  private rebuildGrid(): void {
    const gl = this.gl
    if (!gl || !this.gridVbo) return

    const s = this.schematic
    const margin = Math.max(4, Math.ceil(Math.max(s.width, s.length) * 0.3))
    const minX = -Math.floor(s.width / 2) - margin
    const maxX = Math.ceil(s.width / 2) + margin
    const minZ = -Math.floor(s.length / 2) - margin
    const maxZ = Math.ceil(s.length / 2) + margin

    const lines: number[] = []
    const y = -0.02
    const gridColor = [0.18, 0.18, 0.25]

    for (let x = minX; x <= maxX; x++) {
      lines.push(x, y, minZ, 0, 1, 0, ...gridColor)
      lines.push(x, y, maxZ, 0, 1, 0, ...gridColor)
    }
    for (let z = minZ; z <= maxZ; z++) {
      lines.push(minX, y, z, 0, 1, 0, ...gridColor)
      lines.push(maxX, y, z, 0, 1, 0, ...gridColor)
    }

    this.gridVertexCount = lines.length / 9
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW)
  }

  private rebuildMesh(): void {
    const gl = this.gl
    if (!gl || !this.vbo) return

    const s = this.schematic
    const vertices: number[] = []

    const offsetX = -s.width / 2
    const offsetZ = -s.length / 2

    const limitY = Math.min(s.height - 1, this.maxLayer)

    for (let y = 0; y <= limitY; y++) {
      for (let z = 0; z < s.length; z++) {
        for (let x = 0; x < s.width; x++) {
          const b = s.blocks[y]?.[z]?.[x]
          if (!b || isAir(b.name)) continue

          const hex = getBlockVoxelColor(b.name)
          const [r, g, bCol] = hexToNormalizedRgb(hex)

          const x0 = x + offsetX
          const x1 = x0 + 1
          const y0 = y
          const y1 = y0 + 1
          const z0 = z + offsetZ
          const z1 = z0 + 1

          const isAirAt = (nx: number, ny: number, nz: number): boolean => {
            if (ny < 0 || ny >= s.height || nx < 0 || nx >= s.width || nz < 0 || nz >= s.length) return true
            if (ny > limitY) return true
            const nb = s.blocks[ny]?.[nz]?.[nx]
            return !nb || isAir(nb.name)
          }

          if (isAirAt(x, y + 1, z)) {
            const nx = 0, ny = 1, nz = 0
            vertices.push(
              x0, y1, z0, nx, ny, nz, r, g, bCol,
              x0, y1, z1, nx, ny, nz, r, g, bCol,
              x1, y1, z1, nx, ny, nz, r, g, bCol,
              x0, y1, z0, nx, ny, nz, r, g, bCol,
              x1, y1, z1, nx, ny, nz, r, g, bCol,
              x1, y1, z0, nx, ny, nz, r, g, bCol
            )
          }

          if (isAirAt(x, y - 1, z)) {
            const nx = 0, ny = -1, nz = 0
            vertices.push(
              x0, y0, z1, nx, ny, nz, r, g, bCol,
              x0, y0, z0, nx, ny, nz, r, g, bCol,
              x1, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y0, z0, nx, ny, nz, r, g, bCol,
              x1, y0, z1, nx, ny, nz, r, g, bCol
            )
          }

          if (isAirAt(x + 1, y, z)) {
            const nx = 1, ny = 0, nz = 0
            vertices.push(
              x1, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y0, z0, nx, ny, nz, r, g, bCol,
              x1, y1, z0, nx, ny, nz, r, g, bCol,
              x1, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y1, z0, nx, ny, nz, r, g, bCol,
              x1, y1, z1, nx, ny, nz, r, g, bCol
            )
          }

          if (isAirAt(x - 1, y, z)) {
            const nx = -1, ny = 0, nz = 0
            vertices.push(
              x0, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y0, z1, nx, ny, nz, r, g, bCol,
              x0, y1, z1, nx, ny, nz, r, g, bCol,
              x0, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y1, z1, nx, ny, nz, r, g, bCol,
              x0, y1, z0, nx, ny, nz, r, g, bCol
            )
          }

          if (isAirAt(x, y, z + 1)) {
            const nx = 0, ny = 0, nz = 1
            vertices.push(
              x0, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y1, z1, nx, ny, nz, r, g, bCol,
              x0, y0, z1, nx, ny, nz, r, g, bCol,
              x1, y1, z1, nx, ny, nz, r, g, bCol,
              x0, y1, z1, nx, ny, nz, r, g, bCol
            )
          }

          if (isAirAt(x, y, z - 1)) {
            const nx = 0, ny = 0, nz = -1
            vertices.push(
              x1, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y1, z0, nx, ny, nz, r, g, bCol,
              x1, y0, z0, nx, ny, nz, r, g, bCol,
              x0, y1, z0, nx, ny, nz, r, g, bCol,
              x1, y1, z0, nx, ny, nz, r, g, bCol
            )
          }
        }
      }
    }

    this.vertexCount = vertices.length / 9
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  }

  public render(): void {
    const gl = this.gl
    if (!gl || !this.program) return

    const dpr = window.devicePixelRatio || 1
    const displayW = Math.floor(this.canvas.clientWidth * dpr)
    const displayH = Math.floor(this.canvas.clientHeight * dpr)

    if (this.canvas.width !== displayW || this.canvas.height !== displayH) {
      this.canvas.width = displayW
      this.canvas.height = displayH
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const aspect = this.canvas.width / (this.canvas.height || 1)
    const proj = Mat4.create()
    Mat4.perspective(proj, Math.PI / 4, aspect, 0.1, 1000)

    const cosP = Math.cos(this.pitch)
    const sinP = Math.sin(this.pitch)
    const cosY = Math.cos(this.yaw)
    const sinY = Math.sin(this.yaw)

    const eyeX = this.panX + this.distance * cosP * sinY
    const eyeY = this.panY + this.distance * sinP + this.schematic.height * 0.35
    const eyeZ = this.distance * cosP * cosY

    const view = Mat4.create()
    Mat4.lookAt(view, [eyeX, eyeY, eyeZ], [this.panX, this.panY + this.schematic.height * 0.35, 0], [0, 1, 0])

    const mvp = Mat4.create()
    Mat4.multiply(mvp, proj, view)

    gl.useProgram(this.program)
    gl.uniformMatrix4fv(this.uMVP, false, mvp)

    if (this.gridVbo && this.gridVertexCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo)
      gl.enableVertexAttribArray(this.aPos)
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 36, 0)
      gl.enableVertexAttribArray(this.aNormal)
      gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 36, 12)
      gl.enableVertexAttribArray(this.aColor)
      gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, 36, 24)
      gl.drawArrays(gl.LINES, 0, this.gridVertexCount)
    }

    if (this.vbo && this.vertexCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
      gl.enableVertexAttribArray(this.aPos)
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 36, 0)
      gl.enableVertexAttribArray(this.aNormal)
      gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 36, 12)
      gl.enableVertexAttribArray(this.aColor)
      gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, 36, 24)
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount)
    }
  }

  private initEvents(): void {
    const c = this.canvas

    c.addEventListener('contextmenu', (e) => e.preventDefault())

    c.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.dragMode = e.button === 2 || e.shiftKey ? 'pan' : 'orbit'
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return
      const dx = e.clientX - this.lastMouseX
      const dy = e.clientY - this.lastMouseY
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY

      if (this.dragMode === 'orbit') {
        this.yaw += dx * 0.008
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch + dy * 0.008))
      } else {
        const panFactor = this.distance * 0.0015
        this.panX -= dx * panFactor * Math.cos(this.yaw)
        this.panY += dy * panFactor
      }
      this.render()
    })

    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })

    c.addEventListener('wheel', (e) => {
      e.preventDefault()
      const factor = 1 + Math.sign(e.deltaY) * 0.08
      this.distance = Math.max(3, Math.min(300, this.distance * factor))
      this.render()
    }, { passive: false })

    let touchDistance = 0
    c.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true
        this.dragMode = 'orbit'
        this.lastMouseX = e.touches[0].clientX
        this.lastMouseY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        touchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }, { passive: true })

    c.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastMouseX
        const dy = e.touches[0].clientY - this.lastMouseY
        this.lastMouseX = e.touches[0].clientX
        this.lastMouseY = e.touches[0].clientY
        this.yaw += dx * 0.008
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch + dy * 0.008))
        this.render()
      } else if (e.touches.length === 2) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const diff = touchDistance - newDist
        touchDistance = newDist
        this.distance = Math.max(3, Math.min(300, this.distance * (1 + diff * 0.005)))
        this.render()
      }
    }, { passive: true })

    c.addEventListener('touchend', () => {
      this.isDragging = false
    })

    this.startLoop()
  }

  private startLoop(): void {
    const loop = () => {
      if (this.autoRotate && !this.isDragging) {
        this.yaw += 0.007
        this.render()
      }
      this.animFrameId = requestAnimationFrame(loop)
    }
    this.animFrameId = requestAnimationFrame(loop)
  }

  public resetCamera(): void {
    this.yaw = 0.785
    this.pitch = 0.42
    const maxDim = Math.max(this.schematic.width, this.schematic.height, this.schematic.length)
    this.distance = Math.max(12, maxDim * 1.9)
    this.panX = 0
    this.panY = 0
    this.render()
  }

  public zoom(delta: number): void {
    this.distance = Math.max(3, Math.min(300, this.distance * (1 + delta)))
    this.render()
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }
}

export function mount(container: HTMLElement): void {
  let activeSchematic: ParsedSchematic = createDemoRedstoneClock()
  let currentLayer = 1
  let activeTab: '3d' | 'slice' = '3d'
  let materialFilter = ''
  let voxelViewer: WebGLVoxelViewer | null = null

  function render(): void {
    if (voxelViewer) {
      voxelViewer.destroy()
      voxelViewer = null
    }

    const s = activeSchematic
    if (currentLayer >= s.height) currentLayer = Math.max(0, s.height - 1)

    const filteredMaterials = s.materials.filter(m => {
      if (!materialFilter) return true
      return m.name.toLowerCase().includes(materialFilter.toLowerCase())
    })

    container.innerHTML = `
      <div class="tool-content fade-in">
        <div class="tool-header">
          <div class="tool-badge">World & Schematics</div>
          <h2>Schematic & Litematica 3D Studio</h2>
          <p class="tool-desc">Upload .litematic, .schem or .schematic blueprints to inspect full 3D interactive voxel models, layer-by-layer blueprints, and materials shopping lists.</p>
        </div>

        <div class="generator-layout">
          <!-- Left Column: Upload, Metadata & Materials -->
          <div class="config-column">
            <!-- Dropzone & Quick Demos -->
            <div class="panel">
              <div class="panel-header-inline">
                <h3 class="panel-title">Upload Blueprint</h3>
                <span class="badge badge-accent">${s.format.toUpperCase()}</span>
              </div>

              <div id="schem-dropzone" class="schem-dropzone-box">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div class="schem-drop-title">Drop <strong>.litematic</strong>, <strong>.schem</strong> or <strong>.schematic</strong> here</div>
                <div class="schem-drop-sub">or click to browse files from your computer</div>
                <input type="file" id="schem-file-input" accept=".litematic,.schem,.schematic" style="display: none;" />
              </div>

              <!-- Quick Demo Blueprints -->
              <div class="mt-3">
                <label class="form-label" style="font-size: 0.72rem;">Try Example Blueprints:</label>
                <div class="btn-grid-2">
                  <button class="btn btn-sm btn-secondary" id="btn-demo-clock">Demo: Redstone Clock (5×3×5)</button>
                  <button class="btn btn-sm btn-secondary" id="btn-demo-cottage">Demo: Survival Cottage (7×6×7)</button>
                </div>
              </div>
            </div>

            <!-- Structure Metadata -->
            <div class="panel mt-4">
              <h3 class="panel-title">Structure Information</h3>
              <div class="info-grid mt-2">
                <div class="info-row">
                  <span>Name:</span>
                  <strong class="text-truncate" style="max-width: 180px;">${s.name}</strong>
                </div>
                <div class="info-row">
                  <span>Author:</span>
                  <strong>${s.author}</strong>
                </div>
                <div class="info-row">
                  <span>Dimensions (X × Y × Z):</span>
                  <strong>${s.width} × ${s.height} × ${s.length}</strong>
                </div>
                <div class="info-row">
                  <span>Total Placed Blocks:</span>
                  <strong style="color: var(--accent-red);">${formatNumber(s.totalBlocks)} blocks</strong>
                </div>
                <div class="info-row">
                  <span>Enclosing Volume:</span>
                  <strong>${formatNumber(s.volume)} blocks³</strong>
                </div>
              </div>
            </div>

            <!-- Materials / Bill of Materials (BOM) -->
            <div class="panel mt-4">
              <div class="panel-header-inline">
                <h3 class="panel-title">Material Shopping List</h3>
                <button class="btn btn-secondary btn-sm" id="btn-copy-materials">Copy List</button>
              </div>

              <div class="form-group mt-2">
                <input type="text" id="mat-filter" class="input input-sm" placeholder="Filter materials (e.g. stone, repeater)..." value="${materialFilter}" />
              </div>

              <div class="schem-materials-table-wrap">
                <table class="schem-mat-table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th style="text-align: right;">Count</th>
                      <th style="text-align: right;">Stacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredMaterials.length === 0 ? `
                      <tr><td colspan="3" style="text-align: center; color: var(--text-tertiary); padding: 12px;">No matching materials found</td></tr>
                    ` : filteredMaterials.map(m => `
                      <tr>
                        <td>
                          <div class="schem-mat-name-cell">
                            <span class="schem-mat-dot" style="background:${getBlockVoxelColor(m.id)};"></span>
                            <span>${m.name}</span>
                          </div>
                        </td>
                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 600;">${m.count}</td>
                        <td style="text-align: right; font-family: var(--font-mono); color: var(--text-secondary); font-size: 0.76rem;">${m.stacks}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Column: Visualizer (3D Interactive vs 2D Slice) -->
          <div class="preview-column">
            <div class="panel">
              <!-- Visualizer Mode Tabs -->
              <div class="panel-header-inline" style="flex-wrap: wrap; gap: 8px;">
                <div class="syntax-toggle-bar">
                  <button class="syntax-toggle-btn ${activeTab === '3d' ? 'active' : ''}" data-view="3d">
                    3D Voxel Model
                  </button>
                  <button class="syntax-toggle-btn ${activeTab === 'slice' ? 'active' : ''}" data-view="slice">
                    2D Blueprint Slice
                  </button>
                </div>

                ${activeTab === '3d' ? `
                  <div class="schem-3d-actions">
                    <button class="btn btn-sm btn-secondary" id="btn-3d-spin" title="Toggle Auto-Spin">⟳ Spin</button>
                    <button class="btn btn-sm btn-secondary" id="btn-3d-reset" title="Reset Camera View">⌖ Reset</button>
                    <button class="btn btn-sm btn-secondary" id="btn-3d-zoomin" title="Zoom In">+</button>
                    <button class="btn btn-sm btn-secondary" id="btn-3d-zoomout" title="Zoom Out">−</button>
                  </div>
                ` : ''}
              </div>

              <!-- 3D Layer Cut Slider -->
              ${activeTab === '3d' ? `
                <div class="form-group mt-3" style="margin-bottom: 8px;">
                  <div class="form-label-row">
                    <label class="form-label" style="font-size: 0.78rem;">
                      3D Cut Roof / Max Layer: 
                      <strong id="lbl-3d-layer">${currentLayer >= s.height - 1 ? 'All Layers (Full)' : `Layer 0 .. ${currentLayer}`}</strong>
                    </label>
                  </div>
                  <input type="range" id="schem-3d-slider" class="range-slider" min="0" max="${s.height - 1}" value="${currentLayer}" />
                </div>
              ` : `
                <div class="form-group mt-3" style="margin-bottom: 8px;">
                  <div class="form-label-row">
                    <label class="form-label">Y-Slice Layer: <strong>Level ${currentLayer}</strong> / ${s.height - 1}</label>
                    <div style="display: flex; gap: 4px;">
                      <button class="btn btn-sm btn-secondary" id="btn-layer-down" ${currentLayer <= 0 ? 'disabled' : ''}>◀ Lower</button>
                      <button class="btn btn-sm btn-secondary" id="btn-layer-up" ${currentLayer >= s.height - 1 ? 'disabled' : ''}>Higher ▶</button>
                    </div>
                  </div>
                  <input type="range" id="schem-layer-slider" class="range-slider" min="0" max="${s.height - 1}" value="${currentLayer}" />
                </div>
              `}

              <!-- Canvas Stage -->
              <div class="schem-canvas-stage">
                ${activeTab === '3d' ? `
                  <canvas id="schem-3d-canvas" class="schem-3d-canvas" style="width: 100%; height: 460px; display: block; cursor: grab;"></canvas>
                  <div class="schem-3d-hint">Drag: Rotate 3D • Scroll: Zoom • Right-Click: Pan</div>
                ` : `
                  <canvas id="schem-canvas" width="600" height="420" class="schem-canvas"></canvas>
                  <div id="schem-tooltip" class="schem-cell-tooltip" style="display: none;"></div>
                `}
              </div>

              <div class="schem-stage-legend">
                <span>${activeTab === '3d' ? 'Hardware-accelerated WebGL 3D Voxel Engine' : 'Hover cells to inspect coordinates & block states'}</span>
                <span>${s.width}W × ${s.height}H × ${s.length}L (${formatNumber(s.totalBlocks)} placed blocks)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()

    if (activeTab === '3d') {
      const c = container.querySelector<HTMLCanvasElement>('#schem-3d-canvas')
      if (c) {
        voxelViewer = new WebGLVoxelViewer(c, activeSchematic)
        voxelViewer.setLayerCut(currentLayer)
      }
    } else {
      drawSliceCanvas()
    }
  }

  function drawSliceCanvas(): void {
    const canvas = container.querySelector<HTMLCanvasElement>('#schem-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = activeSchematic
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, w, h)

    const sliceY = currentLayer
    if (!s.blocks[sliceY]) return

    const pad = 40
    const availW = w - pad * 2
    const availH = h - pad * 2
    const cellW = Math.min(32, Math.max(8, Math.floor(availW / s.width)))
    const cellH = Math.min(32, Math.max(8, Math.floor(availH / s.length)))
    const cellSize = Math.min(cellW, cellH)

    const gridPixelW = s.width * cellSize
    const gridPixelH = s.length * cellSize
    const startX = Math.floor((w - gridPixelW) / 2)
    const startY = Math.floor((h - gridPixelH) / 2)

    for (let z = 0; z < s.length; z++) {
      for (let x = 0; x < s.width; x++) {
        const px = startX + x * cellSize
        const py = startY + z * cellSize

        const b = s.blocks[sliceY][z][x]
        if (b && !isAir(b.name)) {
          ctx.fillStyle = getBlockVoxelColor(b.name)
          ctx.fillRect(px, py, cellSize, cellSize)
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
        } else {
          ctx.fillStyle = '#12121a'
          ctx.fillRect(px, py, cellSize, cellSize)
          ctx.strokeStyle = '#1b1b26'
          ctx.strokeRect(px, py, cellSize, cellSize)
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 51, 51, 0.4)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(startX - 1, startY - 1, gridPixelW + 2, gridPixelH + 2)

    ctx.fillStyle = '#71717a'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Z: 0', startX + gridPixelW / 2, startY - 10)
    ctx.fillText(`Z: +${s.length - 1}`, startX + gridPixelW / 2, startY + gridPixelH + 18)
    ctx.fillText('X: 0', startX - 16, startY + gridPixelH / 2)
    ctx.fillText(`+${s.width - 1}`, startX + gridPixelW + 20, startY + gridPixelH / 2)
  }

  async function handleFile(file: File): Promise<void> {
    try {
      showToast(`Reading ${file.name}...`)
      const rawBuf = await file.arrayBuffer()
      const decompressed = await decompressGzipIfNeeded(rawBuf)
      const reader = new NbtReader(decompressed)
      const root = reader.readRoot()

      if (!root || !root.value) {
        throw new Error('Invalid NBT structure')
      }

      const val = root.value

      if (file.name.endsWith('.litematic') || val.Regions) {
        activeSchematic = parseLitematica(val)
      } else if (file.name.endsWith('.schem') || val.Palette || val.Schematic) {
        activeSchematic = parseSpongeSchematic(val)
      } else {
        if (val.Regions) activeSchematic = parseLitematica(val)
        else activeSchematic = parseSpongeSchematic(val)
      }

      currentLayer = activeSchematic.height - 1
      showToast(`Loaded "${activeSchematic.name}" (${activeSchematic.totalBlocks} blocks)!`)
      render()
    } catch (err: any) {
      console.error('Failed to parse schematic', err)
      showToast(`Error parsing file: ${err.message || 'Corrupted NBT'}`)
    }
  }

  function bindEvents(): void {
    const fileInput = container.querySelector<HTMLInputElement>('#schem-file-input')
    const dropzone = container.querySelector<HTMLElement>('#schem-dropzone')

    dropzone?.addEventListener('click', () => fileInput?.click())
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) handleFile(file)
    })

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropzone.classList.add('dragover')
    })
    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover')
    })
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault()
      dropzone.classList.remove('dragover')
      const file = e.dataTransfer?.files?.[0]
      if (file) handleFile(file)
    })

    container.querySelector('#btn-demo-clock')?.addEventListener('click', () => {
      activeSchematic = createDemoRedstoneClock()
      currentLayer = activeSchematic.height - 1
      render()
    })
    container.querySelector('#btn-demo-cottage')?.addEventListener('click', () => {
      activeSchematic = createDemoSurvivalCottage()
      currentLayer = activeSchematic.height - 1
      render()
    })

    container.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.view as '3d' | 'slice'
        render()
      })
    })

    const spinBtn = container.querySelector<HTMLButtonElement>('#btn-3d-spin')
    spinBtn?.addEventListener('click', () => {
      if (voxelViewer) {
        voxelViewer.autoRotate = !voxelViewer.autoRotate
        spinBtn.classList.toggle('active', voxelViewer.autoRotate)
      }
    })

    container.querySelector('#btn-3d-reset')?.addEventListener('click', () => {
      voxelViewer?.resetCamera()
    })

    container.querySelector('#btn-3d-zoomin')?.addEventListener('click', () => {
      voxelViewer?.zoom(-0.15)
    })

    container.querySelector('#btn-3d-zoomout')?.addEventListener('click', () => {
      voxelViewer?.zoom(0.15)
    })

    const cutSlider = container.querySelector<HTMLInputElement>('#schem-3d-slider')
    const cutLabel = container.querySelector<HTMLElement>('#lbl-3d-layer')
    cutSlider?.addEventListener('input', () => {
      const val = parseInt(cutSlider.value, 10)
      currentLayer = val
      if (cutLabel) {
        cutLabel.textContent = val >= activeSchematic.height - 1 ? 'All Layers (Full)' : `Layer 0 .. ${val}`
      }
      voxelViewer?.setLayerCut(val)
    })

    const slider = container.querySelector<HTMLInputElement>('#schem-layer-slider')
    slider?.addEventListener('input', () => {
      currentLayer = parseInt(slider.value, 10) || 0
      render()
    })

    container.querySelector('#btn-layer-up')?.addEventListener('click', () => {
      if (currentLayer < activeSchematic.height - 1) {
        currentLayer++
        render()
      }
    })
    container.querySelector('#btn-layer-down')?.addEventListener('click', () => {
      if (currentLayer > 0) {
        currentLayer--
        render()
      }
    })

    const matInput = container.querySelector<HTMLInputElement>('#mat-filter')
    matInput?.addEventListener('input', () => {
      materialFilter = matInput.value
      render()
      const reInput = container.querySelector<HTMLInputElement>('#mat-filter')
      if (reInput) {
        reInput.focus()
        reInput.setSelectionRange(materialFilter.length, materialFilter.length)
      }
    })

    container.querySelector('#btn-copy-materials')?.addEventListener('click', async () => {
      const s = activeSchematic
      const lines = [
        `=== Material Shopping List: ${s.name} ===`,
        `Dimensions: ${s.width}W × ${s.height}H × ${s.length}L (Volume: ${s.volume} blocks)`,
        `Total Required Blocks: ${s.totalBlocks}`,
        '',
      ]
      s.materials.forEach(m => {
        lines.push(`• ${m.name}: ${m.count} (${m.stacks})`)
      })

      await copyToClipboard(lines.join('\n'))
      showToast('Material list copied to clipboard!')
    })

    const canvas = container.querySelector<HTMLCanvasElement>('#schem-canvas')
    const tooltip = container.querySelector<HTMLElement>('#schem-tooltip')

    if (canvas && tooltip && activeTab === 'slice') {
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const s = activeSchematic
        const pad = 40
        const availW = canvas.width - pad * 2
        const availH = canvas.height - pad * 2
        const cellSize = Math.min(
          Math.min(32, Math.max(8, Math.floor(availW / s.width))),
          Math.min(32, Math.max(8, Math.floor(availH / s.length)))
        )
        const gridW = s.width * cellSize
        const gridH = s.length * cellSize
        const startX = Math.floor((canvas.width - gridW) / 2)
        const startY = Math.floor((canvas.height - gridH) / 2)

        const cellX = Math.floor((mouseX - startX) / cellSize)
        const cellZ = Math.floor((mouseY - startY) / cellSize)

        if (cellX >= 0 && cellX < s.width && cellZ >= 0 && cellZ < s.length) {
          const b = s.blocks[currentLayer]?.[cellZ]?.[cellX]
          if (b && !isAir(b.name)) {
            tooltip.style.display = 'block'
            tooltip.style.left = `${e.clientX - rect.left + 14}px`
            tooltip.style.top = `${e.clientY - rect.top + 14}px`
            tooltip.innerHTML = `
              <div style="font-weight: 700; color: #fff;">${normalizeBlockName(b.name)}</div>
              <div style="font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono);">X: ${cellX}, Y: ${currentLayer}, Z: ${cellZ}</div>
              ${b.properties ? `
                <div style="font-size: 10px; color: var(--accent-red); margin-top: 2px;">
                  ${Object.entries(b.properties).map(([k, v]) => `${k}=${v}`).join(', ')}
                </div>
              ` : ''}
            `
            return
          }
        }
        tooltip.style.display = 'none'
      })

      canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none'
      })
    }
  }

  render()
}

