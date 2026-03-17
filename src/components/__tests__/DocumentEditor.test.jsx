import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DocumentEditor } from '../DocumentEditor.jsx'

// Mock SuperDocEditor
vi.mock('@superdoc-dev/react', () => ({
  SuperDocEditor: ({ document, documentMode, onReady, onChange }) => {
    const EditorMock = () => {
      // 模拟编辑器就绪
      setTimeout(() => onReady && onReady(), 10)
      return (
        <div 
          data-testid="superdoc-editor" 
          data-mode={documentMode}
          role="application"
        >
          <div className="editor-content">
            {document ? 'Document Loaded' : 'No Document'}
          </div>
          <button 
            data-testid="mock-save"
            onClick={() => onChange && onChange('<p>Modified content</p>')}
          >
            Trigger Change
          </button>
        </div>
      )
    }
    return EditorMock
  }
}))

describe('DocumentEditor', () => {
  const mockOnReady = vi.fn()
  const mockOnChange = vi.fn()
  const mockOnExport = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('渲染编辑器容器', () => {
      render(<DocumentEditor onReady={mockOnReady} onChange={mockOnChange} />)
      expect(screen.getByTestId('editor-container')).toBeInTheDocument()
    })

    it('未加载文档时显示占位符', () => {
      render(<DocumentEditor onReady={mockOnReady} />)
      expect(screen.getByText(/请上传/i)).toBeInTheDocument()
    })

    it('加载文档时隐藏占位符', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.queryByText(/请上传/i)).not.toBeInTheDocument()
      })
      expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
    })
  })

  describe('SuperDoc 集成', () => {
    it('使用正确的文档 URL 初始化编辑器', async () => {
      const docUrl = 'blob:test-document-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
    })

    it('以编辑模式加载', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        const editor = screen.getByTestId('superdoc-editor')
        expect(editor).toHaveAttribute('data-mode', 'editing')
      })
    })

    it('支持查看模式', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} documentMode="viewing" onReady={mockOnReady} />)
      
      await waitFor(() => {
        const editor = screen.getByTestId('superdoc-editor')
        expect(editor).toHaveAttribute('data-mode', 'viewing')
      })
    })

    it('支持评论模式', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} documentMode="commenting" onReady={mockOnReady} />)
      
      await waitFor(() => {
        const editor = screen.getByTestId('superdoc-editor')
        expect(editor).toHaveAttribute('data-mode', 'commenting')
      })
    })

    it('编辑器就绪时调用 onReady 回调', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalled()
      })
    })

    it('文档变更时调用 onChange 回调', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onChange={mockOnChange} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
      
      // 触发模拟变更
      fireEvent.click(screen.getByTestId('mock-save'))
      
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('加载状态', () => {
    it('文档加载时显示加载指示器', () => {
      const docUrl = 'blob:loading-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('加载完成后隐藏加载指示器', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      })
    })

    it('加载时显示加载文本', () => {
      const docUrl = 'blob:loading-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      expect(screen.getByText(/正在加载/i)).toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('处理无效的文档 URL', async () => {
      const invalidUrl = 'invalid-url'
      render(<DocumentEditor document={invalidUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument()
      })
    })

    it('显示错误消息', async () => {
      const invalidUrl = 'invalid-url'
      render(<DocumentEditor document={invalidUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        const error = screen.getByText(/加载失败/i)
        expect(error).toBeInTheDocument()
      })
    })

    it('提供重试按钮', async () => {
      const invalidUrl = 'invalid-url'
      const mockOnRetry = vi.fn()
      render(<DocumentEditor document={invalidUrl} onRetry={mockOnRetry} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument()
      })
    })
  })

  describe('导出功能', () => {
    it('渲染导出按钮', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onExport={mockOnExport} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
      
      expect(screen.getByRole('button', { name: /导出/i })).toBeInTheDocument()
    })

    it('导出按钮调用 onExport 回调', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onExport={mockOnExport} onReady={mockOnReady} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: /导出/i }))
      
      expect(mockOnExport).toHaveBeenCalled()
    })

    it('没有文档时禁用导出按钮', () => {
      render(<DocumentEditor onExport={mockOnExport} />)
      
      const exportButton = screen.getByRole('button', { name: /导出/i })
      expect(exportButton).toBeDisabled()
    })
  })

  describe('格式保留', () => {
    it('保留粗体格式', async () => {
      const docUrl = 'blob:formatted-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} onChange={mockOnChange} />)
      
      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalled()
      })
      
      // 模拟包含粗体的内容变更
      const boldContent = '<p>This is <strong>bold</strong> text</p>'
      mockOnChange(boldContent)
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('<strong>'))
    })

    it('保留斜体格式', async () => {
      const docUrl = 'blob:formatted-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} onChange={mockOnChange} />)
      
      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalled()
      })
      
      const italicContent = '<p>This is <em>italic</em> text</p>'
      mockOnChange(italicContent)
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('<em>'))
    })

    it('保留标题格式', async () => {
      const docUrl = 'blob:formatted-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} onChange={mockOnChange} />)
      
      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalled()
      })
      
      const headingContent = '<h1>Heading 1</h1><h2>Heading 2</h2>'
      mockOnChange(headingContent)
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('<h1>'))
    })

    it('保留列表格式', async () => {
      const docUrl = 'blob:formatted-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} onChange={mockOnChange} />)
      
      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalled()
      })
      
      const listContent = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      mockOnChange(listContent)
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('<ul>'))
    })
  })

  describe('可访问性', () => {
    it('编辑器有正确的 role 属性', async () => {
      const docUrl = 'blob:test-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        const editor = screen.getByRole('application')
        expect(editor).toBeInTheDocument()
      })
    })

    it('加载状态对屏幕阅读器可见', () => {
      const docUrl = 'blob:loading-url'
      render(<DocumentEditor document={docUrl} onReady={mockOnReady} />)
      
      const loading = screen.getByTestId('loading-indicator')
      expect(loading).toHaveAttribute('aria-live', 'polite')
    })

    it('错误状态对屏幕阅读器可见', async () => {
      const invalidUrl = 'invalid-url'
      render(<DocumentEditor document={invalidUrl} onReady={mockOnReady} />)
      
      await waitFor(() => {
        const error = screen.getByText(/加载失败/i)
        expect(error).toHaveAttribute('role', 'alert')
      })
    })
  })
})
