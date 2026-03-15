# DotAgents Brand Guide

Canonical reference for visual identity across dotagents.app, dotagentsprotocol.com, and docs.dotagents.app.

---

## Palette

All surfaces are dark-first. There is no light theme in the product brand.

| Token              | Hex       | Usage                                      |
|--------------------|-----------|---------------------------------------------|
| `bg`               | `#0d0d0d` | Page background                             |
| `surface`          | `#141414` | Cards, sidebars, elevated panels            |
| `border`           | `#262626` | Default borders                             |
| `border-light`     | `#1e1e1e` | Subtle inner borders (table rows, dividers) |
| `fg`               | `#d4d4d4` | Primary body text                           |
| `fg-muted`         | `#888`    | Secondary text, descriptions                |
| `fg-dim`           | `#555`    | Tertiary text, timestamps, labels           |
| `accent-green`     | `#4ec9b0` | Success, solutions, positive markers        |
| `accent-blue`      | `#569cd6` | MCP, configuration, informational           |
| `accent-amber`     | `#ce9178` | Skills, portable items, warnings            |
| `accent-rose`      | `#d16969` | Errors, problems, destructive               |
| `accent-cyan`      | `#9cdcfe` | Links, active states, interactive elements  |
| `accent-keyword`   | `#c586c0` | Keywords, layered/structural concepts       |
| `accent-violet`    | `#b392f0` | Primary brand accent, agents, sub-agents    |
| `accent-teal`      | `#73c991` | Tasks, automation, scheduled items          |

## Typography

| Role          | Family                                             | Weight     | Size      |
|---------------|----------------------------------------------------|------------|-----------|
| Body / UI     | `JetBrains Mono`, `ui-monospace`, `monospace`      | 400        | 13-14px   |
| Headings      | `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`| 700-800    | 18-32px   |
| Labels        | `JetBrains Mono`                                   | 400-500    | 11-12px   |
| Code          | `JetBrains Mono`                                   | 400        | 13px      |

Body text is monospace (JetBrains Mono). Headings break to Inter for contrast.

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap
```

## Tone & Copy

- **No emojis.** Use colored text markers (`x` for problems, `->` for solutions) or accent-colored symbols.
- **Terse, technical.** Write like a spec, not marketing copy.
- **Lowercase nav links.** `overview`, `get started`, `structure` — not `Overview`, `Get Started`.
- **Use "agent" not "persona"** in all copy.
- **Section markers** use `$` prefix in headings (e.g., `$ overview`).

## Components

### Navbar
- Fixed top, `bg/90` with `backdrop-blur-sm`
- Height: 48px (`h-12`)
- Max width: `max-w-4xl` centered
- Logo text: `.agents Protocol` or `DotAgents` in bold, `hover:text-white`
- Nav links: `text-fg-muted text-xs`, mono font, `hover:text-fg`
- Separator: `|` in `text-border` color

### Cards (spec-card)
- `border: 1px solid border` / `background: surface`
- `rounded-md` (6px)
- Hover: `border-color: #333`
- No box-shadow on hover (flat aesthetic)

### Code Blocks
- Background: `#1a1a1a`
- Border: `1px solid border`
- `rounded-md`
- Header bar: `px-4 py-2 border-b border-border text-fg-dim text-xs`

### Section Layout
- `py-16 border-b border-border`
- `max-w-4xl mx-auto px-6`
- Heading: `text-lg font-bold text-white font-sans`
- Subheading: `text-fg-dim text-xs`

### Links
- Color: `accent-cyan`
- Hover: `text-white`
- External links get ` ↗` suffix

### Tables
- Inside `spec-card` wrapper
- Header: `text-fg-dim text-xs text-left font-normal`
- Rows: `border-b border-border-light`
- Accent-colored first column for emphasis

## Favicon

The `.a` monospace mark on a `#0d0d0d` rounded-rect with `#262626` stroke.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#0d0d0d" stroke="#262626" stroke-width="1"/>
  <text x="16" y="22" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="20" fill="#9cdcfe">.a</text>
</svg>
```

## File / Asset Naming

- Lowercase, hyphen-separated: `og-image.png`, `favicon.svg`
- No spaces, no underscores in public assets

---

Source of truth: `dotagentsprotocol-website/src/styles/global.css` and component files.

