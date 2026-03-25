# Figma Design Spec — Quiz Page (Node 559:2395)

**Source:** [Figma — Avocado TOFU App (Quiz)](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=559-2395&t=ABMUbfqiTvdYpXcy-4)  
**Figma node ID:** `559:2395`  
**Extracted via:** Figma MCP (get_design_context, get_metadata)

---

## 1. Overview

The **Quiz Page** is a full-screen question screen within the Avocado app. It uses a **white background**, a **status bar**, a **header with back button and progress bar**, a **mascot with speech bubble**, a **question block** (label + question text), **multiple-choice option buttons** (with four distinct states), and a bottom **primary CTA** (“Check”).

Layout is vertical: status bar → header → mascot + bubble → question + options → CTA.

---

## 2. Root Frame

| Property | Value |
|----------|--------|
| **Figma name** | iPhone 16 & 17 Pro - 409 |
| **Node ID** | 559:2395 |
| **Position (in file)** | x: 9592.5px, y: 901px |
| **Size** | 402px × 874px |
| **Background** | White (`#FFFFFF`) |
| **Layout** | `relative`, full size |

---

## 3. Hierarchy & Structure

```
Frame 559:2395 — iPhone 16 & 17 Pro - 409 (402×874)
├── StatusBar 559:2396 (0, 0) 402×49
│   ├── Left Side 559:2399 — time "9:41"
│   └── Right Side 559:2402 — battery, wifi, signal
├── Frame 559:2412 (24, 73) 354×36 — Header
│   ├── Frame 559:2413 — Back button (CaretLeft 24×24, 6px padding)
│   └── Frame 559:2416 — Progress bar (312×12)
│       ├── Rectangle 5 559:2417 — track
│       └── Rectangle 7 559:2418 — fill
├── Frame 559:2441 (24, 130) 354×114 — Mascot + speech bubble
│   ├── Frame 559:2442/2443 — Blob mascot (76.8×74.6)
│   └── Group 18 559:2455 — Speech bubble + tail
├── Frame 559:2419 (24, 272) 354×338 — Question + options
│   ├── Frame 559:2420 — Question label + text
│   └── Frame 559:2423 — 4 option rows (559:2424, 2429, 2433, 2437)
└── Frame 559:2464 (24, 800) 354×46 — CTA "Check"
```

---

## 4. Status Bar (559:2396)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2396 |
| **Position** | x: 0, y: 0 |
| **Size** | 402px × 49px |

### 4.1 Left side — Time

- **Text:** "9:41"
- **Typography:** SF Pro Text Semibold (or system), ~17.39px, `#0c0c0c`, leading ~22.5px, tracking -0.4173px, center

### 4.2 Right side

- **Node:** 559:2402 — 78.15×13.3px (battery, wifi, signal icons)

---

## 5. Header — Back + Progress (559:2412)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2412 |
| **Position** | x: 24px, y: 73px |
| **Size** | 354px × 36px |
| **Layout** | Flex, horizontal, gap 6px, centered |

### 5.1 Back button

- **Container:** 36×36px, padding 6px
- **Icon:** CaretLeft, 24×24px (SVG asset)

### 5.2 Progress bar

- **Container:** 312×12px (within 354px width with back)
- **Track:** Full width, height 12px, rounded 8px (or 20px), background `rgba(10,10,10,0.1)`
- **Fill:** Accent color `var(--accent/content/primarytext, #05abd6)`, same height, rounded corners (e.g. rounded-br-[20px] rounded-tr-[20px]); width is dynamic (e.g. 204.891px for partial progress)

---

## 6. Mascot + Speech Bubble (559:2441)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2441 |
| **Position** | x: 24px, y: 130px |
| **Size** | 354px × 114px |

### 6.1 Mascot (Blob)

- **Frame:** ~76.8×74.6px, offset from top ~19.5px
- **Assets:** Blob (outer), Blob (inner), Group 1 & 2 (eyes), Vector 1 (mouth), Vector 2 (eyebrow, rotated ~11.68°)

### 6.2 Speech bubble

- **Background:** White
- **Border:** 1.61px solid `rgba(2,156,61,0.2)` (green tint)
- **Border radius:** ~6.442px
- **Content:** Text “Let’s see what you already know!”
- **Typography:** Space Grotesk Medium, 16px, `rgba(10,10,10,0.6)`, leading 1.4, tracking -0.6px
- **Tail:** Group 16 (small triangle/pointer)

---

## 7. Question Block (559:2420)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2420 |
| **Layout** | Flex column, gap 8px |

### 7.1 Question label

- **Example:** "QUESTION 1 OF 3"
- **Typography:** Space Grotesk Medium, 12px, `var(--neutrals/content/supporting-text, #6c6c6c)`, letter-spacing 1px

### 7.2 Question text

- **Example:** "What does GPT stand for?"
- **Typography:** Space Grotesk Medium, 18px, `var(--primary/content/text, #0a0a0a)`, tracking -0.45px, line-height 1.4

---

## 8. Quiz Option Buttons — Shared Layout

All option rows share:

- **Layout:** Flex row, align center
- **Padding:** 12px horizontal, 16px vertical
- **Border radius:** 12px
- **Gap between icon and label:** 6px (default/correct/wrong) or 10px (selected)
- **Radio/state icon:** 24×24px (SVG per state)
- **Label typography:** Space Grotesk Medium, 14px, tracking -0.45px; color varies by state (see below)

**Shadow (default/neutral):**

`0px 21px 6px 0px rgba(163,163,163,0), 0px 13px 5px 0px rgba(163,163,163,0.01), 0px 7px 4px 0px rgba(163,163,163,0.05), 0px 3px 3px 0px rgba(163,163,163,0.09), 0px 1px 2px 0px rgba(163,163,163,0.1)`

**Shadow (selected/correct/wrong):**

`0px 15px 4px 0px rgba(107,123,133,0), 0px 10px 4px 0px rgba(107,123,133,0.01), 0px 6px 3px 0px rgba(107,123,133,0.05), 0px 2px 2px 0px rgba(107,123,133,0.09), 0px 1px 1px 0px rgba(107,123,133,0.1)`

---

## 9. Quiz Button States (Figma nodes 724:628, 724:632, 724:636, 724:640)

### 9.1 Default state

**Figma node:** [724:628](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-628&t=ABMUbfqiTvdYpXcy-4)

| Property | Value |
|----------|--------|
| **Background** | `#FFFFFF` (white) |
| **Border** | 1px solid `rgba(0,0,0,0.02)` |
| **Border style** | Solid |
| **Padding** | 12px horizontal, 16px vertical |
| **Border radius** | 12px |
| **Shadow** | Default gray shadow (see §8) |
| **Gap (icon ↔ text)** | 6px |
| **Icon** | RadioButton (unselected) — 24×24 SVG |
| **Label color** | `rgba(10,10,10,0.8)` |

---

### 9.2 Selected state

**Figma node:** [724:632](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-632&t=ABMUbfqiTvdYpXcy-4)

| Property | Value |
|----------|--------|
| **Background** | `var(--accent/accent-100, #a6ebfd)` |
| **Border** | 1px solid `rgba(140,229,252,0.8)` |
| **Border style** | Solid |
| **Padding** | 12px horizontal, 16px vertical |
| **Border radius** | 12px |
| **Shadow** | Lighter/blue-tinted shadow (see §8) |
| **Gap (icon ↔ text)** | 10px |
| **Icon** | RadioButton (selected) — 24×24 SVG (different asset from default) |
| **Label color** | `rgba(10,10,10,0.8)` |

---

### 9.3 Correct answer state

**Figma node:** [724:636](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-636&t=ABMUbfqiTvdYpXcy-4)

| Property | Value |
|----------|--------|
| **Background** | `var(--positive/background/positive, #adffc1)` |
| **Border** | 1px solid `var(--positive/border/positive, #b5e6bb)` |
| **Border style** | Solid |
| **Padding** | 12px horizontal, 16px vertical |
| **Border radius** | 12px |
| **Shadow** | Lighter shadow (see §8) |
| **Gap (icon ↔ text)** | 6px |
| **Icon** | RadioButton (correct/checkmark) — 24×24 SVG |
| **Label color** | `rgba(10,10,10,0.8)` |

---

### 9.4 Wrong answer state

**Figma node:** [724:640](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-640&t=ABMUbfqiTvdYpXcy-4)

| Property | Value |
|----------|--------|
| **Background** | `var(--negative/background/negative, #ffcfb8)` |
| **Border** | 1px solid `var(--negative/border/negative, #f5bfa5)` |
| **Border style** | **Dashed** |
| **Padding** | 12px horizontal, 16px vertical |
| **Border radius** | 12px |
| **Shadow** | Lighter shadow (see §8) |
| **Gap (icon ↔ text)** | 6px |
| **Icon** | RadioButton (wrong/cross) — 24×24 SVG |
| **Label color** | `#0a0a0a` (full opacity) |

---

## 10. Design Tokens Summary — Quiz Buttons

| Token / usage | Default | Selected | Correct | Wrong |
|---------------|---------|----------|---------|-------|
| **Background** | `#FFFFFF` | `--accent/accent-100` (#a6ebfd) | `--positive/background/positive` (#adffc1) | `--negative/background/negative` (#ffcfb8) |
| **Border** | `rgba(0,0,0,0.02)` | `rgba(140,229,252,0.8)` | `--positive/border/positive` (#b5e6bb) | `--negative/border/negative` (#f5bfa5) |
| **Border style** | Solid | Solid | Solid | **Dashed** |
| **Icon** | Unselected radio | Selected radio | Checkmark | Cross/wrong |
| **Label color** | rgba(10,10,10,0.8) | rgba(10,10,10,0.8) | rgba(10,10,10,0.8) | #0a0a0a |
| **Gap** | 6px | 10px | 6px | 6px |

---

## 11. Options Container (559:2423)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2423 |
| **Layout** | Flex column, gap **16px** between option rows |
| **Option row height** | 56px (from metadata; visual padding 16px top/bottom + 24px line) |

---

## 12. Primary CTA — “Check” (559:2464)

| Property | Value |
|----------|--------|
| **Node ID** | 559:2464 |
| **Position** | x: 24px (centered in 402px), y: 800px |
| **Size** | 354px × 46px |
| **Background** | `#0a0a0a` |
| **Border radius** | 12px |
| **Shadow** | `0px 103px 29px 0px rgba(51,51,51,0), 0px 66px 26px 0px rgba(51,51,51,0.01), 0px 37px 22px 0px rgba(51,51,51,0.05), 0px 16px 16px 0px rgba(51,51,51,0.09), 0px 4px 9px 0px rgba(51,51,51,0.1)` |
| **Label** | "Check" |
| **Typography** | Space Grotesk Medium, 16px, white, leading 1.2, center |

---

## 13. Assets (from design context)

- **CaretLeft** — back button icon
- **RadioButton** — multiple SVGs for default (unselected), selected, correct, wrong
- **Blob / Blob (inner)** — mascot shapes
- **Group 1, Group 2** — mascot eyes
- **Vector 1** — mouth
- **Vector 2** — eyebrow
- **Group 16** — speech bubble tail
- **Right Side** — status bar icons

Image/SVG sources are served from the Figma MCP local asset server (e.g. `http://localhost:3845/assets/...`). In production, replace with project assets or design-system icons.

---

## 14. Figma Links

| Section | URL |
|--------|-----|
| Quiz page | [node-id=559-2395](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=559-2395&t=ABMUbfqiTvdYpXcy-4) |
| Quiz button — Default | [node-id=724-628](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-628&t=ABMUbfqiTvdYpXcy-4) |
| Quiz button — Selected | [node-id=724-632](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-632&t=ABMUbfqiTvdYpXcy-4) |
| Quiz button — Correct | [node-id=724-636](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-636&t=ABMUbfqiTvdYpXcy-4) |
| Quiz button — Wrong | [node-id=724-640](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=724-640&t=ABMUbfqiTvdYpXcy-4) |
