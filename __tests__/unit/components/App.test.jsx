// App 组件测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../../src/App.jsx'
import { mockDocxFile } from '../../__mocks__/fixtures/documents.js'

// Mock SuperDocEditor
vi.mock('@superdoc-dev/react', () => ({
  SuperDocEditor: ({ document, onReady }) => {
    // 模拟 onReady 回调
    setTimeout(() => onReady?.(), 0)
    return (
      <div data-testid="superdoc-editor" data-document={document}>
        Document Editor
      </div>
    )
  }
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('Initial State', () => {
    it('should render header with title', () => {
      // When
      render(<App />)

      // Then
      expect(screen.getByRole('heading', { name: /docx ai editor/i })).toBeInTheDocument()
    })

    it('should render file upload input', () => {
      // When
      render(<App />)

      // Then
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', '.docx')
    })

    it('should show placeholder when no document uploaded', () => {
      // When
      render(<App />)

      // Then
      expect(screen.getByText(/请上传 docx 文件/i)).toBeInTheDocument()
    })

    it('should have disabled chat input initially', () => {
      // When
      render(<App />)

      // Then
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      expect(chatInput).toBeDisabled()
    })

    it('should have disabled send button initially', () => {
      // When
      render(<App />)

      // Then
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('File Upload', () => {
    it('should handle DOCX file upload', async () => {
      // When
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
    })

    it('should enable chat input after upload', async () => {
      // When
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })

      // Then
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/ask ai/i)
        expect(chatInput).toBeEnabled()
      })
    })

    it('should enable send button after upload', async () => {
      // When
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })

      // Then
      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send/i })
        expect(sendButton).toBeEnabled()
      })
    })

    it('should hide placeholder after upload', async () => {
      // When
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })

      // Then
      await waitFor(() => {
        expect(screen.queryByText(/请上传 docx 文件/i)).not.toBeInTheDocument()
      })
    })

    it('should call SuperDoc onReady callback', async () => {
      // When
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })

      // Then
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('SuperDoc ready!')
      })
    })
  })

  describe('Chat Functionality', () => {
    beforeEach(async () => {
      render(<App />)
      const fileInput = screen.getByRole('textbox', { name: /upload/i })
      fireEvent.change(fileInput, {
        target: { files: [mockDocxFile] }
      })
      await waitFor(() => {
        expect(screen.getByTestId('superdoc-editor')).toBeInTheDocument()
      })
    })

    it('should add user message when sending', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      const sendButton = screen.getByRole('button', { name: /send/i })

      // When
      fireEvent.change(chatInput, { target: { value: '分析文档' } })
      fireEvent.click(sendButton)

      // Then
      expect(screen.getByText(/you:/i)).toBeInTheDocument()
      expect(screen.getByText('分析文档')).toBeInTheDocument()
    })

    it('should clear input after sending', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      const sendButton = screen.getByRole('button', { name: /send/i })

      // When
      fireEvent.change(chatInput, { target: { value: 'test message' } })
      fireEvent.click(sendButton)

      // Then
      expect(chatInput).toHaveValue('')
    })

    it('should not send empty message', async () => {
      // Given
      const sendButton = screen.getByRole('button', { name: /send/i })

      // When
      fireEvent.click(sendButton)

      // Then
      expect(screen.queryByText(/you:/i)).not.toBeInTheDocument()
    })

    it('should not send whitespace only message', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      const sendButton = screen.getByRole('button', { name: /send/i })

      // When
      fireEvent.change(chatInput, { target: { value: '   ' } })
      fireEvent.click(sendButton)

      // Then
      expect(screen.queryByText(/you:/i)).not.toBeInTheDocument()
    })

    it('should send message on Enter key', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)

      // When
      fireEvent.change(chatInput, { target: { value: 'test' } })
      fireEvent.keyPress(chatInput, { key: 'Enter', code: 'Enter' })

      // Then
      expect(screen.getByText(/you:/i)).toBeInTheDocument()
    })

    it('should not send on Enter when input is empty', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)

      // When
      fireEvent.keyPress(chatInput, { key: 'Enter', code: 'Enter' })

      // Then
      expect(screen.queryByText(/you:/i)).not.toBeInTheDocument()
    })

    it('should display multiple messages', async () => {
      // Given
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      const sendButton = screen.getByRole('button', { name: /send/i })

      // When
      fireEvent.change(chatInput, { target: { value: 'Message 1' } })
      fireEvent.click(sendButton)
      fireEvent.change(chatInput, { target: { value: 'Message 2' } })
      fireEvent.click(sendButton)

      // Then
      const userMessages = screen.getAllByText(/you:/i)
      expect(userMessages).toHaveLength(2)
    })

    it('should label AI messages correctly', async () => {
      // Given
      // 模拟 AI 响应（TODO: 实际实现后启用）
      /*
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI response' } }]
        })
      })
      */

      // When
      const chatInput = screen.getByPlaceholderText(/ask ai/i)
      fireEvent.change(chatInput, { target: { value: 'test' } })
      fireEvent.click(screen.getByRole('button', { name: /send/i }))

      // Then
      // 用户消息应该显示
      expect(screen.getByText(/you:/i)).toBeInTheDocument()
      // AI 消息将在 API 集成后测试
    })
  })

  describe('Layout', () => {
    it('should render main layout container', () => {
      // When
      render(<App />)

      // Then
      expect(screen.getByClassName('main-layout')).toBeInTheDocument()
    })

    it('should render document panel', () => {
      // When
      render(<App />)

      // Then
      expect(screen.getByClassName('document-panel')).toBeInTheDocument()
    })

    it('should render chat panel', () => {
      // When
      render(<App />)

      // Then
      expect(screen.getByClassName('chat-panel')).toBeInTheDocument()
    })
  })
})
