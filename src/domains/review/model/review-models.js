/**
 * Review Domain Models - Factory Helpers
 * 
 * Plain factory functions that normalize input into consistent review-domain objects.
 * Framework-agnostic and deterministic.
 */

/**
 * Create a normalized Finding object
 * @param {Object} options - Finding options
 * @param {string} options.title - Finding title
 * @param {string} options.description - Finding description
 * @param {string} [options.severity='medium'] - Severity level: low, medium, high, critical
 * @param {string} [options.status='open'] - Status: open, in_progress, resolved, dismissed
 * @param {string} [options.sourceType='hybrid'] - Source: system_rule, ai_review, user, hybrid
 * @param {number} [options.confidence=0.5] - Confidence score 0-1
 * @param {Array} [options.evidence=[]] - Evidence items
 * @param {Array} [options.tags=[]] - Tags for categorization
 * @param {Object|null} [options.location=null] - Location reference in document
 * @param {string|null} [options.category=null] - Category classification
 * @returns {Object} Normalized Finding object
 */
export function createFinding({
  title,
  description,
  severity = 'medium',
  status = 'open',
  sourceType = 'hybrid',
  confidence = 0.5,
  evidence = [],
  tags = [],
  location = null,
  category = null,
} = {}) {
  return {
    title: title ?? '',
    description: description ?? '',
    severity,
    status,
    sourceType,
    confidence,
    evidence: Array.isArray(evidence) ? evidence : [],
    tags: Array.isArray(tags) ? tags : [],
    location,
    category,
  };
}

/**
 * Create a normalized Suggestion object
 * @param {Object} options - Suggestion options
 * @param {string} options.text - Suggested text or change
 * @param {string} [options.status='open'] - Status: open, accepted, rejected, applied
 * @param {Array} [options.appliedChanges=[]] - List of applied changes
 * @param {string|null} [options.rationale=null] - Rationale for the suggestion
 * @param {Object|null} [options.location=null] - Location reference in document
 * @returns {Object} Normalized Suggestion object
 */
export function createSuggestion({
  text,
  status = 'open',
  appliedChanges = [],
  rationale = null,
  location = null,
} = {}) {
  return {
    text: text ?? '',
    status,
    appliedChanges: Array.isArray(appliedChanges) ? appliedChanges : [],
    rationale,
    location,
  };
}

/**
 * Create a normalized ReviewTask object
 * @param {Object} options - Review task options
 * @param {string} options.title - Task title
 * @param {string} [options.description=''] - Task description
 * @param {string} [options.status='open'] - Status: open, in_progress, completed, cancelled
 * @param {string} [options.sourceType='hybrid'] - Source: system_rule, ai_review, user, hybrid
 * @param {Array} [options.findings=[]] - Associated findings
 * @param {Array} [options.suggestions=[]] - Associated suggestions
 * @param {string|null} [options.assignedTo=null] - Assignee identifier
 * @param {string|null} [options.dueDate=null] - Due date (ISO string)
 * @returns {Object} Normalized ReviewTask object
 */
export function createReviewTask({
  title,
  description = '',
  status = 'open',
  sourceType = 'hybrid',
  findings = [],
  suggestions = [],
  assignedTo = null,
  dueDate = null,
} = {}) {
  return {
    title: title ?? '',
    description,
    status,
    sourceType,
    findings: Array.isArray(findings) ? findings : [],
    suggestions: Array.isArray(suggestions) ? suggestions : [],
    assignedTo,
    dueDate,
  };
}

/**
 * Create a normalized ReviewReport object
 * @param {Object} options - Review report options
 * @param {string} options.documentId - Reference to the reviewed document
 * @param {string} [options.documentName=''] - Document name
 * @param {string} [options.status='open'] - Status: open, in_progress, completed, archived
 * @param {Array} [options.findings=[]] - All findings in the review
 * @param {Array} [options.summary=[]] - Summary points
 * @param {Array} [options.ruleSets=[]] - Applied rule sets
 * @param {string|null} [options.generatedAt=null] - Generation timestamp (ISO string)
 * @param {string|null} [options.completedAt=null] - Completion timestamp (ISO string)
 * @returns {Object} Normalized ReviewReport object
 */
export function createReviewReport({
  documentId,
  documentName = '',
  status = 'open',
  findings = [],
  summary = [],
  ruleSets = [],
  generatedAt = null,
  completedAt = null,
} = {}) {
  return {
    documentId: documentId ?? '',
    documentName,
    status,
    findings: Array.isArray(findings) ? findings : [],
    summary: Array.isArray(summary) ? summary : [],
    ruleSets: Array.isArray(ruleSets) ? ruleSets : [],
    generatedAt,
    completedAt,
  };
}

/**
 * Default rules for procurement document review
 */
export const defaultRules = [
  {
    id: 'budget-section-required',
    checkType: 'required_presence',
    target: 'section',
    pattern: '预算',
    severity: 'high',
    message: '缺少预算部分',
  },
  {
    id: 'vendor-section-required',
    checkType: 'required_presence',
    target: 'section',
    pattern: '供应商',
    severity: 'high',
    message: '缺少供应商部分',
  },
  {
    id: 'timeline-section-required',
    checkType: 'required_presence',
    target: 'section',
    pattern: '时间安排',
    severity: 'medium',
    message: '缺少时间安排部分',
  },
  {
    id: 'cost-analysis-required',
    checkType: 'structure_check',
    target: 'section_length',
    sectionPattern: '成本分析',
    minLength: 50,
    severity: 'medium',
    message: '成本分析部分太短',
  },
  {
    id: 'approval-section-required',
    checkType: 'required_presence',
    target: 'section',
    pattern: '审批',
    severity: 'high',
    message: '缺少审批部分',
  },
];
