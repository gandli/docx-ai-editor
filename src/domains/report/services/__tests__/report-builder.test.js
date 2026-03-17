import { describe, it, expect } from 'vitest';
import { buildReviewReport } from '../report-builder';

describe('Report Builder Service', () => {
  // Mock document
  const mockDocument = {
    id: 'doc-123',
    name: '采购档案-2024-001.docx',
    segments: [],
  };

  // Mock rule sets
  const mockRuleSets = [
    {
      id: 'ruleset-1',
      name: '采购合规规则集',
      source: 'system',
      description: 'System procurement compliance rules',
      rules: [
        { id: 'rule-1', name: 'Required Section Check', source: 'system' },
        { id: 'rule-2', name: 'Budget Field Check', source: 'system' },
      ],
    },
    {
      id: 'ruleset-2',
      name: '用户自定义规则',
      source: 'user',
      description: 'User-defined review rules',
      rules: [
        { id: 'rule-3', name: 'Custom Keyword Check', source: 'user' },
      ],
    },
  ];

  // Mock findings with various severities and statuses
  const mockFindings = [
    {
      id: 'finding-1',
      title: 'Missing budget section',
      description: 'Document lacks required budget information',
      severity: 'high',
      status: 'open',
      sourceType: 'system_rule',
      category: 'compliance',
      location: 'section-3',
      evidence: ['Evidence A'],
    },
    {
      id: 'finding-2',
      title: 'Incomplete vendor info',
      description: 'Vendor contact information is incomplete',
      severity: 'medium',
      status: 'open',
      sourceType: 'ai_review',
      category: 'completeness',
      location: 'section-5',
      evidence: ['Evidence B'],
    },
    {
      id: 'finding-3',
      title: 'Critical approval missing',
      description: 'Required approval signature not found',
      severity: 'critical',
      status: 'open',
      sourceType: 'hybrid',
      category: 'approval',
      location: 'section-1',
      evidence: ['Evidence C'],
    },
    {
      id: 'finding-4',
      title: 'Minor formatting issue',
      description: 'Header formatting is inconsistent',
      severity: 'low',
      status: 'dismissed',
      sourceType: 'ai_review',
      category: 'formatting',
      location: 'section-2',
      evidence: ['Evidence D'],
    },
    {
      id: 'finding-5',
      title: 'Payment terms unclear',
      description: 'Payment terms section is ambiguous',
      severity: 'high',
      status: 'open',
      sourceType: 'user_rule',
      category: 'contract',
      location: 'section-4',
      evidence: ['Evidence E'],
    },
  ];

  describe('summary counts', () => {
    it('should calculate correct summary counts', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      expect(report.summary.totalFindings).toBe(5);
      expect(report.summary.openFindings).toBe(4);
      expect(report.summary.dismissedFindings).toBe(1);
      expect(report.summary.bySeverity.critical).toBe(1);
      expect(report.summary.bySeverity.high).toBe(2);
      expect(report.summary.bySeverity.medium).toBe(1);
      expect(report.summary.bySeverity.low).toBe(1);
    });

    it('should handle empty findings', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: [],
        ruleSets: mockRuleSets,
      });

      expect(report.summary.totalFindings).toBe(0);
      expect(report.summary.openFindings).toBe(0);
      expect(report.summary.dismissedFindings).toBe(0);
      expect(report.summary.bySeverity.critical).toBe(0);
      expect(report.summary.bySeverity.high).toBe(0);
      expect(report.summary.bySeverity.medium).toBe(0);
      expect(report.summary.bySeverity.low).toBe(0);
    });

    it('should count findings by status correctly', () => {
      const findingsWithMixedStatus = [
        { ...mockFindings[0], status: 'open' },
        { ...mockFindings[1], status: 'resolved' },
        { ...mockFindings[2], status: 'in_progress' },
        { ...mockFindings[3], status: 'dismissed' },
      ];

      const report = buildReviewReport({
        document: mockDocument,
        findings: findingsWithMixedStatus,
        ruleSets: mockRuleSets,
      });

      expect(report.summary.byStatus.open).toBe(1);
      expect(report.summary.byStatus.resolved).toBe(1);
      expect(report.summary.byStatus.in_progress).toBe(1);
      expect(report.summary.byStatus.dismissed).toBe(1);
    });
  });

  describe('high-risk findings ordering', () => {
    it('should surface high-risk findings first', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      // Critical and high severity should come first
      const severities = report.findings.map(f => f.severity);
      expect(severities[0]).toBe('critical');
      expect(severities[1]).toBe('high');
      expect(severities[2]).toBe('high');
      // Medium and low come after
      expect(severities[3]).toBe('medium');
      expect(severities[4]).toBe('low');
    });

    it('should sort by severity priority: critical > high > medium > low', () => {
      const unsortedFindings = [
        { id: 'f1', title: 'Low', severity: 'low', status: 'open' },
        { id: 'f2', title: 'Critical', severity: 'critical', status: 'open' },
        { id: 'f3', title: 'Medium', severity: 'medium', status: 'open' },
        { id: 'f4', title: 'High', severity: 'high', status: 'open' },
      ];

      const report = buildReviewReport({
        document: mockDocument,
        findings: unsortedFindings,
        ruleSets: mockRuleSets,
      });

      const severities = report.findings.map(f => f.severity);
      expect(severities).toEqual(['critical', 'high', 'medium', 'low']);
    });
  });

  describe('rule source metadata', () => {
    it('should include rule source metadata in report', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      expect(report.ruleSets).toHaveLength(2);
      expect(report.ruleSets[0].id).toBe('ruleset-1');
      expect(report.ruleSets[0].source).toBe('system');
      expect(report.ruleSets[0].name).toBe('采购合规规则集');
      expect(report.ruleSets[1].id).toBe('ruleset-2');
      expect(report.ruleSets[1].source).toBe('user');
    });

    it('should include rule source counts in metadata', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      expect(report.metadata.ruleSourceCounts).toBeDefined();
      expect(report.metadata.ruleSourceCounts.system).toBe(1);
      expect(report.metadata.ruleSourceCounts.user).toBe(1);
    });

    it('should include total rule count in metadata', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      expect(report.metadata.totalRules).toBe(3); // 2 system + 1 user
    });
  });

  describe('dismissed findings exclusion', () => {
    it('should exclude dismissed findings when option is set', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
        options: { excludeDismissed: true },
      });

      // Should only have 4 findings (excluding the dismissed one)
      expect(report.findings).toHaveLength(4);
      expect(report.findings.every(f => f.status !== 'dismissed')).toBe(true);
      expect(report.summary.totalFindings).toBe(4);
      expect(report.summary.dismissedFindings).toBe(0);
    });

    it('should include dismissed findings by default', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      // Should include all 5 findings including the dismissed one
      expect(report.findings).toHaveLength(5);
      expect(report.summary.totalFindings).toBe(5);
      expect(report.summary.dismissedFindings).toBe(1);
    });
  });

  describe('normalized ReviewReport structure', () => {
    it('should return a normalized ReviewReport object', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      // Verify structure matches createReviewReport pattern
      expect(report.documentId).toBe('doc-123');
      expect(report.documentName).toBe('采购档案-2024-001.docx');
      expect(report.status).toBe('completed');
      expect(Array.isArray(report.findings)).toBe(true);
      expect(Array.isArray(report.summary)).toBe(false); // summary is an object
      expect(typeof report.summary).toBe('object');
      expect(Array.isArray(report.ruleSets)).toBe(true);
      expect(report.generatedAt).toBeDefined();
      expect(report.completedAt).toBeDefined();
    });

    it('should include highRiskFindings section', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      expect(report.highRiskFindings).toBeDefined();
      expect(Array.isArray(report.highRiskFindings)).toBe(true);
      // Should include critical and high severity findings
      expect(report.highRiskFindings.length).toBe(3);
      expect(report.highRiskFindings.every(f => ['critical', 'high'].includes(f.severity))).toBe(true);
    });

    it('should preserve finding structure in report', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: mockRuleSets,
      });

      const firstFinding = report.findings[0];
      expect(firstFinding.id).toBeDefined();
      expect(firstFinding.title).toBeDefined();
      expect(firstFinding.description).toBeDefined();
      expect(firstFinding.severity).toBeDefined();
      expect(firstFinding.status).toBeDefined();
      expect(firstFinding.sourceType).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing document properties gracefully', () => {
      const minimalDoc = { id: 'doc-456' };
      const report = buildReviewReport({
        document: minimalDoc,
        findings: [],
        ruleSets: [],
      });

      expect(report.documentId).toBe('doc-456');
      expect(report.documentName).toBe('');
    });

    it('should handle findings without severity', () => {
      const findingsNoSeverity = [
        { id: 'f1', title: 'Test', status: 'open' },
      ];

      const report = buildReviewReport({
        document: mockDocument,
        findings: findingsNoSeverity,
        ruleSets: mockRuleSets,
      });

      // Should default to medium or handle gracefully
      expect(report.summary.totalFindings).toBe(1);
    });

    it('should handle null/undefined ruleSets', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: mockFindings,
        ruleSets: null,
      });

      expect(report.ruleSets).toEqual([]);
      expect(report.metadata.totalRules).toBe(0);
    });

    it('should handle null/undefined findings', () => {
      const report = buildReviewReport({
        document: mockDocument,
        findings: null,
        ruleSets: mockRuleSets,
      });

      expect(report.findings).toEqual([]);
      expect(report.summary.totalFindings).toBe(0);
    });
  });
});