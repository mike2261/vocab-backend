# Frontend Design Brief — Vocab Learning App
**Date:** 2026-06-03  
**Aesthetic target:** Grammarly-inspired teal/green, minimalist, breathable, subtle animations

---

## 1. Color Palette

### Primary — Grammarly Teal/Green

Grammarly's official primary is `#15C39A` (RGB 21, 195, 154 — Pantone PMS 3385 C). The full custom scale below is derived from this anchor and tuned for accessibility/contrast on white backgrounds.

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#edfdf8` | Tinted backgrounds, hover fills |
| `primary-100` | `#d2faf0` | Subtle badges, tag backgrounds |
| `primary-200` | `#a8f4e1` | Highlighted text background |
| `primary-300` | `#6eeacb` | Secondary accents, progress bars |
| `primary-400` | `#38d9b1` | Interactive icon color |
| `primary-500` | `#15c39a` | **Brand primary — buttons, links** |
| `primary-600` | `#0fa882` | Button hover state |
| `primary-700` | `#0d8a6a` | Button active/pressed state |
| `primary-800` | `#0c6e55` | Dark accents, dark mode primary text |
| `primary-900` | `#0b5442` | Darkest variant, footer backgrounds |

> Contrast check: `#15C39A` on `#FFFFFF` = 2.9:1 (not WCAG AA for body text). Use `#FFFFFF` text on `primary-500`+ backgrounds. For small text on tinted backgrounds, use `primary-700` or `primary-800`.

### Neutral / Gray Scale

Pure neutral (no warm/cool tint) — mirrors Vercel's approach for clean UI surfaces.

| Token | Hex | Usage |
|---|---|---|
| `neutral-50` | `#f9fafb` | Page background |
| `neutral-100` | `#f3f4f6` | Card backgrounds, sidebar |
| `neutral-200` | `#e5e7eb` | Dividers, table borders |
| `neutral-300` | `#d1d5db` | Disabled borders, input lines |
| `neutral-400` | `#9ca3af` | Placeholder text |
| `neutral-500` | `#6b7280` | Supporting/secondary text |
| `neutral-600` | `#4b5563` | Body text (secondary) |
| `neutral-700` | `#374151` | Strong body text |
| `neutral-800` | `#1f2937` | Headings |
| `neutral-900` | `#111827` | Maximum contrast text |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `background` | `#ffffff` | App shell |
| `surface` | `#f9fafb` | Page-level background |
| `surface-raised` | `#ffffff` | Cards, popovers (with shadow) |
| `text-primary` | `#111827` | Headings, emphasis |
| `text-secondary` | `#4b5563` | Body, descriptions |
| `text-tertiary` | `#9ca3af` | Placeholders, metadata |
| `text-inverse` | `#ffffff` | Text on dark/primary backgrounds |
| `border-subtle` | `#e5e7eb` | Card borders, dividers |
| `border-default` | `#d1d5db` | Input outlines, separators |
| `focus-ring` | `#15c39a` | Focus indicator (3px) |
| `error` | `#ef4444` | Validation errors |
| `warning` | `#f59e0b` | Caution states |
| `success` | `#15c39a` | Correct answers, completed states |

---

## 2. Typography

### Font Stack Recommendation

**Primary font: Plus Jakarta Sans** — warm geometric sans-serif; ideal for an educational product that needs approachability without sacrificing legibility. Weight range 200–800.  
**Fallback/dense UI text: Inter** — for data tables, stats, long prose passages where legibility at small sizes is critical.

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
```

### Type Scale

| Step | Size | Weight | Line-height | Letter-spacing | Use case |
|---|---|---|---|---|---|
| `text-xs` | 11px | 500 | 1.45 | +0.02em | Labels, metadata |
| `text-sm` | 13px | 400 | 1.5 | 0 | Secondary body |
| `text-base` | 15px | 400 | 1.6 | 0 | Primary body text |
| `text-lg` | 17px | 500 | 1.5 | -0.01em | Sub-headings, card titles |
| `text-xl` | 20px | 600 | 1.4 | -0.01em | Section headings |
| `text-2xl` | 24px | 700 | 1.3 | -0.02em | Page headings |
| `text-3xl` | 30px | 700 | 1.25 | -0.02em | Hero titles |
| `text-4xl` | 36px | 800 | 1.2 | -0.03em | Display (flashcard word) |
| `text-5xl` | 48px | 800 | 1.1 | -0.04em | Splash/marketing |

**Pairing rules:**
- Headings: Plus Jakarta Sans 700–800, tight tracking (`-0.02em` to `-0.04em`)
- Body: Plus Jakarta Sans 400, relaxed line-height (1.6)
- UI labels / badge text: Plus Jakarta Sans 500–600, positive tracking (+0.01em)
- Code / IPA phonetics / vocab IDs: JetBrains Mono 400

---

## 3. Animation Principles

### Philosophy
Animations should be invisible assistants — they confirm intent, reduce cognitive jarring, and guide attention. Never decorate. Duration ceiling: **400ms**. Default to `easeOut` for entrances, `easeIn` for exits, `easeInOut` for in-place transitions.

### Named Animation Presets (Framer Motion)

```ts
// lib/animations.ts

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

export const fadeSlideDown = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

// For cards entering a list (stagger parent + child)
export const listContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const listItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' },
};

// Buttons — snappy spring feedback
export const buttonTap = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 300, damping: 22 },
};

// Cards — gentle lift on hover
export const cardHover = {
  whileHover: { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
  transition: { type: 'spring', stiffness: 260, damping: 24 },
};

// Modal / drawer entrance
export const modalEntrance = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 8 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] }, // custom easeOutExpo
};

// Flashcard flip (CSS-based 3D transform)
export const cardFlip = {
  initial: { rotateY: 0 },
  flipped: { rotateY: 180 },
  transition: { type: 'spring', stiffness: 120, damping: 20 },
};

// Correct answer pulse
export const successPulse = {
  animate: { scale: [1, 1.04, 1] },
  transition: { duration: 0.32, ease: 'easeOut' },
};

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.24, ease: 'easeInOut' },
};
```

### Duration Reference

| Interaction | Duration | Type |
|---|---|---|
| Icon/button hover | 120–160ms | CSS transition |
| Button tap feedback | 160–200ms | Spring |
| Tooltip / popover | 160–200ms | Fade |
| Card hover lift | 200–240ms | Spring |
| Modal open/close | 260–300ms | Spring + fade |
| Page transition | 220–280ms | EaseInOut |
| List stagger (per item) | 60ms delay | EaseOut |
| Card flip | 300–350ms | Spring (low stiffness) |
| Toast notification | 200ms in / 160ms out | EaseOut |
| Progress bar fill | 400–600ms | EaseInOut |

### CSS Transition Classes (Tailwind)

```css
/* Reusable transition utilities */
.transition-subtle { transition: all 160ms ease-out; }
.transition-base   { transition: all 220ms ease-out; }
.transition-slow   { transition: all 320ms ease-in-out; }
```

---

## 4. Component Design Patterns

### Cards

```
- Background: #ffffff
- Border: 1px solid #e5e7eb (neutral-200)
- Border-radius: 12px (rounded-xl)
- Shadow (resting): 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
- Shadow (hover): 0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)
- Padding: 20px (p-5) or 24px (p-6)
- Transition: shadow + transform 220ms spring
```

**Flashcard specifically:**
- Large word: text-4xl/5xl, Plus Jakarta Sans 800, `#111827`
- Phonetic: text-base, JetBrains Mono, `#6b7280`
- Definition: text-lg, 400 weight, `#374151`
- Part-of-speech badge: teal-100 background, teal-700 text, rounded-full, text-xs 600
- "Flip" cue: subtle bottom-center dot indicator (3 dots, teal for active)

### Buttons

**Primary:**
```
background: #15c39a (primary-500)
text: #ffffff
border-radius: 8px (rounded-lg)
padding: 10px 20px (py-2.5 px-5)
font: 500 weight, 14px
hover: background #0fa882 (primary-600), translateY(-1px)
active: background #0d8a6a (primary-700), translateY(0)
focus: outline 2px solid #15c39a, outline-offset 2px
transition: 160ms spring
```

**Secondary (ghost/outline):**
```
background: transparent
border: 1px solid #e5e7eb
text: #374151
hover: background #f9fafb, border-color #15c39a, text #0d8a6a
border-radius: 8px
```

**Tertiary (text-only):**
```
background: none
text: #15c39a
hover: text #0d8a6a, background #edfdf8 (primary-50)
border-radius: 6px
padding: 8px 12px
```

**Icon button:**
```
width/height: 36px
border-radius: 8px
hover: background #f3f4f6
active: background #e5e7eb
```

### Input Fields

```
border: 1px solid #d1d5db
border-radius: 8px
padding: 10px 14px
background: #ffffff
placeholder: #9ca3af
font: 15px, 400 weight
focus: border-color #15c39a, ring 3px rgba(21,195,154,0.20)
error: border-color #ef4444, ring 3px rgba(239,68,68,0.15)
transition: border-color 160ms ease-out, box-shadow 160ms ease-out
```

### Badges / Tags

```
border-radius: 9999px (pill)
padding: 3px 10px
font: 11–12px, 600 weight, tracking +0.02em, uppercase
```

| Variant | Background | Text |
|---|---|---|
| Teal (default/correct) | `#d2faf0` (primary-100) | `#0d8a6a` (primary-700) |
| Neutral | `#f3f4f6` | `#4b5563` |
| Warning | `#fef3c7` | `#b45309` |
| Error | `#fee2e2` | `#b91c1c` |

### Navigation / Sidebar

```
background: #f9fafb
border-right: 1px solid #e5e7eb
nav item (inactive): text #6b7280, border-radius 8px, hover bg #f3f4f6
nav item (active): bg #edfdf8 (primary-50), text #0d8a6a, left-border 2px solid #15c39a
icon size: 18px
item padding: 8px 12px
```

### Progress / Streaks

```
Track: #e5e7eb, height 6px, border-radius 9999px
Fill: gradient from #38d9b1 (primary-400) → #15c39a (primary-500)
Animated fill: width transition 400ms easeInOut
Streak counter: text-2xl 700, primary-500 color
```

---

## 5. Tailwind CSS Design Tokens

### `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#edfdf8',
          100: '#d2faf0',
          200: '#a8f4e1',
          300: '#6eeacb',
          400: '#38d9b1',
          500: '#15c39a',  // Grammarly brand primary
          600: '#0fa882',
          700: '#0d8a6a',
          800: '#0c6e55',
          900: '#0b5442',
        },
        neutral: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '1.45', letterSpacing: '0.02em' }],
        'sm':   ['13px', { lineHeight: '1.5',  letterSpacing: '0' }],
        'base': ['15px', { lineHeight: '1.6',  letterSpacing: '0' }],
        'lg':   ['17px', { lineHeight: '1.5',  letterSpacing: '-0.01em' }],
        'xl':   ['20px', { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        '2xl':  ['24px', { lineHeight: '1.3',  letterSpacing: '-0.02em' }],
        '3xl':  ['30px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '4xl':  ['36px', { lineHeight: '1.2',  letterSpacing: '-0.03em' }],
        '5xl':  ['48px', { lineHeight: '1.1',  letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        'none': '0px',
        'sm':   '4px',
        'md':   '6px',
        DEFAULT: '8px',
        'lg':   '10px',
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '20px',
        'full': '9999px',
      },
      boxShadow: {
        'xs':  '0 1px 2px rgba(0,0,0,0.04)',
        'sm':  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        'md':  '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        'lg':  '0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)',
        'xl':  '0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        'teal-glow': '0 0 0 3px rgba(21,195,154,0.20)',
        'none': 'none',
      },
      spacing: {
        // 4px base grid
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '2.5': '10px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
        '20':  '80px',
        '24':  '96px',
        '32':  '128px',
      },
      transitionDuration: {
        '80':  '80ms',
        '120': '120ms',
        '160': '160ms',
        '220': '220ms',
        '280': '280ms',
        '350': '350ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-success': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':       'fade-in 180ms ease-out',
        'slide-up':      'slide-up 220ms ease-out',
        'slide-down':    'slide-down 220ms ease-out',
        'pulse-success': 'pulse-success 320ms ease-out',
        'shimmer':       'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
```

### CSS Variables (`globals.css`)

```css
@layer base {
  :root {
    /* Brand */
    --primary: 168 74% 42%;          /* #15c39a in HSL */
    --primary-foreground: 0 0% 100%;

    /* Surfaces */
    --background: 0 0% 100%;
    --foreground: 220 14% 7%;         /* #111827 */
    --surface: 210 20% 98%;           /* #f9fafb */
    --card: 0 0% 100%;
    --card-foreground: 220 14% 7%;

    /* Interactive */
    --secondary: 210 16% 97%;
    --secondary-foreground: 215 14% 34%;
    --muted: 210 16% 97%;
    --muted-foreground: 215 12% 47%;
    --accent: 168 74% 95%;            /* primary-50 */
    --accent-foreground: 168 74% 28%; /* primary-700 */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    /* Chrome */
    --border: 220 13% 91%;            /* #e5e7eb */
    --input: 220 13% 82%;             /* #d1d5db */
    --ring: 168 74% 42%;              /* matches primary */

    /* Radius */
    --radius: 8px;
    --radius-sm: 4px;
    --radius-lg: 12px;
    --radius-full: 9999px;
  }

  .dark {
    --background: 222 47% 8%;
    --foreground: 210 40% 96%;
    --surface: 222 47% 10%;
    --card: 222 47% 11%;
    --card-foreground: 210 40% 96%;
    --border: 217 33% 18%;
    --input: 217 33% 22%;
    --muted: 217 33% 14%;
    --muted-foreground: 215 20% 65%;
    --primary: 168 74% 46%;           /* slightly lighter in dark mode */
    --primary-foreground: 0 0% 100%;
    --accent: 168 50% 15%;
    --accent-foreground: 168 74% 72%;
  }
}
```

---

## 6. Inspiration References

### Linear (`linear.app`)
**What to borrow:** Precise micro-typography — tight heading tracking (`-0.04em`), compact vertical rhythm, zero decorative elements. Navigation is nearly invisible: icon + label, no borders, hover-only highlight. Keyboard-first affordances (shortcuts shown on hover). The "command palette" pattern for power users.

### Grammarly
**What to borrow:** The teal `#15C39A` as the single accent across the entire UI — it appears only on CTAs, success states, and active selection. Everything else is neutral. Inline feedback cards use very light teal backgrounds (primary-50) with teal-700 text — this is the badge/highlight pattern to replicate for vocabulary hints and correct-answer states.

### Notion
**What to borrow:** Layered shadow system — instead of a single drop shadow, use 2–3 stacked low-opacity shadows to mimic physical depth. `8px/12px` border-radius on all containers. Typography breathing room: `1.6–1.7` line-height for reading-focused content. The "page" metaphor (white card on subtle gray background).

### Vercel
**What to borrow:** Neutral gray ramp with zero color tint — makes the primary teal pop much harder. Pure `#111827` text rather than soft black. Spacing based on strict 4px/8px grid. Border treatment: `1px solid rgba(0,0,0,0.06)` instead of hard color — feels nearly invisible while still structuring content.

### Duolingo (interaction patterns only, not visual style)
**What to borrow:** Immediate, game-like feedback on correct/incorrect answers. Progress visualization front-and-center. Streak mechanics with satisfying micro-animations. Card-flip reveal mechanic for word → definition. XP/point animations that fade in then out without blocking content.

---

## 7. Component-Specific Vocabulary App Notes

### Flashcard Component
- Front face: word in `text-4xl` Plus Jakarta Sans 800, centered, `#111827`
- Back face: definition `text-lg` 400, example sentence `text-base` italic in `#6b7280`, synonyms as teal pill badges
- Flip: CSS `perspective(1000px) rotateY(180deg)`, `transform-style: preserve-3d`, `backface-visibility: hidden` — 340ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight spring overshoot)
- Swipe gestures: Framer Motion `drag="x"` with `dragConstraints`, rotate card ±15deg based on drag, show green "KNOW" / red "REVIEW" overlay at drag threshold

### Progress Dashboard
- Weekly streak: large display number in `text-5xl` `primary-500`, flame icon, "days" label `text-sm` `neutral-500`
- Vocabulary count: `text-3xl` `neutral-800`, subtitle `text-sm` `neutral-400`
- Progress ring: SVG circle with `strokeDashoffset` animated via Framer Motion on mount
- Mastered/Learning/New split: horizontal bar, 3 segments (primary-500, primary-300, neutral-200)

### Word List / Review Queue
- List items: 56px height, border-bottom `neutral-200`, word left + mastery badge right
- Mastery states: `rounded-full` badge — "New" (neutral-100/neutral-600), "Learning" (amber-100/amber-700), "Mastered" (primary-100/primary-700)
- Row hover: `bg-neutral-50` transition 120ms
- Inline expand: `AnimatePresence` + `fadeSlideDown` for definition reveal

### Quiz Mode
- Full-bleed card, single question per screen, no distractions
- Answer buttons: 4 large options, `py-4 px-6`, `rounded-xl`, `border border-neutral-200`
- Correct: animate border + background to `primary-100`, green checkmark scales in (successPulse)
- Incorrect: border/background to `red-100`, shake animation (`translateX` oscillation 200ms)
- "Next" button slides in from bottom after answer is revealed

---

## Quick Reference Cheat Sheet

```
Brand primary:     #15c39a
Page background:   #ffffff / surface: #f9fafb
Heading text:      #111827
Body text:         #374151
Secondary text:    #6b7280
Border default:    #e5e7eb
Card shadow:       0 4px 12px rgba(0,0,0,0.07)
Border radius:     8px default, 12px cards, 9999px pills
Font:              Plus Jakarta Sans (headings 700–800, body 400)
Animation floor:   120ms  |  ceiling: 400ms
Spring default:    stiffness 260, damping 22
Easing default:    easeOut (entrances), easeIn (exits)
```
