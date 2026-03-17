import { createFinding } from '../model/review-models.js';

/**
 * Deterministic Rule Engine MVP
 *
 * Synchronous rule engine that performs explicit checks on document segments.
 * Supports:
 * - required_presence: Check for required sections or keywords
 * - structure_check: Validate document structure (section length, required sections)
 * - field_consistency: Check consistency between fields across sections
 *
 * @param {Object} document - Document with segments array
 * @param {Array} rules - Array of rule definitions
 * @returns {Array} Array of Finding objects
 */
export function runRuleChecks(document, rules) {
  if (!rules || rules.length === 0) {
    return [];
  }

  const findings = [];
  const segments = document?.segments || [];

  for (const rule of rules) {
    const result = evaluateRule(rule, segments, document);
    if (result) {
      findings.push(result);
    }
  }

  return findings;
}

/**
 * Evaluate a single rule against document segments
 * @param {Object} rule - Rule definition
 * @param {Array} segments - Document segments
 * @param {Object} document - Full document for context
 * @returns {Object|null} Finding object or null if no issue
 */
function evaluateRule(rule, segments, document) {
  switch (rule.checkType) {
    case 'required_presence':
      return evaluateRequiredPresence(rule, segments);
    case 'structure_check':
      return evaluateStructureCheck(rule, segments);
    case 'field_consistency':
      return evaluateFieldConsistency(rule, segments);
    default:
      // Unknown check type - skip gracefully
      return null;
  }
}

/**
 * Evaluate required_presence rule
 * Checks if a section heading or keyword exists in the document
 */
function evaluateRequiredPresence(rule, segments) {
  const { target, pattern, severity, message } = rule;

  if (!pattern || !message) {
    return null;
  }

  let found = false;

  for (const segment of segments) {
    if (target === 'section' && segment.type === 'heading') {
      if (segment.text.includes(pattern)) {
        found = true;
        break;
      }
    } else if (target === 'keyword') {
      // Check in any text content
      if (segment.text && segment.text.includes(pattern)) {
        found = true;
        break;
      }
    }
  }

  if (!found) {
    return createFinding({
      title: message,
      description: `Required ${target} "${pattern}" was not found in the document.`,
      severity: severity || 'medium',
      sourceType: 'system_rule',
      category: 'missing_content',
      evidence: [
        {
          type: 'rule_reference',
          content: `Rule ${rule.id || 'unknown'}: ${rule.checkType} check for "${pattern}"`,
        },
      ],
    });
  }

  return null;
}

/**
 * Evaluate structure_check rule
 * Checks section length, required sections, etc.
 */
function evaluateStructureCheck(rule, segments) {
  const { target, sectionPattern, minLength, severity, message } = rule;

  if (!message) {
    return null;
  }

  if (target === 'section_length') {
    // Find the section and check its content length
    let sectionContent = '';
    let inTargetSection = false;
    let targetSectionId = null;

    for (const segment of segments) {
      if (segment.type === 'heading') {
        inTargetSection = segment.text.includes(sectionPattern);
        if (inTargetSection) {
          targetSectionId = segment.id;
        }
      } else if (inTargetSection && segment.type === 'paragraph') {
        sectionContent += segment.text;
      }
    }

    if (targetSectionId && sectionContent.length < (minLength || 10)) {
      return createFinding({
        title: message,
        description: `Section "${sectionPattern}" content is too short (${sectionContent.length} chars, minimum ${minLength || 10}).`,
        severity: severity || 'low',
        sourceType: 'system_rule',
        category: 'structure',
        location: {
          segmentId: targetSectionId,
          type: 'section',
        },
        evidence: [
          {
            type: 'content_sample',
            content: sectionContent.slice(0, 100),
          },
        ],
      });
    }
  } else if (target === 'required_section') {
    // Check if required section exists
    let found = false;
    let sectionId = null;

    for (const segment of segments) {
      if (segment.type === 'heading' && segment.text.includes(sectionPattern)) {
        found = true;
        sectionId = segment.id;
        break;
      }
    }

    if (!found) {
      return createFinding({
        title: message,
        description: `Required section "${sectionPattern}" is missing from the document structure.`,
        severity: severity || 'high',
        sourceType: 'system_rule',
        category: 'structure',
        evidence: [
          {
            type: 'available_headings',
            content: segments
              .filter(s => s.type === 'heading')
              .map(s => s.text)
              .join(', '),
          },
        ],
      });
    }
  }

  return null;
}

/**
 * Evaluate field_consistency rule
 * Checks if values across different sections are consistent
 */
function evaluateFieldConsistency(rule, segments) {
  const { fields, severity, message } = rule;

  if (!fields || fields.length < 2 || !message) {
    return null;
  }

  const extractedValues = [];
  const evidence = [];

  for (const field of fields) {
    const { sectionPattern, extractPattern } = field;

    // Find the section and extract value
    let inTargetSection = false;
    let sectionId = null;
    let sectionContent = '';

    for (const segment of segments) {
      if (segment.type === 'heading') {
        inTargetSection = segment.text.includes(sectionPattern);
        if (inTargetSection) {
          sectionId = segment.id;
        }
      } else if (inTargetSection && segment.type === 'paragraph') {
        sectionContent += segment.text;
      }
    }

    if (!sectionId) {
      // Section not found - create finding
      return createFinding({
        title: message,
        description: `Cannot check consistency: section matching "${sectionPattern}" was not found.`,
        severity: severity || 'high',
        sourceType: 'system_rule',
        category: 'consistency',
        evidence: [
          {
            type: 'missing_section',
            content: `Section pattern: ${sectionPattern}`,
          },
        ],
      });
    }

    // Extract value using regex pattern
    let extractedValue = null;
    if (extractPattern) {
      try {
        const regex = new RegExp(extractPattern);
        const match = sectionContent.match(regex);
        extractedValue = match ? match[0] : null;
      } catch (e) {
        // Invalid regex - skip extraction
        extractedValue = null;
      }
    }

    extractedValues.push({
      sectionPattern,
      sectionId,
      value: extractedValue,
      content: sectionContent.slice(0, 200),
    });

    evidence.push({
      type: 'extracted_value',
      content: `From "${sectionPattern}": ${extractedValue || 'not found'}`,
    });
  }

  // Check if all values match
  const nonNullValues = extractedValues.filter(v => v.value !== null);

  if (nonNullValues.length >= 2) {
    const firstValue = nonNullValues[0].value;
    const allMatch = nonNullValues.every(v => v.value === firstValue);

    if (!allMatch) {
      // Find the first mismatch for location
      const mismatch = extractedValues.find(v => v.value !== firstValue);

      return createFinding({
        title: message,
        description: `Field values do not match across sections. Expected "${firstValue}" but found inconsistencies.`,
        severity: severity || 'high',
        sourceType: 'system_rule',
        category: 'consistency',
        location: mismatch
          ? {
              segmentId: mismatch.sectionId,
              type: 'section',
            }
          : null,
        evidence,
      });
    }
  }

  return null;
}
