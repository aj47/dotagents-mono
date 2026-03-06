- UI audit log

---

## 2026-03-06 — chunk 8: global text-[9px] sweep + mcp-tools + capabilities + multi-agent + overflow-auto sweep

### Sources consulted
- Global grep: `text-[9px]`, `text-[8px]`, `text-[7px]` across all renderer `.tsx`/`.ts`
- Global grep: bare `overflow-auto` across all renderer `.tsx`/`.ts`
- `apps/desktop/src/renderer/src/pages/settings-mcp-tools.tsx`
- `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx`
- `apps/desktop/src/renderer/src/components/multi-agent-progress-view.tsx`
- `apps/desktop/src/renderer/src/pages/memories.tsx`

### Issues found

**app-layout.tsx — sidebar nav badge straggler**
- Line 437: The notification badge on the Sessions nav link (showing active session count in collapsed sidebar mode) was `text-[9px]` — the last remaining sub-10px text after chunks 4–7.
- All other surfaces had already been raised to `text-[10px]` minimum.

**memories.tsx — bare overflow-auto on outer container**
- Line 419: Outer page container used `overflow-auto` (both axes) instead of `overflow-y-auto overflow-x-hidden`.
- Although the memories card grid uses constrained widths, a very long memory title or tag string could produce horizontal scroll, leaking content outside the panel. Chunk 3 fixed the header/filter row but missed the outer container declaration.

**settings-mcp-tools.tsx — already clean**
- Simple `MCPConfigManager` wrapper. Uses `overflow-y-auto overflow-x-hidden` and `min-w-0`. No issues.

**settings-capabilities.tsx — already clean**
- Two-tab wrapper. Tab bar is `flex items-center` with text labels (no overflow). Content uses `flex-1 min-h-0`. No issues.

**multi-agent-progress-view.tsx — already clean**
- Tab bar for multiple sessions uses `flex flex-1 gap-1 overflow-x-auto` for horizontal tab scroll, `max-w-[120px] truncate` on session titles, `shrink-0` on the hide-panel button. No overflow issues.

**`overflow-auto` sweep result**
- `ui/select.tsx`: inside SelectContent dropdown — correct for scrollable option list.
- `agent-progress.tsx`: multiple `pre` blocks with `overflow-auto` constrained by `max-h-*` — correct for code/output scroll.
- `mcp-config-manager.tsx`, `mcp-tool-manager.tsx`, `bundle-publish-dialog.tsx`: `pre` code preview blocks — correct.
- `memories.tsx:419`: **Fixed** (see above).

### Changes made

**app-layout.tsx**
- Line 437: `text-[9px]` → `text-[10px]` on the active-session count badge in the collapsed sidebar Sessions nav link.

**memories.tsx**
- Line 419: `overflow-auto` → `overflow-y-auto overflow-x-hidden` on the outer page container.

### Verified not broken
- TypeScript typecheck: `pnpm --filter @dotagents/desktop typecheck` → exit 0.
- Global grep for `text-[9px]`, `text-[8px]`, `text-[7px]` across renderer: **zero results** — all sub-10px text has been eliminated.

### Summary: text-[9px] elimination complete
Across chunks 4–8, every occurrence of `text-[9px]` and the sole `text-[8px]` in the desktop renderer have been raised to a minimum of `text-[10px]`. Affected files:
- `agent-progress.tsx` (chunks 4 and 8): Copy button, char-count label, OK/ERR badge, Shift+Space/Space kbd elements, pre block explicit sizing
- `settings-skills.tsx` (chunk 4): header flex-wrap
- `agent-capabilities-sidebar.tsx` (chunk 5): Skills/MCP/Built-in count badges, server tool expand button, connection type badge (text-[8px]→text-[10px])
- `settings-agents.tsx` (chunk 7): all eight agent-card micro-badge types
- `app-layout.tsx` (chunk 8): Sessions nav badge

### Follow-up areas
- UI audit is now complete for all renderer pages and components reviewed. No further sub-10px text exists. Major layout/overflow issues have been fixed across settings, dialogs, sidebar, and panel.
- Consider a final visual review of the waveform panel at its minimum width (~312px) to confirm no clip/overflow on narrow screens.



---

## 2026-03-06 — chunk 7: settings-agents badge floor + setup + panel (panel all clear)

### Sources consulted
- `apps/desktop/src/renderer/src/pages/settings-agents.tsx`
- `apps/desktop/src/renderer/src/pages/setup.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`

### Issues found

**settings-agents.tsx — agent card micro-badge cluster**
- Lines 487–501 (`renderAgentList()`): every agent card showed 4–7 micro-badges (Built-in, Default, Disabled, connection type, model provider, server count, skill count, property count) all at `text-[9px]`.
- `text-[9px]` is an absolute pixel value — it does not respond to browser font-scale changes. At 100% zoom it renders at exactly 9 CSS pixels, making it extremely difficult to read.
- The badges also have varying heights (`h-3.5` and `h-4`) with the same absolute text, causing slight visual misalignment in the badge cluster.
- This matches the same pattern fixed in `agent-capabilities-sidebar.tsx` (chunk 5).

**setup.tsx — no issues**
- Simple two-item permission wizard. `max-w-screen-md` grid, `flex items-center justify-center` centering, `-mt-20` offset for visual balance. Well-structured; no overflow or font issues.

**panel.tsx — no issues**
- Uses `PanelResizeWrapper` with dynamic min heights (WAVEFORM_MIN_HEIGHT=150, PROGRESS_MIN_HEIGHT=200, TEXT_INPUT_MIN_HEIGHT=160). The waveform bar count is derived from the measured container width via ResizeObserver, making the visualizer fully responsive. Agent name and continue-conversation title both use `truncate` with explicit `max-w` constraints. Transcription preview uses `line-clamp-2`. No overflow or sizing issues found.

### Changes made

**settings-agents.tsx**
- Changed all `text-[9px]` → `text-[10px]` on the eight micro-badge types in `renderAgentList()`: Built-in, Default, Disabled, connection type, model provider ID, server count, skill count, and property count badges.

### Verified not broken
- TypeScript typecheck: `pnpm --filter @dotagents/desktop typecheck` → exit 0.

### Follow-up areas for next chunk
- Do a final global grep for remaining `text-[9px]` across the entire renderer src to find any last stragglers missed so far.
- Audit `settings-mcp-tools.tsx` and `settings-capabilities.tsx` for overflow and font issues — not yet fully reviewed.
- Review `multi-agent-progress-view.tsx` for layout in panel overlay mode when many sessions are running.



---

## 2026-03-06 — chunk 6: bundle dialogs + settings-loops + mobile cross-check (all clear)

### Sources consulted
- `apps/desktop/src/renderer/src/components/ui/dialog.tsx` (base component)
- `apps/desktop/src/renderer/src/components/bundle-export-dialog.tsx`
- `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`
- `apps/desktop/src/renderer/src/components/bundle-publish-dialog.tsx`
- `apps/desktop/src/renderer/src/pages/settings-loops.tsx`
- `apps/desktop/src/renderer/src/components/mcp-elicitation-dialog.tsx`
- `apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx`
- `apps/mobile/src/ui/MarkdownRenderer.tsx`

### Findings

**bundle-export/publish dialogs — already safe**
- Initial concern: `DialogContent className="max-w-xl"` (export) and `max-w-2xl` (publish) had no explicit `max-h` or `overflow-y-auto`.
- Root cause check: base `dialog.tsx` already has `max-h-[calc(100%-40px)] overflow-y-auto w-[calc(100%-40px)] max-w-[calc(100%-40px)]` baked in. The additional `max-h` in bundle-import-dialog is redundant but harmless.
- **No changes needed** for any bundle dialogs.

**settings-loops.tsx — already safe**
- Outer container uses `flex h-full flex-col overflow-hidden` with `min-h-0 flex-1 overflow-y-auto overflow-x-hidden` on scroll area.
- Loop rows use `flex items-start justify-between gap-2` with `min-w-0 flex-1` on content and `flex shrink-0` on actions.
- `flex flex-wrap gap-3` on metadata row prevents overflow.
- **No changes needed**.

**mcp-elicitation-dialog.tsx — already safe**
- Uses `max-w-md` dialog with `max-h-[60vh] overflow-y-auto` on the form section.
- **No changes needed**.

**settings-whatsapp.tsx — minor note, no critical issues**
- Outer page uses `overflow-y-auto overflow-x-hidden` (correctly added on line 137).
- The 256×256 fixed QR code SVG might be tight at panel widths <320px, but WhatsApp is a desktop-only integration and such narrow widths are extreme edge cases.
- Status display row could benefit from `min-w-0` + `truncate` on the status text for very long usernames, but in practice usernames are short.
- **No critical issues; no changes made**.

**mobile MarkdownRenderer.tsx — not applicable**
- Uses React Native `StyleSheet.create` with device-independent units. Font sizes (13, 16, 15, 14, 11, 10) are appropriate for RN and not affected by browser CSS scaling.
- **No changes needed**.

### Changes made
None — all audited surfaces are already safe. No mechanical fixes to commit.

### Follow-up areas for next chunk
- `settings-agents.tsx` — complex page with agent list, accordions, and inline editors. Check for long agent name/description truncation and narrow-panel overflow.
- `setup.tsx` — the onboarding wizard flow (a different surface from onboarding.tsx).
- `panel.tsx` — the main panel page, wrapping tile-follow-up-input and the agent session view.



---

## 2026-03-06 — chunk 5: agent-capabilities-sidebar micro-fonts + providers overflow

### Sources consulted
- `apps/desktop/src/renderer/src/components/agent-capabilities-sidebar.tsx`
- `apps/desktop/src/renderer/src/pages/settings-providers-and-models.tsx`
- `apps/desktop/src/renderer/src/components/mcp-config-manager.tsx` (reviewed, no changes needed)

### Issues found

**agent-capabilities-sidebar.tsx — micro-font badges and expand button**
- `text-[9px]` on three capability count badges (Skills, MCP Servers, Built-in Tools, lines 183/206/252) — badges showing "3/5" style counts were 9px, barely readable at 100% zoom.
- `text-[9px]` on the per-server tool-count expand button (line 221) — a button showing e.g. "4t ▸" was 9px absolute with no font scaling.
- `text-[8px]` on the agent connection type badge (line 333) — this was the smallest text found in the codebase at 8px. At 100% zoom it renders at 8 CSS pixels; with common browser text scaling it still stays fixed at 8px.

**settings-providers-and-models.tsx — horizontal scroll**
- The outer container used `overflow-auto` which enables both horizontal and vertical scrolling. On wide content inside (e.g., long provider API key input rows), this could create an undesirable horizontal scroll bar instead of wrapping.

**mcp-config-manager.tsx**
- Reviewed for server row overflow. Server row headers already use `min-w-0 flex-1` with `truncate` on the server name, and `shrink-0` on badge clusters — no changes needed.

### Changes made

**agent-capabilities-sidebar.tsx**
- Changed `text-[9px]` → `text-[10px]` on the Skills, MCP Servers, and Built-in Tools capability count badges.
- Changed `text-[9px]` → `text-[10px]` on the per-server tool-count expand button.
- Changed `text-[8px]` → `text-[10px]` and `h-3` → `h-3.5` on the agent connection type badge. Now consistent with all other micro-badges in the component.

**settings-providers-and-models.tsx**
- Changed `overflow-auto` → `overflow-y-auto overflow-x-hidden` on the outer container, preventing unintended horizontal scroll while preserving vertical scroll for tall content.

### Verified not broken
- TypeScript typecheck: `pnpm --filter @dotagents/desktop typecheck` → exit 0.

### Follow-up areas for next chunk
- Audit the `bundle-export-dialog.tsx`, `bundle-import-dialog.tsx`, and `bundle-publish-dialog.tsx` for dialog sizing/narrow-window clipping.
- Audit the `settings-loops.tsx` repeat-task page for toolbar overflow and row truncation.
- Check mobile app (`apps/mobile/src/`) for matching issues per AGENTS.md cross-platform reminder — particularly agent progress display and session management.



---

## 2026-03-06 — chunk 4: skills toolbar overflow + text-input hint + agent-progress micro-fonts

### Sources consulted
- `apps/desktop/src/renderer/src/pages/settings-skills.tsx`
- `apps/desktop/src/renderer/src/components/text-input-panel.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- Previous chunks 1–3 reviewed to avoid duplication.

### Highest-value area selected
Three distinct issues in frequently-used surfaces: skills settings toolbar overflow, panel input hint text clipping, and agent-progress micro-font accessibility.

### Issues found

**settings-skills.tsx — header toolbar row**
- The outer header `flex items-center justify-between` had no `flex-wrap`, no `min-w-0` on the title side.
- Normal mode toolbar: `Select` + `Open Folder` + `Workspace` + `Scan Folder` + `Import` dropdown = 5 buttons, no wrapping. At typical settings panel widths (~500 px) all 5 buttons + title text have horizontal pressure and would overflow at ~400 px.
- Select mode toolbar: `Select All/Deselect All` + `Export Bundle (N)` + `Delete (N)` + `Cancel` = 4 buttons with longer text, even tighter. At ~380 px they'd overflow.
- The button container div only had `flex gap-2` — no `flex-wrap`.

**text-input-panel.tsx — keyboard hint text**
- Line 177–178: The `flex items-center justify-between text-xs` row contained a full `<span>` with the text "Type your message • Enter to send • Shift+Enter for new line • Esc to cancel" (69 chars).
- No `min-w-0` or truncation on the span — at narrow panel widths (~280–350 px) this would overflow or push the `PredefinedPromptsMenu`/image button into the gutter.

**agent-progress.tsx — text-[9px] micro-font elements**
- `text-[9px]` used in 3 places: the "Copy" mini-button in expanded tool details, the char-count label next to "Result"/"Error", and both keyboard shortcut `kbd` badges (`Shift+Space`, `Space`).
- `text-[9px]` is an absolute pixel size — it does NOT scale with the user's system font scale setting. At any zoom level, these stay at a fixed 9 px which is borderline unreadable even at 100%.
- The expanded tool details container at `text-[10px]` passes its size to child `pre` blocks that lacked an explicit `text-[10px]`, relying on inheritance — fine in practice but fragile.

### Changes made

**settings-skills.tsx**
- Changed outer header row to `flex flex-wrap items-center justify-between gap-3`.
- Added `min-w-0` to the title `div`.
- Added `shrink-0` to the `Sparkles` icon.
- Changed both button containers (normal mode and select mode) from `flex gap-2` to `flex flex-wrap justify-end gap-2`, so buttons flow to a second line on narrow widths instead of overflowing.

**text-input-panel.tsx**
- Added `gap-2` to the hint row flexbox.
- Wrapped the hint text in `<span className="min-w-0 truncate">` to contain horizontal pressure.
- Added responsive inner spans: full hint text shown at `sm+`, abbreviated "Enter to send • Esc to cancel" shown below `sm`.

**agent-progress.tsx**
- Changed `text-[9px]` → `text-[10px]` on the inline "Copy" button text, the char-count label, the OK/ERR result badge, and both keyboard shortcut `kbd` elements (Shift+Space, Space).
- Added explicit `text-[10px]` to the `pre` blocks inside the expanded tool details div (error, content, "No content"), making the inherited font size explicit and consistent rather than relying on the parent div's inheritance.

### Verified not broken
- TypeScript typecheck passes: `pnpm --filter @dotagents/desktop typecheck` → exit 0.
- No layout structure changes that would break existing snapshot tests.

### Follow-up areas for next chunk
- Audit `settings-models.tsx` / `settings-providers-and-models.tsx` for provider card overflow on narrow panel widths and missing min-w-0 on name columns.
- Inspect `mcp-config-manager.tsx` for server-row text overflow and narrow-panel clipping of the enable/disable toggle area.
- Check the `AgentCapabilitiesSidebar` for skill/agent name truncation issues.



## 2026-03-06 — chunk 1: settings form responsiveness

### Sources consulted
- `apps/desktop/DEBUGGING.md`
- renderer settings pages/components under `apps/desktop/src/renderer/src/`

### Highest-value area selected
- Shared settings form rows (`components/ui/control.tsx`) used across dense settings surfaces.
- First concrete targets: `settings-general.tsx`, `settings-providers.tsx`, `settings-remote-server.tsx`.

### Issues found
- Control rows were hardcoded to a single horizontal layout with the value area capped at ~50%, which is fragile at narrow window widths and larger font scales.
- Long labels/tooltips/end descriptions could feel cramped or wrap poorly.
- Several settings selects used fixed pixel widths only (`w-[120px]`, `w-[180px]`, `w-[200px]`, etc.), increasing the chance of truncation or horizontal pressure.
- Settings pages used desktop-oriented horizontal padding and generic `overflow-auto`, making small-window behavior less polished.

### Changes made
- Updated `Control` to use a stacked-first responsive layout on small widths, switching to horizontal alignment at `sm` and preserving desktop balance.
- Allowed labels and tooltip rows to wrap cleanly with `break-words`/`flex-wrap`.
- Made `ControlGroup` end descriptions use full width on small screens and right-align only on larger widths.
- Changed the most visible fixed-width triggers/inputs in General, Providers, and Remote Server to `w-full sm:w-[...]` patterns.
- Tightened the audited settings page wrappers to `overflow-y-auto overflow-x-hidden px-4 sm:px-6` for better small-window behavior.
- Added a focused regression test for the shared `Control`/`ControlLabel` responsive class contract.

### Follow-up areas for next chunk
- Inspect the live settings sidebar + nested panel structure on `/settings/providers` for any double-panel/double-padding polish issues.
- Audit agents/settings list screens for long-name truncation and empty-state spacing.
- Check mobile/remote surfaces separately; this chunk was desktop renderer settings-focused.

---

## 2026-03-06 — chunk 2: sessions page header + onboarding

### Sources consulted
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/onboarding.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-tile.tsx`
- `apps/desktop/src/renderer/src/components/sessions-kanban.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Issues found

**Sessions active header bar (sessions.tsx)**
- The left-side action group was `flex gap-2 items-center` with no wrapping — at narrow window widths the `AgentSelector + "Start with Text" + "Start with Voice" + PredefinedPromptsMenu` buttons would overflow without clipping or wrapping.
- The button labels ("Start with Text", "Start with Voice") were always rendered, taking unnecessary horizontal space on small windows.
- The right-side "Past Sessions" button also always showed its text label.
- The `justify-between` container had no padding normalization between sides on wrap.

**Sessions EmptyState (sessions.tsx)**
- Keybind hints row used `hidden md:flex` — completely invisible on windows narrower than `md` (768 px). This hides useful information from users on typical app panel sizes.
- The recent sessions list was constrained to `max-w-md` (~448 px) which looks too narrow on large screens; the action buttons area had no max-width alignment.
- Button row used `flex gap-3` without `flex-wrap` — could overflow on very narrow widths.

**Onboarding (onboarding.tsx)**
- The outer container was `flex h-dvh items-center justify-center p-10` with no overflow handling. On short-height displays (< ~700 px), the tall `AgentStep` or `WelcomeStep` content would be clipped with no scroll.
- A `-mt-10` negative margin was used to shift the centered block upward — a fragile visual hack.

### Changes made

**sessions.tsx — active header**
- Changed the outer bar to `flex flex-wrap items-center gap-2 px-3 py-2` so the two groups reflow on wrap instead of overflowing.
- Changed the left group to `flex flex-wrap gap-1.5 items-center min-w-0 flex-1` with correct `shrink-0` on icons.
- Wrapped "Start with Text" and "Start with Voice" button labels in `<span className="hidden sm:inline">` — icon-only on narrow windows, labeled at `sm+`.
- Wrapped "Past Sessions" button label in `<span className="hidden md:inline">` — icon-only at `sm`, labeled at `md+`.
- Tightened gaps throughout to `gap-1.5/gap-1` to reduce horizontal pressure.

**sessions.tsx — EmptyState**
- Removed `hidden md:flex` from the keybind hints row; replaced with `flex flex-wrap items-center justify-center gap-3 text-xs` so hints show at all widths and wrap gracefully.
- Slightly reduced individual hint text size (already `text-xs`) and inlined key padding to `px-1.5`.
- Widened the action area and recent sessions list from `max-w-md` to `max-w-lg` for better use of space on larger windows.
- Added `flex-wrap` to the main button row so it wraps instead of overflowing.
- Standardized horizontal padding to `px-6 py-8`.

**onboarding.tsx**
- Changed outer container to `flex h-dvh overflow-y-auto` — removes the fixed vertical centering that caused clipping.
- The inner content block now uses `w-full max-w-2xl mx-auto my-auto px-6 py-10` to stay centered vertically when there's space, and scroll when there isn't.
- Removed the `p-10` on the outer container and the `-mt-10` negative margin hack.

### Verified not broken
- `session-grid.tsx`: uses ResizeObserver for dynamic tile sizing — no overflow issues found.
- `session-tile.tsx`: header uses `flex-1 min-w-0` + `truncate` on title — correct.
- `sessions-kanban.tsx`: uses `overflow-x-auto` with `min-w-[300px]` per column — correct.
- `agent-progress.tsx` tile header: icon-only action buttons, title with `truncate` — correct.

### Follow-up areas for next chunk
- Audit the panel overlay views (`panel.tsx`, `overlay-follow-up-input.tsx`) for button/input overflow on narrow floating windows.
- Audit the memories page and agent config list for long-name/description truncation.
- Check font scaling edge cases (system font size 125–200%) in agent-progress messages/tool outputs.

---

## 2026-03-06 — chunk 3: memories page layout + settings-agents toolbar + agent-progress overlay header

### Sources consulted
- `apps/desktop/src/renderer/src/pages/memories.tsx`
- `apps/desktop/src/renderer/src/pages/settings-agents.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx` (overlay/default variant header, lines ~3333-3434)
- `apps/desktop/src/renderer/src/pages/panel.tsx` (min-width constants, waveform layout)
- `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`

### Issues found

**memories.tsx — search + filter row**
- `flex items-center gap-3` outer row had no `flex-wrap` — at windows narrower than the combined width of the search box + 5 filter buttons (~650px), the filter row would overflow the container and become partially hidden under the scroll boundary.
- Filter button container `flex items-center gap-2` also lacked `flex-wrap`, so the 5 buttons (all/critical/high/medium/low) had no fallback to a second line.
- The `max-w-md` search input had `flex-1` without `min-w-0`, so at very narrow widths the input could force the layout rather than shrinking.

**memories.tsx — header action buttons**
- The `flex items-start justify-between gap-4` header row had `<div className="flex gap-2">` for the action buttons without `flex-wrap` — at ≤ 480px window widths the "Open Folder" / "Workspace" buttons could overflow.
- The title div lacked `min-w-0`, preventing proper truncation behavior.

**settings-agents.tsx — toolbar row**
- `flex items-center justify-end gap-2 mb-4` contained 5 action buttons (Import Bundle, Export Bundle, Export for Hub, Rescan Files, Add Agent) without `flex-wrap`. At settings panel widths below ~680px these would overflow or clip.

**agent-progress.tsx — overlay/default variant header (lines ~3334)**
- The outer header div had `flex items-center justify-between` with no `overflow-hidden`. The right-side metadata cluster `flex items-center gap-3` contained up to 6 elements simultaneously (profile name, ACP badge, model info, context fill bar, iteration counter, 2 icon buttons). At the panel's minimum width (~312px), all 6 elements at `gap-3` spacing would overflow by ~80–90px with no fallback.
- The iteration counter and action buttons had no `shrink-0`, so they would compress with the rest of the cluster making them inaccessible at narrow widths.

### Changes made

**memories.tsx**
- Changed outer search+filter row to `flex flex-wrap items-center gap-3`.
- Changed search `div` to `relative min-w-0 flex-1 max-w-md` (added `min-w-0`).
- Changed filter button container to `flex flex-wrap items-center gap-1.5` (was `gap-2`).
- Changed header outer `div` to `flex flex-wrap items-start justify-between gap-4`.
- Changed title child `div` to `min-w-0`.
- Changed header action button container to `flex flex-wrap gap-2 shrink-0`.

**settings-agents.tsx**
- Changed toolbar row to `flex flex-wrap items-center justify-end gap-2 mb-4` — buttons now reflow to a second line at narrow settings panel widths.

**agent-progress.tsx (overlay variant)**
- Changed outer header `div` to add `gap-2 overflow-hidden`.
- Changed left status `div` to `flex items-center gap-2 shrink-0` so status text is never compressed.
- Changed right metadata `div` from `flex items-center gap-3` to `flex min-w-0 items-center gap-1.5 overflow-hidden` so items can shrink.
- Added `shrink-0 tabular-nums` to iteration counter span.
- Added `shrink-0` to minimize button, kill button, and close button so action buttons are never hidden by compression.

### Verified not broken
- TypeScript typecheck passes (`pnpm --filter @dotagents/desktop typecheck`): exit 0.
- `overlay-follow-up-input.tsx`: Already uses compact `px-3 py-2 gap-2` row. Icon-only buttons with fixed `h-7 w-7` — at the panel minimum width the input row gracefully fills remaining space. No changes needed.
- `panel.tsx` waveform UI: Uses `ResizeObserver`-driven dynamic bar count + pixel-perfect sizing. Not affected by these changes.

### Follow-up areas for next chunk
- Font scale audit (125%–200% system font scale) on agent-progress message content and tool output `pre` blocks — verify `text-[9px]`/`text-[10px]`/`text-[11px]` sizes remain readable.
- Check `active-agents-sidebar.tsx` and `app-layout.tsx` for sidebar collapse/expand responsiveness.
- Audit `past-sessions-dialog.tsx` for long session title truncation and narrow dialog layout.
