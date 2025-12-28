/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClarificationConfig } from './ClarificationConfig';
/**
 * Response model for GET /v1/config/defaults.
 *
 * Contains the current default configuration and allowed models
 * for all providers.
 */
export type DefaultsResponse = {
    /**
     * Current default ClarificationConfig used when no config is provided
     */
    default_config: ClarificationConfig;
    /**
     * Dictionary mapping provider names to lists of allowed model names
     */
    allowed_models: Record<string, Array<string>>;
};

