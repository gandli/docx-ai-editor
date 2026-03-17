import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReviewSession } from '../review-orchestrator';

// Mock the dependencies
vi.mock('../rule-engine', () => ({
  runRuleChecks: vi.fn()
}));

vi.mock('../../document/services/location-mapper', () => ({
  resolveFindingLocation: vi.fn()
}));

vi.mock('../ai-review-schema', () => ({
  normalizeAIReviewResult: vi.fn()
}));

vi.mock('../finding-merger', () => ({
  mergeFindings: vi.fn()
}));

import { runRuleChecks } from '../rule-engine';
import { normalizeAIReviewResult } from '../ai-review-schema';
import { mergeFindings } from '../finding-merger';

describe('review-orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes both rule engine and AI reviewer', async () => {
    // Setup mocks
    const mockDocument = { segments: [], content: 'test doc' };
    const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
    const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });
    
    const mockRuleFindings = [{ id: 'rf1', title: 'Rule Finding 1' }];
    const mockNormalizedAIResult = { findings: [{ id: 'af1', title: 'AI Finding 1' }] };
    const mockMergedFindings = [
      { id: 'rf1', title: 'Rule Finding 1' },
      { id: 'af1', title: 'AI Finding 1' }
    ];
    
    runRuleChecks.mockReturnValue(mockRuleFindings);
    normalizeAIReviewResult.mockReturnValue(mockNormalizedAIResult);
    mergeFindings.mockReturnValue(mockMergedFindings);

    // Execute
    await runReviewSession({ document: mockDocument, rules: mockRules, aiReviewer: mockAIReviewer });

    // Verify
    expect(runRuleChecks).toHaveBeenCalledWith(mockDocument, mockRules);
    expect(mockAIReviewer).toHaveBeenCalledWith(mockDocument);
  });

  it('normalizes AI output before merging', async () => {
    // Setup mocks
    const mockDocument = { segments: [], content: 'test doc' };
    const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
    const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [{ title: 'Raw AI Finding' }] });
    
    const mockRuleFindings = [];
    const mockNormalizedAIResult = { findings: [{ id: 'af1', title: 'Normalized AI Finding' }] };
    const mockMergedFindings = [{ id: 'af1', title: 'Normalized AI Finding' }];
    
    runRuleChecks.mockReturnValue(mockRuleFindings);
    normalizeAIReviewResult.mockReturnValue(mockNormalizedAIResult);
    mergeFindings.mockReturnValue(mockMergedFindings);

    // Execute
    await runReviewSession({ document: mockDocument, rules: mockRules, aiReviewer: mockAIReviewer });

    // Verify
    expect(normalizeAIReviewResult).toHaveBeenCalledWith({ findings: [{ title: 'Raw AI Finding' }] });
    expect(mergeFindings).toHaveBeenCalledWith(
      mockRuleFindings,
      mockNormalizedAIResult.findings
    );
  });

  it('returns merged findings in stable order', async () => {
    // Setup mocks
    const mockDocument = { segments: [], content: 'test doc' };
    const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
    const mockAIReviewer = vi.fn().mockResolvedValue({ findings: [] });
    
    const mockRuleFindings = [
      { id: 'rf2', title: 'Rule Finding 2', severity: 'high' },
      { id: 'rf1', title: 'Rule Finding 1', severity: 'low' }
    ];
    const mockNormalizedAIResult = { findings: [] };
    const mockMergedFindings = [
      { id: 'rf2', title: 'Rule Finding 2', severity: 'high' },
      { id: 'rf1', title: 'Rule Finding 1', severity: 'low' }
    ];
    
    runRuleChecks.mockReturnValue(mockRuleFindings);
    normalizeAIReviewResult.mockReturnValue(mockNormalizedAIResult);
    mergeFindings.mockReturnValue(mockMergedFindings);

    // Execute
    const result = await runReviewSession({ document: mockDocument, rules: mockRules, aiReviewer: mockAIReviewer });

    // Verify
    expect(result).toEqual({
      findings: mockMergedFindings,
      summary: expect.any(Object)
    });
    expect(result.findings).toEqual(mockMergedFindings);
  });

  it('degrades gracefully to rule-only findings when AI fails', async () => {
    // Setup mocks
    const mockDocument = { segments: [], content: 'test doc' };
    const mockRules = [{ id: 'r1', checkType: 'required_presence', field: 'title' }];
    const mockAIReviewer = vi.fn().mockRejectedValue(new Error('AI service unavailable'));
    
    const mockRuleFindings = [{ id: 'rf1', title: 'Rule Finding 1' }];
    
    runRuleChecks.mockReturnValue(mockRuleFindings);

    // Execute
    const result = await runReviewSession({ document: mockDocument, rules: mockRules, aiReviewer: mockAIReviewer });

    // Verify
    expect(result).toEqual({
      findings: mockRuleFindings,
      summary: expect.objectContaining({
        totalFindings: 1,
        aiFindings: 0,
        ruleFindings: 1,
        aiErrors: 1
      })
    });
    expect(mergeFindings).not.toHaveBeenCalled();
    expect(normalizeAIReviewResult).not.toHaveBeenCalled();
  });
});