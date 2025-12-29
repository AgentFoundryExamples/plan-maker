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

import { describe, it, expect } from 'vitest';
import { validateUUID, validateLimit } from './validators';

describe('Validators', () => {
  describe('validateUUID', () => {
    it('accepts valid UUIDs', () => {
      expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
      expect(() => validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).not.toThrow();
      expect(() => validateUUID('f81d4fae-7dec-11d0-a765-00a0c91e6bf6')).not.toThrow();
    });

    it('accepts UUIDs with uppercase letters', () => {
      expect(() => validateUUID('550E8400-E29B-41D4-A716-446655440000')).not.toThrow();
      expect(() => validateUUID('F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6')).not.toThrow();
    });

    it('accepts UUIDs with mixed case', () => {
      expect(() => validateUUID('550e8400-E29B-41d4-A716-446655440000')).not.toThrow();
    });

    it('rejects invalid UUID formats', () => {
      expect(() => validateUUID('invalid-uuid')).toThrow(/Invalid UUID format/);
      expect(() => validateUUID('not-a-uuid-at-all')).toThrow(/Invalid UUID format/);
      expect(() => validateUUID('12345')).toThrow(/Invalid UUID format/);
    });

    it('rejects empty string', () => {
      expect(() => validateUUID('')).toThrow(/Invalid UUID format/);
    });

    it('rejects UUID without hyphens', () => {
      expect(() => validateUUID('550e8400e29b41d4a716446655440000')).toThrow(/Invalid UUID format/);
    });

    it('rejects UUID with wrong number of sections', () => {
      expect(() => validateUUID('550e8400-e29b-41d4-446655440000')).toThrow(/Invalid UUID format/);
      expect(() => validateUUID('550e8400-e29b-41d4-a716-4466-55440000')).toThrow(/Invalid UUID format/);
    });

    it('rejects UUID with invalid characters', () => {
      expect(() => validateUUID('550e8400-e29b-41g4-a716-446655440000')).toThrow(/Invalid UUID format/);
      expect(() => validateUUID('550e8400-e29b-41d4-a716-44665544000z')).toThrow(/Invalid UUID format/);
    });
  });

  describe('validateLimit', () => {
    it('accepts valid limits within range', () => {
      expect(() => validateLimit(1)).not.toThrow();
      expect(() => validateLimit(100)).not.toThrow();
      expect(() => validateLimit(500)).not.toThrow();
      expect(() => validateLimit(1000)).not.toThrow();
    });

    it('rejects limit of 0', () => {
      expect(() => validateLimit(0)).toThrow(/Invalid limit: 0/);
    });

    it('rejects negative limits', () => {
      expect(() => validateLimit(-1)).toThrow(/Invalid limit: -1/);
      expect(() => validateLimit(-100)).toThrow(/Invalid limit: -100/);
    });

    it('rejects limit greater than 1000', () => {
      expect(() => validateLimit(1001)).toThrow(/Invalid limit: 1001/);
      expect(() => validateLimit(5000)).toThrow(/Invalid limit: 5000/);
    });

    it('rejects NaN', () => {
      expect(() => validateLimit(NaN)).toThrow(/Invalid limit: NaN/);
    });

    it('rejects Infinity', () => {
      expect(() => validateLimit(Infinity)).toThrow(/Invalid limit: Infinity/);
      expect(() => validateLimit(-Infinity)).toThrow(/Invalid limit: -Infinity/);
    });

    it('provides actionable error message', () => {
      try {
        validateLimit(2000);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('must be between 1 and 1000');
      }
    });
  });
});
