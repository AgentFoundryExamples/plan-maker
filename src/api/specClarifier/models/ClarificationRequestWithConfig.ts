/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClarificationConfig } from './ClarificationConfig';
import type { PlanInput } from './PlanInput';
import type { QuestionAnswer } from './QuestionAnswer';
/**
 * Request to clarify specifications with optional answers and config.
 *
 * This schema extends the basic ClarificationRequest by allowing clients to
 * optionally supply a ClarificationConfig that overrides process defaults.
 * The config is validated and merged with defaults before job processing.
 *
 * Attributes:
 * plan: The plan input with specifications
 * answers: List of answers to open questions (optional, currently ignored)
 * config: Optional ClarificationConfig to override defaults for this request
 */
export type ClarificationRequestWithConfig = {
    /**
     * The plan input with specifications
     */
    plan: PlanInput;
    /**
     * List of answers to open questions
     */
    answers?: Array<QuestionAnswer>;
    /**
     * Optional config to override defaults
     */
    config?: (ClarificationConfig | null);
};

