/**
 * Test Procurement Documents Fixtures
 * Exports file paths and content for test documents
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the path to a fixture file
 * @param {string} filename - The fixture filename
 * @returns {string} Full path to the fixture
 */
export function getFixturePath(filename) {
  return join(__dirname, filename);
}

/**
 * Load a fixture file as a File object
 * @param {string} filename - The fixture filename
 * @returns {File} File object for testing
 */
export function loadFixtureFile(filename) {
  const path = getFixturePath(filename);
  const buffer = readFileSync(path);
  return new File([buffer], filename, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    lastModified: Date.now()
  });
}

// Expected content for validation tests
export const expectedValidProcurementContent = {
  hasBudget: true,
  hasValidContact: true,
  hasCompleteTimeline: true,
  projectName: '智慧校园信息化建设项目',
  budget: '500 万元',
  contactName: '张三',
  contactPhone: '138-0000-1234',
  contactEmail: 'zhangsan@example.edu.cn'
};

export const expectedMissingBudgetContent = {
  hasBudget: false,
  hasValidContact: true,
  hasCompleteTimeline: true,
  projectName: '智慧校园信息化建设项目',
  budget: null,
  contactName: '李四',
  contactPhone: '139-0000-5678',
  contactEmail: 'lisi@example.edu.cn'
};

export const expectedInvalidContactContent = {
  hasBudget: true,
  hasValidContact: false,
  hasCompleteTimeline: true,
  projectName: '智慧校园信息化建设项目',
  budget: '500 万元',
  contactName: '王五',
  contactPhone: 'invalid-phone',
  contactEmail: 'not-an-email',
  contactAddress: ''
};

export const expectedIncompleteTimelineContent = {
  hasBudget: true,
  hasValidContact: true,
  hasCompleteTimeline: false,
  projectName: '智慧校园信息化建设项目',
  budget: '500 万元',
  contactName: '赵六',
  contactPhone: '137-0000-9999',
  contactEmail: 'zhaoliu@example.edu.cn',
  timelineIssues: ['投标截止日期', '开标日期', '合同签订日期', '项目完成期限']
};

// Export fixture metadata
export const FIXTURES = {
  validProcurement: {
    filename: 'valid-procurement.docx',
    description: 'A properly formatted procurement document with all required fields',
    expectedFindings: 0,
    expectedSeverity: 'none'
  },
  missingBudget: {
    filename: 'missing-budget.docx',
    description: 'Document missing budget information - should trigger finding',
    expectedFindings: 1,
    expectedSeverity: 'high',
    expectedFindingType: 'missing_budget'
  },
  invalidContact: {
    filename: 'invalid-contact.docx',
    description: 'Document with invalid contact information - should trigger finding',
    expectedFindings: 2,
    expectedSeverity: 'medium',
    expectedFindingTypes: ['invalid_phone', 'invalid_email', 'missing_address']
  },
  incompleteTimeline: {
    filename: 'incomplete-timeline.docx',
    description: 'Document with incomplete project timeline - should trigger finding',
    expectedFindings: 1,
    expectedSeverity: 'high',
    expectedFindingType: 'incomplete_timeline'
  },
  emergencyProcurement: {
    filename: 'emergency-procurement.docx',
    description: 'Emergency procurement with expedited timeline - tests emergency compliance rules',
    expectedFindings: 2,
    expectedSeverity: 'high',
    expectedFindingTypes: ['emergency_justification_insufficient', 'accelerated_timeline_risk'],
    tags: ['emergency', 'compliance', 'risk']
  },
  multiVendorBid: {
    filename: 'multi-vendor-bid.docx',
    description: 'Multi-vendor bidding process document - tests consortium and coordination rules',
    expectedFindings: 1,
    expectedSeverity: 'medium',
    expectedFindingTypes: ['consortium_agreement_incomplete'],
    tags: ['multi-vendor', 'consortium', 'coordination']
  },
  internationalSupplier: {
    filename: 'international-supplier.docx',
    description: 'International supplier with currency/translation issues - tests cross-border compliance',
    expectedFindings: 3,
    expectedSeverity: 'high',
    expectedFindingTypes: ['foreign_exchange_compliance', 'import_approval_missing', 'currency_risk'],
    tags: ['international', 'currency', 'compliance']
  },
  highValueContract: {
    filename: 'high-value-contract.docx',
    description: 'High-value contract requiring additional approvals - tests budget and authority rules',
    expectedFindings: 2,
    expectedSeverity: 'high',
    expectedFindingTypes: ['budget_verification_needed', 'approval_documentation_incomplete'],
    tags: ['high-value', 'budget', 'approval']
  }
};

// Helper to get all fixture files
export function getAllFixtures() {
  return Object.values(FIXTURES).map(fixture => ({
    ...fixture,
    file: loadFixtureFile(fixture.filename)
  }));
}

// Helper to get fixtures by tag
export function getFixturesByTag(tag) {
  return Object.values(FIXTURES)
    .filter(fixture => fixture.tags?.includes(tag))
    .map(fixture => ({
      ...fixture,
      file: loadFixtureFile(fixture.filename)
    }));
}

// Helper to get fixtures by severity
export function getFixturesBySeverity(severity) {
  return Object.values(FIXTURES)
    .filter(fixture => fixture.expectedSeverity === severity)
    .map(fixture => ({
      ...fixture,
      file: loadFixtureFile(fixture.filename)
    }));
}

// Demo scenarios mapping
export const DEMO_SCENARIOS = {
  budgetAnalysis: {
    name: '预算分析审查',
    description: '分析采购文档预算部分的合规性和风险',
    documents: ['high-value-contract.docx', 'international-supplier.docx'],
    exampleFile: 'docs/examples/budget-analysis-scenario.md'
  },
  complianceCheck: {
    name: '合规性检查',
    description: '全面检查采购文档的法规合规性',
    documents: ['emergency-procurement.docx', 'international-supplier.docx', 'multi-vendor-bid.docx'],
    exampleFile: 'docs/examples/compliance-check-scenario.md'
  },
  riskAssessment: {
    name: '风险评估',
    description: '识别和评估采购项目的各类风险',
    documents: ['high-value-contract.docx', 'emergency-procurement.docx', 'international-supplier.docx', 'multi-vendor-bid.docx'],
    exampleFile: 'docs/examples/risk-assessment-scenario.md'
  }
};
