import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateDocxFile,
  extractTextFromDocx,
  convertHtmlToDocx,
  mergeDocumentChanges,
  exportDocxDocument,
  downloadBlob,
  previewDocxContent,
  formatFileSize,
  ExportError
} from '../docx-utils'

describe('docx-utils 导出功能', () => {
  // 创建模拟文件
  const createMockFile = (content = 'test content', name = 'test.docx', type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') => {
    return new File([content], name, { type })
  }

  const createMockBlob = (content = 'test content', type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') => {
    return new Blob([content], { type })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportDocxDocument', () => {
    it('应该拒绝空的编辑器 ref', async () => {
      const result = await exportDocxDocument(null)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('编辑器未就绪')
    })

    it('应该拒绝 current 为 null 的 ref', async () => {
      const result = await exportDocxDocument({ current: null })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('编辑器未就绪')
    })

    it('应该使用编辑器的 exportDocument 方法', async () => {
      const mockBlob = createMockBlob('exported content')
      const mockEditor = {
        current: {
          exportDocument: vi.fn().mockResolvedValue(mockBlob)
        }
      }
      const progressCallback = vi.fn()

      const result = await exportDocxDocument(mockEditor, 'test.docx', progressCallback)

      expect(mockEditor.current.exportDocument).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.blob).toBe(mockBlob)
    })

    it('应该使用编辑器的 saveDocument 方法（备用）', async () => {
      const mockBlob = createMockBlob('exported content')
      const mockEditor = {
        current: {
          saveDocument: vi.fn().mockResolvedValue(mockBlob)
        }
      }

      const result = await exportDocxDocument(mockEditor, 'test.docx')

      expect(mockEditor.current.saveDocument).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('应该使用编辑器的 export 方法（备用）', async () => {
      const mockBlob = createMockBlob('exported content')
      const mockEditor = {
        current: {
          export: vi.fn().mockResolvedValue(mockBlob)
        }
      }

      const result = await exportDocxDocument(mockEditor, 'test.docx')

      expect(mockEditor.current.export).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('应该在导出失败时尝试备用方案', async () => {
      const mockEditor = {
        current: {
          exportDocument: vi.fn().mockRejectedValue(new Error('Export failed')),
          getContent: vi.fn().mockReturnValue('<p>content</p>')
        }
      }

      const result = await exportDocxDocument(mockEditor, 'test.docx')

      expect(result.success).toBe(true)
      expect(result.blob).toBeDefined()
    })

    it('应该调用进度回调函数', async () => {
      const mockBlob = createMockBlob('exported content')
      const mockEditor = {
        current: {
          exportDocument: vi.fn().mockResolvedValue(mockBlob)
        }
      }
      const progressCallback = vi.fn()

      await exportDocxDocument(mockEditor, 'test.docx', progressCallback)

      // 进度回调应该被调用多次
      expect(progressCallback.mock.calls.length).toBeGreaterThan(1)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })

    it('应该识别大文件', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
      const mockBlob = createMockBlob(largeContent)
      const mockEditor = {
        current: {
          exportDocument: vi.fn().mockResolvedValue(mockBlob)
        }
      }

      const result = await exportDocxDocument(mockEditor, 'large.docx', null, 10 * 1024 * 1024)

      expect(result.success).toBe(true)
      expect(result.isLargeFile).toBe(true)
    })

    it('应该正确处理导出错误', async () => {
      const mockEditor = {
        current: {
          exportDocument: vi.fn().mockRejectedValue(new Error('Network error')),
          getContent: vi.fn().mockReturnValue(null)
        }
      }

      const result = await exportDocxDocument(mockEditor, 'test.docx')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('downloadBlob', () => {
    it.skip('应该成功触发下载', () => {
      // 跳过：需要完整的 DOM 环境
      const mockBlob = createMockBlob('download content')
      const result = downloadBlob(mockBlob, 'test.docx')
      expect(result).toBe(true)
    })

    it('应该拒绝空 blob', () => {
      const result = downloadBlob(null, 'test.docx')
      expect(result).toBe(false)
    })
  })

  describe('previewDocxContent', () => {
    it('应该成功预览文档内容', async () => {
      // 创建带有 PK 头的模拟 DOCX 文件
      const content = 'test content here'
      const mockFile = new File(['PK' + content], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      
      const result = await previewDocxContent(mockFile)

      expect(result.success).toBe(true)
      expect(result.preview).toBeDefined()
      expect(result.size).toBe(mockFile.size)
    })

    it('应该拒绝空 blob', async () => {
      const result = await previewDocxContent(null)

      expect(result.success).toBe(false)
      expect(result.error).toContain('没有可预览的内容')
    })

    it('应该返回文件大小信息', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024)
      const mockFile = new File(['PK' + largeContent], 'large.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      
      const result = await previewDocxContent(mockFile)

      expect(result.success).toBe(true)
      expect(result.isLargeFile).toBe(true)
      expect(result.sizeMB).toBeDefined()
    })
  })

  describe('formatFileSize', () => {
    it('应该格式化字节大小', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('应该处理小数', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    })
  })

  describe('ExportError', () => {
    it('应该定义所有错误类型', () => {
      expect(ExportError).toEqual({
        EDITOR_NOT_READY: 'EDITOR_NOT_READY',
        EXPORT_FAILED: 'EXPORT_FAILED',
        FILE_TOO_LARGE: 'FILE_TOO_LARGE',
        CANCELLED: 'CANCELLED',
        UNKNOWN: 'UNKNOWN'
      })
    })
  })
})
