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

