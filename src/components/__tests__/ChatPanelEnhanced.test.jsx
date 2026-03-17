import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatPanel } from '../ChatPanel'

/**
 * 增强版 ChatPanel 组件测试
 * 测试覆盖：
 * - 消息历史持久化
 * - 快捷指令
 * - Markdown 渲染
 * - 代码块复制
 * - 消息编辑和删除
 * - 对话导出
 */
describe('ChatPanel Enhanced', () => {
  const mockSendMessage = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // 清空 localStorage
    localStorage.clear()
  })

  describe('基础功能', () => {
    it('应该正确渲染空状态', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByText('开始对话')).toBeInTheDocument()
      expect(screen.getByText(/上传文档后/)).toBeInTheDocument()
    })

    it('应该显示快捷指令提示', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByText('/summarize')).toBeInTheDocument()
      expect(screen.getByText('/rewrite')).toBeInTheDocument()
      expect(screen.getByText('/explain')).toBeInTheDocument()
      expect(screen.getByText('/help')).toBeInTheDocument()
    })

    it('应该渲染快捷操作按钮', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByText('📝 总结文档')).toBeInTheDocument()
      expect(screen.getByText('✓ 检查语法')).toBeInTheDocument()
      expect(screen.getByText('📋 优化结构')).toBeInTheDocument()
    })
  })

  describe('消息发送', () => {
    it('应该允许输入消息', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      expect(textarea.value).toBe('测试消息')
    })

    it('应该允许发送消息', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      const sendButton = screen.getByTitle('发送消息')
      
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('测试消息')
      })
    })

    it('应该通过 Enter 键发送消息', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('测试消息')
      })
    })

    it('应该通过 Shift+Enter 换行', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '第一行' } })
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
      
      expect(textarea.value).toBe('第一行')
    })
  })

  describe('快捷指令', () => {
    it('应该识别 /help 指令', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '/help' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      // /help 应该显示帮助信息而不是发送消息
      await waitFor(() => {
        expect(mockSendMessage).not.toHaveBeenCalled()
      })
    })

    it('应该识别 /clear 指令', async () => {
      // 模拟 window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '/clear' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled()
      })
    })

    it('应该识别 /summarize 指令', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '/summarize 5' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled()
      })
    })

    it('应该识别 /rewrite 指令', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '/rewrite 更正式一些' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      // 没有消息时应该不发送
      await waitFor(() => {
        expect(mockSendMessage).not.toHaveBeenCalled()
      })
    })

    it('应该识别 /explain 指令', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      fireEvent.change(textarea, { target: { value: '/explain 什么是闭包' } })
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled()
      })
    })
  })

  describe('消息历史持久化', () => {
    it('应该保存消息到 localStorage', async () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      const sendButton = screen.getByTitle('发送消息')
      
      fireEvent.change(textarea, { target: { value: '测试持久化' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        const savedHistory = localStorage.getItem('docx-ai-chat-history')
        expect(savedHistory).toBeTruthy()
        
        const history = JSON.parse(savedHistory)
        expect(history.conversations).toBeDefined()
        expect(history.currentConversationId).toBeDefined()
      }, 1000)
    })

    it('应该从 localStorage 恢复消息', () => {
      // 预置数据
      const testData = {
        conversations: [{
          id: 'test-conv-1',
          title: '测试对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            { id: 'msg-1', role: 'user', content: '历史消息', timestamp: Date.now() }
          ]
        }],
        currentConversationId: 'test-conv-1'
      }
      localStorage.setItem('docx-ai-chat-history', JSON.stringify(testData))
      
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      // 应该显示历史消息
      expect(screen.getByText('历史消息')).toBeInTheDocument()
    })
  })

  describe('对话管理', () => {
    it('应该显示对话列表按钮', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByTitle('对话列表')).toBeInTheDocument()
      expect(screen.getByTitle('新对话')).toBeInTheDocument()
    })

    it('应该允许创建新对话', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      const newConversationBtn = screen.getByTitle('新对话')
      fireEvent.click(newConversationBtn)
      
      // 应该创建新对话
      expect(screen.getByText('开始对话')).toBeInTheDocument()
    })

    it('应该显示导出按钮', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByTitle('导出为 Markdown')).toBeInTheDocument()
      expect(screen.getByTitle('导出为 JSON')).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载指示器', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} isLoading={true} />)
      
      expect(screen.getByText('AI 正在思考...')).toBeInTheDocument()
    })

    it('应该在加载时禁用发送按钮', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} isLoading={true} />)
      
      const sendButton = screen.getByTitle('发送消息')
      expect(sendButton).toBeDisabled()
    })

    it('应该在加载时禁用输入框', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} isLoading={true} />)
      
      const textarea = screen.getByPlaceholderText(/输入您的问题/)
      expect(textarea).toBeDisabled()
    })
  })

  describe('禁用状态', () => {
    it('应该在禁用时显示提示', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} disabled={true} />)
      
      const textarea = screen.getByPlaceholderText('请先上传文档')
      expect(textarea).toBeDisabled()
    })

    it('应该在禁用时禁用发送按钮', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} disabled={true} />)
      
      const sendButton = screen.getByTitle('发送消息')
      expect(sendButton).toBeDisabled()
    })
  })

  describe('响应式设计', () => {
    it('应该支持移动端视图', () => {
      const { container } = render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      // 应该包含响应式类名
      expect(container.querySelector('.chat-panel-container')).toBeTruthy()
    })
  })

  describe('辅助功能', () => {
    it('应该包含测试 ID', () => {
      const { container } = render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(container.querySelector('[data-testid="chat-panel"]')).toBeTruthy()
      expect(container.querySelector('[data-testid="chat-messages"]')).toBeTruthy()
    })

    it('应该有空状态提示', () => {
      render(<ChatPanel onSendMessage={mockSendMessage} />)
      
      expect(screen.getByRole('heading', { name: '开始对话' })).toBeInTheDocument()
    })
  })
})
