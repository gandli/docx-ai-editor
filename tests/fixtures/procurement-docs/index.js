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
  }
};

// Helper to get all fixture files
export function getAllFixtures() {
  return Object.values(FIXTURES).map(fixture => ({
    ...fixture,
    file: loadFixtureFile(fixture.filename)
  }));
}
