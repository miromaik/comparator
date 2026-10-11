export function renderBiomeColor(container: HTMLElement) {
  container.innerHTML = `
    <div class="tool-content fade-in">
      <div class="tool-header">
        <div class="tool-badge">World & Geometry</div>
        <h2>Biome Tint & Colormap Calculator</h2>
        <p class="tool-desc">Calculate grass, foliage, and water tint colors from Minecraft temperature and downfall curves, with full custom datapack JSON export.</p>
      </div>

      <div class="generator-layout">
        <!-- Settings Column -->
        <div class="config-column">
          <div class="panel">
            <h3 class="panel-title">Biome Selection & Climate</h3>

            <div class="form-group">
              <label>Biome Preset</label>
              <select id="biome-preset" class="input">
                <option value="plains">Plains (Standard)</option>
                <option value="cherry_grove">Cherry Grove (Vibrant Blossom)</option>
                <option value="pale_garden">Pale Garden (1.21.4 Muted Desaturated)</option>
                <option value="jungle">Jungle (Lush Emerald)</option>
                <option value="dark_forest">Dark Forest (Deep Pine)</option>
                <option value="swamp">Swamp (Murky Olive)</option>
                <option value="mangrove_swamp">Mangrove Swamp (Teal Water)</option>
                <option value="desert">Desert (Arid Yellow)</option>
                <option value="badlands">Badlands (Terracotta Brown)</option>
                <option value="snowy_plains">Snowy Plains (Icy Teal)</option>
                <option value="warm_ocean">Warm Ocean (Turquoise Cyan)</option>
                <option value="deep_dark">Deep Dark (Grim Sculk Fog)</option>
                <option value="custom">Custom Climate...</option>
              </select>
            </div>

            <div class="form-group">
              <label>Temperature (<span id="val-temp">0.80</span>)</label>
              <input type="range" id="biome-temp" min="-0.5" max="2.0" step="0.05" value="0.8" class="range-slider">
            </div>

            <div class="form-group">
              <label>Downfall / Moisture (<span id="val-downfall">0.40</span>)</label>
              <input type="range" id="biome-downfall" min="0.0" max="1.0" step="0.05" value="0.4" class="range-slider">
            </div>

            <div class="form-group">
              <label>Water Color Hex</label>
              <div class="color-picker-group">
                <input type="color" id="biome-water-color" value="#3f76e4" class="color-input">
                <input type="text" id="biome-water-hex" value="#3f76e4" class="input input-hex">
              </div>
            </div>

            <div class="form-group">
              <label>Water Fog Color Hex</label>
              <div class="color-picker-group">
                <input type="color" id="biome-waterfog-color" value="#050533" class="color-input">
                <input type="text" id="biome-waterfog-hex" value="#050533" class="input input-hex">
              </div>
            </div>

            <div class="form-group">
              <label>Sky / Fog Color Hex</label>
              <div class="color-picker-group">
                <input type="color" id="biome-sky-color" value="#78a7ff" class="color-input">
                <input type="text" id="biome-sky-hex" value="#78a7ff" class="input input-hex">
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Preview & Datapack Output -->
        <div class="preview-column">
          <!-- Colormap Canvas & Swatches -->
          <div class="panel">
            <h3 class="panel-title">Colormap Triangle & Biome Palette</h3>

            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
              <!-- Canvas Colormap -->
              <div style="background: #000; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; position: relative;">
                <canvas id="biome-canvas" width="160" height="160" style="display: block;"></canvas>
                <div style="position: absolute; bottom: 4px; left: 4px; font-size: 10px; color: #94a3b8; pointer-events: none;">colormap.png</div>
              </div>

              <!-- Color Swatches -->
              <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="swatch-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div id="swatch-grass" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);"></div>
                    <div>
                      <div style="font-size: 11px; color: var(--text-muted);">Grass Tint</div>
                      <div id="hex-grass" style="font-size: 13px; font-weight: 600;">#91BD59</div>
                    </div>
                  </div>
                </div>

                <div class="swatch-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div id="swatch-foliage" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);"></div>
                    <div>
                      <div style="font-size: 11px; color: var(--text-muted);">Foliage Tint</div>
                      <div id="hex-foliage" style="font-size: 13px; font-weight: 600;">#77AB2F</div>
                    </div>
                  </div>
                </div>

                <div class="swatch-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div id="swatch-water" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);"></div>
                    <div>
                      <div style="font-size: 11px; color: var(--text-muted);">Water Surface</div>
                      <div id="hex-water" style="font-size: 13px; font-weight: 600;">#3F76E4</div>
                    </div>
                  </div>
                </div>

                <div class="swatch-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div id="swatch-sky" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);"></div>
                    <div>
                      <div style="font-size: 11px; color: var(--text-muted);">Sky / Fog</div>
                      <div id="hex-sky" style="font-size: 13px; font-weight: 600;">#78A7FF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Landscape Preview Strip -->
            <div id="landscape-strip" style="height: 60px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; overflow: hidden;">
              <div id="strip-foliage" style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Canopy Leaves</div>
              <div id="strip-grass" style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Grass Field</div>
              <div id="strip-water" style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">River Water</div>
            </div>
          </div>

          <!-- Datapack JSON Export -->
          <div class="panel mt-4">
            <div class="panel-header-inline">
              <h3 class="panel-title">worldgen/biome JSON</h3>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" id="btn-copy-biome">Copy JSON</button>
                <button class="btn btn-primary btn-sm" id="btn-dl-biome">Download .json</button>
              </div>
            </div>
            <pre class="code-preview" id="preview-biome-json"></pre>
          </div>
        </div>
      </div>
    </div>
  `

  const selectPreset = container.querySelector('#biome-preset') as HTMLSelectElement
  const inputTemp = container.querySelector('#biome-temp') as HTMLInputElement
  const inputDownfall = container.querySelector('#biome-downfall') as HTMLInputElement
  const valTemp = container.querySelector('#val-temp') as HTMLElement
  const valDownfall = container.querySelector('#val-downfall') as HTMLElement

  const inputWaterColor = container.querySelector('#biome-water-color') as HTMLInputElement
  const inputWaterHex = container.querySelector('#biome-water-hex') as HTMLInputElement
  const inputWaterFogColor = container.querySelector('#biome-waterfog-color') as HTMLInputElement
  const inputWaterFogHex = container.querySelector('#biome-waterfog-hex') as HTMLInputElement
  const inputSkyColor = container.querySelector('#biome-sky-color') as HTMLInputElement
  const inputSkyHex = container.querySelector('#biome-sky-hex') as HTMLInputElement

  const canvas = container.querySelector('#biome-canvas') as HTMLCanvasElement
  const swatchGrass = container.querySelector('#swatch-grass') as HTMLElement
  const swatchFoliage = container.querySelector('#swatch-foliage') as HTMLElement
  const swatchWater = container.querySelector('#swatch-water') as HTMLElement
  const swatchSky = container.querySelector('#swatch-sky') as HTMLElement
  const hexGrass = container.querySelector('#hex-grass') as HTMLElement
  const hexFoliage = container.querySelector('#hex-foliage') as HTMLElement
  const hexWater = container.querySelector('#hex-water') as HTMLElement
  const hexSky = container.querySelector('#hex-sky') as HTMLElement

  const stripFoliage = container.querySelector('#strip-foliage') as HTMLElement
  const stripGrass = container.querySelector('#strip-grass') as HTMLElement
  const stripWater = container.querySelector('#strip-water') as HTMLElement

  const previewJson = container.querySelector('#preview-biome-json') as HTMLElement

  const PRESETS: Record<string, { temp: number; downfall: number; grass?: string; foliage?: string; water: string; waterfog: string; sky: string }> = {
    plains: { temp: 0.8, downfall: 0.4, water: '#3f76e4', waterfog: '#050533', sky: '#78a7ff' },
    cherry_grove: { temp: 0.5, downfall: 0.8, grass: '#b6db67', foliage: '#b6db67', water: '#5db7ef', waterfog: '#1d3557', sky: '#89b8ff' },
    pale_garden: { temp: 0.7, downfall: 0.8, grass: '#737373', foliage: '#878787', water: '#4f5d75', waterfog: '#1c2541', sky: '#6c757d' },
    jungle: { temp: 0.95, downfall: 0.9, grass: '#59c93c', foliage: '#30bb0b', water: '#3f76e4', waterfog: '#050533', sky: '#78a7ff' },
    dark_forest: { temp: 0.7, downfall: 0.8, grass: '#507a32', foliage: '#507a32', water: '#3f76e4', waterfog: '#050533', sky: '#78a7ff' },
    swamp: { temp: 0.8, downfall: 0.9, grass: '#6a7039', foliage: '#6a7039', water: '#617b5d', waterfog: '#232317', sky: '#78a7ff' },
    mangrove_swamp: { temp: 0.8, downfall: 0.9, grass: '#6a7039', foliage: '#8db127', water: '#3a7a6a', waterfog: '#102e26', sky: '#78a7ff' },
    desert: { temp: 2.0, downfall: 0.0, grass: '#bfb755', foliage: '#aea42a', water: '#3f76e4', waterfog: '#050533', sky: '#78a7ff' },
    badlands: { temp: 2.0, downfall: 0.0, grass: '#90814d', foliage: '#9e814d', water: '#3f76e4', waterfog: '#050533', sky: '#78a7ff' },
    snowy_plains: { temp: 0.0, downfall: 0.5, grass: '#80b497', foliage: '#60a17b', water: '#3d57d6', waterfog: '#050533', sky: '#82b0ff' },
    warm_ocean: { temp: 0.5, downfall: 0.5, grass: '#8eb971', foliage: '#71a74d', water: '#43d5ee', waterfog: '#041f33', sky: '#78a7ff' },
    deep_dark: { temp: 0.8, downfall: 0.4, grass: '#0e2b3d', foliage: '#0a1d28', water: '#081726', waterfog: '#03080e', sky: '#03071e' },
  }

  function sampleColormap(temp: number, downfall: number): { grass: string; foliage: string } {
    const t = Math.max(0.0, Math.min(1.0, temp))
    const d = Math.max(0.0, Math.min(1.0, downfall)) * t

    const rG = Math.round(191 - t * 65 + d * 15)
    const gG = Math.round(180 + t * 25 - d * 30)
    const bG = Math.round(75 + (1 - t) * 60)

    const rF = Math.round(120 - t * 45 + d * 10)
    const gF = Math.round(175 + t * 20 - d * 25)
    const bF = Math.round(50 + (1 - t) * 50)

    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
    return {
      grass: `#${toHex(rG)}${toHex(gG)}${toHex(bG)}`,
      foliage: `#${toHex(rF)}${toHex(gF)}${toHex(bF)}`
    }
  }

  function drawColormapCanvas(currentT: number, currentD: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    const imgData = ctx.createImageData(w, h)
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const u = 1 - px / w
        const v = 1 - py / h

        const idx = (py * w + px) * 4
        if (v <= u) {
          const r = Math.round(191 - u * 65 + v * 15)
          const g = Math.round(180 + u * 25 - v * 30)
          const b = Math.round(75 + (1 - u) * 60)
          imgData.data[idx] = r
          imgData.data[idx + 1] = g
          imgData.data[idx + 2] = b
          imgData.data[idx + 3] = 255
        } else {
          imgData.data[idx] = 16
          imgData.data[idx + 1] = 20
          imgData.data[idx + 2] = 28
          imgData.data[idx + 3] = 255
        }
      }
    }
    ctx.putImageData(imgData, 0, 0)

    const tClamped = Math.max(0, Math.min(1, currentT))
    const dClamped = Math.max(0, Math.min(1, currentD)) * tClamped
    const mx = (1 - tClamped) * w
    const my = (1 - dClamped) * h

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(mx, my, 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  function update() {
    const temp = parseFloat(inputTemp.value)
    const downfall = parseFloat(inputDownfall.value)
    valTemp.textContent = temp.toFixed(2)
    valDownfall.textContent = downfall.toFixed(2)

    const presetKey = selectPreset.value
    const preset = PRESETS[presetKey]

    let grassColor = ''
    let foliageColor = ''

    if (preset && preset.grass) {
      grassColor = preset.grass
      foliageColor = preset.foliage || preset.grass
    } else {
      const sampled = sampleColormap(temp, downfall)
      grassColor = sampled.grass
      foliageColor = sampled.foliage
    }

    const waterColor = inputWaterHex.value
    const skyColor = inputSkyHex.value

    swatchGrass.style.backgroundColor = grassColor
    swatchFoliage.style.backgroundColor = foliageColor
    swatchWater.style.backgroundColor = waterColor
    swatchSky.style.backgroundColor = skyColor

    hexGrass.textContent = grassColor.toUpperCase()
    hexFoliage.textContent = foliageColor.toUpperCase()
    hexWater.textContent = waterColor.toUpperCase()
    hexSky.textContent = skyColor.toUpperCase()

    stripGrass.style.backgroundColor = grassColor
    stripFoliage.style.backgroundColor = foliageColor
    stripWater.style.backgroundColor = waterColor

    drawColormapCanvas(temp, downfall)

    const hexToInt = (hex: string) => parseInt(hex.replace('#', ''), 16) || 0
    const biomeJson = {
      temperature: temp,
      downfall: downfall,
      has_precipitation: downfall > 0,
      effects: {
        sky_color: hexToInt(skyColor),
        fog_color: hexToInt(skyColor),
        water_color: hexToInt(waterColor),
        water_fog_color: hexToInt(inputWaterFogHex.value),
        grass_color: hexToInt(grassColor),
        foliage_color: hexToInt(foliageColor)
      }
    }

    previewJson.textContent = JSON.stringify(biomeJson, null, 2)
  }

  selectPreset.addEventListener('change', () => {
    const p = PRESETS[selectPreset.value]
    if (p) {
      inputTemp.value = p.temp.toString()
      inputDownfall.value = p.downfall.toString()
      inputWaterColor.value = p.water
      inputWaterHex.value = p.water
      inputWaterFogColor.value = p.waterfog
      inputWaterFogHex.value = p.waterfog
      inputSkyColor.value = p.sky
      inputSkyHex.value = p.sky
    }
    update()
  })

  inputTemp.addEventListener('input', () => {
    selectPreset.value = 'custom'
    update()
  })
  inputDownfall.addEventListener('input', () => {
    selectPreset.value = 'custom'
    update()
  })

  inputWaterColor.addEventListener('input', () => {
    inputWaterHex.value = inputWaterColor.value
    update()
  })
  inputWaterHex.addEventListener('input', () => {
    inputWaterColor.value = inputWaterHex.value
    update()
  })

  inputWaterFogColor.addEventListener('input', () => {
    inputWaterFogHex.value = inputWaterFogColor.value
    update()
  })
  inputWaterFogHex.addEventListener('input', () => {
    inputWaterFogColor.value = inputWaterFogHex.value
    update()
  })

  inputSkyColor.addEventListener('input', () => {
    inputSkyHex.value = inputSkyColor.value
    update()
  })
  inputSkyHex.addEventListener('input', () => {
    inputSkyColor.value = inputSkyHex.value
    update()
  })

  container.querySelector('#btn-copy-biome')?.addEventListener('click', () => {
    navigator.clipboard.writeText(previewJson.textContent || '')
    showToast('Biome JSON copied to clipboard!')
  })

  container.querySelector('#btn-dl-biome')?.addEventListener('click', () => {
    const blob = new Blob([previewJson.textContent || ''], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectPreset.value}_biome.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded biome JSON!')
  })

  function showToast(msg: string) {
    const toast = document.createElement('div')
    toast.className = 'toast show'
    toast.textContent = msg
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }

  update()
}

export const mount = renderBiomeColor
