/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Input specification with questions to be clarified.
 *
 * Attributes:
 * purpose: The purpose of the specification
 * vision: The vision statement
 * must: List of must-have requirements
 * dont: List of don't requirements (things to avoid)
 * nice: List of nice-to-have features
 * open_questions: List of questions needing clarification
 * assumptions: List of assumptions made
 */
export type SpecInput = {
    /**
     * The purpose of the specification
     */
    purpose: string;
    /**
     * The vision statement
     */
    vision: string;
    /**
     * List of must-have requirements
     */
    must?: Array<string>;
    /**
     * List of don't requirements
     */
    dont?: Array<string>;
    /**
     * List of nice-to-have features
     */
    nice?: Array<string>;
    /**
     * List of questions needing clarification
     */
    open_questions?: Array<string>;
    /**
     * List of assumptions made
     */
    assumptions?: Array<string>;
};

