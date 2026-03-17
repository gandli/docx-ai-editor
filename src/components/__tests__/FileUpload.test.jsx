import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileUpload } from '../FileUpload.jsx'
import { validateDocxFile } from '../../api/docx-utils.js'

// Mock validateDocxFile
vi.mock('../../api/docx-utils.js', () => ({
  validateDocxFile: vi.fn()
}))

describe('FileUpload', () => {
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    validateDocxFile.mockResolvedValue({ valid: true })
  })

  describe('基础渲染', () => {
    it('渲染文件上传区域', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      expect(screen.getByText(/上传 DOCX 文件/i)).toBeInTheDocument()
    })

    it('渲染拖放区域', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      const dropzone = screen.getByTestId('file-dropzone')
      expect(dropzone).toBeInTheDocument()
    })

    it('显示支持的文件类型提示', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      expect(screen.getByText(/支持 .docx 格式/i)).toBeInTheDocument()
    })

    it('渲染浏览按钮', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      expect(screen.getByRole('button', { name: /浏览/i })).toBeInTheDocument()
    })
  })

  describe('文件选择', () => {
    it('处理文件选择', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['PK test content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(validateDocxFile).toHaveBeenCalledWith(file, expect.any(Number))
      })
    })

    it('验证通过后调用 onFileSelect', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const file = new File(['PK test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      validateDocxFile.mockResolvedValue({ valid: true })
      
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file)
      })
    })

    it('验证失败时显示错误消息', async () => {
      validateDocxFile.mockResolvedValue({ valid: false, error: '无效的文件格式' })
      
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const file = new File(['invalid'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText(/无效的文件格式/i)).toBeInTheDocument()
      })
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('拖放功能', () => {
    it('拖放进入时显示视觉反馈', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      const dropzone = screen.getByTestId('file-dropzone')
      
      fireEvent.dragEnter(dropzone)
      expect(dropzone).toHaveClass('drag-active')
    })

    it('拖放离开时移除视觉反馈', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      const dropzone = screen.getByTestId('file-dropzone')
      
      fireEvent.dragEnter(dropzone)
      fireEvent.dragLeave(dropzone)
      expect(dropzone).not.toHaveClass('drag-active')
    })
  })

  describe('加载状态', () => {
    it('验证期间显示加载指示器', async () => {
      validateDocxFile.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ valid: true }), 100)
      ))
      
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const file = new File(['PK test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      })
    })
  })

  describe('文件大小限制', () => {
    it('拒绝超过 50MB 的文件', async () => {
      validateDocxFile.mockResolvedValue({ 
        valid: false, 
        error: '文件大小不能超过 50MB' 
      })
      
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const largeFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [largeFile] } })
      
      await waitFor(() => {
        expect(screen.getByText(/文件大小不能超过 50MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('可访问性', () => {
    it('文件输入有正确的 label', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      const labels = screen.getAllByLabelText(/上传 DOCX 文件/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('错误消息对屏幕阅读器可见', async () => {
      validateDocxFile.mockResolvedValue({ valid: false, error: '无效文件' })
      
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const file = new File(['invalid'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        const error = screen.getByTestId('error-message')
        expect(error).toHaveAttribute('role', 'alert')
      })
    })
  })
})
