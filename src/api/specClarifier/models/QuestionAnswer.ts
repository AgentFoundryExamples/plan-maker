/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Answer to a specific question in a specification.
 *
 * Attributes:
 * spec_index: Index of the specification containing the question
 * question_index: Index of the question within the specification
 * question: The question text
 * answer: The answer provided
 */
export type QuestionAnswer = {
    /**
     * Index of the specification containing the question
     */
    spec_index: number;
    /**
     * Index of the question within the specification
     */
    question_index: number;
    /**
     * The question text
     */
    question: string;
    /**
     * The answer provided
     */
    answer: string;
};

