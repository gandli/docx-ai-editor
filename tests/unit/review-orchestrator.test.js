/**
 * Unit Tests: Review Orchestrator Integration
 * 
 * Tests the review orchestrator with procurement documents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReviewSession } from '../../src/domains/review/services/review-orchestrator.js';
import { createFinding } from '../../src/domains/review/model/review-models.js';
import { FIXTURES, loadFixtureFile } from '../fixtures/procurement-docs/index.js';

// Mock dependencies
vi.mock('../../src/domains/review/services/rule-engine.js', () => ({
  runRuleChecks: vi.fn()
}));

vi.mock('../../src/domains/review/services/ai-review-schema.js', () => ({
  normalizeAIReviewResult: vi.fn((result) => result)
}));

vi.mock('../../src/domains/review/services/finding-merger.js', () => ({
  mergeFindings: vi.fn((ruleFindings, aiFindings) => [...ruleFindings, ...aiFindings])
}));

import { runRuleChecks } from '../../src/domains/review/services/rule-engine.js';
import { normalizeAIReviewResult } from '../../src/domains/review/services/ai-review-schema.js';
import { mergeFindings } from '../../src/domains/review/services/finding-merger.js';

describe('Unit: Review Orchestrator Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Procurement Document Review', () => {
    it('should process valid procurement document with no findings', async () => {
      const mockDocument = {
        id: 'doc-1',
        name: FIXTURES.validProcurement.filename,
        content: 'valid procurement content',
        segments: []
      };
      const mockRules = [
        { id: 'budget_required', checkType: 'required_presence', field: 'budget' },
        { id: 'contact_required', checkType: 'required_presence', field: 'contact' }
      ];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      // Mock rule engine to return no findings for valid doc
      runRuleChecks.mockReturnValue([]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(result.summary.ruleFindings).toBe(0);
      expect(result.summary.aiFindings).toBe(0);
      expect(runRuleChecks).toHaveBeenCalledWith(mockDocument, mockRules);
    });

    it('should detect missing budget finding', async () => {
      const mockDocument = {
        id: 'doc-2',
        name: FIXTURES.missingBudget.filename,
        content: 'procurement content without budget',
        segments: []
      };
      const mockRules = [
        { id: 'budget_required', checkType: 'required_presence', field: 'budget' }
      ];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      // Mock rule engine to return budget finding
      const budgetFinding = createFinding({
        title: 'Missing Budget Information',
        description: 'The procurement document is missing required budget information',
        severity: 'high',
        category: 'budget',
        sourceType: 'system_rule'
      });
      runRuleChecks.mockReturnValue([budgetFinding]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].title).toBe('Missing Budget Information');
      expect(result.findings[0].severity).toBe('high');
      expect(result.summary.totalFindings).toBe(1);
      expect(result.summary.ruleFindings).toBe(1);
    });

    it('should detect invalid contact information', async () => {
      const mockDocument = {
        id: 'doc-3',
        name: FIXTURES.invalidContact.filename,
        content: 'procurement with invalid contact',
        segments: []
      };
      const mockRules = [
        { id: 'contact_valid', checkType: 'pattern_match', field: 'contact' }
      ];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      // Mock rule engine to return contact findings
      const phoneFinding = createFinding({
        title: 'Invalid Phone Number',
        description: 'The contact phone number format is invalid',
        severity: 'medium',
        category: 'contact',
        sourceType: 'system_rule'
      });
      const emailFinding = createFinding({
        title: 'Invalid Email Address',
        description: 'The contact email format is invalid',
        severity: 'medium',
        category: 'contact',
        sourceType: 'system_rule'
      });
      runRuleChecks.mockReturnValue([phoneFinding, emailFinding]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(result.findings).toHaveLength(2);
      expect(result.summary.totalFindings).toBe(2);
      expect(result.summary.ruleFindings).toBe(2);
    });

    it('should detect incomplete timeline', async () => {
      const mockDocument = {
        id: 'doc-4',
        name: FIXTURES.incompleteTimeline.filename,
        content: 'procurement with incomplete timeline',
        segments: []
      };
      const mockRules = [
        { id: 'timeline_complete', checkType: 'required_presence', field: 'timeline' }
      ];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      // Mock rule engine to return timeline finding
      const timelineFinding = createFinding({
        title: 'Incomplete Project Timeline',
        description: 'The project timeline has dates marked as TBD',
        severity: 'high',
        category: 'timeline',
        sourceType: 'system_rule'
      });
      runRuleChecks.mockReturnValue([timelineFinding]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].category).toBe('timeline');
      expect(result.findings[0].severity).toBe('high');
    });
  });

  describe('AI Reviewer Integration', () => {
    it('should combine rule and AI findings', async () => {
      const mockDocument = {
        id: 'doc-5',
        name: 'test.docx',
        content: 'test content',
        segments: []
      };
      const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
      const mockAIReviewer = vi.fn().mockResolvedValue({
        findings: [
          { title: 'AI Finding 1', description: 'AI detected issue', severity: 'low' }
        ]
      });

      const ruleFinding = createFinding({
        title: 'Rule Finding',
        description: 'Rule detected issue',
        severity: 'medium',
        sourceType: 'system_rule'
      });

      runRuleChecks.mockReturnValue([ruleFinding]);
      mergeFindings.mockReturnValue([ruleFinding, { 
        title: 'AI Finding 1', 
        description: 'AI detected issue', 
        severity: 'low',
        sourceType: 'ai_review'
      }]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(mockAIReviewer).toHaveBeenCalledWith(mockDocument);
      expect(normalizeAIReviewResult).toHaveBeenCalled();
      expect(mergeFindings).toHaveBeenCalled();
      expect(result.summary.aiFindings).toBe(1);
    });

    it('should handle AI reviewer failure gracefully', async () => {
      const mockDocument = {
        id: 'doc-6',
        name: 'test.docx',
        content: 'test content',
        segments: []
      };
      const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
      
      // AI reviewer fails
      const mockAIReviewer = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const ruleFinding = createFinding({
        title: 'Rule Finding',
        description: 'Rule detected issue',
        severity: 'medium',
        sourceType: 'system_rule'
      });
      runRuleChecks.mockReturnValue([ruleFinding]);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      // Should still return rule findings even when AI fails
      expect(result.findings).toHaveLength(1);
      expect(result.summary.totalFindings).toBe(1);
      expect(result.summary.ruleFindings).toBe(1);
      expect(result.summary.aiFindings).toBe(0);
      expect(result.summary.aiErrors).toBe(1);
      expect(mergeFindings).not.toHaveBeenCalled();
    });
  });

  describe('Review Summary Statistics', () => {
    it('should generate accurate summary for procurement review', async () => {
      const mockDocument = {
        id: 'doc-7',
        name: FIXTURES.invalidContact.filename,
        content: 'document with multiple issues',
        segments: []
      };
      const mockRules = [
        { id: 'contact_phone', checkType: 'pattern_match', field: 'phone' },
        { id: 'contact_email', checkType: 'pattern_match', field: 'email' },
        { id: 'contact_address', checkType: 'required_presence', field: 'address' }
      ];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      // Multiple rule findings
      const findings = [
        createFinding({ title: 'Invalid Phone', severity: 'medium', category: 'contact' }),
        createFinding({ title: 'Invalid Email', severity: 'medium', category: 'contact' }),
        createFinding({ title: 'Missing Address', severity: 'low', category: 'contact' })
      ];
      runRuleChecks.mockReturnValue(findings);

      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });

      expect(result.summary.totalFindings).toBe(3);
      expect(result.summary.ruleFindings).toBe(3);
      expect(result.summary.aiFindings).toBe(0);
      expect(result.summary.timestamp).toBeDefined();
      expect(new Date(result.summary.timestamp)).toBeInstanceOf(Date);
    });

    it('should include timestamp in summary', async () => {
      const mockDocument = {
        id: 'doc-8',
        name: 'test.docx',
        content: 'test',
        segments: []
      };
      const mockRules = [];
      const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });

      runRuleChecks.mockReturnValue([]);

      const beforeTime = Date.now();
      const result = await runReviewSession({
        document: mockDocument,
        rules: mockRules,
        aiReviewer: mockAIReviewer
      });
      const afterTime = Date.now();

      const timestamp = new Date(result.summary.timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
