import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 模拟依赖
vi.mock('../docx-utils', () => ({
  extractTextFromDocx: vi.fn()
}))

describe('LLM API', () => {
  let originalEnv
  let mockFetch
  let mockExtractTextFromDocx

  beforeEach(async () => {
    originalEnv = { ...process.env }
    vi.clearAllMocks()
    
    // 清理环境变量
    delete process.env.QWEN_API_KEY
    delete process.env.CLAUDE_API_KEY
    delete process.env.GLM_API_KEY
    
    // 设置 mock
    mockFetch = vi.fn()
    global.fetch = mockFetch
    
    const mod = await import('../llm.js')
    mockExtractTextFromDocx = (await import('../docx-utils')).extractTextFromDocx
  })

  afterEach(() => {
    Object.assign(process.env, originalEnv)
    vi.restoreAllMocks()
  })

  describe('模型配置', () => {
    it('导出模型配置', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS).toBeDefined()
      expect(typeof mod.MODEL_CONFIGS).toBe('object')
    })

    it('包含 qwen3-max 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['qwen3-max']).toBeDefined()
      expect(mod.MODEL_CONFIGS['qwen3-max'].provider).toBe('modelstudio')
    })

    it('包含 claude-opus 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['claude-opus']).toBeDefined()
      expect(mod.MODEL_CONFIGS['claude-opus'].provider).toBe('anyrouter')
    })

    it('包含 glm-5 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['glm-5']).toBeDefined()
      expect(mod.MODEL_CONFIGS['glm-5'].provider).toBe('modelstudio')
    })

    it('每个模型都有必需的配置', async () => {
      const mod = await import('../llm.js')
      Object.values(mod.MODEL_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('provider')
        expect(config).toHaveProperty('baseUrl')
        expect(config).toHaveProperty('apiKey')
        expect(config).toHaveProperty('timeout')
      })
    })
  })

  describe('LRUCache', () => {
    it('存储和检索值', async () => {
      const mod = await import('../llm.js')
      const cache = new mod.LRUCache(10)
      
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('返回 undefined 对于不存在的键', async () => {
      const mod = await import('../llm.js')
      const cache = new mod.LRUCache(10)
      
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('达到最大容量时删除最旧的项', async () => {
      const mod = await import('../llm.js')
      const cache = new mod.LRUCache(2)
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3') // 应该删除 key1
      
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
    })

    it('更新现有键时移动到最新', async () => {
      const mod = await import('../llm.js')
      const cache = new mod.LRUCache(2)
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key1', 'updated') // 更新 key1
      
      cache.set('key3', 'value3') // 应该删除 key2（最旧）
      
      expect(cache.get('key1')).toBe('updated')
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.get('key3')).toBe('value3')
    })

    it('clear 方法清空所有缓存', async () => {
      const mod = await import('../llm.js')
      const cache = new mod.LRUCache(10)
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
    })
  })

  describe('analyzeDocument', () => {
    it('提取文档文本并调用 API', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Document content')
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Analysis result' } }]
        })
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      const result = await mod.analyzeDocument(mockFile, '请分析这个文档')
      
      expect(mockExtractTextFromDocx).toHaveBeenCalledWith(mockFile)
      expect(result).toBe('Analysis result')
    })

    it('使用默认模型 qwen3-max', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Result' } }] })
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocument(mockFile, 'Test')
      
      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.model).toBe('qwen3-max')
    })

    it('使用指定的模型', async () => {
      process.env.CLAUDE_API_KEY = 'claude-key'
      mockExtractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Result' } }] })
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocument(mockFile, 'Test', 'claude-opus')
      
      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.model).toBe('claude-opus')
    })

    it('对不支持的模型抛出错误', async () => {
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(mod.analyzeDocument(mockFile, 'Test', 'invalid-model'))
        .rejects.toThrow('Unsupported model: invalid-model')
    })

    it('构建系统提示', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Document text')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Result' } }] })
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocument(mockFile, 'User prompt')
      
      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toContain('文档编辑助手')
    })

    it('处理 API 错误', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(mod.analyzeDocument(mockFile, 'Test'))
        .rejects.toThrow()
    })

    it('处理提取错误', async () => {
      mockExtractTextFromDocx.mockRejectedValue(new Error('提取失败'))
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(mod.analyzeDocument(mockFile, 'Test'))
        .rejects.toThrow('提取失败')
    })
  })

  describe('analyzeDocumentStream', () => {
    it('创建流式响应', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Content')
      
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"chunk":"test"}\n') })
          .mockResolvedValueOnce({ done: true, value: undefined })
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      const result = await mod.analyzeDocumentStream(mockFile, 'Prompt')
      
      expect(result).toBeDefined()
      expect(mockFetch).toHaveBeenCalled()
    })

    it('使用默认模型', async () => {
      process.env.QWEN_API_KEY = 'test-key'
      mockExtractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: true,
        body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true }) }) }
      })
      
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocumentStream(mockFile, 'Prompt')
      
      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.model).toBe('qwen3-max')
    })

    it('对不支持的模型抛出错误', async () => {
      const mod = await import('../llm.js')
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(mod.analyzeDocumentStream(mockFile, 'Prompt', 'invalid-model'))
        .rejects.toThrow('Unsupported model')
    })
  })

  describe('buildSystemPrompt', () => {
    it('构建包含文档内容的系统提示', async () => {
      const mod = await import('../llm.js')
      const prompt = mod.buildSystemPrompt('Document content', 'User request')
      
      expect(prompt).toContain('文档编辑助手')
      expect(prompt).toContain('Document content')
      expect(prompt).toContain('User request')
    })

    it('包含语法校对职责', async () => {
      const mod = await import('../llm.js')
      const prompt = mod.buildSystemPrompt('Doc', 'Request')
      
      expect(prompt).toContain('语法校对')
    })

    it('包含风格润色职责', async () => {
      const mod = await import('../llm.js')
      const prompt = mod.buildSystemPrompt('Doc', 'Request')
      
      expect(prompt).toContain('风格润色')
    })

    it('包含内容优化职责', async () => {
      const mod = await import('../llm.js')
      const prompt = mod.buildSystemPrompt('Doc', 'Request')
      
      expect(prompt).toContain('内容优化')
    })

    it('包含格式建议职责', async () => {
      const mod = await import('../llm.js')
      const prompt = mod.buildSystemPrompt('Doc', 'Request')
      
      expect(prompt).toContain('格式建议')
    })
  })

  describe('fetchWithRetry', () => {
    it('成功时返回响应', async () => {
      const mod = await import('../llm.js')
      const mockResponse = { ok: true, json: async () => ({ data: 'test' }) }
      mockFetch.mockResolvedValue(mockResponse)
      
      const result = await mod.fetchWithRetry('https://example.com', { method: 'GET' })
      
      expect(result).toBe(mockResponse)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('失败时重试', async () => {
      const mod = await import('../llm.js')
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: 'test' }) })
      
      const result = await mod.fetchWithRetry('https://example.com', { method: 'GET' })
      
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.ok).toBe(true)
    })

    it('超过最大重试次数后抛出错误', async () => {
      const mod = await import('../llm.js')
      mockFetch.mockRejectedValue(new Error('Persistent error'))
      
      await expect(mod.fetchWithRetry('https://example.com', { method: 'GET' }, 100))
        .rejects.toThrow('Persistent error')
      
      expect(mockFetch).toHaveBeenCalledTimes(3) // 默认重试 3 次
    })
  })

  describe('generateCacheKey', () => {
    it('为相同的输入生成相同的键', async () => {
      const mod = await import('../llm.js')
      const file1 = new File(['content'], 'test.docx')
      const file2 = new File(['content'], 'test.docx')
      
      const key1 = mod.generateCacheKey(file1, 'prompt', 'model')
      const key2 = mod.generateCacheKey(file2, 'prompt', 'model')
      
      expect(key1).toBe(key2)
    })

    it('为不同的输入生成不同的键', async () => {
      const mod = await import('../llm.js')
      const file1 = new File(['content1'], 'test.docx')
      const file2 = new File(['content2'], 'test.docx')
      
      const key1 = mod.generateCacheKey(file1, 'prompt', 'model')
      const key2 = mod.generateCacheKey(file2, 'prompt', 'model')
      
      expect(key1).not.toBe(key2)
    })
  })
})
