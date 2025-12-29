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
 * Displays a list of specifications in the left pane of the dual-pane layout.
 * Each spec shows its title, number, and question status badge.
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
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectSpec(index);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1 < specs.length ? index + 1 : index;
      onSelectSpec(nextIndex);
      // Focus next item
      const nextElement = document.getElementById(`spec-list-item-${nextIndex}`);
      nextElement?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1 >= 0 ? index - 1 : index;
      onSelectSpec(prevIndex);
      // Focus previous item
      const prevElement = document.getElementById(`spec-list-item-${prevIndex}`);
      prevElement?.focus();
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
