# Mobile and Touch-First Optimization Guide

## Overview

This document outlines the mobile and touch-first optimizations implemented across the Plan Maker application to ensure optimal user experience on phones and tablets.

## Responsive Layout Design

### PlanDetailPage Layout Modes

The Plan Detail page implements a dual-mode responsive layout:

**Mobile Mode (< 768px):**
- **Collapsible Spec List**: A sticky, top-docked drawer showing all specifications
  - Toggle button to expand/collapse the list
  - Auto-collapses when a spec is selected for optimal viewing space
  - Sticky positioned below the header for easy access
- **Detail Pane**: Stacked below the spec list
  - Shows the currently selected specification's content and Q&A
  - Natural full-page vertical scrolling
  - No fixed heights or nested scrollbars

**Desktop Mode (≥ 768px):**
- **Dual-Pane Layout**: Side-by-side spec list and detail pane
  - Fixed-width left pane (320px) with scrollable spec list
  - Flexible-width right pane with scrollable detail content
  - Fixed maximum height with internal scrolling

### Breakpoints

Responsive breakpoints are configured via CSS custom properties:

```css
:root {
  --dual-pane-breakpoint: 768px;
}
```

The layout switches at this breakpoint:
- **<768px**: Stacked mobile layout with collapsible spec list
- **≥768px**: Side-by-side dual-pane layout

## Key Features

### 1. Touch Targets

All interactive elements meet or exceed the minimum 44×44px touch target requirement:

- **Buttons**: Minimum 44px height on mobile, 48px for primary actions
- **Form inputs**: Minimum 44px height with increased padding on mobile
- **Spec list items**: Minimum 88px height for adequate touch surface
- **Toggle button**: 44×44px minimum for easy interaction
- **Checkboxes/Radio buttons**: Minimum 24×24px

Mobile-specific touch target improvements:
```css
@media (max-width: 767px) {
  .spec-list-item {
    min-height: 88px;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  
  .btn-submit {
    width: 100%;
    min-height: 48px;
  }
}
```

### 2. Safe Area Support

The application respects device safe areas (notches, home indicators):

```css
/* Safe area insets are used throughout */
--safe-area-inset-top: env(safe-area-inset-top, 0px);
--safe-area-inset-right: env(safe-area-inset-right, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-inset-left: env(safe-area-inset-left, 0px);
```

Applied to:
- Container padding
- Form inputs
- Sticky action bars
- Card layouts

### 3. Responsive Breakpoints

Optimized for common device sizes:

- **320px**: Very small phones (e.g., iPhone SE 1st gen)
- **480px**: Small phones
- **768px**: Tablets and larger
- **1200px**: Desktop (max container width)

### 4. Smooth Scrolling

#### Page-Level Scrolling
On mobile, the entire page uses natural vertical scrolling - no nested scrollbars or fixed-height containers that could trap content.

**Mobile (<768px):**
- Spec list is collapsible and sticky at the top
- Detail pane scrolls naturally with page content
- No `max-height` constraints
- Single scroll context for the entire page

**Desktop (≥768px):**
- Dual-pane layout with fixed max-height
- Each pane has independent scrolling
- Spec list scrolls within its 320px width
- Detail pane scrolls within remaining space

#### Momentum Scrolling
Momentum scrolling enabled for iOS devices:

```css
-webkit-overflow-scrolling: touch;
scroll-behavior: smooth;
```

Applied to:
- Spec list pane (desktop only)
- Detail pane (desktop only)
- Timeline containers
- Clarifier panels
- All scrollable regions

#### Collapsible Spec List (Mobile)

The spec list on mobile features:
- **Sticky positioning** below the header
- **Toggle button** (▼/▲) to expand/collapse
- **Auto-collapse** when a spec is selected
- **Smooth animation** for expand/collapse transitions
- **Accessible** with ARIA labels and keyboard support

```tsx
// Auto-collapse behavior
useEffect(() => {
  if (isMobile && selectedIndex !== null) {
    setIsCollapsed(true);
  }
}, [selectedIndex, isMobile]);
```

### 5. Sticky Action Bars

Primary actions remain accessible on mobile:

- **Sticky Summary Bar**: Positioned at bottom (configurable)
- **Keyboard Offset**: Dynamic adjustment for virtual keyboards via `--keyboard-offset` CSS variable
- **Safe Area Padding**: Respects device notches/home indicators

Configuration:
```css
:root {
  --sticky-summary-position: bottom; /* top or bottom */
  --sticky-summary-offset: 0px;
  --keyboard-offset: 0px; /* Update via JS when keyboard appears */
}
```

**JavaScript Integration for Virtual Keyboard:**
```javascript
// Example: Update keyboard offset when virtual keyboard appears
window.visualViewport?.addEventListener('resize', () => {
  const keyboardHeight = window.innerHeight - window.visualViewport.height;
  document.documentElement.style.setProperty(
    '--keyboard-offset', 
    `${Math.max(0, keyboardHeight)}px`
  );
});
```

### 6. Reduced Motion Support

All animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Why Universal Selector?**

The universal selector (`*`) is intentional and follows WCAG accessibility guidelines. It ensures:
- All animations respect user preferences
- Third-party components honor the setting
- Future additions automatically comply
- No animations slip through the cracks

**Performance Note:** The performance impact is negligible in modern browsers as this rule only activates when `prefers-reduced-motion: reduce` is set (typically <5% of users).

**Alternative Approach:** If performance is critical, replace with specific selectors:
```css
@media (prefers-reduced-motion: reduce) {
  .accordion-content,
  .timeline-item,
  .submission-banner,
  /* ...other animated elements */
  {
    animation: none !important;
    transition: none !important;
  }
}
```

Animations (<200ms duration):
- **Accordion expand/collapse**: 200ms slideDown
- **Timeline items**: 200ms fadeInUp
- **Banners**: 200ms fadeIn
- **Sticky bars**: 300ms slideIn

All automatically disabled for users who prefer reduced motion.

## Implementation Details

### PlanDetailPage

The PlanDetailPage implements responsive layout switching based on viewport width:

```tsx
// Detect viewport size
const [isDesktop, setIsDesktop] = useState(false);

useEffect(() => {
  setIsDesktop(window.innerWidth >= 768);
}, []);

useEffect(() => {
  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 768);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Layout Rendering:**
```tsx
{isDesktop ? (
  // Desktop: Dual-pane layout
  <div className="dual-pane-container">
    <SpecListPane ... />
    <SpecDetailPane ... />
  </div>
) : (
  // Mobile: Accordion layout (legacy) or Stacked layout (new)
  <div className="dual-pane-container">
    <SpecListPane ... />  {/* Collapsible */}
    <SpecDetailPane ... /> {/* Stacked below */}
  </div>
)}
```

**Mobile Optimizations:**
- Collapsible spec list with toggle button
- Natural page-level scrolling (no fixed heights)
- Full-width submit buttons (48px height)
- Safe area padding for all form fields
- Reduced motion for animations
- 88px minimum height for spec list items
- Increased font sizes for readability

**Breakpoints:**
- **320px**: Compact padding, maintains minimum touch targets
- **480px**: Standard mobile spacing
- **768px+**: Desktop dual-pane layout activated

### SpecListPane (Mobile Behavior)

The SpecListPane component adapts for mobile:

```tsx
const [isCollapsed, setIsCollapsed] = React.useState(false);
const [isMobile, setIsMobile] = React.useState(false);

// Auto-collapse when spec is selected on mobile
useEffect(() => {
  if (isMobile && selectedIndex !== null) {
    setIsCollapsed(true);
  }
}, [selectedIndex, isMobile]);
```

**CSS Implementation:**
```css
@media (max-width: 767px) {
  .spec-list-pane {
    position: sticky;
    top: calc(var(--header-height) + var(--spacing-sm));
    z-index: calc(var(--z-index-sticky) - 1);
  }

  .spec-list-pane.collapsed .spec-list-items {
    display: none;
  }
}
```

### SpecDetailPane (Mobile Scrolling)

On mobile, the detail pane allows natural scrolling:

```css
@media (max-width: 767px) {
  .spec-detail-pane {
    /* Allow natural scrolling */
    overflow: visible;
    min-height: 300px;
  }
}

@media (min-width: 768px) {
  .spec-detail-pane {
    /* Fixed height with internal scrolling */
    overflow-y: auto;
    height: 100%;
  }
}
```

### PlansListPage

**Mobile Optimizations:**
- 88px minimum card height
- Safe area padding for cards and timeline
- Full-width buttons (44px height)
- Ellipsis for long job IDs

**Breakpoint: 320px**
- Compact padding (8px)
- 150px max width for job IDs

### ClarifierPanel

**Mobile Optimizations:**
- Full-width action buttons (48px height)
- Momentum scrolling for debug output
- Safe area padding for inputs
- Stacked layout on mobile

## Testing Checklist

### Visual Testing

- [ ] Test on 320px width (iPhone SE)
- [ ] Test on 375px width (iPhone 13)
- [ ] Test on 768px width (iPad)
- [ ] Test on desktop (1200px+)

### Touch Testing

- [ ] All buttons have adequate touch targets (44px+)
- [ ] Form inputs are easy to tap
- [ ] Cards are easy to tap
- [ ] No accidental taps on adjacent elements

### Scrolling Testing

- [ ] No nested scrollbars
- [ ] Momentum scrolling works on iOS
- [ ] Sticky elements don't hide content
- [ ] Virtual keyboard doesn't hide inputs

### Accessibility Testing

- [ ] Reduced motion preference disables animations
- [ ] Focus indicators are visible
- [ ] Screen reader announces interactive elements
- [ ] Keyboard navigation works properly

### Edge Cases

- [ ] Very small viewports (<=320px) work without horizontal scroll
- [ ] Soft keyboard doesn't hide sticky actions
- [ ] Long text wraps without breaking layout
- [ ] Safe areas respected on devices with notches

## Browser Compatibility

### Supported Browsers

- **iOS Safari**: 14+
- **Chrome Mobile**: Latest
- **Firefox Mobile**: Latest
- **Samsung Internet**: Latest

### Feature Support

| Feature | iOS Safari | Chrome | Firefox | Samsung |
|---------|-----------|--------|---------|---------|
| Safe Area Insets | ✅ | ✅ | ✅ | ✅ |
| Momentum Scrolling | ✅ | N/A | N/A | N/A |
| Reduced Motion | ✅ | ✅ | ✅ | ✅ |
| CSS Animations | ✅ | ✅ | ✅ | ✅ |

## Performance Considerations

### CSS Performance

- All animations use `transform` and `opacity` (GPU-accelerated)
- Animations limited to <200ms for responsive feel
- Reduced motion disables all animations for better performance

### Scroll Performance

- `will-change` property avoided (causes memory issues)
- Momentum scrolling uses native browser behavior
- Smooth scroll behavior applied selectively

## Configuration

All mobile behavior is configurable via CSS custom properties:

```css
:root {
  /* Touch targets */
  --accordion-header-min-height-mobile: 4.5rem; /* 72px */
  --accordion-header-min-height-desktop: 3.75rem; /* 60px */
  
  /* Sticky elements */
  --sticky-summary-position: bottom;
  --sticky-summary-height: 5rem;
  --sticky-summary-z-index: var(--z-index-sticky);
  
  /* Animations */
  --transition-duration-fast: 150ms;
  --transition-duration-base: 200ms;
  --transition-duration-slow: 300ms;
}
```

## Best Practices

### When Adding New Features

1. **Touch Targets**: Ensure minimum 44×44px for all interactive elements
2. **Safe Areas**: Use `max()` with safe area insets for padding
3. **Animations**: Keep under 200ms and add reduced motion support
4. **Scrolling**: Enable momentum scrolling with `-webkit-overflow-scrolling: touch`
5. **Testing**: Test at 320px, 768px, and desktop breakpoints

### Mobile-First Approach

Always write CSS mobile-first:

```css
/* Mobile styles (default) */
.element {
  padding: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    padding: var(--spacing-lg);
  }
}
```

### Accessibility First

- Always include reduced motion support
- Test with keyboard navigation
- Ensure focus indicators are visible
- Use semantic HTML

## Resources

- [Apple Human Interface Guidelines - Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [CSS Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
