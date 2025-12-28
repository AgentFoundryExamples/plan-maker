/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SpecItem } from './SpecItem';
/**
 * Response model for the /plan endpoint.
 *
 * This is an immutable contract - field names and types must not change.
 *
 * Attributes:
 * specs: List of specification items.
 */
export type PlanResponse = {
    /**
     * List of specification items (at least one required)
     */
    specs: Array<SpecItem>;
};

