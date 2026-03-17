import { describe, it, expect } from 'vitest';
import { normalizeAIReviewResult } from '../ai-review-schema.js';

describe('normalizeAIReviewResult', () => {
  it('should pass through valid AI findings', () => {
    const input = {
      findings: [
        {
          title: 'Missing budget section',
          description: 'The document lacks a detailed budget breakdown',
          severity: 'high',
          category: 'completeness',
          location: { segmentId: 'sec-1', anchorText: 'Project Overview' },
          evidence: ['No budget table found'],
          confidence: 0.85,
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].title).toBe('Missing budget section');
    expect(result.findings[0].severity).toBe('high');
    expect(result.findings[0].confidence).toBe(0.85);
  });

  it('should correct invalid severity to medium', () => {
    const input = {
      findings: [
        {
          title: 'Invalid severity test',
          description: 'This has an invalid severity value',
          severity: 'super-critical', // invalid
        },
        {
          title: 'Another invalid severity',
          description: 'Empty severity',
          severity: '', // invalid
        },
        {
          title: 'Null severity',
          description: 'Null severity value',
          severity: null, // invalid
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(3);
    expect(result.findings[0].severity).toBe('medium');
    expect(result.findings[1].severity).toBe('medium');
    expect(result.findings[2].severity).toBe('medium');
  });

  it('should accept valid severity values', () => {
    const input = {
      findings: [
        { title: 'Low', description: 'Test', severity: 'low' },
        { title: 'Medium', description: 'Test', severity: 'medium' },
        { title: 'High', description: 'Test', severity: 'high' },
        { title: 'Critical', description: 'Test', severity: 'critical' },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].severity).toBe('low');
    expect(result.findings[1].severity).toBe('medium');
    expect(result.findings[2].severity).toBe('high');
    expect(result.findings[3].severity).toBe('critical');
  });

  it('should reject items with missing title', () => {
    const input = {
      findings: [
        {
          description: 'This has no title',
          severity: 'high',
        },
        {
          title: '',
          description: 'This has empty title',
          severity: 'high',
        },
        {
          title: null,
          description: 'This has null title',
          severity: 'high',
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(0);
  });

  it('should reject items with missing description', () => {
    const input = {
      findings: [
        {
          title: 'No description',
          severity: 'high',
        },
        {
          title: 'Empty description',
          description: '',
          severity: 'high',
        },
        {
          title: 'Null description',
          description: null,
          severity: 'high',
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(0);
  });

  it('should provide safe fallback for missing location', () => {
    const input = {
      findings: [
        {
          title: 'No location',
          description: 'This finding has no location',
          severity: 'medium',
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].location).toEqual({
      segmentId: null,
      anchorText: null,
      fallback: true,
    });
  });

  it('should preserve existing location data', () => {
    const input = {
      findings: [
        {
          title: 'With location',
          description: 'This has location info',
          severity: 'medium',
          location: { segmentId: 'sec-5', anchorText: 'Budget Section' },
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].location).toEqual({
      segmentId: 'sec-5',
      anchorText: 'Budget Section',
      fallback: false,
    });
  });

  it('should return empty findings array for malformed payload instead of throwing', () => {
    const malformedInputs = [
      null,
      undefined,
      'string',
      123,
      {},
      { findings: null },
      { findings: 'not-an-array' },
      { findings: {} },
    ];

    malformedInputs.forEach((input) => {
      const result = normalizeAIReviewResult(input);
      expect(result).toEqual({ findings: [] });
    });
  });

  it('should normalize partial location objects', () => {
    const input = {
      findings: [
        {
          title: 'Partial location',
          description: 'Only has segmentId',
          severity: 'low',
          location: { segmentId: 'sec-10' },
        },
        {
          title: 'Partial location 2',
          description: 'Only has anchorText',
          severity: 'low',
          location: { anchorText: 'Section Header' },
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].location).toEqual({
      segmentId: 'sec-10',
      anchorText: null,
      fallback: false,
    });
    expect(result.findings[1].location).toEqual({
      segmentId: null,
      anchorText: 'Section Header',
      fallback: false,
    });
  });

  it('should set default values for optional fields', () => {
    const input = {
      findings: [
        {
          title: 'Minimal finding',
          description: 'Only required fields',
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0]).toMatchObject({
      title: 'Minimal finding',
      description: 'Only required fields',
      severity: 'medium',
      status: 'open',
      sourceType: 'ai_review',
      confidence: 0.5,
      evidence: [],
      tags: [],
      category: null,
    });
  });

  it('should handle array items that are not objects', () => {
    const input = {
      findings: [
        'invalid string item',
        123,
        null,
        { title: 'Valid', description: 'Valid finding' },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].title).toBe('Valid');
  });

  it('should sanitize evidence to be an array', () => {
    const input = {
      findings: [
        {
          title: 'Bad evidence',
          description: 'Evidence is not an array',
          severity: 'medium',
          evidence: 'single string evidence',
        },
        {
          title: 'Null evidence',
          description: 'Evidence is null',
          severity: 'medium',
          evidence: null,
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].evidence).toEqual([]);
    expect(result.findings[1].evidence).toEqual([]);
  });

  it('should sanitize tags to be an array', () => {
    const input = {
      findings: [
        {
          title: 'Bad tags',
          description: 'Tags is not an array',
          severity: 'medium',
          tags: 'tag1,tag2',
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].tags).toEqual([]);
  });

  it('should handle empty findings array', () => {
    const input = {
      findings: [],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings).toEqual([]);
  });

  it('should normalize confidence to a number between 0 and 1', () => {
    const input = {
      findings: [
        {
          title: 'High confidence',
          description: 'Test',
          confidence: 1.5, // clamped
        },
        {
          title: 'Negative confidence',
          description: 'Test',
          confidence: -0.5, // clamped
        },
        {
          title: 'String confidence',
          description: 'Test',
          confidence: '0.8', // converted
        },
      ],
    };

    const result = normalizeAIReviewResult(input);

    expect(result.findings[0].confidence).toBe(1);
    expect(result.findings[1].confidence).toBe(0);
    expect(result.findings[2].confidence).toBe(0.8);
  });
});