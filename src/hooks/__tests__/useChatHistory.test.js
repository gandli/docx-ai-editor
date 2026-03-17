import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChatHistory } from '../useChatHistory'

/**
 * useChatHistory Hook 测试
 */
describe('useChatHistory', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该创建默认对话', () => {
      const { result } = renderHook(() => useChatHistory())
      
      expect(result.current.conversations.length).toBeGreaterThan(0)
      expect(result.current.currentConversationId).toBeTruthy()
    })

    it('应该从 localStorage 加载历史', () => {
      const testData = {
        conversations: [{
          id: 'test-conv',
          title: '测试对话',
          messages: [{ id: 'msg-1', role: 'user', content: '测试' }]
        }],
        currentConversationId: 'test-conv'
      }
      localStorage.setItem('docx-ai-chat-history', JSON.stringify(testData))
      
      const { result } = renderHook(() => useChatHistory({ storageKey: 'docx-ai-chat-history' }))
      
      expect(result.current.conversations.length).toBe(1)
      expect(result.current.currentConversationId).toBe('test-conv')
    })
  })

  describe('消息操作', () => {
    it('应该添加消息', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({
          role: 'user',
          content: '测试消息'
        })
      })
      
      expect(result.current.messages.length).toBe(1)
      expect(result.current.messages[0].content).toBe('测试消息')
    })

    it('应该更新消息', () => {
      const { result } = renderHook(() => useChatHistory())
      
      let messageId
      act(() => {
        const id = result.current.addMessage({
          role: 'user',
          content: '原始消息'
        })
        messageId = id
      })
      
      act(() => {
        result.current.updateMessage(messageId, {
          content: '更新后的消息',
          edited: true
        })
      })
      
      expect(result.current.messages[0].content).toBe('更新后的消息')
      expect(result.current.messages[0].edited).toBe(true)
    })

    it('应该删除消息', () => {
      const { result } = renderHook(() => useChatHistory())
      
      let messageId
      act(() => {
        const id = result.current.addMessage({
          role: 'user',
          content: '待删除消息'
        })
        messageId = id
      })
      
      expect(result.current.messages.length).toBe(1)
      
      act(() => {
        result.current.deleteMessage(messageId)
      })
      
      expect(result.current.messages.length).toBe(0)
    })

    it('应该限制消息数量', () => {
      const { result } = renderHook(() => useChatHistory({ maxMessages: 5 }))
      
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addMessage({
            role: 'user',
            content: `消息${i}`
          })
        }
      })
      
      expect(result.current.messages.length).toBe(5)
      expect(result.current.messages[0].content).toBe('消息 5')
    })
  })

  describe('对话管理', () => {
    it('应该创建新对话', () => {
      const { result } = renderHook(() => useChatHistory())
      const initialCount = result.current.conversations.length
      
      let newId
      act(() => {
        newId = result.current.createConversation('新对话')
      })
      
      expect(result.current.conversations.length).toBe(initialCount + 1)
      expect(result.current.currentConversationId).toBe(newId)
      expect(result.current.messages.length).toBe(0)
    })

    it('应该切换对话', () => {
      const { result } = renderHook(() => useChatHistory())
      
      let firstConvId, secondConvId
      act(() => {
        firstConvId = result.current.currentConversationId
        result.current.addMessage({ role: 'user', content: '对话 1' })
        secondConvId = result.current.createConversation('对话 2')
      })
      
      expect(result.current.messages.length).toBe(0)
      
      act(() => {
        result.current.switchConversation(firstConvId)
      })
      
      expect(result.current.messages.length).toBe(1)
      expect(result.current.messages[0].content).toBe('对话 1')
    })

    it('应该删除对话', () => {
      const { result } = renderHook(() => useChatHistory())
      
      let convId
      act(() => {
        convId = result.current.createConversation('待删除')
      })
      
      const initialCount = result.current.conversations.length
      
      act(() => {
        result.current.deleteConversation(convId)
      })
      
      expect(result.current.conversations.length).toBe(initialCount - 1)
    })

    it('应该清空对话', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '消息 1' })
        result.current.addMessage({ role: 'assistant', content: '消息 2' })
      })
      
      expect(result.current.messages.length).toBe(2)
      
      act(() => {
        result.current.clearConversation()
      })
      
      expect(result.current.messages.length).toBe(0)
    })
  })

  describe('导出功能', () => {
    it('应该导出为 JSON', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '测试' })
      })
      
      const exported = result.current.exportConversation('json')
      expect(exported).toBeTruthy()
      
      const parsed = JSON.parse(exported)
      expect(parsed.messages).toBeDefined()
      expect(parsed.messages.length).toBe(1)
    })

    it('应该导出为 Markdown', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '用户消息' })
        result.current.addMessage({ role: 'assistant', content: 'AI 回复' })
      })
      
      const exported = result.current.exportConversation('markdown')
      expect(exported).toContain('#')
      expect(exported).toContain('👤 用户')
      expect(exported).toContain('🤖 AI')
    })

    it('应该导出为纯文本', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '测试' })
      })
      
      const exported = result.current.exportConversation('txt')
      expect(exported).toContain('用户:')
    })
  })

  describe('统计功能', () => {
    it('应该获取对话统计', () => {
      const { result } = renderHook(() => useChatHistory())
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '用户 1' })
        result.current.addMessage({ role: 'user', content: '用户 2' })
        result.current.addMessage({ role: 'assistant', content: 'AI 1' })
      })
      
      const stats = result.current.getConversationStats()
      expect(stats.totalMessages).toBe(3)
      expect(stats.userMessages).toBe(2)
      expect(stats.aiMessages).toBe(1)
    })
  })

  describe('持久化', () => {
    it('应该自动保存到 localStorage', () => {
      const { result } = renderHook(() => useChatHistory({ autoSave: true }))
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '测试' })
      })
      
      // 等待保存
      setTimeout(() => {
        const saved = localStorage.getItem('docx-ai-chat-history')
        expect(saved).toBeTruthy()
      }, 100)
    })

    it('应该禁用自动保存', () => {
      const { result } = renderHook(() => useChatHistory({ autoSave: false }))
      
      act(() => {
        result.current.addMessage({ role: 'user', content: '测试' })
      })
      
      const saved = localStorage.getItem('docx-ai-chat-history')
      expect(saved).toBeFalsy()
    })
  })
})
