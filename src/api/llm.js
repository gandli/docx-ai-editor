/**
 * LLM API 集成 - 性能优化版本
 * 优化点：
 * 1. 请求缓存
 * 2. 请求去重
 * 3. 超时控制
 * 4. 重试机制
 * 5. 流式响应
 */

import { extractTextFromDocx } from './docx-utils'

// ============ 缓存系统 ============
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  get(key) {
    if (!this.cache.has(key)) return undefined
    
    // 移到最新
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  clear() {
    this.cache.clear()
  }
}

// 响应缓存（5 分钟过期）
const responseCache = new LRUCache(50)
const CACHE_TTL = 5 * 60 * 1000

// 请求去重
const pendingRequests = new Map()

// ============ 配置 ============
const MODEL_CONFIGS = {
  'qwen3-max': {
    provider: 'modelstudio',
    baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
    apiKey: process.env.QWEN_API_KEY,
    timeout: 30000
  },
  'claude-opus': {
    provider: 'anyrouter',
    baseUrl: 'https://anyrouter.top',
    apiKey: process.env.CLAUDE_API_KEY,
    timeout: 30000
  },
  'glm-5': {
    provider: 'modelstudio', 
    baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
    apiKey: process.env.GLM_API_KEY,
    timeout: 30000
  }
}

// ============ 优化的 API 调用 ============
export async function analyzeDocument(docxFile, userPrompt, selectedModel = 'qwen3-max') {
  const startTime = performance.now()
  
  try {
    // 1. 检查缓存
    const cacheKey = generateCacheKey(docxFile, userPrompt, selectedModel)
    const cached = responseCache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('✅ 使用缓存响应')
      return cached.data
    }
    
    // 2. 检查是否有相同请求正在进行（去重）
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ 等待相同请求完成')
      return await pendingRequests.get(cacheKey)
    }
    
    // 3. 创建新的请求 Promise
    const requestPromise = (async () => {
      // 提取文本（使用缓存）
      const docxText = await extractTextFromDocx(docxFile)
      
      // 构建提示
      const systemPrompt = buildSystemPrompt(docxText, userPrompt)
      
      // 调用 API（带超时和重试）
      const config = MODEL_CONFIGS[selectedModel]
      if (!config) {
        throw new Error(`Unsupported model: ${selectedModel}`)
      }
      
      const response = await fetchWithRetry(
        `${config.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        },
        config.timeout
      )
      
      const result = await response.json()
      const content = result.choices[0].message.content
      
      // 缓存结果
      responseCache.set(cacheKey, {
        data: content,
        timestamp: Date.now()
      })
      
      return content
    })()
    
    // 记录 pending 请求
    pendingRequests.set(cacheKey, requestPromise)
    
    try {
      const result = await requestPromise
      const endTime = performance.now()
      console.log(`API 响应时间：${(endTime - startTime).toFixed(2)}ms`)
      return result
    } finally {
      // 清理 pending 请求
      pendingRequests.delete(cacheKey)
    }
    
  } catch (error) {
    console.error('LLM API error:', error)
    throw error
  }
}

// ============ 流式 API 调用 ============
export async function analyzeDocumentStream(docxFile, userPrompt, selectedModel = 'qwen3-max', onChunk) {
  const config = MODEL_CONFIGS[selectedModel]
  if (!config) {
    throw new Error(`Unsupported model: ${selectedModel}`)
  }
  
  const docxText = await extractTextFromDocx(docxFile)
  const systemPrompt = buildSystemPrompt(docxText, userPrompt)
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    })
  })
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

// ============ 辅助函数 ============
function generateCacheKey(file, prompt, model) {
  // 使用文件名、大小和提示生成缓存键
  return `${file.name}-${file.size}-${model}-${hashCode(prompt)}`
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function buildSystemPrompt(docxText, userPrompt) {
  return `你是一个专业的文档编辑助手。请分析以下文档并提供改进建议。
文档内容：
${docxText}

用户请求：${userPrompt}

请提供具体的修改建议，包括语法校对、风格润色、内容优化等。`
}

async function fetchWithRetry(url, options, timeout = 30000, maxRetries = 3) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1) {
        // 指数退避
        const delay = Math.pow(2, i) * 1000
        console.log(`请求失败，${delay}ms 后重试 (${i + 1}/${maxRetries})`)
        await sleep(delay)
      }
    }
  }
  
  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============ 文档修改应用 ============
export async function applyDocumentChanges(originalDocx, aiSuggestions) {
  console.log('Applying changes to document...')
  return originalDocx
}
