# Mobile and Touch-First Optimization Guide

## Overview

This document outlines the mobile and touch-first optimizations implemented across the Plan Maker application to ensure optimal user experience on phones and tablets.

## Responsive Layout Design

### PlanDetailPage Layout Modes

The Plan Detail page implements a dual-mode responsive layout:

**Mobile Mode (< 768px):**
- **Stacked Workflow with Distinct Views**: Users navigate between full-screen views
  - **Spec List View**: Full-screen view showing all specifications
    - Tap a spec to navigate to its detail view
    - Shows question status badges for each spec
  - **Spec Detail View**: Full-screen view showing selected spec content and Q&A
    - Shows back button (← Back) to return to spec list
    - Full content visibility without scrolling conflicts
    - Natural page-level vertical scrolling
- **Navigation Flow**:
  1. User starts on spec list view
  2. Taps a spec → transitions to spec detail view
  3. Answers questions, navigates between questions
  4. Taps back button → returns to spec list view
  5. Can select a different spec and repeat

**Desktop Mode (≥ 768px):**
- **Dual-Pane Layout**: Side-by-side spec list and detail pane
  - Fixed-width left pane (320px) with scrollable spec list
  - Flexible-width right pane with scrollable detail content
  - Fixed maximum height with internal scrolling
  - Both panes visible simultaneously

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
- **Back button**: 44px minimum height, full-width tap area on mobile
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
  
  .spec-detail-back-button {
    min-height: 44px;
    width: fit-content;
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
On mobile, each view uses natural vertical scrolling - no nested scrollbars or fixed-height containers that could trap content.

**Mobile (<768px):**
- **Spec List View**: Full-screen with natural page scrolling
  - Scrollable list of all specs
  - No height constraints
  - Single scroll context
- **Spec Detail View**: Full-screen with natural page scrolling
  - Back button at top to return to list
  - Detail content scrolls naturally with page
  - No `max-height` constraints
  - Single scroll context per view

**Desktop (≥768px):**
- Dual-pane layout with fixed max-height
- Each pane has independent scrolling
- Spec list scrolls within its 320px width
- Detail pane scrolls within remaining space

#### Momentum Scrolling

**Modern iOS (13+)** handles momentum scrolling automatically without requiring `-webkit-overflow-scrolling: touch`. This property has been deprecated and is no longer needed.

The application relies on native browser scrolling behavior which provides:
- Smooth inertia scrolling on iOS Safari
- Natural momentum on all mobile browsers
- Better performance without legacy CSS properties

**Note:** The deprecated `-webkit-overflow-scrolling: touch` property has been removed from all stylesheets as modern browsers handle this automatically.

#### Mobile Navigation Flow

The mobile experience uses distinct full-screen views for clarity:

**View Transitions**:
- **Spec List → Spec Detail**: Tap any spec item
- **Spec Detail → Spec List**: Tap back button (← Back)

**State Management**:
```tsx
// Mobile view state ('spec-list', 'spec-detail', or null for desktop)
const [mobileView, setMobileView] = useState<'spec-list' | 'spec-detail' | null>(null);

// Navigate to spec detail when spec is selected on mobile
const handleSelectSpec = (index: number) => {
  setSelectedSpecIndex(index);
  if (!isDesktop) {
    setMobileView('spec-detail');
  }
};

// Return to spec list on mobile
const handleBackToList = () => {
  if (!isDesktop) {
    setMobileView('spec-list');
  }
};
```

**Accessibility**:
- Back button has clear label: "Back to specifications list"
- Focus management ensures back button is first interactive element
- Screen readers announce view transitions
- Keyboard navigation supported with external keyboard

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
const [mobileView, setMobileView] = useState<'spec-list' | 'spec-detail' | null>(null);

useEffect(() => {
  const handleResize = () => {
    const newIsDesktop = window.innerWidth >= 768;
    setIsDesktop(newIsDesktop);
    
    // Reset mobile view when switching to desktop
    if (newIsDesktop) {
      setMobileView(null);
    }
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
  // Mobile: Stacked views with navigation
  <div className="mobile-stacked-container">
    {(mobileView === 'spec-list' || mobileView === null) && (
      <SpecListPane ... />
    )}
    {mobileView === 'spec-detail' && selectedSpecIndex !== null && (
      <SpecDetailPane ... onBackToList={handleBackToList} />
    )}
  </div>
)}
```

**Mobile Optimizations:**
- Distinct full-screen views for spec list and spec detail
- Natural page-level scrolling per view
- Back button for explicit navigation
- Full-width elements (no sidebar confusion)
- 88px minimum height for spec list items
- Increased font sizes for readability

**Breakpoints:**
- **320px**: Compact padding, maintains minimum touch targets
- **480px**: Standard mobile spacing
- **768px+**: Desktop dual-pane layout activated

### SpecListPane (Mobile Behavior)

The SpecListPane component adapts for mobile:

```tsx
// On mobile: Full-screen view showing all specs
// On desktop: Left pane in dual-pane layout
```

**CSS Implementation:**
```css
@media (max-width: 767px) {
  .spec-list-pane {
    min-height: 100vh;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
```

### SpecDetailPane (Mobile Scrolling)

On mobile, the detail pane displays full-screen with a back button:

```css
@media (max-width: 767px) {
  .spec-detail-pane {
    /* Full-screen mobile view */
    min-height: 100vh;
    border-radius: 0;
    overflow: visible; /* Natural scrolling */
  }
  
  .spec-detail-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .spec-detail-back-button {
    order: -1; /* Move back button to top */
    min-height: 44px;
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

Test the application at these common viewport widths:

- [ ] **320px width** - iPhone SE (1st gen), very small phones
  - Spec list should be collapsible
  - All content should fit without horizontal scroll
  - Touch targets should be at least 44px
  - Text should be readable without zooming

- [ ] **375px width** - iPhone 13/14, common phone size
  - Spec list toggle button should be visible
  - Detail pane should display full content
  - Buttons should be full-width
  - No layout overflow

- [ ] **768px width** - iPad Mini, small tablets
  - Should show dual-pane layout (desktop mode)
  - Spec list should be 320px fixed width
  - Detail pane should scroll independently
  - No toggle button visible

- [ ] **1024px+ width** - Desktop
  - Dual-pane layout fully visible
  - Optimal viewing experience
  - No mobile styles applied

### Touch Testing

Verify touch interactions on actual mobile devices:

- [ ] Spec list items are easy to tap (88px minimum height)
- [ ] Back button is easy to tap (44px minimum height, full-width area)
- [ ] Submit buttons are easy to tap (48px minimum height)
- [ ] Form inputs are easy to tap (44px minimum height)
- [ ] No accidental taps on adjacent elements
- [ ] Touch targets have adequate spacing

### Scrolling Testing

Test scrolling behavior across devices:

- [ ] **Mobile**: Spec list view scrolls naturally from top to bottom
- [ ] **Mobile**: Spec detail view scrolls naturally from top to bottom
- [ ] **Mobile**: No nested scrollbars (one scroll context per view)
- [ ] **Mobile**: Momentum scrolling works smoothly on iOS
- [ ] **Mobile**: Virtual keyboard doesn't hide inputs or buttons
- [ ] **Mobile**: Back button remains visible when scrolling
- [ ] **Desktop**: Dual panes scroll independently
- [ ] **Desktop**: No page-level scroll, only pane scrolling

### Accessibility Testing

Ensure mobile accessibility:

- [ ] Reduced motion preference disables animations
- [ ] Focus indicators are visible on all interactive elements
- [ ] Screen reader announces back button and view changes
- [ ] Screen reader announces selected spec
- [ ] Keyboard navigation works on mobile (with external keyboard)
- [ ] Touch targets meet WCAG 2.1 AA requirements (44×44px)
- [ ] Back button has clear aria-label

### Edge Cases

Test these scenarios:

- [ ] **Device Rotation**: Rotate from portrait to landscape and back
  - Selected spec should remain selected
  - Current view should be preserved
  - Layout should adapt without breaking
  
- [ ] **Navigation Flow**: Test complete navigation cycle
  - Spec list → select spec → spec detail → back button → spec list
  - Select different spec → spec detail → back button → spec list
  - No state loss during transitions
  
- [ ] **Very Long Specs**: Test with specs that have long titles and many questions
  - Text should wrap without breaking layout
  - Scroll should work smoothly
  - No horizontal overflow
  - Back button remains accessible
  
- [ ] **Virtual Keyboard**: Open keyboard in spec detail inputs
  - Back button should remain accessible
  - Submit button should remain accessible
  - Keyboard offset should be handled properly
  
- [ ] **Slow Network**: Simulate slow 3G connection
  - Skeleton states should display correctly
  - Layout should not jump when content loads
  - Mobile-appropriate sizes for loading states

### Browser Compatibility

Test on these mobile browsers:

- [ ] **iOS Safari** 14+
  - Momentum scrolling works
  - Safe area insets respected
  - No layout issues with notch
  
- [ ] **Chrome Mobile** (Android)
  - Scrolling is smooth
  - Touch interactions work
  - No performance issues
  
- [ ] **Firefox Mobile**
  - All features functional
  - Layout displays correctly
  
- [ ] **Samsung Internet**
  - Compatible with all features
  - No browser-specific bugs

### Performance Testing

Verify performance on mobile devices:

- [ ] **Animations**: Should be smooth 60fps or disabled with reduced motion
- [ ] **Scroll Performance**: No jank or lag when scrolling
- [ ] **Touch Response**: Immediate feedback on touch
- [ ] **Page Load**: Loads quickly on mobile networks
- [ ] **Memory**: No memory leaks with prolonged use

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

All mobile behavior is configurable via CSS custom properties in `src/styles/PlanDetailPage.css`:

### Layout Configuration

```css
:root {
  /* Dual-pane layout settings */
  --dual-pane-enabled: true;
  --dual-pane-breakpoint: 768px;  /* Switch point between mobile/desktop */
  --dual-pane-gap: var(--spacing-lg);
  --spec-list-width: 320px;       /* Desktop spec list width */
  --spec-list-min-width: 280px;
  --spec-list-max-width: 400px;
  --detail-pane-min-width: 400px;
  --dual-pane-min-height: 500px;
  --dual-pane-max-height: calc(100vh - 200px);
}
```

### Touch Target Configuration

```css
:root {
  /* Accordion on mobile (if used) */
  --accordion-header-min-height-mobile: 4.5rem;   /* 72px */
  --accordion-header-min-height-desktop: 3.75rem; /* 60px */
  
  /* Buttons minimum heights */
  --button-min-height-mobile: 48px;
  --button-min-height-desktop: 44px;
  
  /* Input minimum heights */
  --input-height: 44px;
}
```

### Sticky Elements Configuration

```css
:root {
  /* Sticky summary bar (if used) */
  --sticky-summary-position: bottom; /* top or bottom */
  --sticky-summary-height: 5rem;
  --sticky-summary-offset: 0px;
  --sticky-summary-z-index: var(--z-index-sticky);
  
  /* Keyboard offset for virtual keyboards */
  --keyboard-offset: 0px;  /* Update via JS when keyboard appears */
}
```

### Animation Configuration

```css
:root {
  /* Transition durations */
  --transition-duration-fast: 150ms;
  --transition-duration-base: 200ms;
  --transition-duration-slow: 300ms;
  
  /* Easing functions */
  --transition-timing-ease-in-out: ease-in-out;
  --transition-timing-ease-out: ease-out;
}
```

### Modifying Breakpoint

To change the mobile/desktop breakpoint:

1. Update the CSS variable:
```css
:root {
  --dual-pane-breakpoint: 900px;  /* New breakpoint */
}
```

2. Update the JavaScript detection in `SpecListPane.tsx`:
```tsx
const checkMobile = () => {
  setIsMobile(window.innerWidth < 900);  /* Match CSS breakpoint */
};
```

3. Update the PlanDetailPage responsive logic:
```tsx
setIsDesktop(window.innerWidth >= 900);  /* Match CSS breakpoint */
```

### Virtual Keyboard Handling

To handle virtual keyboards on mobile:

```javascript
// Add to your app initialization
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    document.documentElement.style.setProperty(
      '--keyboard-offset',
      `${Math.max(0, keyboardHeight)}px`
    );
  });
}
```

This updates the `--keyboard-offset` CSS variable to adjust sticky element positioning when the virtual keyboard appears.

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
