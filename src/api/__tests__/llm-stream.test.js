// LLM Stream API 单元测试 - OpenRouter 集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  analyzeDocumentStream,
  analyzeDocument,
  processStreamResult,
  getSupportedModels,
  isModelSupported,
  analyzeDocumentStreamFromFile
} from '../llm-stream.js'

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn()
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn((modelId) => ({ modelId })))
}))

vi.mock('../docx-utils', () => ({
  extractTextFromDocx: vi.fn()
}))

vi.mock('../llm', () => ({
  MODEL_CONFIGS: {
    'qwen/qwen3-max': {
      id: 'qwen/qwen3-max',
      name: 'Qwen3 Max',
      provider: 'Alibaba',
      contextWindow: 256000
    },
    'anthropic/claude-opus': {
      id: 'anthropic/claude-opus',
      name: 'Claude Opus',
      provider: 'Anthropic',
      contextWindow: 200000
    },
    'google/gemini-2.5-pro-exp-03-25': {
      id: 'google/gemini-2.5-pro-exp-03-25',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      contextWindow: 1000000
    }
  },
  DEFAULT_MODEL: 'qwen/qwen3-max',
  isApiKeyConfigured: vi.fn(),
  isModelSupported: vi.fn((modelId) => modelId in {
    'qwen/qwen3-max': true,
    'anthropic/claude-opus': true,
    'google/gemini-2.5-pro-exp-03-25': true
  })
}))

import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { isApiKeyConfigured } from '../llm'

describe('LLM Stream API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置环境变量
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key'
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    
    isApiKeyConfigured.mockReturnValue(true)
  })

  afterEach(() => {
    // 清理环境变量
    delete process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_BASE_URL
  })

  describe('analyzeDocumentStream', () => {
    beforeEach(() => {
      // Mock streamText 返回
      streamText.mockResolvedValue({
        textStream: (async function* () {
          yield 'Test'
          yield ' response'
        })(),
        text: vi.fn().mockResolvedValue('Test response'),
        usage: vi.fn().mockResolvedValue({ promptTokens: 10, completionTokens: 5 }),
        finishReason: vi.fn().mockResolvedValue('stop')
      })
    })

    it('当 API 密钥未配置时抛出错误', async () => {
      isApiKeyConfigured.mockReturnValue(false)
      
      await expect(analyzeDocumentStream('doc', 'prompt'))
        .rejects.toThrow('OpenRouter API 密钥未配置')
    })

    it('当模型不支持时抛出错误', async () => {
      await expect(analyzeDocumentStream('doc', 'prompt', 'invalid-model'))
        .rejects.toThrow('不支持的模型')
    })

    it('使用正确的参数调用 streamText', async () => {
      const documentText = '这是测试文档'
      const userPrompt = '请优化这段文字'
      
      await analyzeDocumentStream(documentText, userPrompt, 'qwen/qwen3-max')
      
      expect(streamText).toHaveBeenCalledWith({
        model: expect.any(Object),
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('你是一个专业的文档编辑助手')
          },
          {
            role: 'user',
            content: expect.stringContaining(documentText)
          }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        onError: expect.any(Function)
      })
    })

    it('在系统提示中包含所有职责', async () => {
      await analyzeDocumentStream('doc', 'prompt')
      
      const callArgs = streamText.mock.calls[0][0]
      const systemPrompt = callArgs.messages[0].content
      
      expect(systemPrompt).toContain('语法校对')
      expect(systemPrompt).toContain('风格润色')
      expect(systemPrompt).toContain('内容优化')
      expect(systemPrompt).toContain('格式建议')
    })

    it('要求使用中文回复', async () => {
      await analyzeDocumentStream('doc', 'prompt')
      
      const callArgs = streamText.mock.calls[0][0]
      const systemPrompt = callArgs.messages[0].content
      
      expect(systemPrompt).toContain('请用中文回复')
    })

    it('使用默认模型 qwen/qwen3-max', async () => {
      await analyzeDocumentStream('doc', 'prompt')
      
      expect(createOpenAI).toHaveBeenCalled()
    })

    it('处理流错误', async () => {
      streamText.mockRejectedValue(new Error('API error'))
      
      await expect(analyzeDocumentStream('doc', 'prompt'))
        .rejects.toThrow('API error')
    })
  })

  describe('analyzeDocument', () => {
    it('从流返回文本', async () => {
      const mockResult = {
        text: vi.fn().mockResolvedValue('AI 回复内容')
      }
      streamText.mockResolvedValue(mockResult)
      
      const result = await analyzeDocument('文档', '提示')
      
      expect(result).toBe('AI 回复内容')
      expect(mockResult.text).toHaveBeenCalled()
    })

    it('处理 API 错误', async () => {
      streamText.mockRejectedValue(new Error('Network error'))
      
      await expect(analyzeDocument('文档', '提示'))
        .rejects.toThrow('Network error')
    })
  })

  describe('processStreamResult', () => {
    it('处理文本块并调用 onChunk 回调', async () => {
      const mockStreamResult = {
        textStream: (async function* () {
          yield 'Hello'
          yield ' '
          yield 'World'
        })(),
        text: vi.fn().mockResolvedValue('Hello World'),
        usage: vi.fn().mockResolvedValue({ promptTokens: 10, completionTokens: 5 }),
        finishReason: vi.fn().mockResolvedValue('stop')
      }

      const onChunk = vi.fn()
      const onComplete = vi.fn()

      await processStreamResult(mockStreamResult, { onChunk, onComplete })

      expect(onChunk).toHaveBeenCalledTimes(3)
      expect(onChunk).toHaveBeenCalledWith('Hello')
      expect(onChunk).toHaveBeenCalledWith(' ')
      expect(onChunk).toHaveBeenCalledWith('World')
      expect(onComplete).toHaveBeenCalledWith({
        text: 'Hello World',
        usage: { promptTokens: 10, completionTokens: 5 },
        finishReason: 'stop'
      })
    })

    it('处理流错误并调用 onError', async () => {
      const mockStreamResult = {
        textStream: (async function* () {
          yield 'Partial'
          throw new Error('Stream error')
        })(),
        text: vi.fn().mockRejectedValue(new Error('Stream error'))
      }

      const onError = vi.fn()

      await expect(processStreamResult(mockStreamResult, { onError }))
        .rejects.toThrow('Stream error')
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('在没有回调时正常工作', async () => {
      const mockStreamResult = {
        textStream: (async function* () {
          yield 'Test'
        })(),
        text: vi.fn().mockResolvedValue('Test'),
        usage: vi.fn().mockResolvedValue({}),
        finishReason: vi.fn().mockResolvedValue('stop')
      }

      await expect(processStreamResult(mockStreamResult, {}))
        .resolves.toBeUndefined()
    })
  })

  describe('analyzeDocumentStreamFromFile', () => {
    const { extractTextFromDocx } = await import('../docx-utils')

    it('从文件提取文本并调用流式分析', async () => {
      extractTextFromDocx.mockResolvedValue('Extracted text')
      streamText.mockResolvedValue({
        textStream: (async function* () { yield 'Response' })(),
        text: vi.fn().mockResolvedValue('Response')
      })

      const mockFile = new File(['test'], 'test.docx')
      await analyzeDocumentStreamFromFile(mockFile, 'Analyze this')

      expect(extractTextFromDocx).toHaveBeenCalledWith(mockFile)
      expect(streamText).toHaveBeenCalled()
    })

    it('传递选中的模型', async () => {
      extractTextFromDocx.mockResolvedValue('Text')
      streamText.mockResolvedValue({
        textStream: (async function* () { yield 'Response' })(),
        text: vi.fn().mockResolvedValue('Response')
      })

      const mockFile = new File(['test'], 'test.docx')
      await analyzeDocumentStreamFromFile(mockFile, 'Prompt', 'anthropic/claude-opus')

      expect(createOpenAI).toHaveBeenCalled()
    })

    it('处理提取错误', async () => {
      extractTextFromDocx.mockRejectedValue(new Error('提取失败'))

      const mockFile = new File(['test'], 'test.docx')
      await expect(analyzeDocumentStreamFromFile(mockFile, 'Prompt'))
        .rejects.toThrow('提取失败')
    })
  })

  describe('getSupportedModels', () => {
    it('返回所有支持的模型', () => {
      const models = getSupportedModels()
      
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)
    })

    it('每个模型都有必需的属性', () => {
      const models = getSupportedModels()
      
      models.forEach(model => {
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('provider')
        expect(model).toHaveProperty('contextWindow')
      })
    })
  })

  describe('isModelSupported', () => {
    it('对支持的模型返回 true', () => {
      expect(isModelSupported('qwen/qwen3-max')).toBe(true)
      expect(isModelSupported('anthropic/claude-opus')).toBe(true)
    })

    it('对不支持的模型返回 false', () => {
      expect(isModelSupported('invalid-model')).toBe(false)
      expect(isModelSupported('')).toBe(false)
    })
  })

  describe('重试机制', () => {
    it('在临时失败时重试', async () => {
      let callCount = 0
      streamText.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Rate limit exceeded'))
        }
        return Promise.resolve({
          textStream: (async function* () { yield 'Success' })(),
          text: vi.fn().mockResolvedValue('Success')
        })
      })

      const result = await analyzeDocumentStream('doc', 'prompt')
      const text = await result.text()
      
      expect(text).toBe('Success')
      expect(callCount).toBe(3)
    })

    it('在达到最大重试次数后抛出错误', async () => {
      streamText.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(analyzeDocumentStream('doc', 'prompt'))
        .rejects.toThrow('请求失败（已重试')
    })

    it('对于 API 密钥错误不重试', async () => {
      isApiKeyConfigured.mockReturnValue(false)
      streamText.mockRejectedValue(new Error('OpenRouter API 密钥未配置'))

      await expect(analyzeDocumentStream('doc', 'prompt'))
        .rejects.toThrow('OpenRouter API 密钥未配置')
    })
  })

  describe('参数配置', () => {
    it('使用 temperature 0.7', async () => {
      await analyzeDocumentStream('doc', 'prompt')
      
      const callArgs = streamText.mock.calls[0][0]
      expect(callArgs.temperature).toBe(0.7)
    })

    it('使用 maxTokens 2000', async () => {
      await analyzeDocumentStream('doc', 'prompt')
      
      const callArgs = streamText.mock.calls[0][0]
      expect(callArgs.maxTokens).toBe(2000)
    })
  })
})
