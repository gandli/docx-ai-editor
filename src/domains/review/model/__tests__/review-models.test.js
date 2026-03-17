import { describe, it, expect } from 'vitest';
import {
  createFinding,
  createSuggestion,
  createReviewTask,
  createReviewReport,
} from '../review-models.js';

describe('Review Domain Models', () => {
  describe('createFinding', () => {
    it('returns normalized finding with default severity', () => {
      const finding = createFinding({ title: 'Test finding', description: 'Test description' });
      expect(finding.severity).toBe('medium');
    });

    it('returns normalized finding with default status', () => {
      const finding = createFinding({ title: 'Test finding', description: 'Test description' });
      expect(finding.status).toBe('open');
    });

    it('returns normalized finding with default sourceType', () => {
      const finding = createFinding({ title: 'Test finding', description: 'Test description' });
      expect(finding.sourceType).toBe('hybrid');
    });

    it('returns normalized finding with default confidence', () => {
      const finding = createFinding({ title: 'Test finding', description: 'Test description' });
      expect(finding.confidence).toBe(0.5);
    });

    it('initializes empty arrays safely', () => {
      const finding = createFinding({ title: 'Test finding', description: 'Test description' });
      expect(Array.isArray(finding.evidence)).toBe(true);
      expect(finding.evidence.length).toBe(0);
      expect(Array.isArray(finding.tags)).toBe(true);
      expect(finding.tags.length).toBe(0);
    });

    it('accepts overrides for all fields', () => {
      const finding = createFinding({
        title: 'Custom finding',
        description: 'Custom description',
        severity: 'high',
        status: 'resolved',
        sourceType: 'system_rule',
        confidence: 0.9,
        evidence: ['evidence1'],
        tags: ['tag1'],
        location: { segmentId: 'seg-1' },
      });
      expect(finding.severity).toBe('high');
      expect(finding.status).toBe('resolved');
      expect(finding.sourceType).toBe('system_rule');
      expect(finding.confidence).toBe(0.9);
      expect(finding.evidence).toEqual(['evidence1']);
      expect(finding.tags).toEqual(['tag1']);
      expect(finding.location).toEqual({ segmentId: 'seg-1' });
    });
  });

  describe('createSuggestion', () => {
    it('returns normalized suggestion with default status', () => {
      const suggestion = createSuggestion({ text: 'Suggested text' });
      expect(suggestion.status).toBe('open');
    });

    it('initializes empty arrays safely', () => {
      const suggestion = createSuggestion({ text: 'Suggested text' });
      expect(Array.isArray(suggestion.appliedChanges)).toBe(true);
      expect(suggestion.appliedChanges.length).toBe(0);
    });

    it('accepts overrides for all fields', () => {
      const suggestion = createSuggestion({
        text: 'Custom suggestion',
        status: 'accepted',
        appliedChanges: ['change1'],
        rationale: 'Because reasons',
      });
      expect(suggestion.status).toBe('accepted');
      expect(suggestion.appliedChanges).toEqual(['change1']);
      expect(suggestion.rationale).toBe('Because reasons');
    });
  });

  describe('createReviewTask', () => {
    it('returns normalized task with default status', () => {
      const task = createReviewTask({ title: 'Review task' });
      expect(task.status).toBe('open');
    });

    it('returns normalized task with default sourceType', () => {
      const task = createReviewTask({ title: 'Review task' });
      expect(task.sourceType).toBe('hybrid');
    });

    it('initializes empty arrays safely', () => {
      const task = createReviewTask({ title: 'Review task' });
      expect(Array.isArray(task.findings)).toBe(true);
      expect(task.findings.length).toBe(0);
      expect(Array.isArray(task.suggestions)).toBe(true);
      expect(task.suggestions.length).toBe(0);
    });

    it('accepts overrides for all fields', () => {
      const task = createReviewTask({
        title: 'Custom task',
        status: 'in_progress',
        sourceType: 'ai_review',
        findings: [createFinding({ title: 'f1', description: 'd1' })],
        suggestions: [createSuggestion({ text: 's1' })],
        assignedTo: 'reviewer-1',
      });
      expect(task.status).toBe('in_progress');
      expect(task.sourceType).toBe('ai_review');
      expect(task.findings.length).toBe(1);
      expect(task.suggestions.length).toBe(1);
      expect(task.assignedTo).toBe('reviewer-1');
    });
  });

  describe('createReviewReport', () => {
    it('returns normalized report with default status', () => {
      const report = createReviewReport({ documentId: 'doc-1' });
      expect(report.status).toBe('open');
    });

    it('initializes empty arrays safely', () => {
      const report = createReviewReport({ documentId: 'doc-1' });
      expect(Array.isArray(report.findings)).toBe(true);
      expect(report.findings.length).toBe(0);
      expect(Array.isArray(report.summary)).toBe(true);
      expect(report.summary.length).toBe(0);
      expect(Array.isArray(report.ruleSets)).toBe(true);
      expect(report.ruleSets.length).toBe(0);
    });

    it('accepts overrides for all fields', () => {
      const report = createReviewReport({
        documentId: 'doc-1',
        status: 'completed',
        findings: [createFinding({ title: 'f1', description: 'd1' })],
        summary: ['Summary point 1'],
        ruleSets: [{ id: 'rule-1', name: 'Rule Set 1' }],
        generatedAt: '2026-03-18T00:00:00Z',
      });
      expect(report.status).toBe('completed');
      expect(report.findings.length).toBe(1);
      expect(report.summary).toEqual(['Summary point 1']);
      expect(report.ruleSets.length).toBe(1);
      expect(report.generatedAt).toBe('2026-03-18T00:00:00Z');
    });
  });
});
