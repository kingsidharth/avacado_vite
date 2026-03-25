# Design Review Guide — Step by Step (First Time)

This guide walks you through reviewing the design changes in this repo as if you're doing it for the first time. You'll: (1) see what changed in the code, (2) run the app, (3) open each screen, and (4) compare it to the design specs.

---

## Part 1: See what changed (optional but useful)

**Step 1.1** — Open **Terminal** (on Mac: Spotlight → type "Terminal" → Enter).

**Step 1.2** — Go to the project folder. Replace the path with yours if different:

```bash
cd /Users/saumyparihar/Avocado-app/avacado_vite
```

**Step 1.3** — List changed and new files:

```bash
git status
```

You'll see modified files (e.g. `src/components/quiz/QuizContainer.tsx`) and new files (e.g. `docs/figma-design-spec-quiz-page-559-2395.md`). No need to understand every line; this just shows the scope of the design work.

**Step 1.4** — (Optional) To see the actual code changes for one file:

```bash
git diff src/components/quiz/QuizPageHeader.tsx
```

Press **Space** to scroll, **q** to quit. You can repeat with other file paths from `git status`.

---

## Part 2: Run the app

**Step 2.1** — In the same terminal, from the project folder, install dependencies (only needed once per clone):

```bash
bun install
```

Wait until it finishes (you'll see the prompt again).

**Step 2.2** — Start the dev server:

```bash
bun run dev
```

You should see something like "Local: http://localhost:5173/" (or another port). **Leave this terminal open**; closing it stops the app.

**Step 2.3** — Open your browser (Chrome, Safari, etc.) and go to:

```
http://localhost:5173/
```

(Use the exact URL shown in the terminal if the port is different.)

You should see the app (e.g. splash or login). If you get "Cannot connect", check that the terminal is still running `bun run dev` and that the URL/port match.

**Step 2.4** — Switch to **mobile size** so the layout matches the Figma design (phone width):

- **Chrome:** Right-click the page → **Inspect** → click the **device icon** (phone/tablet) in the top bar of the dev tools → pick "iPhone 14 Pro" or set width to **402**.
- **Safari:** Develop → Enter Responsive Design Mode (or use a narrow window ~402px wide).

Keep the browser in this mobile view for the rest of the review.

---

## Part 3: Open each screen and pick a spec

Design changes are grouped by screen. For each screen below, (A) open the URL, (B) open the matching spec in `docs/`, then (C) compare.

### Screen 1 — Dashboard (stats + learning path)

**Step 3.1a** — In the browser, go to:

```
http://localhost:5173/dashboard
```

(If the app sends you to login or onboarding first, complete that, then go to `/dashboard`.)

**Step 3.1b** — In your editor or Finder, open these spec files (they're in the `docs` folder):

- `docs/figma-design-spec-stats-row-559-3870.md` — stats at the top
- `docs/figma-design-spec-learning-path-journey-712-90.md` — learning path
- `docs/figma-design-spec-node-703-24.md` — each lesson/node

**Step 3.1c** — Compare: Does the stats row match the spec (layout, numbers, labels)? Does the learning path and each node match (icons, states, spacing)? Note "matches" or "off: [what's wrong]".

---

### Screen 2 — Quiz page (single question)

**Step 3.2a** — In the browser, go to a quiz. For example:

```
http://localhost:5173/quiz/1
```

(Use another quiz ID if your app has different data, e.g. `/quiz/2`.)

**Step 3.2b** — Open:

- `docs/figma-design-spec-quiz-page-559-2395.md`

**Step 3.2c** — Compare: From top to bottom — header with back + progress bar, mascot + speech bubble, question text, option buttons, bottom "Check" button. Check spacing (e.g. 24px from sides), colors, and font sizes. Try selecting an answer and clicking "Check" — do the correct/incorrect states match the spec?

---

### Screen 3 — Lesson loading

**Step 3.3a** — In the browser, go to a lesson-loading URL. The route looks like:

```
http://localhost:5173/lesson-loading/MILESTONE/LEVEL/LESSON
```

Replace `MILESTONE`, `LEVEL`, and `LESSON` with real IDs from your app (e.g. from the dashboard when you tap a lesson). If you don't have IDs, skip this screen or ask your team for a sample URL.

**Step 3.3b** — Open:

- `docs/figma-design-spec-lesson-loading-559-4021.md`

**Step 3.3c** — Compare: Loading animation, avocado graphic, platform, and any text. Do they match the spec?

---

### Screen 4 — Header and progress bar

The header (back button + progress bar) appears on several screens (e.g. quiz, lesson).

**Step 3.4a** — You already see it if you opened the quiz page (`/quiz/1`). If not, open any in-app screen that has a back button and progress bar.

**Step 3.4b** — Open:

- `docs/figma-design-spec-header-progress-559-4084.md`

**Step 3.4c** — Compare: Back button size and padding, progress bar height, track color, fill color, and spacing from the left/right edges.

---

## Part 4: Write down your findings

**Step 4.1** — Keep a short list as you go. You can create a file in the repo, e.g. `docs/DESIGN_REVIEW_NOTES.md`, with content like:

```markdown
# Design review – [today's date]

## Dashboard
- Stats row: matches spec.
- Learning path: spacing on nodes looks tighter than spec.

## Quiz page
- Layout and CTA: good.
- Option buttons: selected state color different from spec (spec says #XXX).

## Header
- Matches spec.
```

**Step 4.2** — If you're reviewing in a **pull request**, open the PR in the browser, go to the "Files changed" tab, and add comments on the specific lines (e.g. "Header: spec says 24px from left – can we confirm?").

**Step 4.3** — Each spec file has a **Figma link** at the top (e.g. "Source: Figma — Avocado TOFU App"). Open that link to see the design in Figma and compare side-by-side with the app for pixel-level checks.

---

## Quick reference — which spec for which screen

| What you're reviewing | Spec file in `docs/` |
|------------------------|------------------------|
| Stats row on dashboard | `figma-design-spec-stats-row-559-3870.md` |
| Learning path / journey | `figma-design-spec-learning-path-journey-712-90.md` |
| Lesson/course nodes | `figma-design-spec-node-703-24.md` |
| Quiz page (full screen) | `figma-design-spec-quiz-page-559-2395.md` |
| Lesson loading screen | `figma-design-spec-lesson-loading-559-4021.md` |
| Header + progress bar | `figma-design-spec-header-progress-559-4084.md` |

---

## Summary checklist

- [ ] Opened terminal and ran `git status` (and optionally `git diff`).
- [ ] Ran `bun install` then `bun run dev` and opened the app in the browser.
- [ ] Set browser to mobile width (~402px).
- [ ] Opened `/dashboard` and compared with stats-row, learning-path, and node specs.
- [ ] Opened `/quiz/1` (or another quiz) and compared with quiz-page spec.
- [ ] Opened lesson-loading URL (if available) and compared with lesson-loading spec.
- [ ] Checked header + progress bar against header-progress spec.
- [ ] Wrote notes in `docs/DESIGN_REVIEW_NOTES.md` or in the PR.
