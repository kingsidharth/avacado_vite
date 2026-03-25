# Figma Design Spec — Header with Progress Bar (Node 559:4084)

**Source:** [Figma — Avocado TOFU App](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=559-4084&t=ABMUbfqiTvdYpXcy-4)  
**Figma node ID:** `559:4084`  
**Extracted via:** Figma MCP (get_design_context, get_metadata, get_screenshot)

---

## 1. Overview

The **Header with Progress Bar** is a compact header used on learning/onboarding screens. It provides:

- **Close control** — X icon on the left to dismiss or go back
- **Title** — Centered heading (e.g. "Welcome to the World of AI")
- **Progress label** — Text progress (e.g. "1/8") on the right
- **Segmented progress bar** — A row of segment pills below; filled segments use teal, unfilled use light gray

Layout is a vertical stack: top row (icon, title, progress text) with 11px gap to the progress bar row. The bar has 13 segments of equal width with rounded corners.

---

## 2. Root Frame

| Property | Value |
|----------|--------|
| **Figma name** | Frame 2147225339 |
| **Node ID** | 559:4084 |
| **Position (in file)** | x: 24px, y: 57px |
| **Size** | 354px × 53px |
| **Layout** | Flex column, `content-stretch`, `gap: 11px`, `items-end`, full width |
| **Spacing** | 11px between top row and progress bar |

---

## 3. Hierarchy & Structure

```
Frame 559:4084 — Frame 2147225339 (354×53)
├── Frame 559:4085 — Top row (0, 0) 354×36
│   ├── Frame 559:4086 — Close button area (0, 0) 36×36
│   │   └── X 559:4087 (6, 6) 24×24 — close icon
│   ├── Text 559:4089 — "Welcome to the World of AI" (69.5, 6) 224×24
│   └── Text 559:4090 — "1/8" (327, 9) 27×18
└── Frame 559:4091 — Progress bar row (0, 47) 354×6
    ├── Segment 559:4092 (0, 0) 25×6 — filled
    ├── Segment 559:4095 (27.42, 0) 25×6 — filled
    ├── Segment 559:4098 (54.83, 0) 25×6 — filled
    ├── Segment 559:4101 (82.25, 0) 25×6 — partial
    ├── Segment 559:4104 (109.67, 0) 25×6 — empty
    ├── Segment 559:4106 (137.08, 0) 25×6 — empty
    ├── Segment 559:4108 (164.5, 0) 25×6 — empty
    ├── Segment 559:4110 (191.92, 0) 25×6 — empty
    ├── Segment 559:4112 (219.33, 0) 25×6 — empty
    ├── Segment 559:4114 (246.75, 0) 25×6 — empty
    ├── Segment 559:4116 (274.17, 0) 25×6 — empty
    ├── Segment 559:4118 (301.58, 0) 25×6 — empty
    └── Segment 559:4120 (329, 0) 25×6 — empty
```

---

## 4. Top Row (559:4085)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4085 |
| **Position** | x: 0, y: 0 (within root) |
| **Size** | 354px × 36px |
| **Layout** | Flex row, `items-center`, `justify-between`, full width |

### 4.1 Close Button (559:4086, 559:4087)

| Property | Value |
|----------|--------|
| **Container node** | 559:4086 |
| **Container size** | 36px × 36px |
| **Padding** | 6px all sides (touch target) |
| **Icon node** | 559:4087 (name: "X") |
| **Icon size** | 24px × 24px |
| **Icon position** | 6px from left and top inside container |
| **Asset** | SVG (X icon); reference from design: local asset URL pattern |
| **Role** | Dismiss / close / back |

### 4.2 Title Text (559:4089)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4089 |
| **Position** | x: 69.5px, y: 6px |
| **Size** | 224px × 24px |
| **Content (example)** | "Welcome to the World of AI" |
| **Font family** | Space Grotesk (Medium) — `font-['Space_Grotesk:Medium',sans-serif]` |
| **Font weight** | Medium (500) |
| **Font size** | 18px |
| **Line height** | 1.32 (~23.76px) |
| **Letter spacing** | -0.45px |
| **Color** | `#0a0a0a` (near black) |
| **Whitespace** | `nowrap` |

### 4.3 Progress Label (559:4090)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4090 |
| **Position** | x: 327px, y: 9px |
| **Size** | 27px × 18px |
| **Content (example)** | "1/8" |
| **Font family** | Space Grotesk Medium — use the app sans font token |
| **Font variation settings** | `'CASL' 0, 'CRSV' 0.5, 'MONO' 0` |
| **Font weight** | Medium |
| **Font size** | 16px |
| **Line height** | 1.1 (~17.6px) |
| **Letter spacing** | -1px |
| **Font style** | not-italic |
| **Color** | `rgba(10, 10, 10, 0.3)` (30% black) |
| **Whitespace** | nowrap |
| **Role** | Current step / total steps (e.g. step 1 of 8) |

---

## 5. Progress Bar Row (559:4091)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4091 |
| **Position** | x: 0, y: 47px (11px below top row) |
| **Size** | 354px × 6px |
| **Layout** | Flex row, `items-center`, `justify-between`, full width |
| **Segment count** | 13 segments (design example) |
| **Segment width** | 25px each |
| **Gap between segments** | ~2.42px (from metadata positions: 27.42 − 25 = 2.42) |

### 5.1 Segment Pill (each 25×6)

Each segment is a rounded pill with two layers:

| Layer | Role | Specs |
|-------|------|--------|
| **Track (background)** | Unfilled portion | Full 25×6; `bg-[rgba(10,10,10,0.08)]`; height ~5.993px; `rounded-[8px]`; `overflow-clip` |
| **Fill** | Completed/active portion | Same height; `bg-[#05abd6]` (teal); `rounded-tr-[20px]` and `rounded-br-[20px]` (pill ends) |

| Property | Value |
|----------|--------|
| **Segment height** | 6px (container); fill height ~5.993px |
| **Segment width** | 25px |
| **Border radius (container)** | 8px |
| **Track color** | `rgba(10, 10, 10, 0.08)` (8% black) |
| **Fill color** | `#05abd6` (teal) |
| **Fill radius** | 20px (top-right, bottom-right for LTR fill) |

### 5.2 Segment States (from design)

- **Filled:** Fill width = 25px (full segment).
- **Partial:** Fill width &lt; 25px (e.g. 20.191px, 24.5px) for in-progress or intermediate state.
- **Empty:** Only track visible; no fill or fill width 0.

---

## 6. Design Tokens Summary

| Token | Value | Usage |
|-------|--------|--------|
| **Text primary** | `#0a0a0a` | Title |
| **Text secondary** | `rgba(10, 10, 10, 0.3)` | Progress label "1/8" |
| **Progress fill** | `#05abd6` | Filled segment |
| **Progress track** | `rgba(10, 10, 10, 0.08)` | Segment background |
| **Gap (vertical)** | 11px | Between top row and progress bar |
| **Title font** | Space Grotesk Medium, 18px | Header title |
| **Progress font** | Space Grotesk Medium, 16px | "1/8" label |
| **Segment size** | 25×6px | Each progress pill |
| **Segment radius** | 8px (container), 20px (fill ends) | Pills |
| **Close touch target** | 36×36px, 6px padding | Icon 24×24 |

---

## 7. Layout & Spacing

- **Root:** Column, gap 11px, full width.
- **Top row:** Space-between so close (left), title (center), progress text (right). Title centered by flex distribution.
- **Progress row:** 13 segments, 25px wide, spaced with `justify-between` (gap ~2.42px from metadata).
- **Vertical rhythm:** Top row 36px tall; 11px gap; progress row 6px → total height 53px.

---

## 8. Responsive / Variants

- Title and "1/8" can be dynamic (different titles, different totals e.g. "3/8").
- Number of segments can match total steps (e.g. 8 segments for "1/8"); design example uses 13 segments.
- Partial fill width can be derived from progress (e.g. percentage of current segment) for a stepped or smooth look.

---

## 9. Assets

- **Close icon (X):** SVG; in design context referenced as local asset (e.g. `http://localhost:3845/assets/...svg`). In implementation, use project icon set or same SVG exported from Figma.

---

## 10. Implementation Notes

- Use **Space Grotesk** for both title and progress label to match the app typography system.
- Progress bar can be implemented as a list of segment components; each segment has a track div and an optional fill div whose width is set by progress.
- Preserve 11px gap between header row and progress bar and 25×6 segment size with 8px radius for visual match.
- Ensure close button has at least 36×36px hit area and 24×24px visible icon.
