# Design Review Notes

**Purpose:** This document summarizes the design work implemented in this branch and provides space for the reviewer (manager) to note whether each area matches the Figma specs or what needs to be fixed.

**Reviewer:** Please run the app (`bun install` then `bun run dev`), open the screens below in mobile view (~402px), and compare with the design specs in `docs/`. Add your verdict under "Reviewer feedback" for each section. See `docs/DESIGN_REVIEW_GUIDE.md` for step-by-step instructions.

---

## Summary of work (implementer)

Design changes were implemented to align the app with the Figma specs. Scope:

- **Dashboard:** Stats row (XP, Days, Coins, Avo Cash pills), learning path journey (zig-zag path with nodes and connector segments), and lesson/course nodes (active, completed, locked states with blob and path assets). New components: `StatsRow`, `LessonPathMap`, `LessonNode`, `learning-path-assets`.
- **Quiz page:** Full question screen with header (back button + progress bar), mascot + speech bubble, question label and text, multiple-choice option buttons (default, selected, correct, incorrect states using radio SVGs), and bottom primary CTA ("Check"). New/updated: `QuizContainer`, `QuizPageHeader`, `QuizOptionButton`, `QuizMascotBubble`, radio assets in `public/`.
- **Header & progress bar:** Back button (CaretLeft, 36×36 touch target, 6px padding) and progress bar (track + fill, 12px height, teal fill). Used on quiz and other learning screens. Spec: `figma-design-spec-header-progress-559-4084.md` (quiz uses the back+progress variant from quiz spec 559:2412).
- **Lesson loading:** New route and screen with white background, centered mascot (blob) above isometric platform, glow/projection, and loading assets. New route: `lesson-loading.$milestoneId.$levelId.$lessonId.tsx`; assets in `public/lesson-loading/`.
- **Supporting updates:** Layout components (`AppShell`, `BottomTabBar`, `Header`), lesson/quiz components (`LessonPlayer`, `QuizRunner`, question types, `MascotHero`, `MascotBlob`), onboarding progress bar, and shared UI (e.g. `input`). All Figma design spec docs are in `docs/` for reference.

---

## Dashboard

**What was implemented:** Stats row at top (four pills with icons and labels, space-between layout, 354×32). Learning path below with alternating left/right nodes connected by path segments (completed vs locked SVGs). Each node: blob, status icon (play / check / lock), sizing and spacing per node spec 703:24 and journey spec 712:90.

**Specs to compare:** `figma-design-spec-stats-row-559-3870.md`, `figma-design-spec-learning-path-journey-712-90.md`, `figma-design-spec-node-703-24.md`.

**Reviewer feedback:**

- Stats row:
- Learning path / nodes:

---

## Quiz page

**What was implemented:** White full-screen layout. Top: header with back button (24×24 icon, 6px padding) and progress bar (12px height, track + teal fill). Then mascot + speech bubble (blob ~77×75, bubble with tail). Question block (label + question text). Four option rows with distinct states (default, selected, correct, incorrect) using `public/radio-*.svg`. Bottom: primary CTA "Check" (354×46, 24px horizontal margin). Spacing and hierarchy per quiz spec 559:2395.

**Spec to compare:** `figma-design-spec-quiz-page-559-2395.md`.

**Reviewer feedback:**

---

## Header + progress bar

**What was implemented:** Back button and progress bar as used on the quiz (and other learning) screens. Back: 36×36px touch target, 6px padding, CaretLeft 24×24. Progress: 312×12px bar, rounded track (e.g. rgba(10,10,10,0.1)), teal fill with rounded corners; width reflects progress. Horizontal layout with 6px gap between back and bar; 24px from screen left.

**Spec to compare:** `figma-design-spec-header-progress-559-4084.md` (and quiz spec section 5 for the back+progress variant).

**Reviewer feedback:**

---

## Lesson loading

**What was implemented:** Full-screen white layout. Status bar at top. Centered content: mascot blob above isometric platform, glow/projection between mascot and platform, and decorative vectors. Assets from `public/lesson-loading/` (e.g. loading-glow, avocado-loading, loading-platform). Route: `/lesson-loading/:milestoneId/:levelId/:lessonId`.

**Spec to compare:** `figma-design-spec-lesson-loading-559-4021.md`.

**Reviewer feedback:**

---

## Any other comments

(Reviewer: add anything else — e.g. typography, colors, spacing elsewhere, or accessibility.)
