import { describe, it, expect } from 'vitest';
import { mergeFindings } from '../finding-merger';

describe('Finding Merger Service', () => {
  it('should merge duplicate findings at same location', () => {
    const ruleFindings = [
      {
        id: 'rule-1',
        title: 'Missing Section',
        location: 'section-1',
        category: 'compliance',
        severity: 'high',
        evidence: ['Evidence from rule'],
        sourceType: 'system_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Missing Section',
        location: 'section-1',
        category: 'compliance',
        severity: 'medium',
        evidence: ['Evidence from AI'],
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    
    // Should have only one finding since they have same title, location, and category
    expect(result).toHaveLength(1);
    const mergedFinding = result[0];
    
    // Should combine evidence from both sources
    expect(mergedFinding.evidence).toContain('Evidence from rule');
    expect(mergedFinding.evidence).toContain('Evidence from AI');
    
    // Title, location, and category should remain the same
    expect(mergedFinding.title).toBe('Missing Section');
    expect(mergedFinding.location).toBe('section-1');
    expect(mergedFinding.category).toBe('compliance');
  });

  it('should combine evidence arrays from both sources', () => {
    const ruleFindings = [
      {
        id: 'rule-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        evidence: ['rule-evidence-1', 'rule-evidence-2'],
        sourceType: 'system_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        evidence: ['ai-evidence-1', 'ai-evidence-2'],
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    expect(result).toHaveLength(1);
    
    const mergedFinding = result[0];
    expect(mergedFinding.evidence).toEqual(
      expect.arrayContaining(['rule-evidence-1', 'rule-evidence-2', 'ai-evidence-1', 'ai-evidence-2'])
    );
  });

  it('should select higher severity when merging findings', () => {
    const ruleFindings = [
      {
        id: 'rule-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'low',
        sourceType: 'system_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'high',
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    expect(result).toHaveLength(1);
    
    const mergedFinding = result[0];
    // Higher severity (high) should win
    expect(mergedFinding.severity).toBe('high');
  });

  it('should give precedence to user-rule findings over system-rule findings', () => {
    const ruleFindings = [
      {
        id: 'user-rule-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'medium',
        description: 'User rule description',
        sourceType: 'user_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'low',
        description: 'AI description',
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    expect(result).toHaveLength(1);
    
    const mergedFinding = result[0];
    // User rule should take precedence, so description should be from user rule
    expect(mergedFinding.description).toBe('User rule description');
    expect(mergedFinding.sourceType).toBe('user_rule');
  });

  it('should mark unresolved conflicts as needs_review', () => {
    const ruleFindings = [
      {
        id: 'rule-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'high',
        description: 'Different description 1',
        sourceType: 'system_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        severity: 'high',
        description: 'Different description 2',
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    expect(result).toHaveLength(1);
    
    const mergedFinding = result[0];
    // When there are conflicting descriptions with same severity, mark as needs_review
    expect(mergedFinding.status).toBe('needs_review');
  });

  it('should handle findings with different titles, locations, or categories separately', () => {
    const ruleFindings = [
      {
        id: 'rule-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        sourceType: 'system_rule'
      },
      {
        id: 'rule-2',
        title: 'Title 2',
        location: 'loc-1',
        category: 'category-1',
        sourceType: 'system_rule'
      }
    ];

    const aiFindings = [
      {
        id: 'ai-1',
        title: 'Title 1',
        location: 'loc-1',
        category: 'category-1',
        sourceType: 'ai_review'
      },
      {
        id: 'ai-2',
        title: 'Title 1',
        location: 'loc-2',
        category: 'category-1',
        sourceType: 'ai_review'
      }
    ];

    const result = mergeFindings(ruleFindings, aiFindings);
    
    // Should have 3 findings: one merged (Title 1, loc-1, category-1) and two separate
    expect(result).toHaveLength(3);
  });

  it('should handle empty inputs correctly', () => {
    expect(mergeFindings([], [])).toHaveLength(0);
    expect(mergeFindings([{ id: '1', title: 'Test', location: 'loc', category: 'cat', sourceType: 'system_rule' }], [])).toHaveLength(1);
    expect(mergeFindings([], [{ id: '1', title: 'Test', location: 'loc', category: 'cat', sourceType: 'ai_review' }])).toHaveLength(1);
  });
});