// LLM API 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeDocument, applyDocumentChanges } from '../../src/api/llm.js'
import { mockDocxFile, mockExtractedText } from '../../__mocks__/fixtures/documents.js'

// Mock docx-utils
vi.mock('../../src/api/docx-utils.js', () => ({
  extractTextFromDocx: vi.fn()
}))

import { extractTextFromDocx } from '../../src/api/docx-utils.js'

describe('LLM API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    extractTextFromDocx.mockResolvedValue(mockExtractedText)
  })

  describe('analyzeDocument', () => {
    it('should successfully analyze document with qwen3-max', async () => {
      // Given
      const mockPrompt = '请优化这段文字'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: '分析结果' } }]
        })
      })

      // When
      const result = await analyzeDocument(mockDocxFile, mockPrompt, 'qwen3-max')

      // Then
      expect(result).toBe('分析结果')
      expect(extractTextFromDocx).toHaveBeenCalledWith(mockDocxFile)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('coding.dashscope.aliyuncs.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should throw error for unsupported model', async () => {
      // Given
      const invalidModel = 'invalid-model'
      const mockPrompt = 'test'

      // When & Then
      await expect(analyzeDocument(mockDocxFile, mockPrompt, invalidModel))
        .rejects.toThrow('Unsupported model: invalid-model')
    })

    it('should handle API failure gracefully', async () => {
      // Given
      const mockPrompt = 'test'
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      // When & Then
      await expect(analyzeDocument(mockDocxFile, mockPrompt))
        .rejects.toThrow()
      expect(console.error).toHaveBeenCalledWith(
        'LLM API error:',
        expect.any(Error)
      )
    })

    it('should handle API error response', async () => {
      // Given
      const mockPrompt = 'test'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          error: { message: 'API error' }
        })
      })

      // When & Then
      await expect(analyzeDocument(mockDocxFile, mockPrompt))
        .rejects.toThrow()
    })

    it.each([
      ['qwen3-max', 'https://coding.dashscope.aliyuncs.com'],
      ['claude-opus', 'https://anyrouter.top'],
      ['glm-5', 'https://coding.dashscope.aliyuncs.com']
    ])('should use correct provider for model %s', async (model, expectedUrl) => {
      // Given
      const mockPrompt = 'test'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: 'result' } }]
        })
      })

      // When
      await analyzeDocument(mockDocxFile, mockPrompt, model)

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(expectedUrl),
        expect.any(Object)
      )
    })

    it('should include document content in request', async () => {
      // Given
      const mockPrompt = '分析文档'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: 'result' } }]
        })
      })

      // When
      await analyzeDocument(mockDocxFile, mockPrompt)

      // Then
      const callArgs = global.fetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body)
      expect(requestBody.messages).toBeDefined()
      expect(requestBody.messages[0].role).toBe('system')
      expect(requestBody.messages[0].content).toContain(mockExtractedText)
    })

    it('should include user prompt in request', async () => {
      // Given
      const mockPrompt = '请优化这段文字'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: 'result' } }]
        })
      })

      // When
      await analyzeDocument(mockDocxFile, mockPrompt)

      // Then
      const callArgs = global.fetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body)
      expect(requestBody.messages).some.toMatchObject({
        role: 'user',
        content: mockPrompt
      })
    })

    it('should use correct temperature and max_tokens', async () => {
      // Given
      const mockPrompt = 'test'
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: 'result' } }]
        })
      })

      // When
      await analyzeDocument(mockDocxFile, mockPrompt)

      // Then
      const callArgs = global.fetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body)
      expect(requestBody.temperature).toBe(0.7)
      expect(requestBody.max_tokens).toBe(2000)
    })
  })

  describe('applyDocumentChanges', () => {
    it('should return modified document', async () => {
      // Given
      const suggestions = '修改建议'

      // When
      const result = await applyDocumentChanges(mockDocxFile, suggestions)

      // Then
      expect(result).toBeDefined()
    })

    it('should log progress', async () => {
      // Given
      const suggestions = '修改建议'
      const logSpy = vi.spyOn(console, 'log')

      // When
      await applyDocumentChanges(mockDocxFile, suggestions)

      // Then
      expect(logSpy).toHaveBeenCalledWith('Applying changes to document...')
      logSpy.mockRestore()
    })
  })
})
