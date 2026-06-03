# Design System — Vocab Learning App

**Aesthetic:** Grammarly-inspired teal, minimalist, breathable, subtle animations

---

## Color Palette

### Primary — Grammarly Teal

| Token | Hex | Usage |
|---|---|---|
| `primary-50`  | `#edfdf8` | Tinted backgrounds, hover fills |
| `primary-100` | `#d2faf0` | Badge backgrounds, highlights |
| `primary-200` | `#a8f4e1` | Progress track accents |
| `primary-300` | `#6eeacb` | Secondary accents |
| `primary-400` | `#38d9b1` | Icons, interactive elements |
| `primary-500` | `#15c39a` | **Brand primary — CTA, links, success** |
| `primary-600` | `#0fa882` | Button hover |
| `primary-700` | `#0d8a6a` | Button active, text on teal bg |
| `primary-800` | `#0c6e55` | Dark accents |
| `primary-900` | `#0b5442` | Darkest variant |

### Neutral

| Token | Hex | Usage |
|---|---|---|
| `neutral-50`  | `#f9fafb` | Page / surface background |
| `neutral-100` | `#f3f4f6` | Sidebar, secondary surfaces |
| `neutral-200` | `#e5e7eb` | Dividers, card borders |
| `neutral-300` | `#d1d5db` | Input borders, disabled |
| `neutral-400` | `#9ca3af` | Placeholder text |
| `neutral-500` | `#6b7280` | Secondary / muted text |
| `neutral-600` | `#4b5563` | Body text |
| `neutral-700` | `#374151` | Strong body text |
| `neutral-800` | `#1f2937` | Headings |
| `neutral-900` | `#111827` | Maximum contrast |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `background`     | `#ffffff` | App shell |
| `surface`        | `#f9fafb` | Page background |
| `text-primary`   | `#111827` | Headings |
| `text-secondary` | `#374151` | Body |
| `text-muted`     | `#6b7280` | Metadata, placeholders |
| `border`         | `#e5e7eb` | Cards, dividers |
| `border-input`   | `#d1d5db` | Input outlines |
| `error`          | `#ef4444` | Validation errors |
| `warning`        | `#f59e0b` | Caution states |
| `success`        | `#15c39a` | Correct answers |

---

## Typography

**Font stack:**
```css
--font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

- **Plus Jakarta Sans** — headings & UI (weight 700–800 for headings, 400–500 for body/labels)
- **Inter** — dense UI, data tables, stats
- **JetBrains Mono** — IPA phonetics, code

### Type Scale

| Name | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `xs`   | 11px | 500 | 1.45 | +0.02em | Labels, metadata |
| `sm`   | 13px | 400 | 1.5  | 0       | Secondary body |
| `base` | 15px | 400 | 1.6  | 0       | Primary body |
| `lg`   | 17px | 500 | 1.5  | -0.01em | Card titles |
| `xl`   | 20px | 600 | 1.4  | -0.01em | Section headings |
| `2xl`  | 24px | 700 | 1.3  | -0.02em | Page headings |
| `3xl`  | 30px | 700 | 1.25 | -0.02em | Hero titles |
| `4xl`  | 36px | 800 | 1.2  | -0.03em | Flashcard word |
| `5xl`  | 48px | 800 | 1.1  | -0.04em | Display / splash |

---

## Animation

**Rules:** duration ceiling 400ms — `easeOut` entrances, `easeIn` exits, spring for physical interactions.

### Framer Motion Presets

```ts
// lib/animations.ts

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' },
}

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const listContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const listItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' },
}

export const buttonTap = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap:   { scale: 0.97 },
  transition: { type: 'spring', stiffness: 300, damping: 22 },
}

export const cardHover = {
  whileHover: { y: -3 },
  transition:  { type: 'spring', stiffness: 260, damping: 24 },
}

export const modalEntrance = {
  initial:  { opacity: 0, scale: 0.97, y: 8 },
  animate:  { opacity: 1, scale: 1, y: 0 },
  exit:     { opacity: 0, scale: 0.97, y: 8 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
}

export const cardFlip = {
  transition: { type: 'spring', stiffness: 120, damping: 20 },
}

export const successPulse = {
  animate: { scale: [1, 1.04, 1] },
  transition: { duration: 0.32, ease: 'easeOut' },
}
```

### Duration Reference

| Interaction | Duration |
|---|---|
| Icon / button hover | 120–160ms |
| Button tap | 160–200ms |
| Card hover lift | 200–240ms |
| Modal open/close | 260–300ms |
| Page transition | 220–280ms |
| List stagger (per item) | 60ms delay |
| Card flip | 300–350ms |

---

## Components

### Card
```
background:     #ffffff
border:         1px solid #e5e7eb
border-radius:  12px
shadow resting: 0 1px 3px rgba(0,0,0,0.06)
shadow hover:   0 8px 24px rgba(0,0,0,0.09)
padding:        20–24px
```

### Button

**Primary**
```
bg: #15c39a  |  text: #ffffff  |  radius: 8px  |  py-2.5 px-5  |  weight: 500
hover: bg #0fa882, translateY(-1px)
active: bg #0d8a6a
focus: outline 2px solid #15c39a, offset 2px
```

**Secondary (outline)**
```
bg: transparent  |  border: 1px solid #e5e7eb  |  text: #374151
hover: bg #f9fafb, border #15c39a, text #0d8a6a
```

**Ghost (text)**
```
bg: none  |  text: #15c39a
hover: bg #edfdf8, text #0d8a6a
```

### Input
```
border:         1px solid #d1d5db
border-radius:  8px
padding:        10px 14px
focus:          border #15c39a + ring 3px rgba(21,195,154,0.20)
error:          border #ef4444 + ring 3px rgba(239,68,68,0.15)
transition:     160ms ease-out
```

### Badge / Tag
```
border-radius: 9999px  |  padding: 3px 10px  |  font: 11px 600 uppercase +0.02em
```

| Variant | Background | Text |
|---|---|---|
| Teal | `#d2faf0` | `#0d8a6a` |
| Neutral | `#f3f4f6` | `#4b5563` |
| Warning | `#fef3c7` | `#b45309` |
| Error | `#fee2e2` | `#b91c1c` |

### Navigation (sidebar)
```
background: #f9fafb  |  border-right: 1px solid #e5e7eb
item inactive: text #6b7280, radius 8px, hover bg #f3f4f6
item active:   bg #edfdf8, text #0d8a6a, left-border 2px solid #15c39a
```

---

## Tailwind Config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

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
          500: '#15c39a',
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
        'xs':   ['11px', { lineHeight: '1.45', letterSpacing: '0.02em'  }],
        'sm':   ['13px', { lineHeight: '1.5',  letterSpacing: '0'       }],
        'base': ['15px', { lineHeight: '1.6',  letterSpacing: '0'       }],
        'lg':   ['17px', { lineHeight: '1.5',  letterSpacing: '-0.01em' }],
        'xl':   ['20px', { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        '2xl':  ['24px', { lineHeight: '1.3',  letterSpacing: '-0.02em' }],
        '3xl':  ['30px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '4xl':  ['36px', { lineHeight: '1.2',  letterSpacing: '-0.03em' }],
        '5xl':  ['48px', { lineHeight: '1.1',  letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '6px',
        DEFAULT: '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'xs':  '0 1px 2px rgba(0,0,0,0.04)',
        'sm':  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        'lg':  '0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)',
        'xl':  '0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        'teal-glow': '0 0 0 3px rgba(21,195,154,0.20)',
      },
      transitionDuration: {
        '80': '80ms', '120': '120ms', '160': '160ms',
        '220': '220ms', '280': '280ms', '350': '350ms', '400': '400ms',
      },
      transitionTimingFunction: {
        'out-expo':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-success': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
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
}

export default config
```

---

## Inspiration

| App | Borrow |
|---|---|
| **Grammarly** | Single teal accent on CTAs + success only; teal-50 bg for inline hints |
| **Linear** | Tight heading tracking, invisible nav, keyboard-first UX |
| **Notion** | Layered low-opacity shadows, 8–12px radius, white card on gray surface |
| **Vercel** | Pure neutral grays, strict 4px/8px grid, near-invisible borders |
| **Duolingo** | Card-flip reveal, swipe gestures, immediate correct/incorrect feedback |

---

## Quick Reference

```
Primary:      #15c39a
Background:   #ffffff  |  Surface: #f9fafb
Heading:      #111827  |  Body: #374151  |  Muted: #6b7280
Border:       #e5e7eb
Card shadow:  0 4px 12px rgba(0,0,0,0.07)
Radius:       8px default / 12px cards / 9999px pills
Font:         Plus Jakarta Sans 700–800 heading / 400 body
Animation:    120ms–400ms  |  Spring: stiffness 260, damping 22
```
