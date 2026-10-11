class Mat4 {
  static create(): Float32Array {
    const out = new Float32Array(16)
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1
    return out
  }

  static perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number): void {
    const f = 1.0 / Math.tan(fovy / 2)
    const nf = 1 / (near - far)
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1
    out[12] = 0; out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0
  }

  static lookAt(out: Float32Array, eye: number[], center: number[], up: number[]): void {
    let x0: number, x1: number, x2: number, y0: number, y1: number, y2: number, z0: number, z1: number, z2: number, len: number
    const eyex = eye[0], eyey = eye[1], eyez = eye[2]
    const upx = up[0], upy = up[1], upz = up[2]
    const centerx = center[0], centery = center[1], centerz = center[2]

    z0 = eyex - centerx
    z1 = eyey - centery
    z2 = eyez - centerz
    len = 1 / Math.hypot(z0, z1, z2)
    z0 *= len; z1 *= len; z2 *= len

    x0 = upy * z2 - upz * z1
    x1 = upz * z0 - upx * z2
    x2 = upx * z1 - upy * z0
    len = Math.hypot(x0, x1, x2)
    if (!len) {
      x0 = 0; x1 = 0; x2 = 0
    } else {
      len = 1 / len
      x0 *= len; x1 *= len; x2 *= len
    }

    y0 = z1 * x2 - z2 * x1
    y1 = z2 * x0 - z0 * x2
    y2 = z0 * x1 - z1 * x0
    len = Math.hypot(y0, y1, y2)
    if (!len) {
      y0 = 0; y1 = 0; y2 = 0
    } else {
      len = 1 / len
      y0 *= len; y1 *= len; y2 *= len
    }

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez)
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez)
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez)
    out[15] = 1
  }

  static multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
  }
}

export type BackAttachment = 'none' | 'cape' | 'elytra'

export class SkinViewer3D {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private vbo: WebGLBuffer | null = null

  private skinTexture: WebGLTexture | null = null
  private capeTexture: WebGLTexture | null = null

  private uMVP: WebGLUniformLocation | null = null
  private uSkinTex: WebGLUniformLocation | null = null
  private uCapeTex: WebGLUniformLocation | null = null

  private vertexCount: number = 0

  public yaw: number = -0.45
  public pitch: number = 0.22
  public distance: number = 52
  public autoRotate: boolean = true
  public showOuterLayers: boolean = true
  public backAttachment: BackAttachment = 'cape'
  public isSlim: boolean = false

  private isDragging: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0
  private animFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.initGL()
    this.initEvents()
    this.startLoop()
  }

  private initGL(): void {
    const gl = this.canvas.getContext('webgl', { antialias: true, alpha: true }) ||
               this.canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return
    this.gl = gl

    const vsSource = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
      attribute vec2 aUV;
      attribute float aTexId;

      uniform mat4 uMVP;

      varying vec2 vUV;
      varying float vLight;
      varying float vTexId;

      void main() {
        vec3 norm = normalize(aNormal);
        vec3 lightDir = normalize(vec3(0.4, 0.9, 0.6));
        float diff = max(dot(norm, lightDir), 0.0);
        float ambient = 0.55;
        if (norm.y > 0.5) ambient += 0.25;
        else if (norm.y < -0.5) ambient -= 0.15;
        else if (norm.z < -0.5) ambient -= 0.10;

        vLight = clamp(ambient + diff * 0.45, 0.35, 1.0);
        vUV = aUV;
        vTexId = aTexId;
        gl_Position = uMVP * vec4(aPos, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      uniform sampler2D uSkinTex;
      uniform sampler2D uCapeTex;

      varying vec2 vUV;
      varying float vLight;
      varying float vTexId;

      void main() {
        vec4 color;
        if (vTexId > 0.5) {
          color = texture2D(uCapeTex, vUV);
        } else {
          color = texture2D(uSkinTex, vUV);
        }
        if (color.a < 0.1) discard;
        gl_FragColor = vec4(color.rgb * vLight, color.a);
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

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return

    this.program = prog
    this.uMVP = gl.getUniformLocation(prog, 'uMVP')
    this.uSkinTex = gl.getUniformLocation(prog, 'uSkinTex')
    this.uCapeTex = gl.getUniformLocation(prog, 'uCapeTex')

    this.vbo = gl.createBuffer()

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.skinTexture = this.createDefaultTexture([150, 150, 150, 255])
    this.capeTexture = this.createDefaultCapeTexture()
  }

  private createDefaultTexture(rgba: number[]): WebGLTexture {
    const gl = this.gl!
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba))
    return tex
  }

  private createDefaultCapeTexture(): WebGLTexture {
    const gl = this.gl!
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 64, 32)
      ctx.fillStyle = '#8b1e1e'
      ctx.fillRect(1, 1, 10, 16)
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(2, 2, 8, 2)
      ctx.fillRect(2, 4, 2, 11)
      ctx.fillRect(8, 4, 2, 11)
      ctx.fillStyle = '#5c1414'
      ctx.fillRect(12, 1, 10, 16)
      ctx.fillStyle = '#3a383e'
      ctx.fillRect(34, 0, 10, 2)
      ctx.fillStyle = '#55525c'
      ctx.fillRect(36, 2, 10, 20)
      ctx.fillStyle = '#38353d'
      ctx.strokeRect(36.5, 2.5, 9, 19)
      ctx.fillStyle = '#6e6977'
      ctx.fillRect(38, 4, 3, 14)
    }
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return tex
  }

  private initEvents(): void {
    const c = this.canvas

    const onPointerDown = (clientX: number, clientY: number) => {
      this.isDragging = true
      this.lastMouseX = clientX
      this.lastMouseY = clientY
    }

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!this.isDragging) return
      const dx = clientX - this.lastMouseX
      const dy = clientY - this.lastMouseY
      this.lastMouseX = clientX
      this.lastMouseY = clientY

      this.yaw -= dx * 0.012
      this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch - dy * 0.012))
      this.autoRotate = false
    }

    const onPointerUp = () => {
      this.isDragging = false
    }

    c.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY))
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY))
    window.addEventListener('mouseup', onPointerUp)

    c.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY)
      }
    }, { passive: true })

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }, { passive: true })

    window.addEventListener('touchend', onPointerUp)

    c.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.distance = Math.max(24, Math.min(88, this.distance + e.deltaY * 0.06))
    }, { passive: false })
  }

  public setSkinTexture(img: HTMLImageElement): void {
    const gl = this.gl
    if (!gl) return

    let canvasSource: HTMLCanvasElement | HTMLImageElement = img
    if (img.width === 64 && img.height === 32) {
      const cnv = document.createElement('canvas')
      cnv.width = 64
      cnv.height = 64
      const ctx = cnv.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        ctx.drawImage(img, 0, 16, 16, 16, 16, 48, 16, 16)
        ctx.drawImage(img, 40, 16, 16, 16, 32, 48, 16, 16)
        canvasSource = cnv
      }
    }

    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasSource)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.skinTexture = tex
    this.rebuildModel()
  }

  public setCapeTexture(img: HTMLImageElement | null): void {
    const gl = this.gl
    if (!gl) return

    if (!img) {
      this.capeTexture = this.createDefaultCapeTexture()
      this.rebuildModel()
      return
    }

    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.capeTexture = tex
    this.rebuildModel()
  }

  public rebuildModel(): void {
    const vertices: number[] = []

    const addBox = (
      cx: number, cy: number, cz: number,
      w: number, h: number, d: number,
      uX: number, uY: number,
      texW: number = 64, texH: number = 64,
      texId: number = 0,
      scale: number = 1.0
    ) => {
      const hw = (w * scale) / 2
      const hh = (h * scale) / 2
      const hd = (d * scale) / 2

      const x0 = cx - hw, x1 = cx + hw
      const y0 = cy - hh, y1 = cy + hh
      const z0 = cz - hd, z1 = cz + hd

      const u = (px: number) => px / texW
      const v = (py: number) => py / texH

      const quad = (
        p0: [number, number, number],
        p1: [number, number, number],
        p2: [number, number, number],
        p3: [number, number, number],
        norm: [number, number, number],
        uv0: [number, number],
        uv1: [number, number],
        uv2: [number, number],
        uv3: [number, number]
      ) => {
        vertices.push(p0[0], p0[1], p0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], texId)
        vertices.push(p1[0], p1[1], p1[2], norm[0], norm[1], norm[2], uv1[0], uv1[1], texId)
        vertices.push(p2[0], p2[1], p2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], texId)
        vertices.push(p0[0], p0[1], p0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], texId)
        vertices.push(p2[0], p2[1], p2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], texId)
        vertices.push(p3[0], p3[1], p3[2], norm[0], norm[1], norm[2], uv3[0], uv3[1], texId)
      }

      quad(
        [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
        [0, 1, 0],
        [u(uX + d), v(uY)], [u(uX + d + w), v(uY)], [u(uX + d + w), v(uY + d)], [u(uX + d), v(uY + d)]
      )

      quad(
        [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0],
        [0, -1, 0],
        [u(uX + d + w), v(uY)], [u(uX + d + 2 * w), v(uY)], [u(uX + d + 2 * w), v(uY + d)], [u(uX + d + w), v(uY + d)]
      )

      quad(
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
        [0, 0, 1],
        [u(uX + d), v(uY + d + h)], [u(uX + d + w), v(uY + d + h)], [u(uX + d + w), v(uY + d)], [u(uX + d), v(uY + d)]
      )

      quad(
        [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0],
        [0, 0, -1],
        [u(uX + 2 * d + w), v(uY + d + h)], [u(uX + 2 * d + 2 * w), v(uY + d + h)], [u(uX + 2 * d + 2 * w), v(uY + d)], [u(uX + 2 * d + w), v(uY + d)]
      )

      quad(
        [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1],
        [1, 0, 0],
        [u(uX), v(uY + d + h)], [u(uX + d), v(uY + d + h)], [u(uX + d), v(uY + d)], [u(uX), v(uY + d)]
      )

      quad(
        [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0],
        [-1, 0, 0],
        [u(uX + d + w), v(uY + d + h)], [u(uX + 2 * d + w), v(uY + d + h)], [u(uX + 2 * d + w), v(uY + d)], [u(uX + d + w), v(uY + d)]
      )
    }

    const armW = this.isSlim ? 3 : 4
    const armX = this.isSlim ? 5.5 : 6.0

    addBox(0, 14, 0, 8, 8, 8, 0, 0)
    addBox(0, 4, 0, 8, 12, 4, 16, 16)
    addBox(armX, 4, 0, armW, 12, 4, 40, 16)
    addBox(-armX, 4, 0, armW, 12, 4, 32, 48)
    addBox(2, -8, 0, 4, 12, 4, 0, 16)
    addBox(-2, -8, 0, 4, 12, 4, 16, 48)

    if (this.showOuterLayers) {
      addBox(0, 14, 0, 8, 8, 8, 32, 0, 64, 64, 0, 1.12)
      addBox(0, 4, 0, 8, 12, 4, 16, 32, 64, 64, 0, 1.08)
      addBox(armX, 4, 0, armW, 12, 4, 40, 32, 64, 64, 0, 1.08)
      addBox(-armX, 4, 0, armW, 12, 4, 48, 48, 64, 64, 0, 1.08)
      addBox(2, -8, 0, 4, 12, 4, 0, 32, 64, 64, 0, 1.08)
      addBox(-2, -8, 0, 4, 12, 4, 0, 48, 64, 64, 0, 1.08)
    }

    if (this.backAttachment === 'cape') {
      const cx = 0, cy = 2, cz = -2.6
      const w = 10, h = 16, d = 1
      const texW = 64, texH = 32
      const hw = w / 2, hh = h / 2, hd = d / 2
      const angle = 0.22

      const rot = (x: number, y: number, z: number): [number, number, number] => {
        const dy = y - (cy + hh)
        const dz = z - cz
        const ny = (cy + hh) + dy * Math.cos(angle) - dz * Math.sin(angle)
        const nz = cz + dy * Math.sin(angle) + dz * Math.cos(angle)
        return [x, ny, nz]
      }

      const u = (px: number) => px / texW
      const v = (py: number) => py / texH

      const x0 = cx - hw, x1 = cx + hw
      const y0 = cy - hh, y1 = cy + hh
      const z0 = cz - hd, z1 = cz + hd

      const quadC = (
        p0: [number, number, number], p1: [number, number, number],
        p2: [number, number, number], p3: [number, number, number],
        norm: [number, number, number],
        uv0: [number, number], uv1: [number, number], uv2: [number, number], uv3: [number, number]
      ) => {
        const rp0 = rot(...p0), rp1 = rot(...p1), rp2 = rot(...p2), rp3 = rot(...p3)
        vertices.push(rp0[0], rp0[1], rp0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], 1)
        vertices.push(rp1[0], rp1[1], rp1[2], norm[0], norm[1], norm[2], uv1[0], uv1[1], 1)
        vertices.push(rp2[0], rp2[1], rp2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], 1)
        vertices.push(rp0[0], rp0[1], rp0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], 1)
        vertices.push(rp2[0], rp2[1], rp2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], 1)
        vertices.push(rp3[0], rp3[1], rp3[2], norm[0], norm[1], norm[2], uv3[0], uv3[1], 1)
      }

      quadC([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1],
        [u(1), v(17)], [u(11), v(17)], [u(11), v(1)], [u(1), v(1)])

      quadC([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1],
        [u(22), v(17)], [u(12), v(17)], [u(12), v(1)], [u(22), v(1)])

      quadC([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0],
        [u(1), v(0)], [u(11), v(0)], [u(11), v(1)], [u(1), v(1)])
      quadC([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, -1, 0],
        [u(11), v(0)], [u(21), v(0)], [u(21), v(1)], [u(11), v(1)])
      quadC([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0],
        [u(0), v(17)], [u(1), v(17)], [u(1), v(1)], [u(0), v(1)])
      quadC([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0],
        [u(11), v(17)], [u(12), v(17)], [u(12), v(1)], [u(11), v(1)])
    }

    if (this.backAttachment === 'elytra') {
      const u = (px: number) => px / 64
      const v = (py: number) => py / 32

      const addBoxWing = (isRight: boolean) => {
        const sign = isRight ? 1 : -1
        const pivotX = sign * 0.6
        const pivotY = 9.2
        const pivotZ = -2.2

        const pitch = 0.22
        const yaw = sign * 0.05
        const roll = sign * 0.20

        const cxP = Math.cos(pitch), sxP = Math.sin(pitch)
        const cxY = Math.cos(yaw), sxY = Math.sin(yaw)
        const cxR = Math.cos(roll), sxR = Math.sin(roll)

        const tf = (lx: number, ly: number, lz: number): [number, number, number] => {
          const x1 = lx * cxR - ly * sxR
          const y1 = lx * sxR + ly * cxR
          const z1 = lz

          const x2 = x1 * cxY + z1 * sxY
          const y2 = y1
          const z2 = -x1 * sxY + z1 * cxY

          const x3 = x2
          const y3 = y2 * cxP - z2 * sxP
          const z3 = y2 * sxP + z2 * cxP

          return [pivotX + x3, pivotY + y3, pivotZ + z3]
        }

        const rotN = (nx: number, ny: number, nz: number): [number, number, number] => {
          const x1 = nx * cxR - ny * sxR
          const y1 = nx * sxR + ny * cxR
          const z1 = nz

          const x2 = x1 * cxY + z1 * sxY
          const y2 = y1
          const z2 = -x1 * sxY + z1 * cxY

          const x3 = x2
          const y3 = y2 * cxP - z2 * sxP
          const z3 = y2 * sxP + z2 * cxP

          return [x3, y3, z3]
        }

        const emitQuad = (
          p0: [number, number, number], p1: [number, number, number],
          p2: [number, number, number], p3: [number, number, number],
          norm: [number, number, number],
          uv0: [number, number], uv1: [number, number],
          uv2: [number, number], uv3: [number, number]
        ) => {
          vertices.push(p0[0], p0[1], p0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], 1)
          vertices.push(p1[0], p1[1], p1[2], norm[0], norm[1], norm[2], uv1[0], uv1[1], 1)
          vertices.push(p2[0], p2[1], p2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], 1)
          vertices.push(p0[0], p0[1], p0[2], norm[0], norm[1], norm[2], uv0[0], uv0[1], 1)
          vertices.push(p2[0], p2[1], p2[2], norm[0], norm[1], norm[2], uv2[0], uv2[1], 1)
          vertices.push(p3[0], p3[1], p3[2], norm[0], norm[1], norm[2], uv3[0], uv3[1], 1)
        }

        const w = 9.5
        const h = 20.0
        const d = 1.0

        const nOut = rotN(0, 0, -1)
        const nIn = rotN(0, 0, 1)
        const nTop = rotN(0, 1, 0)
        const nSide = rotN(sign, 0, 0)

        if (isRight) {
          emitQuad(
            tf(0, -h, -d), tf(w, -h, -d), tf(w, 0, -d), tf(0, 0, -d),
            nOut,
            [u(36), v(22)], [u(46), v(22)], [u(46), v(2)], [u(36), v(2)]
          )
          emitQuad(
            tf(w, -h, 0), tf(0, -h, 0), tf(0, 0, 0), tf(w, 0, 0),
            nIn,
            [u(46), v(22)], [u(36), v(22)], [u(36), v(2)], [u(46), v(2)]
          )
          emitQuad(
            tf(0, 0, -d), tf(w, 0, -d), tf(w, 0, 0), tf(0, 0, 0),
            nTop,
            [u(34), v(0)], [u(44), v(0)], [u(44), v(2)], [u(34), v(2)]
          )
          emitQuad(
            tf(w, -h, -d), tf(w, -h, 0), tf(w, 0, 0), tf(w, 0, -d),
            nSide,
            [u(34), v(22)], [u(36), v(22)], [u(36), v(2)], [u(34), v(2)]
          )
        } else {
          emitQuad(
            tf(-w, -h, -d), tf(0, -h, -d), tf(0, 0, -d), tf(-w, 0, -d),
            nOut,
            [u(46), v(22)], [u(36), v(22)], [u(36), v(2)], [u(46), v(2)]
          )
          emitQuad(
            tf(0, -h, 0), tf(-w, -h, 0), tf(-w, 0, 0), tf(0, 0, 0),
            nIn,
            [u(36), v(22)], [u(46), v(22)], [u(46), v(2)], [u(36), v(2)]
          )
          emitQuad(
            tf(-w, 0, -d), tf(0, 0, -d), tf(0, 0, 0), tf(-w, 0, 0),
            nTop,
            [u(44), v(0)], [u(34), v(0)], [u(34), v(2)], [u(44), v(2)]
          )
          emitQuad(
            tf(-w, -h, 0), tf(-w, -h, -d), tf(-w, 0, -d), tf(-w, 0, 0),
            nSide,
            [u(36), v(22)], [u(34), v(22)], [u(34), v(2)], [u(36), v(2)]
          )
        }
      }

      addBoxWing(true)
      addBoxWing(false)
    }

    const gl = this.gl
    if (!gl || !this.vbo) return

    this.vertexCount = vertices.length / 9
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  }

  private startLoop(): void {
    const renderFrame = () => {
      if (this.autoRotate && !this.isDragging) {
        this.yaw += 0.008
      }
      this.draw()
      this.animFrameId = requestAnimationFrame(renderFrame)
    }
    this.animFrameId = requestAnimationFrame(renderFrame)
  }

  private draw(): void {
    const gl = this.gl
    if (!gl || !this.program || !this.vbo) return

    const dpr = window.devicePixelRatio || 1
    const displayW = Math.floor(this.canvas.clientWidth * dpr)
    const displayH = Math.floor(this.canvas.clientHeight * dpr)

    if (this.canvas.width !== displayW || this.canvas.height !== displayH) {
      this.canvas.width = displayW
      this.canvas.height = displayH
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const aspect = this.canvas.width / (this.canvas.height || 1)
    const proj = Mat4.create()
    Mat4.perspective(proj, Math.PI / 4.2, aspect, 0.1, 500)

    const cosP = Math.cos(this.pitch)
    const sinP = Math.sin(this.pitch)
    const cosY = Math.cos(this.yaw)
    const sinY = Math.sin(this.yaw)

    const eyeX = this.distance * cosP * sinY
    const eyeY = 4 + this.distance * sinP
    const eyeZ = this.distance * cosP * cosY

    const view = Mat4.create()
    Mat4.lookAt(view, [eyeX, eyeY, eyeZ], [0, 4, 0], [0, 1, 0])

    const mvp = Mat4.create()
    Mat4.multiply(mvp, proj, view)

    gl.useProgram(this.program)
    gl.uniformMatrix4fv(this.uMVP, false, mvp)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.skinTexture)
    gl.uniform1i(this.uSkinTex, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.capeTexture)
    gl.uniform1i(this.uCapeTex, 1)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)

    const stride = 9 * 4
    const aPos = gl.getAttribLocation(this.program, 'aPos')
    const aNormal = gl.getAttribLocation(this.program, 'aNormal')
    const aUV = gl.getAttribLocation(this.program, 'aUV')
    const aTexId = gl.getAttribLocation(this.program, 'aTexId')

    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0)

    gl.enableVertexAttribArray(aNormal)
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 3 * 4)

    gl.enableVertexAttribArray(aUV)
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, stride, 6 * 4)

    gl.enableVertexAttribArray(aTexId)
    gl.vertexAttribPointer(aTexId, 1, gl.FLOAT, false, stride, 8 * 4)

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount)
  }

  public resetCamera(): void {
    this.yaw = -0.45
    this.pitch = 0.22
    this.distance = 52
    this.autoRotate = false
  }

  public destroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }
}
