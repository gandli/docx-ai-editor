/**
 * Merges rule findings and AI findings into a unified model.
 * 
 * The merger uses a key based on title + location + category to identify duplicate findings.
 * When duplicates are found, they are merged with the following precedence rules:
 * 1. Evidence arrays are combined
 * 2. Higher severity wins
 * 3. User-rule findings take precedence over system-rule findings
 * 4. Unresolved conflicts are marked as needs_review
 * 
 * @param {Array} ruleFindings - Array of findings from rule checks
 * @param {Array} aiFindings - Array of findings from AI review
 * @returns {Array} - Merged array of findings
 */
export function mergeFindings(ruleFindings = [], aiFindings = []) {
  // Combine all findings with a source identifier
  const allFindings = [
    ...ruleFindings.map(finding => ({ ...finding, sourceOrigin: 'rule' })),
    ...aiFindings.map(finding => ({ ...finding, sourceOrigin: 'ai' }))
  ];

  // Group findings by key (title + location + category)
  const groupedFindings = {};
  
  allFindings.forEach(finding => {
    const key = `${finding.title}-${finding.location}-${finding.category}`;
    
    if (!groupedFindings[key]) {
      groupedFindings[key] = [];
    }
    
    groupedFindings[key].push(finding);
  });

  // Process each group to merge findings
  const mergedFindings = [];
  
  Object.values(groupedFindings).forEach(group => {
    if (group.length === 1) {
      // No duplicates, just add the single finding
      const finding = { ...group[0] };
      delete finding.sourceOrigin; // Remove temporary field
      mergedFindings.push(finding);
    } else {
      // Multiple findings with same key, need to merge
      const merged = mergeGroup(group);
      mergedFindings.push(merged);
    }
  });

  return mergedFindings;
}

/**
 * Merges a group of findings that have the same key (title + location + category)
 */
function mergeGroup(findings) {
  // Start with the first finding as base
  let base = { ...findings[0] };
  delete base.sourceOrigin; // Remove temporary field
  
  // Collect all evidence
  let allEvidence = [...(base.evidence || [])];
  let allSources = [base.sourceType || 'unknown'];
  
  // Process other findings in the group
  for (let i = 1; i < findings.length; i++) {
    const current = { ...findings[i] };
    delete current.sourceOrigin; // Remove temporary field
    
    // Combine evidence
    if (current.evidence && Array.isArray(current.evidence)) {
      allEvidence = [...new Set([...allEvidence, ...current.evidence])]; // Deduplicate
    }
    
    allSources.push(current.sourceType || 'unknown');
    
    // Determine severity precedence (critical > high > medium > low)
    base.severity = getHigherSeverity(base.severity, current.severity);
    
    // Handle other properties based on source precedence
    base = mergeFindingProperties(base, current);
  }
  
  // Update evidence array with combined evidence
  base.evidence = allEvidence;
  
  // Mark as needs_review if there are unresolved conflicts
  if (hasUnresolvedConflicts(findings)) {
    base.status = base.status || 'needs_review';
  }
  
  return base;
}

/**
 * Determines which severity is higher
 */
function getHigherSeverity(severity1, severity2) {
  const severityOrder = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  
  const level1 = severityOrder[severity1] || 0;
  const level2 = severityOrder[severity2] || 0;
  
  // Return the severity with higher priority
  return level1 >= level2 ? severity1 : severity2;
}

/**
 * Merges properties of two findings based on precedence rules
 */
function mergeFindingProperties(base, current) {
  // Define source precedence: user_rule > ai_review > system_rule
  const sourcePrecedence = {
    'user_rule': 3,
    'ai_review': 2,
    'system_rule': 1
  };
  
  const basePriority = sourcePrecedence[base.sourceType] || 0;
  const currentPriority = sourcePrecedence[current.sourceType] || 0;
  
  // When current has higher or equal priority, update base properties
  if (currentPriority > basePriority) {
    // Copy over properties from current to base, but preserve some
    Object.keys(current).forEach(key => {
      if (key !== 'evidence') { // Evidence is handled separately
        base[key] = current[key];
      }
    });
  } else if (basePriority > currentPriority) {
    // Base has higher priority, keep base properties
    // We already started with base, so we just need to make sure we don't override
  } else {
    // Same priority, use more complete information where possible
    // For now, just ensure we have all necessary fields
    Object.keys(current).forEach(key => {
      if (key !== 'evidence' && !base.hasOwnProperty(key)) {
        base[key] = current[key];
      }
    });
  }
  
  return base;
}

/**
 * Checks if there are unresolved conflicts in a group of findings
 */
function hasUnresolvedConflicts(findings) {
  // Check if there are different descriptions or other conflicting details
  // when the findings have the same severity and source priority
  
  const uniqueDescriptions = new Set(
    findings
      .filter(f => f.description)
      .map(f => f.description)
  );
  
  // If there are multiple different descriptions and same severity/source priority,
  // it might indicate a conflict that needs review
  if (uniqueDescriptions.size > 1) {
    // Check if the findings have the same severity and similar source priorities
    const severities = [...new Set(findings.map(f => f.severity))];
    const sourceTypes = [...new Set(findings.map(f => f.sourceType))];
    
    // If all have same severity and same source type (or similar priority sources),
    // mark as needs review
    if (severities.length === 1) {
      return true;
    }
  }
  
  return false;
}