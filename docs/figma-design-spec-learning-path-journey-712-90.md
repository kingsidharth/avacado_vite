# Figma Design Spec — Learning Path Journey (Node 712:90)

**Source:** [Figma — Avocado TOFU App](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=712-90&t=ABMUbfqiTvdYpXcy-4)  
**Figma node ID:** `712:90`  
**Extracted via:** Figma MCP (get_design_context, get_metadata, get_screenshot)

---

## 1. Overview

The **Learning Path Journey** is a vertical, zig-zag path of lesson nodes connected by path segments (SVG “Union” shapes). Nodes alternate between **left** and **right** sides. Each node shows a status: **active** (play), **completed** (check), or **locked** (lock). Path segments use different colors for completed vs locked segments.

---

## 2. Root Frame

| Property | Value |
|----------|--------|
| **Figma name** | Frame 2147225363 |
| **Node ID** | 712:90 |
| **Position (in file)** | x: 6018px, y: -12380px |
| **Size** | 354px × 999.5px |
| **Layout** | `relative`, full size container (`size-full`) |

---

## 3. Hierarchy & Structure

```
Frame 712:90 (354×999.5)
├── Path segments (Union vectors)
│   ├── 712:91  — Union (36.14, 64.04)  282.86×115.62  — left, down
│   ├── 712:94  — Union (rotated 180°)  — right, up
│   ├── 712:92  — Union (36.14, 416.38) 282.86×115.62  — left, down
│   ├── 712:95  — Union (rotated 180°)  — right, up
│   ├── 712:93  — Union (36.14, 736.31) 282.86×115.62  — left, down
│   └── 712:96  — Union (rotated 180°)  — right, up
└── Node groups (left/right alternating)
    ├── Group 27  712:122  (278, 0)       — Completed (right, top)
    ├── Group 28  712:97   (0, 169.11)    — Active / Play (left)
    ├── Group 29  712:102  (278, 346.5)   — Locked (right)
    ├── Group 30  712:112  (0, 530)       — Locked (left)
    ├── Group 33  712:107  (278, 668.09)  — Locked (right)
    ├── Group 32  712:117  (0, 840.69)    — Locked (left)
    └── (bottom node implied by path)
```

---

## 4. Path Segments (Connector Lines)

All path segments are **vector SVGs** named “Union”, served as assets (e.g. localhost). Two visual variants are used: one for “left side” segments, one for “right side” (flipped).

| Property | Value |
|----------|--------|
| **Segment size** | 282.864px × 115.618px |
| **Left-side segments** | Position `left: 36.14px`; no transform. Node IDs: 712:91, 712:92, 712:93. |
| **Right-side segments** | Same size, placed with flex center at `left: 36.14px`; inner Union has `transform: scaleY(-1) rotate(180deg)`. Node IDs: 712:94, 712:95, 712:96. |

### 4.1 Path segment positions (Y)

| Node ID | Top (Y) | Role |
|---------|---------|------|
| 712:91 | 64.04px | Top-left path down |
| 712:94 | 238px | Right path up (to completed node) |
| 712:92 | 416.38px | Left path down |
| 712:95 | 571.69px | Right path up |
| 712:93 | 736.31px | Left path down |
| 712:96 | 883.88px | Right path up |

Path segments connect nodes; color is implied by **node state** (see Colors below) — green for active/completed, light blue for locked.

---

## 5. Node Groups — Layout & Sizes

Each node is a **group** containing:
1. A **background rounded rectangle** (Rectangle 29) — 76×76px, `border-radius: 80px`.
2. A **foreground frame** (Frame 2147225310) — 76×76px, same radius, border, and icon.

| Property | Value |
|----------|--------|
| **Node size** | 76px × 76px |
| **Border radius** | 80px (fully round) |
| **Icon size** | 32px × 32px, centered inside node |

### 5.1 Node positions (group anchor)

| Group | Node ID | X | Y | Side | State |
|-------|---------|---|---|------|--------|
| Group 27 | 712:122 | 278px | 0 | Right | Completed |
| Group 28 | 712:97 | 0 | 169.11px | Left | Active (Play) |
| Group 29 | 712:102 | 278px | 346.5px | Right | Locked |
| Group 30 | 712:112 | 0 | 530px | Left | Locked |
| Group 33 | 712:107 | 278px | 668.09px | Right | Locked |
| Group 32 | 712:117 | 0 | 840.69px | Left | Locked |

Left nodes are at **x = 0** (with content centered via `left: calc(50% - 139px)` in code). Right nodes at **x = 278px** (with `left: calc(50% + 139px)`). The offset 139px is half of (354 - 76) = 139.

---

## 6. Node States & Styling

### 6.1 Active (current) — Play

| Property | Value |
|----------|--------|
| **Background (Rectangle)** | `#227a1f` |
| **Frame border** | `1px solid #39cc33` |
| **Frame fill** | `#39cc33` |
| **Icon** | Play (triangle) — 32×32, node 712:100 |

### 6.2 Completed

| Property | Value |
|----------|--------|
| **Background (Rectangle)** | `#39cc33` |
| **Frame border** | `1px solid #39cc33` |
| **Frame fill** | `#8dff9a` |
| **Icon** | CheckCircle — 32×32, node 712:125 |

### 6.3 Locked

| Property | Value |
|----------|--------|
| **Background (Rectangle)** | `#cdeef7` |
| **Frame border** | `1px solid #a3e0f0` |
| **Frame fill** | `#FFFFFF` |
| **Icon** | LockKey — 32×32 (nodes 712:105, 712:110, 712:115, 712:120) |

---

## 7. Color Tokens

| Token | Hex | Usage |
|-------|-----|--------|
| **Green dark** | `#227a1f` | Active node background |
| **Green primary** | `#39cc33` | Active/completed border and fill |
| **Green light** | `#8dff9a` | Completed node inner fill |
| **Blue light bg** | `#cdeef7` | Locked node background |
| **Blue border** | `#a3e0f0` | Locked node border |
| **White** | `#FFFFFF` | Locked node foreground fill |

Path segments (SVGs) should use the same green for “completed” segments and the same light blue for “locked” segments when implemented (e.g. via CSS or SVG fill).

---

## 8. Assets & Icons

| Asset | Node ID | Size | Usage |
|-------|---------|------|--------|
| **Union** (path left) | 712:91, 712:92, 712:93 | 282.86×115.62 | Connector SVG (left-down) |
| **Union** (path right) | 712:94, 712:95, 712:96 | 282.86×115.62 | Connector SVG (right-up, flipped) |
| **Play** | 712:100 | 32×32 | Active lesson |
| **LockKey** | 712:105, 712:110, 712:115, 712:120 | 32×32 | Locked lesson |
| **CheckCircle** | 712:125 | 32×32 | Completed lesson |

Assets are referenced from the Figma MCP asset server (e.g. localhost). For production, export SVGs from Figma or replace with project icons.

---

## 9. Implementation Notes

1. **Layout:** Container is `relative`; path segments and node groups are `absolute` with pixel positions. For responsive layouts, consider converting to a vertical stack with alternating left/right alignment and relative spacing.
2. **Z-order:** Path segments are rendered first; node groups are on top. Ensure nodes have higher `z-index` than path segments.
3. **Right-side path segments:** Implement with `transform: scaleY(-1) rotate(180deg)` on the Union SVG (or equivalent flipped asset).
4. **Centering:** Left nodes use `left: calc(50% - 139px)` and right nodes `left: calc(50% + 139px)` for a 354px-wide frame; adjust for different widths.
5. **Reusable component:** Consider a single “LessonNode” or “PathNode” component that accepts `state: 'active' | 'completed' | 'locked'` and `side: 'left' | 'right'` and renders the correct colors and icon.
6. **Animation:** If using anime.js, path progress and node state changes (e.g. locked → active) can be animated; align with existing project animation patterns.

---

## 10. Visual Summary

- **Direction:** Top to bottom.
- **Pattern:** Nodes alternate left → right → left → right.
- **States:** One active (Play), one completed (CheckCircle), rest locked (LockKey).
- **Path:** Green for completed/active stretch; light blue for locked stretch.
- **Contrast:** Dark green and bright green for progress; light blue and white for locked steps.
