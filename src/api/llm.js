// LLM API 集成 - OpenRouter 多模型支持
import { extractTextFromDocx } from './docx-utils'
import { runMockReview } from './mock-ai-review.js'

// OpenRouter API 配置
const OPENROUTER_BASE_URL = import.meta.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY
const SITE_URL = import.meta.env.OPENROUTER_SITE_URL || 'http://localhost:5173'
const SITE_NAME = import.meta.env.OPENROUTER_SITE_NAME || 'DOCX AI Editor'

// 支持的模型配置（OpenRouter 模型）
export const MODEL_CONFIGS = {
  'qwen/qwen3-max': {
    id: 'qwen/qwen3-max',
    name: 'Qwen3 Max',
    provider: 'Alibaba',
    contextWindow: 256000,
    pricing: { prompt: 0.0000016, completion: 0.0000064 }
  },
  'anthropic/claude-opus': {
    id: 'anthropic/claude-opus',
    name: 'Claude Opus',
    provider: 'Anthropic',
    contextWindow: 200000,
    pricing: { prompt: 0.000015, completion: 0.000075 }
  },
  'google/gemini-2.5-pro-exp-03-25': {
    id: 'google/gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 1000000,
    pricing: { prompt: 0.00000125, completion: 0.00001 }
  },
  'meta-llama/llama-3.3-70b-instruct': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    contextWindow: 128000,
    pricing: { prompt: 0.0000008, completion: 0.0000008 }
  },
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    contextWindow: 128000,
    pricing: { prompt: 0.00000027, completion: 0.0000011 }
  }
}

// 默认模型
export const DEFAULT_MODEL = 'qwen/qwen3-max'

/**
 * 验证 API 密钥是否配置
 * @returns {boolean} 是否已配置
 */
export function isApiKeyConfigured() {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'sk-or-v1-your-api-key-here'
}

/**
 * 获取 API 密钥
 * @returns {string} API 密钥
 */
export function getApiKey() {
  return OPENROUTER_API_KEY
}

/**
 * 获取支持的模型列表
 * @returns {Array} 模型配置数组
 */
export function getSupportedModels() {
  return Object.values(MODEL_CONFIGS).map(model => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    contextWindow: model.contextWindow,
    pricing: model.pricing
  }))
}

/**
 * 验证模型是否支持
 * @param {string} modelId - 模型 ID
 * @returns {boolean} 是否支持
 */
export function isModelSupported(modelId) {
  return modelId in MODEL_CONFIGS
}

/**
 * 获取模型配置
 * @param {string} modelId - 模型 ID
 * @returns {Object} 模型配置
 */
export function getModelConfig(modelId) {
  return MODEL_CONFIGS[modelId] || null
}

/**
 * 调用 OpenRouter API（非流式）
 * @param {Object} options - 请求选项
 * @param {string} options.model - 模型 ID
 * @param {Array} options.messages - 消息数组
 * @param {number} options.temperature - 温度（0-2）
 * @param {number} options.maxTokens - 最大 token 数
 * @returns {Promise<string>} AI 响应文本
 */
export async function callLLM({
  model = DEFAULT_MODEL,
  messages,
  temperature = 0.7,
  maxTokens = 2000
}) {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenRouter API 密钥未配置。请设置 OPENROUTER_API_KEY 环境变量。')
  }

  if (!isModelSupported(model)) {
    throw new Error(`不支持的模型：${model}`)
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `OpenRouter API 错误 (${response.status}): ${errorData.error?.message || response.statusText}`
    )
  }

  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
}

/**
 * 分析文档（非流式）
 * @param {File} docxFile - DOCX 文件
 * @param {string} userPrompt - 用户提示
 * @param {string} selectedModel - 选中的模型
 * @param {boolean} useMock - 是否使用模拟模式
 * @returns {Promise<string>} AI 响应文本
 */
export async function analyzeDocument(docxFile, userPrompt, selectedModel = DEFAULT_MODEL, useMock = false) {
  try {
    // 如果启用模拟模式，返回模拟响应
    if (useMock) {
      // For now, return a basic mock response. In a more sophisticated implementation,
      // we might need to extract text and generate more context-aware mock findings.
      const mockResponse = {
        summary: '基于文档内容的AI分析结果（模拟模式）',
        findings: [
          {
            id: 'mock-finding-1',
            type: 'style_suggestion',
            severity: 'medium',
            title: '文档结构建议',
            description: '文档整体结构良好，建议保持当前的组织方式。',
            suggestions: [
              '保持段落间的逻辑连贯性',
              '适当使用标题层级来组织内容',
              '考虑添加摘要部分'
            ],
            context: '文档整体',
            status: 'open',
            category: 'structure',
            priority: 1
          },
          {
            id: 'mock-finding-2',
            type: 'content_issue',
            severity: 'low',
            title: '表达优化建议',
            description: '某些句子可以更加简洁明了。',
            suggestions: [
              '简化复杂的句子结构',
              '使用更精确的词汇',
              '保持一致的语调'
            ],
            context: '文档正文',
            status: 'open',
            category: 'style',
            priority: 0
          }
        ],
        suggestions: ['考虑添加图表来辅助说明', '优化段落开头的过渡']
      };
      
      return JSON.stringify(mockResponse);
    }
    
    // 1. 提取 DOCX 文本内容
    const docxText = await extractTextFromDocx(docxFile)
    
    // 2. 构建分析提示
    const systemPrompt = `你是一个专业的文档编辑助手。请分析以下文档并提供改进建议。

你的职责包括：
1. 语法校对 - 指出并修正语法错误
2. 风格润色 - 优化表达方式，使文字更流畅
3. 内容优化 - 提供内容改进建议
4. 格式建议 - 如有必要，提供格式调整建议

请用中文回复，保持专业友好的语气。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `文档内容：\n${docxText}\n\n用户请求：${userPrompt}` }
    ]
    
    // 3. 调用 LLM API
    const result = await callLLM({
      model: selectedModel,
      messages,
      temperature: 0.7,
      maxTokens: 2000
    })
    
    return result
    
  } catch (error) {
    console.error('LLM API error:', error)
    // 如果是在模拟模式下出现错误，返回安全的模拟响应而不是抛出错误
    if (useMock) {
      return JSON.stringify({
        summary: '模拟模式运行（API不可用）',
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
        suggestions: ['配置有效的API密钥以获得真实分析结果']
      });
    }
    // 如果不是在模拟模式下，抛出错误以便上层处理
    throw error
  }
}

/**
 * 文档修改应用函数
 * @param {File} originalDocx - 原始文档
 * @param {string} aiSuggestions - AI 建议
 * @returns {Promise<File>} 修改后的文档
 */
export async function applyDocumentChanges(originalDocx, aiSuggestions) {
  // TODO: 使用 SuperDoc 的 Headless 模式应用修改
  // 这将利用 SuperDoc 的原生 DOCX 处理能力
  console.log('Applying changes to document...')
  console.log('Suggestions:', aiSuggestions)
  return originalDocx // 返回修改后的文档
}
