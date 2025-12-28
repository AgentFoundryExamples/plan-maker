// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
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
