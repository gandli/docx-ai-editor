import { runRuleChecks } from './rule-engine';
import { normalizeAIReviewResult } from './ai-review-schema';
import { mergeFindings } from './finding-merger';

/**
 * Runs a complete review session combining rule-based and AI-based analysis
 * @param {Object} params - The review session parameters
 * @param {Object} params.document - The document to review
 * @param {Array} params.rules - Array of rules to apply
 * @param {Function} params.aiReviewer - Async function that reviews the document and returns findings
 * @returns {Promise<Object>} Object containing findings and summary statistics
 */
export async function runReviewSession({ document, rules, aiReviewer }) {
  // Run rule-based checks
  const ruleFindings = runRuleChecks(document, rules);
  
  let aiFindings = [];
  let aiErrors = 0;
  
  try {
    // Run AI review
    const rawAIResult = await aiReviewer(document);
    
    // Normalize AI output to prevent malformed findings from breaking the UI
    const normalizedAIResult = normalizeAIReviewResult(rawAIResult);
    aiFindings = normalizedAIResult.findings || [];
  } catch (error) {
    console.warn('AI reviewer failed, proceeding with rule-only findings:', error);
    aiErrors = 1;
  }
  
  // Merge rule and AI findings
  let mergedFindings = [...ruleFindings]; // Start with rule findings
  
  if (aiFindings.length > 0) {
    mergedFindings = mergeFindings(ruleFindings, aiFindings);
  }
  
  // Generate summary statistics
  const summary = {
    totalFindings: mergedFindings.length,
    ruleFindings: ruleFindings.length,
    aiFindings: aiFindings.length,
    aiErrors,
    timestamp: new Date().toISOString()
  };
  
  return {
    findings: mergedFindings,
    summary
  };
}