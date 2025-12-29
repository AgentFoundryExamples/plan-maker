/**
 * Mobile Optimization CSS Configuration Tests
 * 
 * This test verifies that all required CSS custom properties for mobile optimization
 * are properly defined in the theme.css file.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read CSS files once at module level for better performance
const themeCss = readFileSync(
  resolve(__dirname, '../styles/theme.css'),
  'utf-8'
);

const planDetailCss = readFileSync(
  resolve(__dirname, '../styles/PlanDetailPage.css'),
  'utf-8'
);

const plannerInputCss = readFileSync(
  resolve(__dirname, '../styles/PlannerInputPage.css'),
  'utf-8'
);

const plansListCss = readFileSync(
  resolve(__dirname, '../styles/PlansListPage.css'),
  'utf-8'
);

const globalCss = readFileSync(
  resolve(__dirname, '../styles/global.css'),
  'utf-8'
);

describe('Mobile Optimization CSS Configuration', () => {

  describe('Safe Area Insets', () => {
    it('should define safe area inset custom properties', () => {
      expect(themeCss).toContain('--safe-area-inset-top');
      expect(themeCss).toContain('--safe-area-inset-right');
      expect(themeCss).toContain('--safe-area-inset-bottom');
      expect(themeCss).toContain('--safe-area-inset-left');
    });

    it('should use env() function for safe area values', () => {
      expect(themeCss).toMatch(/env\(safe-area-inset-top/);
      expect(themeCss).toMatch(/env\(safe-area-inset-bottom/);
    });
  });

  describe('Touch Target Sizing', () => {
    it('should define mobile header minimum height', () => {
      expect(themeCss).toContain('--accordion-header-min-height-mobile');
      expect(themeCss).toMatch(/--accordion-header-min-height-mobile:\s*4\.5rem/);
    });

    it('should define desktop header minimum height', () => {
      expect(themeCss).toContain('--accordion-header-min-height-desktop');
      expect(themeCss).toMatch(/--accordion-header-min-height-desktop:\s*3\.75rem/);
    });
  });

  describe('Animation Durations', () => {
    it('should define fast animation duration under 200ms', () => {
      expect(themeCss).toMatch(/--transition-duration-fast:\s*150ms/);
    });

    it('should define base animation duration under 200ms', () => {
      expect(themeCss).toMatch(/--transition-duration-base:\s*200ms/);
    });

    it('should define slow animation duration', () => {
      expect(themeCss).toContain('--transition-duration-slow');
    });
  });

  describe('Spacing Tokens', () => {
    it('should define mobile-first spacing scale', () => {
      expect(themeCss).toContain('--spacing-xs');
      expect(themeCss).toContain('--spacing-sm');
      expect(themeCss).toContain('--spacing-md');
      expect(themeCss).toContain('--spacing-lg');
      expect(themeCss).toContain('--spacing-xl');
    });

    it('should define at least 16px base spacing', () => {
      // --spacing-md should be at least 1rem (16px)
      expect(themeCss).toMatch(/--spacing-md:\s*1rem/);
    });
  });

  describe('Z-Index Layering', () => {
    it('should define sticky z-index for mobile elements', () => {
      expect(themeCss).toContain('--z-index-sticky');
    });
  });
});

describe('Reduced Motion Support', () => {
  it('should include prefers-reduced-motion media query', () => {
    expect(themeCss).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('should disable animations in reduced motion mode', () => {
    expect(themeCss).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(themeCss).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });
});

describe('Page-specific Mobile Optimizations', () => {
  describe('PlanDetailPage', () => {
    it('should have momentum scrolling for accordion list', () => {
      expect(planDetailCss).toContain('-webkit-overflow-scrolling: touch');
    });

    it('should define keyboard offset for sticky bar', () => {
      expect(planDetailCss).toContain('--keyboard-offset');
    });

    it('should have safe area padding for sticky bar', () => {
      expect(planDetailCss).toMatch(/safe-area-inset-bottom/);
    });

    it('should have minimum textarea height on mobile', () => {
      expect(planDetailCss).toMatch(/min-height:\s*6rem/);
    });
  });

  describe('PlannerInputPage', () => {
    it('should have 44px minimum touch targets', () => {
      expect(plannerInputCss).toMatch(/min-height:\s*44px/);
    });

    it('should have safe area padding for inputs on mobile', () => {
      expect(plannerInputCss).toMatch(/safe-area-inset/);
    });

    it('should disable spinner animation in reduced motion', () => {
      expect(plannerInputCss).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('PlansListPage', () => {
    it('should have 88px minimum card height', () => {
      expect(plansListCss).toMatch(/min-height:\s*88px/);
    });

    it('should have 320px breakpoint optimization', () => {
      expect(plansListCss).toContain('@media (max-width: 320px)');
    });

    it('should prevent horizontal scroll', () => {
      expect(plansListCss).toContain('overflow-x: hidden');
    });

    it('should disable transitions in reduced motion', () => {
      expect(plansListCss).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('Global Styles', () => {
    it('should have momentum scrolling for body', () => {
      expect(globalCss).toContain('-webkit-overflow-scrolling: touch');
    });

    it('should have safe area padding for container', () => {
      expect(globalCss).toMatch(/safe-area-inset/);
    });

    it('should reduce font size at 320px breakpoint', () => {
      expect(globalCss).toContain('@media (max-width: 320px)');
      expect(globalCss).toMatch(/font-size:\s*14px/);
    });
  });
});

describe('Mobile Breakpoints', () => {
  const files = [
    { name: 'PlanDetailPage', css: planDetailCss },
    { name: 'PlannerInputPage', css: plannerInputCss },
    { name: 'PlansListPage', css: plansListCss },
    { name: 'global', css: globalCss },
  ];

  files.forEach(({ name, css }) => {
    describe(name, () => {
      it('should have mobile breakpoint (max-width: 767px)', () => {
        expect(css).toContain('@media (max-width: 767px)');
      });

      if (name !== 'global') {
        it('should have very small screen breakpoint (max-width: 320px)', () => {
          expect(css).toContain('@media (max-width: 320px)');
        });
      }
    });
  });
});

describe('Animation Performance', () => {
  it('should define slideDown animation under 200ms', () => {
    const match = planDetailCss.match(/animation:\s*slideDown\s+var\(--transition-duration-base\)/);
    expect(match).toBeTruthy();
  });

  it('should define slideIn animation under 300ms', () => {
    const match = planDetailCss.match(/animation:\s*slideIn\s+var\(--transition-duration-slow\)/);
    expect(match).toBeTruthy();
  });

  it('should define fadeInUp animation under 200ms', () => {
    const match = planDetailCss.match(/animation:\s*fadeInUp\s+var\(--transition-duration-base\)/);
    expect(match).toBeTruthy();
  });
});
