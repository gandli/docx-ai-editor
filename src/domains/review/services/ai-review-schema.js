/**
 * AI Review Schema Normalization
 *
 * Sanitizes untrusted AI output before UI consumption.
 * Defensive: malformed payloads must not crash the app.
 *
 * This module is designed to be generic enough for future scenarios like:
 * - 招标文件结构化填充 (structured procurement document filling)
 * - 甲方视角合同审阅 (client-side contract review)
 */

import { createFinding } from '../model/review-models.js';

/**
 * Valid severity levels
 * @type {string[]}
 */
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Normalizes a single AI finding item
 * @param {unknown} item - Raw finding item from AI output
 * @returns {Object|null} Normalized finding or null if invalid
 */
function normalizeFindingItem(item) {
  // Must be an object
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  // Required fields: title and description must be non-empty strings
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const description = typeof item.description === 'string' ? item.description.trim() : '';

  if (!title || !description) {
    return null;
  }

  // Validate and correct severity
  let severity = item.severity;
  if (!VALID_SEVERITIES.includes(severity)) {
    severity = 'medium';
  }

  // Normalize location with safe fallback
  const location = normalizeLocation(item.location);

  // Normalize evidence to array
  const evidence = Array.isArray(item.evidence) ? item.evidence : [];

  // Normalize tags to array
  const tags = Array.isArray(item.tags) ? item.tags : [];

  // Normalize confidence to number between 0 and 1
  const confidence = normalizeConfidence(item.confidence);

  // Build normalized finding using the factory
  return createFinding({
    title,
    description,
    severity,
    status: item.status || 'open',
    sourceType: 'ai_review',
    confidence,
    evidence,
    tags,
    location,
    category: item.category || null,
  });
}

/**
 * Normalizes location data with safe fallback
 * @param {unknown} location - Raw location from AI output
 * @returns {Object} Normalized location object
 */
function normalizeLocation(location) {
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return {
      segmentId: null,
      anchorText: null,
      fallback: true,
    };
  }

  const segmentId = location.segmentId ?? null;
  const anchorText = location.anchorText ?? null;

  return {
    segmentId: typeof segmentId === 'string' ? segmentId : null,
    anchorText: typeof anchorText === 'string' ? anchorText : null,
    fallback: false,
  };
}

/**
 * Normalizes confidence value to a number between 0 and 1
 * @param {unknown} confidence - Raw confidence value
 * @returns {number} Normalized confidence (0-1)
 */
function normalizeConfidence(confidence) {
  let value = typeof confidence === 'number' ? confidence : parseFloat(confidence);

  if (Number.isNaN(value)) {
    return 0.5;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, value));
}

/**
 * Normalizes AI review result payload
 * @param {unknown} payload - Raw AI output payload
 * @returns {Object} Normalized result with findings array
 */
export function normalizeAIReviewResult(payload) {
  // Defensive: handle null, undefined, or non-object payloads
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { findings: [] };
  }

  // Ensure findings is an array
  const rawFindings = payload.findings;
  if (!Array.isArray(rawFindings)) {
    return { findings: [] };
  }

  // Normalize each finding, filtering out invalid ones
  const findings = rawFindings
    .map((item) => normalizeFindingItem(item))
    .filter((finding) => finding !== null);

  return { findings };
}
