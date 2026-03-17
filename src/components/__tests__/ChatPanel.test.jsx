// ChatPanel 组件单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPanel from '../ChatPanel'

describe('ChatPanel', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('渲染', () => {
    it('应该渲染聊天面板容器', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument()
    })

    it('当没有消息时显示空状态', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('开始对话')).toBeInTheDocument()
      expect(screen.getByText(/上传文档后，向 AI 助手提问/)).toBeInTheDocument()
      expect(screen.getByText('💬')).toBeInTheDocument()
    })

    it('应该显示用户消息', () => {
      const messages = [
        { role: 'user', content: '你好', timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('您')).toBeInTheDocument()
      expect(screen.getByText('你好')).toBeInTheDocument()
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('应该显示 AI 消息', () => {
      const messages = [
        { role: 'assistant', content: '你好！有什么可以帮你？', timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('AI 助手')).toBeInTheDocument()
      expect(screen.getByText('你好！有什么可以帮你？')).toBeInTheDocument()
      expect(screen.getByText('🤖')).toBeInTheDocument()
    })

    it('应该显示消息时间戳', () => {
      const timestamp = new Date('2024-01-01 15:30:00').getTime()
      const messages = [
        { role: 'user', content: '测试', timestamp }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      // 时间戳应该格式化为 HH:MM
      expect(screen.getByText('15:30')).toBeInTheDocument()
    })

    it('应该显示加载状态', () => {
      // 加载状态需要至少有一条消息才会显示
      const messages = [
        { role: 'user', content: '测试', timestamp: Date.now() }
      ]
      
      const { container } = render(
        <ChatPanel 
          messages={messages} 
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />
      )
      
      expect(screen.getByText(/AI 正在思考/)).toBeInTheDocument()
      expect(container.querySelectorAll('.loading-dot')).toHaveLength(3)
    })

    it('应该显示错误消息', () => {
      const messages = [
        { role: 'assistant', content: '出错了', isError: true, timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('重试')).toBeInTheDocument()
    })
  })

  describe('输入和发送', () => {
    it('应该渲染输入框', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      expect(textarea).toBeInTheDocument()
    })

    it('应该禁用输入框当 disabled 为 true', () => {
      render(
        <ChatPanel 
          messages={[]} 
          onSendMessage={mockOnSendMessage}
          disabled={true}
        />
      )
      
      const textarea = screen.getByPlaceholderText('请先上传文档')
      expect(textarea).toBeDisabled()
    })

    it('应该禁用输入框当 isLoading 为 true', () => {
      render(
        <ChatPanel 
          messages={[]} 
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />
      )
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      expect(textarea).toBeDisabled()
    })

    it('应该禁用发送按钮当输入为空', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      expect(sendBtn).toBeDisabled()
    })

    it('应该启用发送按钮当有输入', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      expect(sendBtn).not.toBeDisabled()
    })

    it('点击发送按钮应该调用 onSendMessage', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      fireEvent.click(sendBtn)
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('测试消息')
    })

    it('发送消息后应该清空输入框', async () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      fireEvent.click(sendBtn)
      
      await waitFor(() => {
        expect(textarea.value).toBe('')
      })
    })

    it('按 Enter 键应该发送消息', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      // 需要触发 onKeyPress 而不是 keyDown
      fireEvent.keyPress(textarea, { key: 'Enter', charCode: 13, shiftKey: false })
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('测试消息')
    })

    it('Shift + Enter 应该换行而不是发送', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '测试' } })
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
      
      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('发送消息后应该重新聚焦输入框', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      const focusSpy = vi.spyOn(textarea, 'focus')
      
      fireEvent.change(textarea, { target: { value: '测试' } })
      fireEvent.click(screen.getByTitle('发送消息 (Enter)'))
      
      expect(focusSpy).toHaveBeenCalled()
    })
  })

  describe('输入限制', () => {
    it('应该限制最大输入长度为 2000', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      expect(textarea).toHaveAttribute('maxLength', '2000')
    })

    it('应该默认 rows 为 1', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      expect(textarea).toHaveAttribute('rows', '1')
    })
  })

  describe('提示文本', () => {
    it('应该显示输入提示', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('按 Enter 发送')).toBeInTheDocument()
      expect(screen.getByText('Shift + Enter 换行')).toBeInTheDocument()
    })
  })

  describe('重试功能', () => {
    it('错误消息应该显示重试按钮', () => {
      const messages = [
        { role: 'assistant', content: '错误内容', isError: true, timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('重试')).toBeInTheDocument()
    })

    it('点击重试应该重新发送相同的消息', () => {
      const messages = [
        { role: 'assistant', content: '原始问题', isError: true, timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      fireEvent.click(screen.getByText('重试'))
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('原始问题')
    })

    it('加载时应该禁用重试按钮', () => {
      const messages = [
        { role: 'assistant', content: '错误', isError: true, timestamp: Date.now() }
      ]
      
      render(
        <ChatPanel 
          messages={messages} 
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />
      )
      
      expect(screen.getByText('重试')).toBeDisabled()
    })
  })

  describe('自动滚动', () => {
    it('当消息变化时应该滚动到底部', async () => {
      const { rerender } = render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const newMessages = [
        { role: 'user', content: '新消息', timestamp: Date.now() }
      ]
      
      rerender(<ChatPanel messages={newMessages} onSendMessage={mockOnSendMessage} />)
      
      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
      })
    })
  })

  describe('可访问性', () => {
    it('输入框应该有正确的 placeholder', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByPlaceholderText('输入您的问题或请求...')).toBeInTheDocument()
    })

    it('发送按钮应该有 title 属性', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      expect(sendBtn).toBeInTheDocument()
    })
  })

  describe('消息头像', () => {
    it('用户消息应该显示用户头像', () => {
      const messages = [
        { role: 'user', content: '测试', timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('AI 消息应该显示 AI 头像', () => {
      const messages = [
        { role: 'assistant', content: '测试', timestamp: Date.now() }
      ]
      
      render(<ChatPanel messages={messages} onSendMessage={mockOnSendMessage} />)
      
      expect(screen.getByText('🤖')).toBeInTheDocument()
    })
  })

  describe('性能优化', () => {
    it('空消息不应该发送', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      fireEvent.click(sendBtn)
      
      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('只有空格的消息不应该发送', () => {
      render(<ChatPanel messages={[]} onSendMessage={mockOnSendMessage} />)
      
      const textarea = screen.getByPlaceholderText('输入您的问题或请求...')
      fireEvent.change(textarea, { target: { value: '   ' } })
      
      const sendBtn = screen.getByTitle('发送消息 (Enter)')
      fireEvent.click(sendBtn)
      
      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })
  })
})
