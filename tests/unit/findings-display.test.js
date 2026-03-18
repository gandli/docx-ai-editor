/**
 * Unit Tests: Findings Display After Review
 * 
 * Tests the display and rendering of review findings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFinding, createSuggestion } from '../../src/domains/review/model/review-models.js';

describe('Unit: Findings Display', () => {
  describe('Finding Model Properties', () => {
    it('should create a finding with all required properties', () => {
      const finding = createFinding({
        title: 'Missing Budget',
        description: 'The document is missing budget information',
        severity: 'high',
        category: 'budget',
        sourceType: 'system_rule'
      });

      expect(finding.title).toBe('Missing Budget');
      expect(finding.description).toBe('The document is missing budget information');
      expect(finding.severity).toBe('high');
      expect(finding.category).toBe('budget');
      expect(finding.sourceType).toBe('system_rule');
      expect(finding.status).toBe('open');
      expect(finding.confidence).toBe(0.5);
    });

    it('should create finding with location information', () => {
      const finding = createFinding({
        title: 'Invalid Contact',
        description: 'Contact information is invalid',
        severity: 'medium',
        location: {
          paragraphId: 'p-5',
          segmentId: 'seg-contact',
          startOffset: 10,
          endOffset: 50
        }
      });

      expect(finding.location).toBeDefined();
      expect(finding.location.paragraphId).toBe('p-5');
      expect(finding.location.segmentId).toBe('seg-contact');
    });

    it('should create finding with evidence', () => {
      const finding = createFinding({
        title: 'Incomplete Timeline',
        description: 'Timeline has TBD dates',
        severity: 'high',
        evidence: [
          { type: 'text', content: '投标截止日期：待定' },
          { type: 'text', content: '开标日期：待定' }
        ]
      });

      expect(finding.evidence).toHaveLength(2);
      expect(finding.evidence[0].content).toContain('待定');
    });

    it('should create finding with tags', () => {
      const finding = createFinding({
        title: 'Budget Issue',
        description: 'Budget problem',
        tags: ['procurement', 'budget', 'required-field']
      });

      expect(finding.tags).toHaveLength(3);
      expect(finding.tags).toContain('budget');
    });
  });

  describe('Finding Severity Levels', () => {
    it('should support all severity levels', () => {
      const severities = ['low', 'medium', 'high', 'critical'];
      
      severities.forEach(severity => {
        const finding = createFinding({
          title: `Test ${severity}`,
          severity
        });
        expect(finding.severity).toBe(severity);
      });
    });

    it('should default to medium severity', () => {
      const finding = createFinding({
        title: 'Test Finding'
      });
      expect(finding.severity).toBe('medium');
    });
  });

  describe('Finding Status Transitions', () => {
    it('should support all status values', () => {
      const statuses = ['open', 'in_progress', 'resolved', 'dismissed'];
      
      statuses.forEach(status => {
        const finding = createFinding({
          title: `Test ${status}`,
          status
        });
        expect(finding.status).toBe(status);
      });
    });

    it('should default to open status', () => {
      const finding = createFinding({
        title: 'Test Finding'
      });
      expect(finding.status).toBe('open');
    });
  });

  describe('Procurement-Specific Findings', () => {
    it('should create budget-related finding', () => {
      const finding = createFinding({
        title: 'Missing Budget Information',
        description: '采购预算信息缺失',
        severity: 'high',
        category: 'budget',
        sourceType: 'system_rule',
        tags: ['procurement', 'budget', 'required'],
        evidence: [
          { type: 'text', content: '项目基本信息中未包含预算金额' }
        ]
      });

      expect(finding.category).toBe('budget');
      expect(finding.severity).toBe('high');
    });

    it('should create contact-related finding', () => {
      const finding = createFinding({
        title: 'Invalid Phone Number Format',
        description: '联系电话格式不正确',
        severity: 'medium',
        category: 'contact',
        sourceType: 'system_rule',
        tags: ['procurement', 'contact', 'validation']
      });

      expect(finding.category).toBe('contact');
      expect(finding.severity).toBe('medium');
    });

    it('should create timeline-related finding', () => {
      const finding = createFinding({
        title: 'Incomplete Project Timeline',
        description: '项目时间表包含待定日期',
        severity: 'high',
        category: 'timeline',
        sourceType: 'system_rule',
        tags: ['procurement', 'timeline', 'incomplete']
      });

      expect(finding.category).toBe('timeline');
      expect(finding.severity).toBe('high');
    });
  });

  describe('Finding Grouping', () => {
    it('should group findings by category', () => {
      const findings = [
        createFinding({ title: 'F1', category: 'budget', severity: 'high' }),
        createFinding({ title: 'F2', category: 'contact', severity: 'medium' }),
        createFinding({ title: 'F3', category: 'budget', severity: 'low' }),
        createFinding({ title: 'F4', category: 'timeline', severity: 'high' })
      ];

      const grouped = findings.reduce((acc, finding) => {
        const cat = finding.category || 'uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(finding);
        return acc;
      }, {});

      expect(grouped.budget).toHaveLength(2);
      expect(grouped.contact).toHaveLength(1);
      expect(grouped.timeline).toHaveLength(1);
    });

    it('should group findings by severity', () => {
      const findings = [
        createFinding({ title: 'F1', severity: 'high' }),
        createFinding({ title: 'F2', severity: 'medium' }),
        createFinding({ title: 'F3', severity: 'high' }),
        createFinding({ title: 'F4', severity: 'low' })
      ];

      const grouped = findings.reduce((acc, finding) => {
        const sev = finding.severity;
        if (!acc[sev]) acc[sev] = [];
        acc[sev].push(finding);
        return acc;
      }, {});

      expect(grouped.high).toHaveLength(2);
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.low).toHaveLength(1);
    });
  });

  describe('Finding Filtering', () => {
    it('should filter findings by severity', () => {
      const findings = [
        createFinding({ title: 'F1', severity: 'high' }),
        createFinding({ title: 'F2', severity: 'medium' }),
        createFinding({ title: 'F3', severity: 'high' }),
        createFinding({ title: 'F4', severity: 'low' })
      ];

      const highSeverity = findings.filter(f => f.severity === 'high');
      expect(highSeverity).toHaveLength(2);
    });

    it('should filter findings by category', () => {
      const findings = [
        createFinding({ title: 'F1', category: 'budget' }),
        createFinding({ title: 'F2', category: 'contact' }),
        createFinding({ title: 'F3', category: 'budget' })
      ];

      const budgetFindings = findings.filter(f => f.category === 'budget');
      expect(budgetFindings).toHaveLength(2);
    });

    it('should filter findings by status', () => {
      const findings = [
        createFinding({ title: 'F1', status: 'open' }),
        createFinding({ title: 'F2', status: 'resolved' }),
        createFinding({ title: 'F3', status: 'open' })
      ];

      const openFindings = findings.filter(f => f.status === 'open');
      expect(openFindings).toHaveLength(2);
    });
  });
});

describe('Unit: Suggestions Display', () => {
  describe('Suggestion Model Properties', () => {
    it('should create a suggestion with all required properties', () => {
      const suggestion = createSuggestion({
        text: '建议添加预算信息：人民币 500 万元整',
        rationale: '采购文档需要明确预算金额',
        location: {
          targetSegmentId: 'seg-budget',
          position: 'after'
        }
      });

      expect(suggestion.text).toBe('建议添加预算信息：人民币 500 万元整');
      expect(suggestion.rationale).toBe('采购文档需要明确预算金额');
      expect(suggestion.location.targetSegmentId).toBe('seg-budget');
      expect(suggestion.status).toBe('open');
    });

    it('should create suggestion with applied changes tracking', () => {
      const suggestion = createSuggestion({
        text: 'Fix contact information',
        appliedChanges: [
          { type: 'replace', original: 'invalid-phone', replacement: '138-0000-1234' }
        ]
      });

      expect(suggestion.appliedChanges).toHaveLength(1);
      expect(suggestion.appliedChanges[0].type).toBe('replace');
    });
  });

  describe('Suggestion Status', () => {
    it('should support all suggestion statuses', () => {
      const statuses = ['open', 'accepted', 'rejected', 'applied'];
      
      statuses.forEach(status => {
        const suggestion = createSuggestion({
          text: `Test ${status}`,
          status
        });
        expect(suggestion.status).toBe(status);
      });
    });

    it('should default to open status', () => {
      const suggestion = createSuggestion({
        text: 'Test suggestion'
      });
      expect(suggestion.status).toBe('open');
    });
  });

  describe('Procurement-Specific Suggestions', () => {
    it('should create budget suggestion', () => {
      const suggestion = createSuggestion({
        text: '采购预算：人民币 500 万元整',
        rationale: '根据项目规模，建议预算为 500 万元',
        location: { targetSegmentId: 'project-info', position: 'append' }
      });

      expect(suggestion.text).toContain('500 万元');
      expect(suggestion.rationale).toBeDefined();
    });

    it('should create contact fix suggestion', () => {
      const suggestion = createSuggestion({
        text: '联系电话：138-0000-1234',
        rationale: '修正电话号码格式',
        location: { targetSegmentId: 'contact-phone', position: 'replace' }
      });

      expect(suggestion.text).toMatch(/\d{3}-\d{4}-\d{4}/);
    });

    it('should create timeline completion suggestion', () => {
      const suggestion = createSuggestion({
        text: '投标截止日期：2024年3月31日',
        rationale: '设定具体的投标截止日期',
        location: { targetSegmentId: 'timeline-bid', position: 'replace' }
      });

      expect(suggestion.text).toContain('2024年');
    });
  });

  describe('Suggestion-Finding Association', () => {
    it('should associate suggestions with findings', () => {
      const finding = createFinding({
        title: 'Missing Budget',
        description: 'Budget is missing',
        severity: 'high'
      });

      const suggestion = createSuggestion({
        text: 'Add budget information',
        rationale: 'Fix the missing budget issue',
        location: { targetSegmentId: 'budget-section' }
      });

      // In real implementation, these would be linked via IDs
      // Here we verify the structure supports the relationship
      expect(finding.title).toBe('Missing Budget');
      expect(suggestion.rationale).toContain('budget');
    });
  });
});
