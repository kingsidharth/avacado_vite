# Figma Design Spec — Lesson Loading Screen (Node 559:4021)

**Source:** [Figma — Avocado TOFU App](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=559-4021&t=ABMUbfqiTvdYpXcy-4)  
**Figma node ID:** `559:4021`  
**Extracted via:** Figma MCP (get_design_context, get_metadata, get_screenshot)

---

## 1. Overview

The **Lesson Loading Screen** is a full-screen loading page shown before navigating to a lesson (e.g. after the user taps the play/continue button on a lesson node). The screen uses a **white background**, a **status bar** at the top, and a **centered content area** with:

- A **mascot character** (blob-shaped, green, with face) floating above an isometric platform
- A **glow/projection** connecting the mascot to the platform
- **Decorative vectors** (Vector 9, Group 5) for the platform and background shapes

The layout is symmetric on the vertical axis and reads as a single “loading” or “preparing lesson” state.

---

## 2. Root Frame

| Property | Value |
|----------|--------|
| **Figma name** | iPhone 16 & 17 Pro - 432 |
| **Node ID** | 559:4021 |
| **Position (in file)** | x: 1214px, y: 871.5px |
| **Size** | 402px × 874px |
| **Background** | White (`#FFFFFF` / `bg-white`) |
| **Layout** | `relative`, full size (`size-full`) |

---

## 3. Hierarchy & Structure

```
Frame 559:4021 — iPhone 16 & 17 Pro - 432 (402×874)
├── StatusBar 559:4022 (0, 0) 402×49.1
│   ├── Notch 559:4023
│   ├── Left Side 559:4025 — time "9:41"
│   │   └── _StatusBar-time 559:4026
│   │       └── Text "✏️ Time" 559:4027
│   └── Right Side 559:4028 — battery, wifi, signal
│       ├── _StatusBar-battery 559:4029
│       ├── Wifi 559:4033
│       └── Icon / Mobile Signal 559:4037
└── Frame 2147225039 559:4038 (45.4, 235.7) 311.2×382.7 — main content
    ├── Group 5 559:4039 (28.2, 201.8) 276×180.8 — platform (Vector 7, Vector 8)
    ├── Vector 9 559:4042 (0, 0) 312.3×329.4 — decorative vector
    └── Frame 33 559:4043 (85.6, 43.4) 140×136 — mascot / blob area
        ├── Blob 559:4044 — outer blob
        ├── Blob 559:4045 — inner blob
        ├── Group 1 559:4047 — eye
        ├── Group 2 559:4050 — eye
        ├── Vector 1 559:4053 — mouth
        └── Vector 2 559:4054 — eyebrow (rotated ~11.68deg)
```

---

## 4. Status Bar (559:4022)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4022 |
| **Position** | x: 0, y: 0 |
| **Size** | 402px × 49.099px |
| **Role** | Device status bar (time, signal, wifi, battery) |

### 4.1 Left side — Time

- **Node:** 559:4025 (Left Side), 559:4026 (_StatusBar-time), 559:4027 (Text)
- **Position:** left ~27.6px, top ~14.3px
- **Text:** "9:41" (placeholder)
- **Typography:** SF Pro Text Semibold (or system equivalent), ~17.39px, `#0c0c0c`, leading ~22.5px, tracking -0.4173px, text-center

### 4.2 Right side — Icons

- **Node:** 559:4028 (Right Side) — 78.15×13.3px at right
- **Contents:** Battery (559:4029), Wifi (559:4033), Mobile Signal (559:4037)
- **Color:** Black (`#0c0c0c`) for icons

In implementation, the status bar can be omitted or replaced with a safe-area placeholder so the main loading content is centered in the viewport.

---

## 5. Main Content Area (559:4038)

| Property | Value |
|----------|--------|
| **Figma name** | Frame 2147225039 |
| **Node ID** | 559:4038 |
| **Position** | x: 45.4px, y: 235.7px (relative to root) |
| **Size** | 311.18px × 382.67px |
| **Layout** | Centered in viewport; in Figma placed with `left: 50%`, `top: calc(50% - 10px)`, `transform: translate(-50%, -50%)` |

This frame contains the platform, decorative vector, and mascot. All positioning inside is absolute.

---

## 6. Platform (Group 5 — 559:4039)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4039 |
| **Position (within 559:4038)** | left: 28.17px, top: 201.85px |
| **Size** | 276.02px × 180.83px |
| **Content** | Vector 7 (559:4040), Vector 8 (559:4041) — isometric platform graphic |

### 6.1 Visual description

- **Shape:** Isometric 3D-style platform (square from a slightly elevated angle).
- **Outline:** Thin, crisp line in bright aqua/teal `#22D3EE`.
- **Top surface:** Flat square with subtle gradient (slightly darker in center, lighter at edges).
- **Inner depression:** Square “hole” in the center; gradient darker at bottom, lighter at top; deeper teal `#00C2CB`.
- **Connection:** A soft, semi-transparent column of light (aqua/mint green) connects the mascot to the platform’s center, suggesting projection/loading.

---

## 7. Decorative Vector (Vector 9 — 559:4042)

| Property | Value |
|----------|--------|
| **Node ID** | 559:4042 |
| **Position (within 559:4038)** | left: 0, top: 0 |
| **Size** | 312.34px × 329.43px |
| **Role** | Background/decorative vector behind the mascot and platform |

Rendered as an SVG asset; exact path comes from Figma export. In the design context it is served as an asset (e.g. localhost URL).

---

## 8. Mascot / Blob Area (Frame 33 — 559:4043)

| Property | Value |
|----------|--------|
| **Figma name** | Frame 33 |
| **Node ID** | 559:4043 |
| **Position (within 559:4038)** | left: 85.59px, top: 43.38px |
| **Size** | 140px × 136px |
| **Layout** | Centered content; inner blob and face elements absolutely positioned |

### 8.1 Outer blob (559:4044)

- **Size:** 140×136px (logical), asset may have larger artboard (inset ~-32.35% -31.43% in reference code).
- **Color:** Light green to lime green — `#B0FEE4` transitioning to `#83FFA6`, with a bright yellow-green core.
- **Effect:** Soft radial glow, especially downward toward the platform (aqua/mint).

### 8.2 Inner blob (559:4045)

- **Size:** ~110.3×107.2px, offset (e.g. left: calc(50% + 4px), top: calc(50% - 2.74px)).
- **Role:** Secondary blob shape; same color family as outer blob.

### 8.3 Face

- **Eyes (559:4047, 559:4050):** Two large circular eyes, thick black outlines, solid black pupils; ~42.6×41.4px each; positions ~32.6px and ~80.6px from left, ~22.65px from top.
- **Mouth (559:4053):** Simple upward-curving black line; ~31.5×10px at left ~59px, top ~74.7px.
- **Eyebrow (559:4054):** Single arched black line above left eye; rotation ~11.68deg; in a flex container ~25.6×28.2px at left ~30.4px, top ~2.65px.

### 8.4 Mascot summary

- **Body:** Amorphous, soft blob (green gradient + glow).
- **Face:** Stylized — two eyes, one eyebrow, smile; black strokes/pupils.
- **Expression:** Friendly, slightly curious.

---

## 9. Color Palette

| Role | Color | Notes |
|------|--------|------|
| **Background** | `#FFFFFF` | Full-screen background |
| **Mascot body** | `#B0FEE4` → `#83FFA6` | Gradient; yellow-green core |
| **Mascot glow / projection** | Translucent aqua/mint | Soft column to platform |
| **Face (outlines, pupils, smile, eyebrow)** | `#0c0c0c` / black | |
| **Platform outline** | `#22D3EE` | Bright aqua/teal |
| **Platform inner depression** | `#00C2CB` | Deeper teal |
| **Status bar text & icons** | `#0c0c0c` | Black |

---

## 10. Assets (from get_design_context)

Assets are referenced as URLs (e.g. from a local asset server). For production, export from Figma and host in the app (e.g. `/public/` or asset pipeline).

| Constant (reference) | Node / role |
|----------------------|-------------|
| imgRightSide | Status bar right (signal, wifi, battery) |
| imgGroup5 | Platform (Group 5) |
| imgVector9 | Decorative Vector 9 |
| imgBlob | Outer mascot blob |
| imgBlob1 | Inner mascot blob |
| imgGroup1 | Eye 1 |
| imgGroup2 | Eye 2 |
| imgVector1 | Mouth |
| imgVector2 | Eyebrow |

Export these from Figma at 1x (or 2x for retina) and place under a path such as `public/lesson-loading/` or your design-tokens/assets folder. Replace localhost URLs in any reference code with these paths.

---

## 11. Layout & Positioning Summary

- **Root:** Full-screen, white, 402×874 (device frame). In app, use full viewport (e.g. `min-h-dvh`, `w-full`).
- **Status bar:** Top, full width; height ~49px. Optional: only if you mirror device chrome; otherwise use safe-area insets.
- **Main content (559:4038):** Centered horizontally and vertically (e.g. `left: 50%`, `top: 50%`, `transform: translate(-50%, -50%)`), with optional slight upward offset (e.g. `top: calc(50% - 10px)`). Width ~311px, height ~383px; scale or constrain by max-width/max-height if needed for different screens.
- **Mascot (559:4043):** Centered within 559:4038; 140×136px. Platform and Vector 9 are positioned behind/around it per the hierarchy above.

---

## 12. Implementation Notes

1. **Reuse mascot:** If the app already has a `MascotBlob` (or similar) component, reuse it here and align props with the blob + face description (colors, glow).
2. **Tailwind:** Match project conventions; the reference used `bg-white`, `absolute`, `size-full`, etc. Prefer project tokens and spacing (e.g. `var(--screen-x)` for horizontal padding).
3. **Animation:** Design does not specify motion; consider subtle idle animation (e.g. blob pulse or glow) and/or a short delay before navigating to the lesson.
4. **Route:** Add a route (e.g. `/lesson-loading` or a full-screen overlay) that shows this screen when the user taps play on a lesson node; on “ready” (or after a minimum time), navigate to the actual lesson.
5. **No Tailwind dependency:** If the project does not use Tailwind, convert the reference classes to the project’s styling system (e.g. CSS modules or design tokens) while keeping the same layout and colors.

---

## 13. Reference (Figma MCP)

- **get_design_context** returned React + Tailwind reference code for 559:4021; node IDs are on elements as `data-node-id`.
- **get_metadata** provided the XML hierarchy and exact positions/sizes used in this spec.
- **get_screenshot** provided the visual description (mascot, platform, colors, status bar) used for Sections 6, 8, and 9.

Convert the reference code to the project stack (e.g. React + Tailwind v4, Space Grotesk, existing layout wrappers) and use this spec for layout, hierarchy, and colors.
