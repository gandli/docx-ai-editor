/**
 * Mock AI Review Implementation
 * Generates realistic findings based on document content when API key is not available
 */

import { normalizeAIReviewResult } from '../domains/review/services/ai-review-schema.js';

/**
 * Generates mock AI findings based on document content
 * @param {Object} document - The parsed document object
 * @returns {Array} Array of mock findings
 */
export function generateMockFindings(document) {
  if (!document || !document.segments) {
    return [];
  }

  const findings = [];
  let findingId = 1;

  // Analyze document segments to generate relevant mock findings
  for (const segment of document.segments) {
    if (!segment.text) continue;
    
    const text = segment.text.toLowerCase();
    
    // Generate findings based on content patterns (both English and Chinese)
    if (text.includes('missing') || text.includes('budget') || text.includes('expense') || 
        text.includes('缺少') || text.includes('预算') || text.includes('费用') || text.includes('经费')) {
      // More likely to generate findings for documents mentioning missing budgets
      findings.push({
        id: `mock-${findingId++}`,
        type: 'content_issue',
        severity: 'high',
        title: '预算相关内容可能需要补充',
        description: `在 "${segment.text.substring(0, 50)}..." 段落中提到了预算相关的内容，建议详细说明预算分配和使用计划。`,
        suggestions: [
          '明确列出具体金额',
          '添加预算合理性说明',
          '提供成本效益分析'
        ],
        context: segment.text,
        status: 'open',
        category: 'completeness',
        priority: 2
      });
    }
    
    if (text.includes('error') || text.includes('issue') || text.includes('problem') ||
        text.includes('错误') || text.includes('问题') || text.includes('故障')) {
      findings.push({
        id: `mock-${findingId++}`,
        type: 'content_issue',
        severity: 'medium',
        title: '潜在问题描述需完善',
        description: `段落 "${segment.text.substring(0, 50)}..." 中提到问题但缺乏具体解决方案。`,
        suggestions: [
          '提供具体的解决步骤',
          '添加时间线规划',
          '指定负责人'
        ],
        context: segment.text,
        status: 'open',
        category: 'clarity',
        priority: 1
      });
    }
    
    // Check for very long paragraphs that might benefit from structuring
    if (segment.text && segment.text.length > 300) {
      findings.push({
        id: `mock-${findingId++}`,
        type: 'structure_issue',
        severity: 'low',
        title: '段落过长影响可读性',
        description: `检测到较长的段落，建议拆分为多个小段落以提高可读性。`,
        suggestions: [
          '将段落按主题拆分',
          '添加子标题',
          '使用列表形式呈现要点'
        ],
        context: segment.text.substring(0, 100) + '...',
        status: 'open',
        category: 'structure',
        priority: 0
      });
    }
    
    // Check for incomplete sentences or fragments
    if (segment.text && (segment.text.endsWith('...') || segment.text.match(/etc\.?$/))) {
      findings.push({
        id: `mock-${findingId++}`,
        type: 'completeness_issue',
        severity: 'medium',
        title: '内容可能不完整',
        description: `检测到不完整的表述 "${segment.text.substring(0, 50)}..."，建议补充完整信息。`,
        suggestions: [
          '完成未完的表述',
          '提供完整的信息',
          '删除模糊的结尾'
        ],
        context: segment.text,
        status: 'open',
        category: 'completeness',
        priority: 1
      });
    }
  }
  
  // Only add the "too short" finding if no other specific findings were generated
  if (findings.length === 0 && document.metadata?.wordCount < 50) {
    findings.push({
      id: `mock-${findingId++}`,
      type: 'completeness_issue',
      severity: 'medium',
      title: '文档内容可能过于简短',
      description: `当前文档字数较少（${document.metadata.wordCount} 字），可能需要补充更多细节。`,
      suggestions: [
        '扩展关键概念',
        '提供更多背景信息',
        '添加实例说明'
      ],
      context: '文档整体',
      status: 'open',
      category: 'completeness',
      priority: 1
    });
  }
  
  // If no findings were generated at all, add some general ones
  if (findings.length === 0) {
    findings.push({
      id: `mock-${findingId++}`,
      type: 'style_suggestion',
      severity: 'low',
      title: '文档结构建议',
      description: '文档结构清晰，建议保持一致的格式风格。',
      suggestions: [
        '统一标题层级',
        '保持段落长度适中',
        '检查拼写和语法'
      ],
      context: '文档整体',
      status: 'open',
      category: 'style',
      priority: 0
    });
  }
  
  return findings;
}

/**
 * Mock AI review function that returns realistic findings based on document content
 * @param {File} docxFile - The uploaded DOCX file
 * @param {string} userPrompt - The user's prompt
 * @returns {Promise<Object>} Mock AI response with findings
 */
export async function mockAnalyzeDocument(docxFile, userPrompt) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // We can't extract content from the file directly here without importing utils
  // So we'll return a generic response structure
  const mockResponse = {
    summary: '基于文档内容的AI分析结果（模拟模式）',
    findings: [],
    suggestions: []
  };
  
  return JSON.stringify(mockResponse);
}

/**
 * Mock review function that integrates with the review orchestrator
 * @param {Object} document - The parsed document
 * @returns {Promise<Object>} Normalized mock review result
 */
export async function runMockReview(document) {
  try {
    // Generate mock findings based on document content
    const mockFindings = generateMockFindings(document);
    
    // Normalize the findings to match expected format
    const mockResult = {
      findings: mockFindings,
      summary: `生成了 ${mockFindings.length} 条基于内容的模拟发现`,
      source: 'mock-ai'
    };
    
    // Normalize to ensure consistent format
    const normalizedResult = normalizeAIReviewResult(mockResult);
    
    return normalizedResult;
  } catch (error) {
    console.error('Error in mock review:', error);
    
    // Return a safe fallback result
    return {
      findings: [{
        id: 'mock-error-fallback',
        type: 'informational',
        severity: 'low',
        title: '模拟模式说明',
        description: '由于未配置API密钥，系统当前运行在模拟模式下。真实环境中将提供AI驱动的详细分析。',
        suggestions: ['配置OpenRouter API密钥以获得真实AI分析结果'],
        context: '系统状态',
        status: 'open',
        category: 'information',
        priority: 0
      }],
      summary: '模拟模式运行',
      source: 'mock-ai'
    };
  }
}
