import { useState, useCallback, useRef } from 'react'
import { 
  analyzeDocumentStreamFromFile, 
  processStreamResult,
  analyzeDocument 
} from '../api/llm-stream'
import { isApiKeyConfigured, DEFAULT_MODEL } from '../api/llm'

/**
 * LLM API 使用 Hook
 * 提供流式和非流式的文档分析功能
 * 
 * @returns {Object} LLM 操作方法和状态
 */
export function useLLM() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentResponse, setCurrentResponse] = useState('')
  const abortControllerRef = useRef(null)

  /**
   * 流式分析文档
   * @param {File} docxFile - DOCX 文件
   * @param {string} userPrompt - 用户提示
   * @param {Object} options - 选项
   * @param {string} options.model - 模型 ID
   * @param {Function} options.onChunk - 文本块回调
   * @param {Function} options.onComplete - 完成回调
   * @returns {Promise<string>} 完整响应文本
   */
  const streamAnalyze = useCallback(async (
    docxFile, 
    userPrompt, 
    { 
      model = DEFAULT_MODEL, 
      onChunk, 
      onComplete 
    } = {}
  ) => {
    if (!isApiKeyConfigured()) {
      const errorMsg = 'OpenRouter API 密钥未配置'
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    setIsLoading(true)
    setError(null)
    setCurrentResponse('')

    abortControllerRef.current = new AbortController()

    try {
      const streamResult = await analyzeDocumentStreamFromFile(docxFile, userPrompt, model)

      let fullText = ''

      await processStreamResult(streamResult, {
        onChunk: (textPart) => {
          fullText += textPart
          setCurrentResponse(fullText)
          if (onChunk) {
            onChunk(textPart, fullText)
          }
        },
        onComplete: (result) => {
          if (onComplete) {
            onComplete(result)
          }
        },
        onError: (err) => {
          setError(err.message)
        }
      })

      return fullText
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
      throw err
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  /**
   * 非流式分析文档（简单场景）
   * @param {File} docxFile - DOCX 文件
   * @param {string} userPrompt - 用户提示
   * @param {Object} options - 选项
   * @param {string} options.model - 模型 ID
   * @returns {Promise<string>} 响应文本
   */
  const analyze = useCallback(async (
    docxFile, 
    userPrompt, 
    { model = DEFAULT_MODEL } = {}
  ) => {
    if (!isApiKeyConfigured()) {
      const errorMsg = 'OpenRouter API 密钥未配置'
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await analyzeDocument(
        docxFile, 
        userPrompt, 
        model
      )
      setCurrentResponse(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 取消当前请求
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setError('请求已取消')
    }
  }, [])

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 清除响应
   */
  const clearResponse = useCallback(() => {
    setCurrentResponse('')
  }, [])

  return {
    // 状态
    isLoading,
    error,
    currentResponse,
    isConfigured: isApiKeyConfigured(),
    
    // 方法
    streamAnalyze,
    analyze,
    cancel,
    clearError,
    clearResponse
  }
}

export default useLLM
