import { describe, it, expect } from 'vitest';
import { runRuleChecks } from '../rule-engine.js';

/**
 * Mock document segmented by headings/paragraphs
 * Simulates a procurement document structure
 */
function createMockDocument(options = {}) {
  const {
    hasBudgetSection = true,
    hasTimelineSection = true,
    hasTermsSection = true,
    budgetContent = '本项目预算为人民币 500,000 元整。',
    timelineContent = '项目周期为 6 个月，自合同签订之日起计算。',
    termsContent = '付款方式：分期付款，验收后支付尾款。',
  } = options;

  const segments = [];

  segments.push({
    id: 'seg-1',
    type: 'heading',
    level: 1,
    text: '项目概况',
  });
  segments.push({
    id: 'seg-2',
    type: 'paragraph',
    text: '本项目为采购项目，包含设备采购和服务支持。',
  });

  if (hasBudgetSection) {
    segments.push({
      id: 'seg-3',
      type: 'heading',
      level: 1,
      text: '预算说明',
    });
    segments.push({
      id: 'seg-4',
      type: 'paragraph',
      text: budgetContent,
    });
  }

  if (hasTimelineSection) {
    segments.push({
      id: 'seg-5',
      type: 'heading',
      level: 1,
      text: '项目周期',
    });
    segments.push({
      id: 'seg-6',
      type: 'paragraph',
      text: timelineContent,
    });
  }

  if (hasTermsSection) {
    segments.push({
      id: 'seg-7',
      type: 'heading',
      level: 1,
      text: '合同条款',
    });
    segments.push({
      id: 'seg-8',
      type: 'paragraph',
      text: termsContent,
    });
  }

  segments.push({
    id: 'seg-9',
    type: 'heading',
    level: 1,
    text: '联系方式',
  });
  segments.push({
    id: 'seg-10',
    type: 'paragraph',
    text: '联系人：张先生，电话：138-0000-0000',
  });

  return {
    id: 'doc-001',
    name: '采购项目文档.docx',
    segments,
    metadata: {
      title: '采购项目文档',
      author: '采购部',
    },
  };
}

describe('runRuleChecks', () => {
  describe('required_presence checks', () => {
    it('should create finding when required section is missing', () => {
      // Document without "资质要求" section
      const document = createMockDocument({ hasBudgetSection: true });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'required_presence',
          target: 'section',
          pattern: '资质要求',
          severity: 'high',
          message: '缺少资质要求说明',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('缺少资质要求说明');
      expect(findings[0].severity).toBe('high');
      expect(findings[0].sourceType).toBe('system_rule');
      expect(findings[0].status).toBe('open');
    });

    it('should not create finding when required keyword is present', () => {
      const document = createMockDocument();
      const rules = [
        {
          id: 'rule-1',
          checkType: 'required_presence',
          target: 'keyword',
          pattern: '预算',
          severity: 'medium',
          message: '缺少预算说明',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(0);
    });

    it('should create finding when required keyword is missing', () => {
      const document = createMockDocument();
      const rules = [
        {
          id: 'rule-1',
          checkType: 'required_presence',
          target: 'keyword',
          pattern: '保证金',
          severity: 'medium',
          message: '未提及保证金要求',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('未提及保证金要求');
      expect(findings[0].sourceType).toBe('system_rule');
    });
  });

  describe('structure_check checks', () => {
    it('should create finding with sourceType = "system_rule" when section content is too short', () => {
      const document = createMockDocument({
        budgetContent: '预算：50万。', // Very short content
      });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'structure_check',
          target: 'section_length',
          sectionPattern: '预算',
          minLength: 20,
          severity: 'low',
          message: '预算说明过于简短',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('预算说明过于简短');
      expect(findings[0].sourceType).toBe('system_rule');
      expect(findings[0].severity).toBe('low');
    });

    it('should not create finding when section content meets minimum length', () => {
      const document = createMockDocument({
        budgetContent: '本项目预算为人民币 500,000 元整，包含所有设备采购和安装费用。',
      });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'structure_check',
          target: 'section_length',
          sectionPattern: '预算',
          minLength: 20,
          severity: 'low',
          message: '预算说明过于简短',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(0);
    });

    it('should create finding when required section is missing', () => {
      const document = createMockDocument({ hasTermsSection: false });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'structure_check',
          target: 'required_section',
          sectionPattern: '合同条款',
          severity: 'critical',
          message: '缺少合同条款章节',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('缺少合同条款章节');
      expect(findings[0].severity).toBe('critical');
    });
  });

  describe('field_consistency checks', () => {
    it('should create finding with evidence and location when field values mismatch', () => {
      const document = createMockDocument({
        budgetContent: '预算金额：500,000 元',
        termsContent: '合同金额：450,000 元', // Mismatched amount
      });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'field_consistency',
          target: 'amount_match',
          fields: [
            { sectionPattern: '预算', extractPattern: '\\d{3},\\d{3}' },
            { sectionPattern: '合同', extractPattern: '\\d{3},\\d{3}' },
          ],
          severity: 'high',
          message: '预算金额与合同金额不一致',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('预算金额与合同金额不一致');
      expect(findings[0].sourceType).toBe('system_rule');
      expect(findings[0].severity).toBe('high');
      expect(findings[0].evidence).toBeInstanceOf(Array);
      expect(findings[0].evidence.length).toBeGreaterThan(0);
      expect(findings[0].location).not.toBeNull();
    });

    it('should not create finding when field values match', () => {
      const document = createMockDocument({
        budgetContent: '预算金额：500,000 元',
        termsContent: '合同金额：500,000 元', // Same amount
      });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'field_consistency',
          target: 'amount_match',
          fields: [
            { sectionPattern: '预算', extractPattern: '\\d{3},\\d{3}' },
            { sectionPattern: '合同', extractPattern: '\\d{3},\\d{3}' },
          ],
          severity: 'high',
          message: '预算金额与合同金额不一致',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(0);
    });

    it('should create finding when referenced section is missing for field check', () => {
      const document = createMockDocument({ hasBudgetSection: false });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'field_consistency',
          target: 'amount_match',
          fields: [
            { sectionPattern: '预算', extractPattern: '\\d+' },
            { sectionPattern: '合同', extractPattern: '\\d+' },
          ],
          severity: 'high',
          message: '无法核对金额一致性：缺少预算说明',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('无法核对金额一致性：缺少预算说明');
      expect(findings[0].sourceType).toBe('system_rule');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when no rules provided', () => {
      const document = createMockDocument();
      const findings = runRuleChecks(document, []);

      expect(findings).toEqual([]);
    });

    it('should return empty array when document has no segments', () => {
      const document = { id: 'doc-empty', segments: [] };
      const rules = [
        {
          id: 'rule-1',
          checkType: 'required_presence',
          target: 'keyword',
          pattern: '预算',
          severity: 'medium',
          message: '缺少预算说明',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('缺少预算说明');
    });

    it('should handle unknown checkType gracefully', () => {
      const document = createMockDocument();
      const rules = [
        {
          id: 'rule-1',
          checkType: 'unknown_type',
          target: 'something',
          severity: 'medium',
          message: 'Unknown check',
        },
      ];

      // Should not throw, just skip unknown check types
      const findings = runRuleChecks(document, rules);

      expect(findings).toEqual([]);
    });

    it('should process multiple rules and return all findings', () => {
      const document = createMockDocument({ hasTermsSection: false });
      const rules = [
        {
          id: 'rule-1',
          checkType: 'required_presence',
          target: 'keyword',
          pattern: '保证金',
          severity: 'medium',
          message: '未提及保证金',
        },
        {
          id: 'rule-2',
          checkType: 'structure_check',
          target: 'required_section',
          sectionPattern: '合同条款',
          severity: 'critical',
          message: '缺少合同条款',
        },
      ];

      const findings = runRuleChecks(document, rules);

      expect(findings).toHaveLength(2);
      expect(findings.map(f => f.title)).toContain('未提及保证金');
      expect(findings.map(f => f.title)).toContain('缺少合同条款');
    });
  });
});
