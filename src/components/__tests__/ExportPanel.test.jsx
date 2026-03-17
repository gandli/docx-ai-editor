import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportPanel } from '../ExportPanel'
import * as docxUtils from '../../api/docx-utils'

// 模拟 docx-utils
vi.mock('../../api/docx-utils', () => ({
  exportDocxDocument: vi.fn(),
  downloadBlob: vi.fn(),
  previewDocxContent: vi.fn(),
  formatFileSize: vi.fn((bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`),
  ExportError: {
    EDITOR_NOT_READY: 'EDITOR_NOT_READY',
    EXPORT_FAILED: 'EXPORT_FAILED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    CANCELLED: 'CANCELLED',
    UNKNOWN: 'UNKNOWN'
  }
}))

describe('ExportPanel 组件', () => {
  const mockEditorRef = {
    current: {
      getContent: vi.fn().mockReturnValue('<p>Test content</p>'),
      getHTML: vi.fn().mockReturnValue('<p>Test content</p>'),
      exportDocument: vi.fn()
    }
  }

  const defaultProps = {
    editorRef: mockEditorRef,
    originalFileName: 'test.docx',
    onExportComplete: vi.fn(),
    onExportError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染预览和导出按钮', () => {
      render(<ExportPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /预览/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导出/i })).toBeInTheDocument()
    })

    it('应该在禁用状态下禁用按钮', () => {
      render(<ExportPanel {...defaultProps} disabled={true} />)

      expect(screen.getByRole('button', { name: /预览/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /导出/i })).toBeDisabled()
    })

    it('应该渲染导出面板容器', () => {
      const { container } = render(<ExportPanel {...defaultProps} />)

      expect(container.querySelector('[data-testid="export-panel"]')).toBeInTheDocument()
    })
  })

  describe('预览功能', () => {
    it('应该打开预览面板', async () => {
      render(<ExportPanel {...defaultProps} />)

      const previewButton = screen.getByRole('button', { name: /预览/i })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/导出预览/i)).toBeInTheDocument()
      })
    })

    it('应该显示文档内容预览', async () => {
      render(<ExportPanel {...defaultProps} />)

      const previewButton = screen.getByRole('button', { name: /预览/i })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/字符数/i)).toBeInTheDocument()
      })
    })

    it('应该能够关闭预览面板', async () => {
      render(<ExportPanel {...defaultProps} />)

      const previewButton = screen.getByRole('button', { name: /预览/i })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/导出预览/i)).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /关闭预览/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText(/导出预览/i)).not.toBeInTheDocument()
      })
    })

    it('应该从预览直接导出', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: true,
        blob: new Blob(['test']),
        size: 1024,
        isLargeFile: false
      })

      render(<ExportPanel {...defaultProps} />)

      const previewButton = screen.getByRole('button', { name: /预览/i })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/导出预览/i)).toBeInTheDocument()
      })

      const exportButton = screen.getByRole('button', { name: /确认导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(docxUtils.exportDocxDocument).toHaveBeenCalled()
      })
    })
  })

  describe('导出功能', () => {
    it('应该成功导出文档', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: true,
        blob: new Blob(['test']),
        size: 1024,
        isLargeFile: false
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(docxUtils.exportDocxDocument).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText(/导出成功/i)).toBeInTheDocument()
      })
    })

    it('应该显示导出进度', async () => {
      docxUtils.exportDocxDocument.mockImplementation(async (ref, name, onProgress) => {
        onProgress?.(10)
        onProgress?.(50)
        onProgress?.(100)
        return {
          success: true,
          blob: new Blob(['test']),
          size: 1024,
          isLargeFile: false
        }
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/导出中/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/导出完成/i)).toBeInTheDocument()
      })
    })

    it('应该处理导出错误', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: false,
        error: '导出失败'
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/导出失败/i)).toBeInTheDocument()
      })
    })

    it('应该显示重试按钮', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: false,
        error: '导出失败'
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument()
      })
    })

    it('应该调用 onExportComplete 回调', async () => {
      const mockBlob = new Blob(['test'])
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: true,
        blob: mockBlob,
        size: 1024,
        isLargeFile: false
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(defaultProps.onExportComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            fileName: expect.stringContaining('.docx'),
            blob: mockBlob,
            size: 1024
          })
        )
      })
    })

    it('应该调用 onExportError 回调', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: false,
        error: '导出失败'
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(defaultProps.onExportError).toHaveBeenCalled()
      })
    })
  })

  describe('大文件处理', () => {
    it('应该标识大文件', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: true,
        blob: new Blob(['x'.repeat(11 * 1024 * 1024)]),
        size: 11 * 1024 * 1024,
        isLargeFile: true
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/大文件/i)).toBeInTheDocument()
      })
    })
  })

  describe('取消导出', () => {
    it('应该能够取消导出', async () => {
      let progressCallback
      docxUtils.exportDocxDocument.mockImplementation(async (ref, name, onProgress) => {
        progressCallback = onProgress
        onProgress?.(10)
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          success: true,
          blob: new Blob(['test']),
          size: 1024,
          isLargeFile: false
        }
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/导出中/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /取消/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText(/已取消/i)).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理编辑器未就绪错误', async () => {
      render(<ExportPanel editorRef={{ current: null }} {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(defaultProps.onExportError).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EDITOR_NOT_READY'
          })
        )
      })
    })

    it('应该处理导出异常', async () => {
      docxUtils.exportDocxDocument.mockRejectedValue(new Error('Network error'))

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(defaultProps.onExportError).toHaveBeenCalled()
      })
    })
  })

  describe('可访问性', () => {
    it('应该为进度条设置正确的 ARIA 属性', async () => {
      docxUtils.exportDocxDocument.mockImplementation(async (ref, name, onProgress) => {
        onProgress?.(50)
        return {
          success: true,
          blob: new Blob(['test']),
          size: 1024,
          isLargeFile: false
        }
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '50')
        expect(progressbar).toHaveAttribute('aria-valuemin', '0')
        expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      })
    })

    it('应该为错误信息设置 role=alert', async () => {
      docxUtils.exportDocxDocument.mockResolvedValue({
        success: false,
        error: '导出失败'
      })

      render(<ExportPanel {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /导出/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
