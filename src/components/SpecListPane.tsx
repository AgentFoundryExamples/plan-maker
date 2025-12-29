import React from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';

// Shared breakpoint constant - must match CSS --dual-pane-breakpoint
const MOBILE_BREAKPOINT = 768;

export interface SpecListPaneProps {
  specs: SpecItem[];
  selectedIndex: number | null;
  onSelectSpec: (index: number) => void;
  getUnansweredCount?: (spec: SpecItem, index: number) => number;
}

/**
 * SpecListPane Component
 * 
 * Displays a list of specifications in the dual-pane layout.
 * On mobile: Collapsible drawer at top of page
 * On desktop: Fixed left pane with scrollable list
 * 
 * Features:
 * - Clickable spec items with selection state
 * - Visual indicators for unanswered questions
 * - Keyboard navigation support
 * - Sticky header
 * - Mobile: Collapsible toggle to hide/show spec list
 */
export const SpecListPane: React.FC<SpecListPaneProps> = ({
  specs,
  selectedIndex,
  onSelectSpec,
  getUnansweredCount,
}) => {
  // State for mobile collapse
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  // Use refs for focus management instead of DOM queries
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Detect if we're on mobile (< 768px)
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    
    // Debounced resize handler to avoid excessive re-renders
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  // Ensure refs array matches specs length
  React.useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, specs.length);
  }, [specs.length]);

  // Auto-collapse on mobile when a spec is selected
  React.useEffect(() => {
    if (isMobile && selectedIndex !== null) {
      setIsCollapsed(true);
    }
  }, [selectedIndex, isMobile]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectSpec(index);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1 < specs.length ? index + 1 : index;
      if (index !== nextIndex) {
        onSelectSpec(nextIndex);
        // Focus next item using ref
        itemRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1 >= 0 ? index - 1 : index;
      if (index !== prevIndex) {
        onSelectSpec(prevIndex);
        // Focus previous item using ref
        itemRefs.current[prevIndex]?.focus();
      }
    }
  };

  return (
    <div className={`spec-list-pane ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="spec-list-header">
        <h3>Specifications ({specs.length})</h3>
        <button
          className="spec-list-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Show specifications list' : 'Hide specifications list'}
          aria-expanded={!isCollapsed}
          type="button"
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      <div className="spec-list-items" role="list" aria-hidden={isCollapsed}>
        {specs.map((spec, index) => {
          const isSelected = selectedIndex === index;
          const questions = spec.open_questions || [];
          const hasQuestions = questions.length > 0;
          const unansweredCount = getUnansweredCount ? getUnansweredCount(spec, index) : 0;
          const isComplete = !hasQuestions || unansweredCount === 0;

          return (
            <div
              key={index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              id={`spec-list-item-${index}`}
              className={`spec-list-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectSpec(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="listitem"
              tabIndex={0}
              aria-current={isSelected ? 'true' : undefined}
              aria-label={`Spec ${index + 1}: ${spec.purpose}. ${
                !hasQuestions
                  ? 'No questions.'
                  : isComplete
                  ? 'All questions answered.'
                  : `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} remaining.`
              }`}
            >
              <span className="spec-list-item-number">Spec #{index + 1}</span>
              <p className="spec-list-item-title">{spec.purpose}</p>
              <span
                className={`spec-list-item-badge ${isComplete ? 'complete' : 'pending'}`}
                aria-hidden="true"
              >
                {!hasQuestions
                  ? '✓ No questions'
                  : isComplete
                  ? '✓ Complete'
                  : `⚠ ${unansweredCount} left`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpecListPane;
