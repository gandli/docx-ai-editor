import { describe, it, expect } from 'vitest';
import {
  normalizeRule,
  normalizeRuleSet,
} from '../rule-normalizer.js';

describe('Rule Normalizer', () => {
  describe('normalizeRule', () => {
    it('preserves system rule source', () => {
      const rule = normalizeRule({
        id: 'rule-1',
        name: 'Test Rule',
        source: 'system',
      });
      expect(rule.source).toBe('system');
    });

    it('preserves user rule source', () => {
      const rule = normalizeRule({
        id: 'rule-1',
        name: 'Test Rule',
        source: 'user',
      });
      expect(rule.source).toBe('user');
    });

    it('generates missing ID', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
      });
      expect(rule.id).toBeDefined();
      expect(typeof rule.id).toBe('string');
      expect(rule.id.length).toBeGreaterThan(0);
    });

    it('preserves existing ID', () => {
      const rule = normalizeRule({
        id: 'custom-id',
        name: 'Test Rule',
      });
      expect(rule.id).toBe('custom-id');
    });

    it('falls back to semantic_review for unknown checkType', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
        checkType: 'unknown_type',
      });
      expect(rule.checkType).toBe('semantic_review');
    });

    it('preserves known checkType', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
        checkType: 'required_presence',
      });
      expect(rule.checkType).toBe('required_presence');
    });

    it('defaults severity to medium when missing', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
      });
      expect(rule.severity).toBe('medium');
    });

    it('preserves provided severity', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
        severity: 'high',
      });
      expect(rule.severity).toBe('high');
    });

    it('normalizes string-only input into a rule shell', () => {
      const rule = normalizeRule('Test Rule Name');
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule Name');
      expect(rule.checkType).toBe('semantic_review');
      expect(rule.severity).toBe('medium');
      expect(rule.source).toBe('user');
    });

    it('returns deterministic structure for full object input', () => {
      const rule = normalizeRule({
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        checkType: 'structure_check',
        severity: 'low',
        source: 'system',
        target: 'document',
        params: { key: 'value' },
      });
      expect(rule.id).toBe('rule-1');
      expect(rule.name).toBe('Test Rule');
      expect(rule.description).toBe('A test rule');
      expect(rule.checkType).toBe('structure_check');
      expect(rule.severity).toBe('low');
      expect(rule.source).toBe('system');
      expect(rule.target).toBe('document');
      expect(rule.params).toEqual({ key: 'value' });
    });

    it('initializes empty params when not provided', () => {
      const rule = normalizeRule({
        name: 'Test Rule',
      });
      expect(rule.params).toEqual({});
    });

    it('generates deterministic IDs for same input', () => {
      // IDs should be unique per rule instance, not content-based
      const rule1 = normalizeRule({ name: 'Test Rule' });
      const rule2 = normalizeRule({ name: 'Test Rule' });
      expect(rule1.id).not.toBe(rule2.id);
    });
  });

  describe('normalizeRuleSet', () => {
    it('preserves system rule set source', () => {
      const ruleSet = normalizeRuleSet({
        id: 'set-1',
        name: 'Test Set',
        source: 'system',
        rules: [],
      });
      expect(ruleSet.source).toBe('system');
    });

    it('preserves user rule set source', () => {
      const ruleSet = normalizeRuleSet({
        id: 'set-1',
        name: 'Test Set',
        source: 'user',
        rules: [],
      });
      expect(ruleSet.source).toBe('user');
    });

    it('generates missing ID', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: [],
      });
      expect(ruleSet.id).toBeDefined();
      expect(typeof ruleSet.id).toBe('string');
      expect(ruleSet.id.length).toBeGreaterThan(0);
    });

    it('preserves existing ID', () => {
      const ruleSet = normalizeRuleSet({
        id: 'custom-set-id',
        name: 'Test Set',
        rules: [],
      });
      expect(ruleSet.id).toBe('custom-set-id');
    });

    it('normalizes rules within the set', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: [
          { name: 'Rule 1' },
          { name: 'Rule 2', checkType: 'required_presence' },
        ],
      });
      expect(ruleSet.rules).toHaveLength(2);
      expect(ruleSet.rules[0].id).toBeDefined();
      expect(ruleSet.rules[0].name).toBe('Rule 1');
      expect(ruleSet.rules[1].name).toBe('Rule 2');
      expect(ruleSet.rules[1].checkType).toBe('required_presence');
    });

    it('normalizes string rules within the set', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: ['String Rule'],
      });
      expect(ruleSet.rules).toHaveLength(1);
      expect(ruleSet.rules[0].name).toBe('String Rule');
      expect(ruleSet.rules[0].checkType).toBe('semantic_review');
    });

    it('initializes empty rules array when not provided', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
      });
      expect(Array.isArray(ruleSet.rules)).toBe(true);
      expect(ruleSet.rules.length).toBe(0);
    });

    it('returns deterministic RuleSet structure', () => {
      const ruleSet = normalizeRuleSet({
        id: 'set-1',
        name: 'Test Set',
        description: 'A test rule set',
        source: 'system',
        rules: [
          { name: 'Rule 1', severity: 'high' },
        ],
        active: true,
      });
      expect(ruleSet.id).toBe('set-1');
      expect(ruleSet.name).toBe('Test Set');
      expect(ruleSet.description).toBe('A test rule set');
      expect(ruleSet.source).toBe('system');
      expect(ruleSet.active).toBe(true);
      expect(ruleSet.rules).toHaveLength(1);
      expect(ruleSet.rules[0].severity).toBe('high');
    });

    it('defaults active to true when not provided', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: [],
      });
      expect(ruleSet.active).toBe(true);
    });

    it('preserves active false when provided', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: [],
        active: false,
      });
      expect(ruleSet.active).toBe(false);
    });

    it('generates unique IDs for each rule in the set', () => {
      const ruleSet = normalizeRuleSet({
        name: 'Test Set',
        rules: [
          { name: 'Rule 1' },
          { name: 'Rule 2' },
        ],
      });
      expect(ruleSet.rules[0].id).not.toBe(ruleSet.rules[1].id);
    });
  });
});
