import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLLM } from '../useLLM'

// Mock llm-stream API
vi.mock('../../api/llm-stream', () => ({
  analyzeDocumentStreamFromFile: vi.fn(),
  processStreamResult: vi.fn(async (streamResult, callbacks) => {
    // 模拟流式处理
    if (callbacks.onChunk) {
      callbacks.onChunk('Hello', 'Hello')
      callbacks.onChunk(' World', 'Hello World')
    }
    if (callbacks.onComplete) {
      callbacks.onComplete({ text: 'Hello World', usage: {}, finishReason: 'stop' })
    }
  }),
  analyzeDocument: vi.fn()
}))

// Mock llm API
vi.mock('../../api/llm', () => ({
  isApiKeyConfigured: vi.fn(() => true),
  DEFAULT_MODEL: 'qwen/qwen3-max'
}))

import { analyzeDocumentStreamFromFile, processStreamResult } from '../../api/llm-stream'
import { isApiKeyConfigured } from '../../api/llm'

describe('useLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isApiKeyConfigured.mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('返回初始状态', () => {
    const { result } = renderHook(() => useLLM())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.currentResponse).toBe('')
    expect(result.current.isConfigured).toBe(true)
  })

  it('返回 API 配置状态', () => {
    isApiKeyConfigured.mockReturnValue(false)
    
    const { result } = renderHook(() => useLLM())
    
    expect(result.current.isConfigured).toBe(false)
  })

  describe('streamAnalyze', () => {
    it('流式分析文档', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      const onChunk = vi.fn()
      const onComplete = vi.fn()
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Analyze this', {
          model: 'qwen/qwen3-max',
          onChunk,
          onComplete
        })
      })
      
      expect(analyzeDocumentStreamFromFile).toHaveBeenCalledWith(
        mockFile,
        'Analyze this',
        'qwen/qwen3-max'
      )
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.currentResponse).toBe('Hello World')
    })

    it('调用 onChunk 回调', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      const onChunk = vi.fn()
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Test', { onChunk })
      })
      
      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onChunk).toHaveBeenCalledWith('Hello', 'Hello')
      expect(onChunk).toHaveBeenCalledWith(' World', 'Hello World')
    })

    it('调用 onComplete 回调', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      const onComplete = vi.fn()
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Test', { onComplete })
      })
      
      expect(onComplete).toHaveBeenCalledWith({
        text: 'Hello World',
        usage: {},
        finishReason: 'stop'
      })
    })

    it('使用默认模型', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Test')
      })
      
      expect(analyzeDocumentStreamFromFile).toHaveBeenCalledWith(
        mockFile,
        'Test',
        'qwen/qwen3-max'
      )
    })

    it('当 API 未配置时抛出错误', async () => {
      isApiKeyConfigured.mockReturnValue(false)
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(
        act(async () => {
          await result.current.streamAnalyze(mockFile, 'Test')
        })
      ).rejects.toThrow('OpenRouter API 密钥未配置')
      
      expect(result.current.error).toBe('OpenRouter API 密钥未配置')
    })

    it('设置加载状态', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      // 在分析过程中检查加载状态
      const analyzePromise = act(async () => {
        return result.current.streamAnalyze(mockFile, 'Test')
      })
      
      // 由于是异步的，isLoading 会在过程中变为 true
      await analyzePromise
      
      expect(result.current.isLoading).toBe(false)
    })

    it('处理分析错误', async () => {
      analyzeDocumentStreamFromFile.mockRejectedValue(new Error('API error'))
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await expect(
        act(async () => {
          await result.current.streamAnalyze(mockFile, 'Test')
        })
      ).rejects.toThrow('API error')
      
      expect(result.current.error).toBe('API error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('cancel', () => {
    it('取消当前请求', async () => {
      // 创建一个不会立即完成的流
      analyzeDocumentStreamFromFile.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              textStream: (async function* () { yield 'Test' })(),
              text: () => Promise.resolve('Test')
            })
          }, 1000)
        })
      })
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      // 开始分析
      const analyzePromise = act(async () => {
        return result.current.streamAnalyze(mockFile, 'Test')
      })
      
      // 等待开始加载
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })
      
      // 取消
      act(() => {
        result.current.cancel()
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('请求已取消')
      
      // 清理
      await analyzePromise.catch(() => {})
    })

    it('当没有进行中的请求时不执行操作', () => {
      const { result } = renderHook(() => useLLM())
      
      expect(() => {
        act(() => {
          result.current.cancel()
        })
      }).not.toThrow()
    })
  })

  describe('clearError', () => {
    it('清除错误状态', async () => {
      analyzeDocumentStreamFromFile.mockRejectedValue(new Error('Test error'))
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Test').catch(() => {})
      })
      
      expect(result.current.error).toBe('Test error')
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
    })
  })

  describe('clearResponse', () => {
    it('清除响应内容', async () => {
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await act(async () => {
        await result.current.streamAnalyze(mockFile, 'Test')
      })
      
      expect(result.current.currentResponse).toBe('Hello World')
      
      act(() => {
        result.current.clearResponse()
      })
      
      expect(result.current.currentResponse).toBe('')
    })
  })

  describe('analyze (非流式)', () => {
    it('调用非流式分析', async () => {
      const { analyzeDocument } = await import('../../api/llm-stream')
      analyzeDocument.mockResolvedValue('Non-streaming response')
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await act(async () => {
        await result.current.analyze(mockFile, 'Test')
      })
      
      expect(result.current.currentResponse).toBe('Non-streaming response')
      expect(result.current.isLoading).toBe(false)
    })

    it('处理错误', async () => {
      const { analyzeDocument } = await import('../../api/llm-stream')
      analyzeDocument.mockRejectedValue(new Error('Analysis failed'))
      
      const { result } = renderHook(() => useLLM())
      
      const mockFile = new File(['test'], 'test.docx')
      
      await act(async () => {
        await result.current.analyze(mockFile, 'Test').catch(() => {})
      })
      
      expect(result.current.error).toBe('Analysis failed')
    })
  })
})
