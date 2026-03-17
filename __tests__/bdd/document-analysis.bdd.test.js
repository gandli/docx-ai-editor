// BDD 风格测试示例 - 使用 Given-When-Then 模式
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeDocument } from '../../src/api/llm.js'
import { mockDocxFile, mockExtractedText } from '../../__mocks__/fixtures/documents.js'

vi.mock('../../src/api/docx-utils.js', () => ({
  extractTextFromDocx: vi.fn()
}))

import { extractTextFromDocx } from '../../src/api/docx-utils.js'

describe('BDD: Document Analysis Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    extractTextFromDocx.mockResolvedValue(mockExtractedText)
  })

  describe('Feature: User wants to analyze document with AI', () => {
    describe('Scenario: User uploads a valid DOCX file', () => {
      it('Given a valid DOCX file is uploaded', async () => {
        // Given
        const file = mockDocxFile
        
        // When
        const text = await extractTextFromDocx(file)
        
        // Then
        expect(text).toBeDefined()
        expect(typeof text).toBe('string')
      })

      it('When user requests analysis, Then AI should respond with suggestions', async () => {
        // Given
        global.fetch = vi.fn().mockResolvedValue({
          json: () => Promise.resolve({
            choices: [{ message: { content: '分析结果' } }]
          })
        })
        const userPrompt = '请分析这个文档'
        
        // When
        const result = await analyzeDocument(mockDocxFile, userPrompt)
        
        // Then
        expect(result).toBe('分析结果')
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })

    describe('Scenario: User selects different AI models', () => {
      it('Given Qwen model is selected, When analysis requested, Then should call Qwen API', async () => {
        // Given
        global.fetch = vi.fn().mockResolvedValue({
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Qwen 结果' } }]
          })
        })
        
        // When
        await analyzeDocument(mockDocxFile, 'test', 'qwen3-max')
        
        // Then
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('coding.dashscope.aliyuncs.com'),
          expect.any(Object)
        )
      })

      it('Given Claude model is selected, When analysis requested, Then should call Claude API', async () => {
        // Given
        global.fetch = vi.fn().mockResolvedValue({
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Claude 结果' } }]
          })
        })
        
        // When
        await analyzeDocument(mockDocxFile, 'test', 'claude-opus')
        
        // Then
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('anyrouter.top'),
          expect.any(Object)
        )
      })
    })

    describe('Scenario: API call fails', () => {
      it('Given network error occurs, When analysis requested, Then should handle gracefully', async () => {
        // Given
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
        
        // When & Then
        await expect(analyzeDocument(mockDocxFile, 'test'))
          .rejects.toThrow()
        expect(console.error).toHaveBeenCalledWith(
          'LLM API error:',
          expect.any(Error)
        )
      })

      it('Given unsupported model, When analysis requested, Then should throw clear error', async () => {
        // Given
        const invalidModel = 'invalid-model'
        
        // When & Then
        await expect(analyzeDocument(mockDocxFile, 'test', invalidModel))
          .rejects.toThrow('Unsupported model: invalid-model')
      })
    })
  })

  describe('Feature: Document content extraction', () => {
    describe('Scenario: Extract text from DOCX', () => {
      it('Given a DOCX file, When text extracted, Then should return content', async () => {
        // Given
        const mockArrayBuffer = new TextEncoder().encode(mockExtractedText).buffer
        vi.spyOn(File.prototype, 'arrayBuffer').mockResolvedValue(mockArrayBuffer)
        
        // When
        const text = await extractTextFromDocx(mockDocxFile)
        
        // Then
        expect(text).toContain('测试文档')
      })

      it('Given empty DOCX, When text extracted, Then should return empty string', async () => {
        // Given
        const emptyFile = new File([''], 'empty.docx')
        vi.spyOn(File.prototype, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(0))
        
        // When
        const text = await extractTextFromDocx(emptyFile)
        
        // Then
        expect(text).toBe('')
      })
    })
  })

  describe('Feature: Multi-round conversation', () => {
    describe('Scenario: User sends multiple questions', () => {
      it('Given previous conversation exists, When new question asked, Then context should be maintained', async () => {
        // Given
        let callCount = 0
        global.fetch = vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            json: () => Promise.resolve({
              choices: [{ message: { content: `响应 ${callCount}` } }]
            })
          })
        })
        
        // When
        await analyzeDocument(mockDocxFile, '问题 1')
        await analyzeDocument(mockDocxFile, '问题 2')
        
        // Then
        expect(global.fetch).toHaveBeenCalledTimes(2)
        // TODO: 实际实现中应包含对话历史
      })
    })
  })
})
