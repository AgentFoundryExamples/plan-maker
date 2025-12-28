/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlanInput } from './PlanInput';
import type { QuestionAnswer } from './QuestionAnswer';
/**
 * Request to clarify specifications with optional answers.
 *
 * Attributes:
 * plan: The plan input with specifications
 * answers: List of answers to open questions (optional, currently ignored)
 */
export type ClarificationRequest = {
    /**
     * The plan input with specifications
     */
    plan: PlanInput;
    /**
     * List of answers to open questions
     */
    answers?: Array<QuestionAnswer>;
};

