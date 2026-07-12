# Grooming OS — Design System

This document outlines the core design language, styling tokens, and UI paradigms that define the visual aesthetic of Grooming OS. It serves as the single source of truth for frontend implementation.

---

## 1. Core Philosophy

**"Premium, Dark, and Effortless."**

Grooming OS is an elite personal styling assistant. The interface should feel like a high-end luxury concierge service. 
- **Dark Mode Native:** The default and only theme is dark mode, emphasizing content (clothing photos) over UI chrome.
- **Glassmorphism:** Instead of flat, opaque surfaces, we use translucent "glass" cards to create depth.
- **Subtle Glows:** We use a signature "Gold" accent gradient with soft box-shadow glows to draw attention to primary AI actions.

---

## 2. Design Tokens

All design tokens are defined as CSS Custom Properties (`var(--...)`) in `src/styles/design-tokens.css`. Do not hardcode hex values in component CSS.

### 2.1 Colors

**Backgrounds**
- `--color-bg-primary`: `#0a0a0b` (Main app background)
- `--color-bg-secondary`: `#111113` (Inputs, subtle elements)
- `--color-bg-tertiary`: `#1a1a1f` (Modals, overlays)
- `--color-bg-elevated`: `#1e1e24`

**Glass Surfaces**
- `--color-glass-bg`: `rgba(255, 255, 255, 0.03)`
- `--color-glass-border`: `rgba(255, 255, 255, 0.06)`

**Text**
- `--color-text-primary`: `#f5f5f7` (Headings, primary content)
- `--color-text-secondary`: `#a1a1aa` (Subtitles, labels)
- `--color-text-tertiary`: `#71717a` (Placeholder text, disabled)

**Accents**
- **Gold (Primary AI Actions):** `--color-accent` (`#c8a55a`), with light/dark variants for gradients.
- **Blue (Badges/Secondary Info):** `--color-blue` (`#4a9eff`).

### 2.2 Typography

We use **Inter** for all text to ensure crisp legibility on mobile and desktop.

**Font Scale**
- `--text-xs`: 12px
- `--text-sm`: 13px
- `--text-base`: 14px (Body text)
- `--text-md`: 16px (Buttons, main inputs)
- `--text-lg`: 18px
- `--text-xl` to `--text-7xl`: Heading scales

**Weights & Line Height**
- Regular (400) for body text with relaxed line-height (`1.65`).
- Semibold (600) and Bold (700) for headings with tight line-height (`1.15`) and slight negative tracking (`-0.025em`).

### 2.3 Spatial System

**Spacing Scale (8px Grid)**
- `--space-1` (4px) through `--space-32` (128px)
- We strictly adhere to an 8px grid. Margins and paddings should almost always be a multiple of 4 or 8.

**Border Radius**
- We favor highly rounded corners to soften the dark aesthetic.
- Cards: `--radius-2xl` (24px) or `--radius-xl` (18px)
- Buttons/Inputs: `--radius-lg` (14px)
- Badges/Chips: `--radius-full` (9999px)

---

## 3. UI Component Patterns

### 3.1 Glass Cards
The fundamental building block for content (Outfits, Wardrobe Items, Settings).
```css
/* Standard implementation in a CSS Module */
.card {
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-2xl);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
}
```

### 3.2 Primary "AI" Buttons
Actions that trigger LLM generations or major state changes.
```css
.primaryBtn {
  background: var(--gradient-accent); /* linear-gradient(135deg, #c8a55a, #dbc07a, #a8883e) */
  color: var(--color-text-inverse); /* black/very dark gray for contrast */
  font-weight: var(--font-bold);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glow-accent); /* soft gold glow */
}
```

### 3.3 Inputs & Forms
- Inputs never have a white background. They use `--color-bg-secondary` with a subtle white border.
- On focus, the border transitions to `--color-accent` and the background solidifies slightly to `--color-bg-primary`.
- Use `--text-xs` with uppercase and tracking for input labels.

### 3.4 Icons
- We strictly use **Lucide React** icons.
- Icons should be minimal, 2px stroke width, unfilled. 
- Emojis are deprecated and should not be used in the UI.

---

## 4. Animation Guidelines

Grooming OS feels alive through micro-interactions.

- **Hover States:** Glass cards should shift slightly upward (`transform: translateY(-4px)`) and brighten their background/border opacity.
- **Mount Animations:** New pages and items appearing in lists should use the global `.animate-fade-in-up` class.
- **State Changes:** When the AI is "thinking" or processing a Virtual Try-On, we use the `pulse-glow` keyframe animation on the active step icon to indicate continuous background activity.

---

## 5. Technical Implementation Rules

1. **No TailwindCSS.** We rely exclusively on CSS Modules (`[name].module.css`) and our global variables.
2. **Global Classes.** Reusable utility classes like `.glass-card` and `.gradient-text` are defined in `globals.css` and can be used directly via `className="glass-card"`.
3. **Mobile First.** All CSS is written mobile-first. Use `@media (min-width: 1024px)` inside the CSS modules to handle desktop layout adjustments (like changing a single column to a CSS Grid).
