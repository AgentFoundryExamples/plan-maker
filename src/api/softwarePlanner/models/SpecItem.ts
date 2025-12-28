/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Individual specification item in the plan response.
 *
 * This model represents an immutable contract for specification structure.
 * Field names and types should not be modified.
 *
 * Attributes:
 * purpose: High-level purpose of this specification.
 * vision: Vision or goal statement.
 * must: List of must-have requirements.
 * dont: List of things to avoid.
 * nice: List of nice-to-have features.
 * open_questions: List of open questions for this spec.
 * assumptioins: list of assumptions made in the spec.
 */
export type SpecItem = {
    /**
     * High-level purpose of this specification
     */
    purpose: string;
    /**
     * Vision or goal statement
     */
    vision: string;
    /**
     * Must-have requirements
     */
    must?: Array<string>;
    /**
     * Things to avoid
     */
    dont?: Array<string>;
    /**
     * Nice-to-have features
     */
    nice?: Array<string>;
    /**
     * Any clarification that is needed for this specific spec.
     */
    open_questions?: Array<string>;
    /**
     * Any assumptions made in the plan
     */
    assumptions?: Array<string>;
};

