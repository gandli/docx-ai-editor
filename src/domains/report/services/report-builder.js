/**
 * Report Builder Service
 *
 * Builds normalized ReviewReport objects from document, findings, and rule sets.
 * Supports procurement archive review and future scenarios like:
 * - 招标文件结构化填充 (structured tender document filling)
 * - 甲方视角合同审阅 (client-side contract review)
 */

import { createReviewReport } from '../../review/model/review-models';

// Severity priority order (higher = more critical)
const SEVERITY_PRIORITY = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Get severity priority value
 * @param {string} severity - Severity level
 * @returns {number} Priority value
 */
function getSeverityPriority(severity) {
  return SEVERITY_PRIORITY[severity] || 0;
}

/**
 * Sort findings by severity (critical first, then high, medium, low)
 * @param {Array} findings - Array of findings
 * @returns {Array} Sorted findings
 */
function sortFindingsBySeverity(findings) {
  return [...findings].sort((a, b) => {
    const priorityA = getSeverityPriority(a.severity);
    const priorityB = getSeverityPriority(b.severity);
    return priorityB - priorityA; // Descending order
  });
}

/**
 * Calculate summary statistics from findings
 * @param {Array} findings - Array of findings
 * @returns {Object} Summary statistics
 */
function calculateSummary(findings) {
  const totalFindings = findings.length;
  const openFindings = findings.filter(f => f.status === 'open').length;
  const dismissedFindings = findings.filter(f => f.status === 'dismissed').length;

  // Count by severity
  const bySeverity = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  };

  // Count by status
  const byStatus = {
    open: findings.filter(f => f.status === 'open').length,
    in_progress: findings.filter(f => f.status === 'in_progress').length,
    resolved: findings.filter(f => f.status === 'resolved').length,
    dismissed: findings.filter(f => f.status === 'dismissed').length,
  };

  return {
    totalFindings,
    openFindings,
    dismissedFindings,
    bySeverity,
    byStatus,
  };
}

/**
 * Calculate rule source metadata
 * @param {Array} ruleSets - Array of rule sets
 * @returns {Object} Metadata about rule sources
 */
function calculateRuleMetadata(ruleSets) {
  const ruleSourceCounts = {
    system: 0,
    user: 0,
  };

  let totalRules = 0;

  for (const ruleSet of ruleSets) {
    if (ruleSet.source === 'system') {
      ruleSourceCounts.system++;
    } else if (ruleSet.source === 'user') {
      ruleSourceCounts.user++;
    }

    if (Array.isArray(ruleSet.rules)) {
      totalRules += ruleSet.rules.length;
    }
  }

  return {
    ruleSourceCounts,
    totalRules,
  };
}

/**
 * Filter findings based on options
 * @param {Array} findings - Array of findings
 * @param {Object} options - Filter options
 * @returns {Array} Filtered findings
 */
function filterFindings(findings, options = {}) {
  if (!options.excludeDismissed) {
    return findings;
  }

  return findings.filter(f => f.status !== 'dismissed');
}

/**
 * Get high-risk findings (critical and high severity)
 * @param {Array} findings - Array of findings
 * @returns {Array} High-risk findings
 */
function getHighRiskFindings(findings) {
  return findings.filter(f => f.severity === 'critical' || f.severity === 'high');
}

/**
 * Build a review report from document, findings, and rule sets
 *
 * @param {Object} params - Build parameters
 * @param {Object} params.document - Document being reviewed
 * @param {Array} params.findings - Array of findings from review
 * @param {Array} params.ruleSets - Array of rule sets applied
 * @param {Object} [params.options={}] - Build options
 * @param {boolean} [params.options.excludeDismissed=false] - Whether to exclude dismissed findings
 * @returns {Object} Normalized ReviewReport object
 */
export function buildReviewReport({
  document,
  findings = [],
  ruleSets = [],
  options = {},
} = {}) {
  // Ensure arrays
  const safeFindings = Array.isArray(findings) ? findings : [];
  const safeRuleSets = Array.isArray(ruleSets) ? ruleSets : [];

  // Filter findings if needed
  const filteredFindings = filterFindings(safeFindings, options);

  // Sort findings by severity (high-risk first)
  const sortedFindings = sortFindingsBySeverity(filteredFindings);

  // Calculate summary
  const summary = calculateSummary(sortedFindings);

  // Calculate rule metadata
  const ruleMetadata = calculateRuleMetadata(safeRuleSets);

  // Get high-risk findings
  const highRiskFindings = getHighRiskFindings(sortedFindings);

  // Get current timestamps
  const now = new Date().toISOString();

  // Build the report using the normalized ReviewReport factory
  const report = createReviewReport({
    documentId: document?.id || '',
    documentName: document?.name || '',
    status: 'completed',
    findings: sortedFindings,
    summary: [], // Will be replaced with structured summary below
    ruleSets: safeRuleSets,
    generatedAt: now,
    completedAt: now,
  });

  // Replace summary with structured object and add metadata
  report.summary = summary;
  report.metadata = ruleMetadata;
  report.highRiskFindings = highRiskFindings;

  return report;
}
