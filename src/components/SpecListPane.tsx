import React from 'react';
import type { SpecItem } from '@/api/softwarePlanner/models/SpecItem';

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
 * On mobile: Full-screen view showing spec list
 * On desktop: Fixed left pane with scrollable list
 * 
 * Features:
 * - Clickable spec items with selection state
 * - Visual indicators for unanswered questions
 * - Keyboard navigation support
 * - Sticky header
 */
export const SpecListPane: React.FC<SpecListPaneProps> = ({
  specs,
  selectedIndex,
  onSelectSpec,
  getUnansweredCount,
}) => {
  // Use refs for focus management instead of DOM queries
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    <div className="spec-list-pane">
      <div className="spec-list-header">
        <h3>Specifications ({specs.length})</h3>
      </div>
      <div className="spec-list-items" role="list">
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
