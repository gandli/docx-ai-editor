/**
 * Rules Domain Normalizer
 *
 * Normalization helpers that return deterministic Rule / RuleSet structures.
 * Supports procurement review workflows (采购档案规范性评查, 招标文件结构化填充, 甲方视角合同审阅).
 */

// Valid check types for rule validation
const VALID_CHECK_TYPES = new Set([
  'semantic_review',
  'required_presence',
  'structure_check',
  'field_consistency',
]);

// Valid severity levels
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

// Valid rule sources
const VALID_RULE_SOURCES = new Set(['system', 'user']);

// Valid rule set sources
const VALID_RULESET_SOURCES = new Set(['system', 'user']);

/**
 * Generate a deterministic unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
  return `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalize a single rule into a deterministic structure
 * @param {Object|string} input - Rule input (object or string name)
 * @returns {Object} Normalized Rule object
 */
export function normalizeRule(input) {
  // Handle string-only input - normalize into a rule shell
  if (typeof input === 'string') {
    return {
      id: generateId(),
      name: input,
      description: '',
      checkType: 'semantic_review',
      severity: 'medium',
      source: 'user',
      target: null,
      params: {},
    };
  }

  // Handle object input
  const rule = input || {};

  // Validate and normalize checkType
  const checkType = VALID_CHECK_TYPES.has(rule.checkType)
    ? rule.checkType
    : 'semantic_review';

  // Validate and normalize severity
  const severity = VALID_SEVERITIES.has(rule.severity)
    ? rule.severity
    : 'medium';

  // Validate and normalize source
  const source = VALID_RULE_SOURCES.has(rule.source)
    ? rule.source
    : 'user';

  return {
    id: rule.id || generateId(),
    name: rule.name || '',
    description: rule.description || '',
    checkType,
    severity,
    source,
    target: rule.target || null,
    params: rule.params || {},
  };
}

/**
 * Normalize a rule set into a deterministic structure
 * @param {Object} input - RuleSet input
 * @returns {Object} Normalized RuleSet object
 */
export function normalizeRuleSet(input) {
  const ruleSet = input || {};

  // Validate and normalize source
  const source = VALID_RULESET_SOURCES.has(ruleSet.source)
    ? ruleSet.source
    : 'user';

  // Normalize rules array
  const rawRules = Array.isArray(ruleSet.rules) ? ruleSet.rules : [];
  const rules = rawRules.map(normalizeRule);

  return {
    id: ruleSet.id || generateId(),
    name: ruleSet.name || '',
    description: ruleSet.description || '',
    source,
    rules,
    active: ruleSet.active !== undefined ? Boolean(ruleSet.active) : true,
  };
}
