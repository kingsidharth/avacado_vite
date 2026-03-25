# Figma Design Spec — Node 703:24 (Avocado TOFU App)

**Source:** [Figma — Avocado TOFU App](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=703-24)  
**Figma node ID:** `703:24`  
**Extracted via:** Figma MCP (get_design_context, get_metadata, get_screenshot, get_variable_defs)

---

## 1. Root Frame

| Property | Value |
|----------|--------|
| **Figma name** | Frame 2147225358 |
| **Node ID** | 703:24 |
| **Position** | x: 241px, y: 1313.5px (in file) |
| **Size** | 140px × 136px |
| **Layout** | `relative`, full size container |

---

## 2. Hierarchy & Structure

```
Frame 703:24 (140×136)
├── Blob 703:25 (centered, 140×136)
├── Blob 703:26 (centered offset, ~110×107)
├── Group 703:27 (absolute, top-left area)
│   ├── 703:28 — image group (32.64, 22.65) 41.37×42.61
│   └── 703:31 — image group (80.63, 22.65) 41.37×42.61
├── Vector 703:34 (59.05, 74.69) 31.51×10.02
└── Rotated block (30.39, 2.65) 25.61×28.19
    └── Vector 703:35 (21.11×24.43) — rotation 11.68°
```

---

## 3. Element-by-Element Specs

### 3.1 Blob (703:25)

| Property | Value |
|----------|--------|
| **Node ID** | 703:25 |
| **Position** | Centered: `left: 50%`, `top: 50%`, `transform: translate(-50%, -50%)` |
| **Size** | 140px × 136px |
| **Overflow / crop** | Inner content extends: `inset: -32.35% -31.43%` (negative margins) |
| **Asset** | SVG (blob shape) — localhost asset ref |

### 3.2 Blob (703:26)

| Property | Value |
|----------|--------|
| **Node ID** | 703:26 |
| **Position** | Centered with offset: `left: calc(50% + 4.01px)`, `top: calc(50% - 2.74px)`, `transform: translate(-50%, -50%)` |
| **Size** | 110.322px × 107.17px |
| **Overflow / crop** | Inner content: `inset: -41.06% -39.88%` |
| **Asset** | SVG (second blob) |

### 3.3 Group (703:27) — Top-left graphics

| Property | Value |
|----------|--------|
| **Node ID** | 703:27 |
| **Position** | `left: 32.64px`, `top: 22.65px` |
| **Display** | `contents` (children positioned absolutely in parent) |

#### Child 703:28

| Property | Value |
|----------|--------|
| **Position** | `left: 32.64px`, `top: 22.65px` |
| **Size** | 41.372px × 42.61px |
| **Asset** | SVG group (localhost) |

#### Child 703:31

| Property | Value |
|----------|--------|
| **Position** | `left: 80.63px`, `top: 22.65px` |
| **Size** | 41.372px × 42.61px |
| **Asset** | SVG group (localhost) |

### 3.4 Vector (703:34)

| Property | Value |
|----------|--------|
| **Node ID** | 703:34 |
| **Position** | `left: 59.05px`, `top: 74.69px` |
| **Size** | 31.514px × 10.021px |
| **Overflow** | `inset: -3.6% -1.02% -4.99% -1.1%` |
| **Asset** | SVG vector |

### 3.5 Rotated block + Vector (703:35)

| Property | Value |
|----------|--------|
| **Container** | `left: 30.39px`, `top: 2.65px` — 25.613px × 28.193px, flex center |
| **Rotation** | **11.68deg** (`rotate(11.68deg)`) |
| **Inner (703:35)** | 21.105px × 24.426px |
| **Overflow** | `inset: -2.05% -1.93% -0.23% -2.37%` |
| **CSS custom props** | `--transform-inner-width: 0`, `--transform-inner-height: 0` |
| **Asset** | SVG vector |

---

## 4. Asset References (localhost)

Assets are served from a local Figma asset server. Use these in dev; replace with project assets for production.

| Constant | URL | Usage |
|----------|-----|--------|
| imgBlob | `http://localhost:3845/assets/170c49582aa03cfb2b3bfaf84766b0a80e54c897.svg` | Blob 703:25 |
| imgBlob1 | `http://localhost:3845/assets/4ce01efb3456c7dd8dcdefa2d3c2360d43e55188.svg` | Blob 703:26 |
| imgGroup1 | `http://localhost:3845/assets/adab02b505a8fbb33978f563cb096ef018346efc.svg` | Group 703:28 |
| imgGroup2 | `http://localhost:3845/assets/199c7d716f8264b1455a5bfe77d385c8884c3699.svg` | Group 703:31 |
| imgVector1 | `http://localhost:3845/assets/97bbdcaa873a949e7f4950d8cad1c6d6b6553b4b.svg` | Vector 703:34 |
| imgVector2 | `http://localhost:3845/assets/5b7a67079ef79e2200a8204296aa99607d26dbd7.svg` | Vector 703:35 |

---

## 5. Visual Description (from screenshot)

- **Background:** Solid dark gray (~#404040), high contrast.
- **Character:** Stylized glowing light-green blob with a simple face (eyes, pupils, one curved eyebrow, smiling mouth). Black outlines for all facial features.
- **Blob shape:** Irregular, organic, wider at top, soft undulating top edge.
- **Color:** Luminous light green (e.g. ~`hsl(140, 100%, 75%)` or ~#80FF80); slight internal gradient with brightest area slightly off-center toward top.
- **Glow:** Same green as blob; soft halo extending mainly downward and bottom-right; feathered edges, large blur — read as emissive light.
- **Eyes:** Two circular outlines with central solid black pupils; relatively large; in upper-middle of face.
- **Eyebrow:** Single thin curved line above one eye; friendly/curious.
- **Mouth:** Thin upward-curving line, centered below eyes.

---

## 6. Design Tokens / Variables

- **Figma variable definitions** for this node: none returned (empty object). Rely on pixel values and visual description above for colors and spacing.

---

## 7. Implementation Notes

- **data attributes:** Node IDs are present as `data-node-id="703:xx"` for mapping back to Figma.
- **Tailwind:** Generated reference used Tailwind; project uses Tailwind v4 — convert to project tokens/classes.
- **Images:** All refs use `<img>` with `className="block max-w-none size-full"` (or similar); SVGs use same pattern.
- **Positioning:** Mix of `absolute` with pixel `left`/`top`, and centered blocks with `translate(-50%, -50%)` and `calc(50% ± Npx)`.
- **Rotation:** Only explicit transform is **11.68deg** on the top-left vector container.
- **Stack:** React + TypeScript; use existing components and Space Grotesk / anime.js where relevant.

---

## 8. Exact Pixel Summary

| Element | x (px) | y (px) | width (px) | height (px) | notes |
|---------|--------|--------|------------|-------------|--------|
| Frame | 241* | 1313.5* | 140 | 136 | *in file coords |
| Blob 1 | center | center | 140 | 136 | transform center |
| Blob 2 | center+4.01 | center−2.74 | 110.322 | 107.17 | transform center |
| Group 1 (703:28) | 32.64 | 22.65 | 41.372 | 42.61 | |
| Group 2 (703:31) | 80.63 | 22.65 | 41.372 | 42.61 | |
| Vector (703:34) | 59.05 | 74.69 | 31.514 | 10.021 | |
| Rotated block | 30.39 | 2.65 | 25.613 | 28.193 | rotate 11.68deg |
| Vector (703:35) | — | — | 21.105 | 24.426 | inside rotated |

---

## 9. DOM Path & Implementation (Splash)

The mascot is rendered on the splash screen at this DOM path:

```
div#root
  └── div.flex.min-h-dvh.flex-col                    ← LearningScreenLayout
        └── div.mx-auto.w-full.max-w-[900px].px-[var(--space-screen-x)].flex.min-h-[874px].min-w-[402px].flex-1.flex-col.items-center.justify-center.transition-all
              └── div.flex.flex-col.gap-6.w-full.items-center.text-center   ← Stack (gap xl)
                    └── svg   ← MascotBlob
```

### Placement

| Property | Value |
|----------|--------|
| **Position (in flow)** | top ≈ 227px, left ≈ 192px (from viewport; depends on padding and centering) |
| **Rendered size** | width up to 520px (md), 600px (lg); height follows viewBox aspect (500∶520) → ~541px at 520px width |
| **Component** | `MascotBlob` (`@/components/mascot/MascotBlob`) |
| **Route** | `/splash` (`src/routes/splash.tsx`) |

### SVG element (MascotBlob root)

| Attribute | Value |
|-----------|--------|
| `viewBox` | `0 0 500 520` |
| `width` | `100%` |
| `class` | `w-full max-w-[420px] md:max-w-[520px] lg:max-w-[600px]` |
| `style` | `cursor: pointer` |
| `xmlns` | `http://www.w3.org/2000/svg` |
| `data-cursor-element-id` | Optional; set via prop when needed for DOM targeting |

---

*Document generated from Figma MCP for node 703:24 — Avocado TOFU App.*
