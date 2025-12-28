/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request model for the /plan endpoint.
 *
 * Attributes:
 * description: Project description string with validation for non-empty content
 * and maximum length constraint.
 * model: Optional logical model name to use for this request. Must be enabled in
 * the model registry. If omitted, uses the configured default model.
 * system_prompt: Optional custom system prompt to override the default. Must not
 * exceed max_system_prompt_bytes (32768 bytes). If omitted, uses the
 * configured default system prompt.
 */
export type PlanRequest = {
    /**
     * Non-empty project description (max 8192 bytes)
     */
    description: string;
    /**
     * Optional logical model name (e.g., 'gpt-4-turbo', 'claude-opus'). Must match an enabled model in the registry. Defaults to configured default model.
     */
    model?: (string | null);
    /**
     * Optional custom system prompt to override the default (max 32768 bytes). Used to customize the planning behavior for this request only.
     */
    system_prompt?: (string | null);
};

