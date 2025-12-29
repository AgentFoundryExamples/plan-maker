# Plan Detail Page Layout Refactor

## Overview

This document describes the three-pane fixed layout refactor for the Plan Detail Page, which ensures that spec list, spec detail, and clarifier panes never overflow the viewport on desktop.

## Configuration

All layout behavior is adjustable via CSS variables in `src/styles/PlanDetailPage.css`:

### Three-Pane Layout Configuration

```css
/* Enable/disable three-pane layout */
--three-pane-enabled: true;
--three-pane-breakpoint: 768px; /* Minimum width for three-pane layout */
--pane-gap: var(--spacing-lg); /* Gap between panes */
```

### Spec List Pane (Left, Top Row)

```css
--spec-list-width-percent: 35%; /* Width as percentage (recommended: 35-40%) */
--spec-list-min-width: 280px; /* Minimum width */
--spec-list-max-width: 450px; /* Maximum width */
```

### Spec Detail Pane (Right, Top Row)

```css
--spec-detail-width-percent: 65%; /* Width as percentage (recommended: 60-65%) */
--detail-pane-min-width: 400px; /* Minimum width */
```

### Pane Heights (Viewport-Relative)

```css
--pane-viewport-offset: 400px; /* Offset for header, metadata, and clarifier space - adjust as needed */
--pane-row-height: calc(100vh - var(--pane-viewport-offset)); /* Height for top row */
--pane-min-height: 400px; /* Minimum height for panes */
--pane-max-height: calc(100vh - 350px); /* Maximum height for panes */
```

**Note**: The viewport offset is now configurable via `--pane-viewport-offset` variable, making it easier to adjust for different layouts or header/footer heights. The grid height uses `max()` to ensure panes never fall below the minimum height.

### Clarifier Panel (Bottom, Full Width)

```css
--clarifier-panel-max-height: 500px; /* Maximum height */
--clarifier-panel-min-height: 200px; /* Minimum height */
```

## Layout Structure

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header & Breadcrumbs                                    │
├──────────────────────┬──────────────────────────────────────┤
│ SpecListPane         │ SpecDetailPane                        │
│ (35-40% width)       │ (60-65% width)                        │
│                      │                                       │
│ ┌──────────────────┐ │ ┌──────────────────────────────────┐ │
│ │ Header (sticky)  │ │ │ Header (sticky)                   │ │
│ ├──────────────────┤ │ ├──────────────────────────────────┤ │
│ │                  │ │ │                                   │ │
│ │ Scrollable       │ │ │ Scrollable                        │ │
│ │ Items            │ │ │ Content                           │ │
│ │ (.spec-list-     │ │ │ (.spec-detail-                    │ │
│ │  items)          │ │ │  content)                         │ │
│ │                  │ │ │                                   │ │
│ └──────────────────┘ │ └──────────────────────────────────┘ │
│                      │                                       │
└──────────────────────┴──────────────────────────────────────┘
│                                                              │
│ ClarifierPanel (full width, scrollable if > max-height)     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────────────────┐
│ Page Header & Breadcrumbs            │
├─────────────────────────────────────┤
│ SpecListPane (collapsible)          │
│ - Natural scrolling                  │
├─────────────────────────────────────┤
│ SpecAccordion                        │
│ - Natural scrolling                  │
├─────────────────────────────────────┤
│ ClarifierPanel                       │
│ - Natural scrolling                  │
└─────────────────────────────────────┘
```

## Scrollable Regions

### Desktop

1. **Spec List Items** (`.spec-list-items`)
   - Scrolls vertically within fixed-height spec list pane
   - Custom scrollbar styling
   - Maintains selected item visibility

2. **Spec Detail Content** (`.spec-detail-content`)
   - Scrolls vertically within fixed-height spec detail pane
   - Custom scrollbar styling
   - Sticky header remains visible

3. **Clarifier Panel** (`.clarifier-panel`)
   - Scrolls vertically if content exceeds max-height
   - Custom scrollbar styling
   - Max height configurable via CSS variable

### Mobile

All panes use natural page scrolling without fixed heights to allow for better touch interaction and viewport utilization.

## Text Handling

To prevent text overflow and maintain readable layouts:

### Text Clamping

- **Spec list titles**: 3 lines maximum with ellipsis
- **Spec detail titles**: 2 lines maximum with ellipsis
- **Accordion titles**: 2 lines maximum with ellipsis

```css
display: -webkit-box;
-webkit-line-clamp: 2; /* or 3 */
-webkit-box-orient: vertical;
overflow: hidden;
text-overflow: ellipsis;
```

### Word Wrapping

All text content uses:
```css
overflow-wrap: break-word;
```

This ensures extremely long words or URLs wrap gracefully without horizontal overflow. Note: `hyphens: auto` was removed as it can be unreliable across browsers.

## Edge Cases Handled

### Dozens of Specs or Questions
- Scrolling within fixed-height containers prevents layout shift
- Performance remains smooth with 100+ items
- Selected item remains in view

### Extremely Long Content
- Paragraphs and code blocks wrap with `overflow-wrap: break-word`
- Long titles are clamped with ellipsis
- No horizontal scrolling occurs

### Short Viewports (Laptop Screens)
- Minimum heights ensure usability
- All three panes remain visible
- Scrollbars appear as needed

### Empty Content
- Empty states show placeholders
- Pane sizing is preserved
- Layout remains consistent

## Acceptance Criteria Status

✅ **Desktop PlanDetail layout renders two fixed-height panes in the top row**
   - Spec list: 35% width (configurable)
   - Spec detail: 65% width (configurable)
   - ClarifierPanel: Full width below

✅ **Each pane maintains a fixed height relative to the viewport**
   - Height: `calc(100vh - 400px)` with min/max constraints
   - Overflow scrolling enabled via CSS
   - Long lists never push page taller than viewport

✅ **Content wraps without overlap and clamps long titles**
   - CSS line-clamp applied to titles (2-3 lines)
   - `overflow-wrap: break-word` for all text
   - Unreliable `hyphens: auto` removed for better cross-browser compatibility

✅ **Tests assert layout structure and scrollable containers**
   - 53 tests for PlanDetailPage (includes new layout tests)
   - 32 tests for ClarifierPanel (includes layout verification)
   - All 566 tests in suite passing

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (including `-webkit-line-clamp`)
- Mobile browsers: Natural scrolling, no fixed heights

## Future Enhancements

Potential improvements that could be made:

1. **Resizable Panes**: Allow users to drag pane boundaries
2. **Saved Preferences**: Remember user's preferred pane widths
3. **Keyboard Shortcuts**: Navigate between panes with hotkeys
4. **Focus Management**: Improve focus handling when switching panes
5. **Accessibility**: Add landmark regions and improved ARIA labels

## Migration Notes

No breaking changes for existing functionality:

- Mobile layout unchanged (uses accordion)
- All existing tests pass without modification
- API/data flow unchanged
- Component props unchanged
- Only CSS/layout structure modified

## Testing

Run layout-specific tests:
```bash
npm test -- PlanDetailPage.test.tsx
npm test -- ClarifierPanel.test.tsx
```

Run full test suite:
```bash
npm test
```

Build for production:
```bash
npm run build
```
