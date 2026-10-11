# COMPARATOR

Minecraft toolkit website providing 38 tools for server administration, datapack generation, redstone calculations, and world geometry. Supports dual command syntax for modern 1.20.5+ (components) and legacy 1.14+ (NBT).

## Stack

- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Docker](https://www.docker.com)
- Native Web APIs (Canvas, WebGL, DecompressionStream)

## Tools

### Text & Formatting

| Tool | Description |
|------|-------------|
| MiniMessage Editor | RGB gradients, text decorations, MiniMessage & legacy formats |
| Tellraw & JSON Studio | /tellraw, /title, actionbar, hover tooltips & click events |
| Hex Gradient Generator | Multi-stop RGB gradients for MiniMessage, Spigot, CMI & JSON |
| MOTD & Server List | 2-line MOTD live preview with ping and player counter |
| Signs & Books Studio | Hanging & standing signs, 12 woods, front/back text, glow ink & written books |

### Items & Entities

| Tool | Description |
|------|-------------|
| Item Builder Studio | Custom /give items, enchantments, lore, attributes & dual syntax |
| Armor Trim Studio | 18 trim templates, 10 minerals, mannequin preview & /give |
| Banner Pattern Studio | Interactive loom layers, patterns & /give commands |
| Mob & Boss Creator | Custom /summon boss mobs, health, damage, equipment & attributes |
| Firework Rocket Studio | Custom shapes, RGB colors, trail, twinkle & particle canvas |
| Potion & Arrow Brewer | Duration, amplifier, ambient particles, RGB colors & tipped arrows |
| Armor Stand & Pose Studio | Interactive wooden model posing, armor overlays & /summon |
| Custom Head Database | Decorative mini-block heads, food, tech, Base64 & dual give formats |

### Players & Identity

| Tool | Description |
|------|-------------|
| Player & Skin Studio | Player lookup, 3D skins, online/offline UUID & head commands |
| Villager Trade & Cures | Zombie infection discount calculator & Hero of Village |

### Datapacks & Assets

| Tool | Description |
|------|-------------|
| 3×3 Recipe Studio | Interactive crafting grid, shaped, shapeless & furnace recipes |
| Loot Table Designer | Chests, entities, rolls, weight pools, functions & JSON export |
| Scoreboard & Teams Studio | Objectives, display slots, teams & .mcfunction exporter |
| Advancements & Criteria | Custom advancements, icons, frames, triggers & JSON exporter |
| Command Block Sequencer | Chain/repeating sequences, conditional flow & target selector validator |

### World & Geometry

| Tool | Description |
|------|-------------|
| Nether Coordinates | Overworld ↔ Nether 1:8 coordinate math & portal linking |
| Beacon Calculator | Tiers I-IV, multi-beacon clusters, mineral stacks & blueprints |
| Circle & Sphere Grid | Bresenham voxel canvas for circles, ellipses, spheres and domes |
| Chunk & Slime Radar | Block ↔ Chunk ↔ Region file math and Java RNG slime chunk radar |
| Seed Map & Biome Explorer | Biome climate noise, structures locator & interactive map |
| WorldBorder & Pre-gen | Border boundaries, chunk math, .mca counts & Chunky commands |
| Elytra Kinetics & Fall | Fall physics, Feather Falling IV, Mace smash & elytra kinetic damage |
| Biome Tint & Colormap | Temperature & downfall colormap curves, grass/foliage tint & biome JSON |
| Schematic & Litematica 3D | Interactive 3D & 2D slice viewer for .litematic & .schem with material list |

### Calculators & Redstone

| Tool | Description |
|------|-------------|
| Anvil & Penalty Optimizer | Prior work penalties, repair costs & optimal book combination order |
| Redstone & Hopper Timing | Game ticks, repeater delays & hopper pipeline throughput simulator |
| XP & Mob Farm Calculator | Level milestones, experience deficits, Enderman & Blaze kills |
| Combat & Armor Calculator | 1.21+ damage scaling, armor toughness, Prot IV EPF & Mace breach |
| Enchant Tree Optimizer | Optimal binary merge tree to avoid "Too Expensive!" 39-level penalty |

### Server Management

| Tool | Description |
|------|-------------|
| server.properties Studio | Visual editor for gameplay, world performance, whitelist & security |
| Sound Events & /playsound | 800+ vanilla sound events, categories, pitch, volume & command builder |
| Particle Studio & FX | RGB dust, particle rings, spirals, spheres & /particle command builder |
| BossBar & HUD Studio | Visual boss health bar, notches, colors, players & /bossbar commands |

## Run

```bash
docker compose up
```

Open `http://localhost:8080` in your browser.

Without Docker:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

[MIT](LICENSE) - Miro
