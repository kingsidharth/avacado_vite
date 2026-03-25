# Figma Design Spec: Stats Row (Node 559:3870)

**Source:** [Avocado – TOFU App (Figma)](https://www.figma.com/design/IfAShPMa5xOBLmogVI15VB/Avocado--TOFU-App-?node-id=559-3870&t=ABMUbfqiTvdYpXcy-4)  
**Node ID:** `559:3870`  
**Component name (in app):** StatsRow

---

## 1. Overview

The **Stats Row** is a horizontal row of four pill-shaped stat items. Each item shows an icon and a label (e.g. XP, Days, Coins, Avo Cash). The row uses **space-between** so items are spread across the width with equal space between them.

---

## 2. Structure & Node Hierarchy

| Node ID   | Name / Role        | Type  | Width | Height | Notes                    |
|-----------|--------------------|-------|-------|--------|--------------------------|
| 559:3870  | Root container     | Frame | 354px | 32px   | Full row                 |
| 559:3871  | Stat pill 1 (XP)   | Frame | 62px  | 32px   | Lightning + "0 XP"       |
| 559:3872  | Inner content      | Frame | 46px  | 18px   | Icon + text group        |
| 559:3873  | Lightning          | Frame | 15px  | 15px   | Icon                     |
| 559:3875  | "0 XP"             | Text  | 29px  | 18px   | Label                    |
| 559:3876  | Stat pill 2 (Days) | Frame | 78px  | 32px   | Fire + "0 Days"          |
| 559:3877  | Inner content      | Frame | 62px  | 18px   | Icon + text              |
| 559:3878  | Fire               | Frame | 16px  | 16px   | Icon                     |
| 559:3880  | "0 Days"           | Text  | 44px  | 18px   | Label                    |
| 559:3881  | Stat pill 3 (Coins)| Frame | 81px  | 32px   | Coins + "5 Coins"        |
| 559:3882  | Inner content      | Frame | 65px  | 18px   | Icon + text              |
| 559:3883  | Coins              | Frame | 16px  | 16px   | Icon                     |
| 559:3885  | "5 Coins"          | Text  | 47px  | 18px   | Label                    |
| 559:3886  | Stat pill 4 (Avo)  | Frame | 104px | 32px   | Money + "5 Avo Cash"     |
| 559:3887  | Inner content      | Frame | 88px  | 18px   | Icon + text              |
| 559:3888  | Money              | Frame | 16px  | 16px   | Icon                     |
| 559:3890  | "5 Avo Cash"       | Text  | 70px  | 18px   | Label                    |

---

## 3. Root Container (559:3870)

- **Layout:** Flexbox, full width/height of parent.
- **Alignment:** `items-center`, `justify-between` (children spread with space between).
- **CSS (conceptual):**
  - `display: flex`
  - `align-items: center`
  - `justify-content: space-between`
  - `width: 100%`, `height: 100%` (or equivalent)
- **Design dimensions (from metadata):** 354×32 px at (24, 69).

---

## 4. Stat Pill (each of 559:3871, 559:3876, 559:3881, 559:3886)

### 4.1 Shape & size

- **Border radius:** `48px` (pill).
- **Height:** 32px (from metadata).
- **Width:** Content-based; design widths 62px, 78px, 81px, 104px for the four pills.

### 4.2 Background & border

- **Background:** `#FFFFFF` (white).
- **Border:** `1px solid rgba(10, 10, 10, 0.02)`.

### 4.3 Padding

- **Horizontal:** `8px` (`px-[8px]`).
- **Vertical:** `7px` (`py-[7px]`).

### 4.4 Shadow

Multi-layer shadow (Figma → CSS):

```css
box-shadow:
  0px 21px 6px 0px rgba(163, 163, 163, 0),
  0px 13px 5px 0px rgba(163, 163, 163, 0.01),
  0px 7px 4px 0px rgba(163, 163, 163, 0.05),
  0px 3px 3px 0px rgba(163, 163, 163, 0.09),
  0px 1px 2px 0px rgba(163, 163, 163, 0.1);
```

- In the app this can be represented as a token like `shadow-level-1` if defined in the design system.

### 4.5 Overflow

- `overflow: clip` (or `overflow: hidden`) so content respects the pill shape.

---

## 5. Inner Content (icon + label)

- **Layout:** Flex, horizontal.
- **Gap between icon and text:** `2px` (`gap-[2px]`).
- **Alignment:** `align-items: center`.

---

## 6. Icons

| Stat   | Node   | Name      | Size   | Color (implementation) |
|--------|--------|-----------|--------|-------------------------|
| XP     | 559:3873 | Lightning | 15×15 px | yellow-500 (e.g. Zap)   |
| Days   | 559:3878 | Fire      | 16×16 px | orange-500 (e.g. Flame) |
| Coins  | 559:3883 | Coins     | 16×16 px | amber-500               |
| Avo Cash | 559:3888 | Money   | 16×16 px | emerald-600 (e.g. Wallet) |

- Icons can be Lucide (Zap, Flame, Coins, Wallet) or SVG assets from Figma.
- Fixed size: first icon 15px, others 16px (or standardise to 16px if preferred).

---

## 7. Typography (labels)

- **Font family:** Space Grotesk (project standard).
- **Font weight:** Medium (`font-medium`).
- **Font size:** `14px` (`text-[14px]`).
- **Color:** `rgba(10, 10, 10, 0.8)`.
- **Letter spacing:** `-0.4173px` (`tracking-[-0.4173px]`).
- **Line height:** `normal`.
- **Whitespace:** `whitespace-nowrap`.

---

## 8. Tailwind / class summary

**Root (StatsRow):**

- `flex flex-wrap items-center justify-between gap-2` (with `justify-between` for space-between).

**Stat pill:**

- `bg-white border border-[rgba(10,10,10,0.02)] overflow-clip px-[8px] py-[7px] rounded-[48px] shadow-level-1` (or equivalent shadow utility).

**Inner (icon + label):**

- `flex items-center gap-[2px]`.

**Label text:**

- `font-medium text-[14px] text-[rgba(10,10,10,0.8)] tracking-[-0.4173px] whitespace-nowrap` (and Space Grotesk via project typography).

---

## 9. Content / copy

- **Pill 1:** `{xp} XP`
- **Pill 2:** `{streakDays} Days`
- **Pill 3:** `{coins} Coins`
- **Pill 4:** `{avoCash} Avo Cash`

Values are dynamic; labels are fixed as above.

---

## 10. Implementation notes

1. **Layout:** Use `justify-between` on the root so the four pills are spaced with space-between; keep `flex-wrap` and `gap-2` if wrapping is desired on small widths.
2. **Design tokens:** Prefer `shadow-level-1` and design-system borders/colors if they match the spec above.
3. **Icons:** Use Lucide (Zap, Flame, Coins, Wallet) with the sizes and colors in §6, or replace with Figma SVGs if assets are exported.
4. **Typography:** Use the project’s Space Grotesk setup and map the spec to existing text utilities (e.g. `text-body`) where they align.

---

*Extracted via Figma MCP (get_design_context, get_metadata, get_screenshot) from node 559:3870.*
