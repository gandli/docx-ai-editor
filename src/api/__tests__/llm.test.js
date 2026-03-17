import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 模拟依赖
vi.mock('../docx-utils', () => ({
  extractTextFromDocx: vi.fn()
}))

describe('LLM API', () => {
  let originalEnv
  let mockFetch

  beforeEach(() => {
    originalEnv = { ...process.env }
    vi.clearAllMocks()
    
    // 清理环境变量
    Object.keys(process.env).forEach(key => {
      if (key.includes('OPENROUTER')) delete process.env[key]
    })
    
    // 设置 mock
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    Object.assign(process.env, originalEnv)
    vi.restoreAllMocks()
  })

  describe('模型配置', () => {
    it('导出 MODEL_CONFIGS', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS).toBeDefined()
      expect(typeof mod.MODEL_CONFIGS).toBe('object')
      expect(Object.keys(mod.MODEL_CONFIGS).length).toBeGreaterThan(0)
    })

    it('MODEL_CONFIGS 包含 5 个模型', async () => {
      const mod = await import('../llm.js')
      expect(Object.keys(mod.MODEL_CONFIGS)).toHaveLength(5)
    })

    it('包含 qwen/qwen3-max 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['qwen/qwen3-max']).toBeDefined()
      expect(mod.MODEL_CONFIGS['qwen/qwen3-max'].provider).toBe('Alibaba')
      expect(mod.MODEL_CONFIGS['qwen/qwen3-max'].contextWindow).toBe(256000)
    })

    it('包含 anthropic/claude-opus 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['anthropic/claude-opus']).toBeDefined()
      expect(mod.MODEL_CONFIGS['anthropic/claude-opus'].provider).toBe('Anthropic')
    })

    it('包含 google/gemini-2.5-pro-exp-03-25 模型', async () => {
      const mod = await import('../llm.js')
      expect(mod.MODEL_CONFIGS['google/gemini-2.5-pro-exp-03-25']).toBeDefined()
      expect(mod.MODEL_CONFIGS['google/gemini-2.5-pro-exp-03-25'].contextWindow).toBe(1000000)
    })

    it('每个模型都有必需的配置', async () => {
      const mod = await import('../llm.js')
      Object.values(mod.MODEL_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('id')
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('provider')
        expect(config).toHaveProperty('contextWindow')
        expect(config).toHaveProperty('pricing')
        expect(config.pricing).toHaveProperty('prompt')
        expect(config.pricing).toHaveProperty('completion')
      })
    })
  })

  describe('DEFAULT_MODEL', () => {
    it('默认模型是 qwen/qwen3-max', async () => {
      const mod = await import('../llm.js')
      expect(mod.DEFAULT_MODEL).toBe('qwen/qwen3-max')
    })
  })

  describe('isApiKeyConfigured', () => {
    it('当 API 密钥未设置时返回 false', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = undefined
      expect(mod.isApiKeyConfigured()).toBe(false)
    })

    it('当 API 密钥为空时返回 false', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = ''
      expect(mod.isApiKeyConfigured()).toBe(false)
    })

    it('当 API 密钥为默认占位符时返回 false', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-your-api-key-here'
      expect(mod.isApiKeyConfigured()).toBe(false)
    })

    it('当 API 密钥正确配置时返回 true', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-actual-key'
      expect(mod.isApiKeyConfigured()).toBe(true)
    })
  })

  describe('getApiKey', () => {
    it('返回配置的 API 密钥', async () => {
      const mod = await import('../llm.js')
      const testKey = 'sk-or-v1-test'
      process.env.OPENROUTER_API_KEY = testKey
      expect(mod.getApiKey()).toBe(testKey)
    })

    it('未配置时返回 undefined', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = undefined
      expect(mod.getApiKey()).toBeUndefined()
    })
  })

  describe('getSupportedModels', () => {
    it('返回模型数组', async () => {
      const mod = await import('../llm.js')
      const models = mod.getSupportedModels()
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBe(5)
    })

    it('每个模型都有必需的属性', async () => {
      const mod = await import('../llm.js')
      const models = mod.getSupportedModels()
      models.forEach(model => {
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('provider')
        expect(model).toHaveProperty('contextWindow')
        expect(model).toHaveProperty('pricing')
      })
    })
  })

  describe('isModelSupported', () => {
    it('对支持的模型返回 true', async () => {
      const mod = await import('../llm.js')
      expect(mod.isModelSupported('qwen/qwen3-max')).toBe(true)
      expect(mod.isModelSupported('anthropic/claude-opus')).toBe(true)
      expect(mod.isModelSupported('google/gemini-2.5-pro-exp-03-25')).toBe(true)
    })

    it('对不支持的模型返回 false', async () => {
      const mod = await import('../llm.js')
      expect(mod.isModelSupported('invalid-model')).toBe(false)
      expect(mod.isModelSupported('')).toBe(false)
      expect(mod.isModelSupported(null)).toBe(false)
    })
  })

  describe('getModelConfig', () => {
    it('返回指定模型的配置', async () => {
      const mod = await import('../llm.js')
      const config = mod.getModelConfig('qwen/qwen3-max')
      expect(config).toBeDefined()
      expect(config.id).toBe('qwen/qwen3-max')
      expect(config.name).toBe('Qwen3 Max')
    })

    it('对不支持的模型返回 null', async () => {
      const mod = await import('../llm.js')
      const config = mod.getModelConfig('nonexistent')
      expect(config).toBeNull()
    })
  })

  describe('callLLM', () => {
    it('当 API 密钥未配置时抛出错误', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = undefined
      
      await expect(mod.callLLM({
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('OpenRouter API 密钥未配置')
    })

    it('当模型不支持时抛出错误', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      
      await expect(mod.callLLM({
        model: 'invalid-model',
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('不支持的模型')
    })

    it('成功调用 API', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }]
        })
      })

      const result = await mod.callLLM({
        model: 'qwen/qwen3-max',
        messages: [{ role: 'user', content: 'Hello' }]
      })

      expect(result).toBe('Response')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('使用默认参数', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] })
      })

      await mod.callLLM({
        model: 'qwen/qwen3-max',
        messages: [{ role: 'user', content: 'Test' }]
      })

      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(2000)
    })

    it('处理 API 错误', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid key' } })
      })

      await expect(mod.callLLM({
        model: 'qwen/qwen3-max',
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('OpenRouter API 错误 (401): Invalid key')
    })

    it('处理空响应', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      const result = await mod.callLLM({
        model: 'qwen/qwen3-max',
        messages: [{ role: 'user', content: 'Hello' }]
      })

      expect(result).toBe('')
    })
  })

  describe('analyzeDocument', () => {
    const { extractTextFromDocx } = await import('../docx-utils')

    it('提取文档文本并调用 API', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      extractTextFromDocx.mockResolvedValue('Document content')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Analysis' } }] })
      })

      const mockFile = new File(['test'], 'test.docx')
      const result = await mod.analyzeDocument(mockFile, '请分析')

      expect(extractTextFromDocx).toHaveBeenCalledWith(mockFile)
      expect(result).toBe('Analysis')
    })

    it('使用默认模型', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      extractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Result' } }] })
      })

      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocument(mockFile, 'Test')

      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.model).toBe('qwen/qwen3-max')
    })

    it('构建系统提示', async () => {
      const mod = await import('../llm.js')
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test'
      extractTextFromDocx.mockResolvedValue('Content')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Result' } }] })
      })

      const mockFile = new File(['test'], 'test.docx')
      await mod.analyzeDocument(mockFile, 'Test')

      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toContain('文档编辑助手')
      expect(body.messages[0].content).toContain('语法校对')
    })

    it('处理提取错误', async () => {
      const mod = await import('../llm.js')
      extractTextFromDocx.mockRejectedValue(new Error('提取失败'))

      const mockFile = new File(['test'], 'test.docx')
      await expect(mod.analyzeDocument(mockFile, 'Test'))
        .rejects.toThrow('提取失败')
    })
  })

  describe('applyDocumentChanges', () => {
    it('记录变更并返回原始文档', async () => {
      const mod = await import('../llm.js')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const originalDocx = new File(['test'], 'test.docx')
      const suggestions = '建议内容'
      
      const result = await mod.applyDocumentChanges(originalDocx, suggestions)
      
      expect(result).toBe(originalDocx)
      expect(consoleSpy).toHaveBeenCalledWith('Applying changes to document...')
      expect(consoleSpy).toHaveBeenCalledWith('Suggestions:', '建议内容')
      
      consoleSpy.mockRestore()
    })

    it('处理空建议', async () => {
      const mod = await import('../llm.js')
      const originalDocx = new File(['test'], 'test.docx')
      const result = await mod.applyDocumentChanges(originalDocx, '')
      expect(result).toBe(originalDocx)
    })
  })
})
