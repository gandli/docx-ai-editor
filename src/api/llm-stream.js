// LLM 流式 API 集成 - OpenRouter 流式响应
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { extractTextFromDocx } from './docx-utils'
import { MODEL_CONFIGS, DEFAULT_MODEL, isApiKeyConfigured, isModelSupported } from './llm'

// OpenRouter API 配置
const OPENROUTER_BASE_URL = import.meta.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * 创建 OpenRouter 客户端
 * @returns {Object} OpenAI 兼容客户端
 */
function createOpenRouterClient() {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenRouter API 密钥未配置。请设置 OPENROUTER_API_KEY 环境变量。')
  }

  return createOpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY
  })
}

/**
 * 带重试的流式调用
 * @param {Function} fn - 要执行的函数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise} 重试后的结果
 */
async function withRetry(fn, maxRetries = MAX_RETRIES) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 如果是 API 密钥错误，不重试
      if (error.message.includes('API 密钥未配置')) {
        throw error
      }
      
      // 如果是 4xx 错误（除了 429），不重试
      if (error.message.includes('4') && !error.message.includes('429')) {
        throw error
      }
      
      // 最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw new Error(`请求失败（已重试 ${maxRetries} 次）: ${lastError.message}`)
      }
      
      // 等待后重试（指数退避）
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`重试 ${attempt}/${maxRetries}，等待 ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * 流式分析文档
 * @param {string} documentText - 文档文本内容
 * @param {string} userPrompt - 用户提示
 * @param {string} selectedModel - 选中的模型
 * @returns {Promise<Object>} 流式响应结果
 */
export async function analyzeDocumentStream(documentText, userPrompt, selectedModel = DEFAULT_MODEL) {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenRouter API 密钥未配置。请设置 OPENROUTER_API_KEY 环境变量。')
  }

  if (!isModelSupported(selectedModel)) {
    throw new Error(`不支持的模型：${selectedModel}`)
  }

  return withRetry(async () => {
    try {
      const openrouter = createOpenRouterClient()
      const model = openrouter(selectedModel)

      // 构建系统提示
      const systemPrompt = `你是一个专业的文档编辑助手。请分析用户提供的文档并提供改进建议。
    
你的职责包括：
1. 语法校对 - 指出并修正语法错误
2. 风格润色 - 优化表达方式，使文字更流畅
3. 内容优化 - 提供内容改进建议
4. 格式建议 - 如有必要，提供格式调整建议

请用中文回复，保持专业友好的语气。`

      // 创建流式响应
      const result = await streamText({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `文档内容：\n${documentText}\n\n用户请求：${userPrompt}`
          }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        onError: ({ error }) => {
          console.error('Stream error:', error)
        }
      })

      return result
    } catch (error) {
      console.error('LLM stream error:', error)
      throw error
    }
  })
}

/**
 * 非流式分析文档（用于单元测试或简单场景）
 * @param {string} documentText - 文档文本内容
 * @param {string} userPrompt - 用户提示
 * @param {string} selectedModel - 选中的模型
 * @returns {Promise<string>} AI 响应文本
 */
export async function analyzeDocument(documentText, userPrompt, selectedModel = DEFAULT_MODEL) {
  const result = await analyzeDocumentStream(documentText, userPrompt, selectedModel)
  const text = await result.text()
  return text
}

/**
 * 流式分析文档（从文件）
 * @param {File} docxFile - DOCX 文件
 * @param {string} userPrompt - 用户提示
 * @param {string} selectedModel - 选中的模型
 * @returns {Promise<Object>} 流式响应结果
 */
export async function analyzeDocumentStreamFromFile(docxFile, userPrompt, selectedModel = DEFAULT_MODEL) {
  const documentText = await extractTextFromDocx(docxFile)
  return analyzeDocumentStream(documentText, userPrompt, selectedModel)
}

/**
 * 创建流式文本处理器
 * @param {Object} streamResult - streamText 返回的结果
 * @param {Function} onChunk - 每收到一个文本块的回调
 * @param {Function} onComplete - 完成时的回调
 * @param {Function} onError - 错误时的回调
 * @returns {Promise<void>}
 */
export async function processStreamResult(streamResult, { onChunk, onComplete, onError }) {
  try {
    // 处理文本流
    for await (const textPart of streamResult.textStream) {
      if (onChunk) {
        onChunk(textPart)
      }
    }
    
    // 获取完整响应
    const fullText = await streamResult.text()
    
    // 获取使用信息（如果可用）
    const usage = await streamResult.usage
    
    if (onComplete) {
      onComplete({
        text: fullText,
        usage,
        finishReason: await streamResult.finishReason
      })
    }
  } catch (error) {
    console.error('Stream processing error:', error)
    if (onError) {
      onError(error)
    }
    throw error
  }
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
    contextWindow: model.contextWindow
  }))
}

/**
 * 验证模型配置
 * @param {string} modelName - 模型名称
 * @returns {boolean} 是否支持
 */
export function isModelSupported(modelName) {
  return isModelSupported(modelName)
}
