import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChatCommands } from '../useChatCommands'

/**
 * useChatCommands Hook 测试
 */
describe('useChatCommands', () => {
  const mockSendMessage = vi.fn()
  const mockExport = vi.fn()
  const mockClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMessage.mockClear()
    mockExport.mockClear()
    mockClear.mockClear()
  })

  describe('指令解析', () => {
    it('应该识别 /help 指令', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/help')
      expect(parsed).toEqual({
        command: '/help',
        args: '',
        fullInput: '/help'
      })
    })

    it('应该识别带参数的指令', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/summarize 5')
      expect(parsed.command).toBe('/summarize')
      expect(parsed.args).toBe('5')
    })

    it('应该忽略非指令输入', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('普通消息')
      expect(parsed).toBeNull()
    })

    it('应该处理大小写不敏感', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/HELP')
      expect(parsed.command).toBe('/help')
    })
  })

  describe('/help 指令', () => {
    it('应该显示帮助信息', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/help')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(executed.showHelp).toBe(true)
    })
  })

  describe('/summarize 指令', () => {
    it('应该发送总结请求', async () => {
      const messages = [
        { role: 'user', content: '消息 1' },
        { role: 'assistant', content: '回复 1' }
      ]
      
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        messages
      }))
      
      const parsed = result.current.parseCommand('/summarize 3')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(executed.command).toBe('summarize')
      expect(mockSendMessage).toHaveBeenCalled()
    })

    it('应该使用默认总结数量', async () => {
      const messages = [{ role: 'user', content: '测试' }]
      
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        messages
      }))
      
      const parsed = result.current.parseCommand('/summarize')
      await result.current.executeCommand(parsed)
      
      expect(mockSendMessage).toHaveBeenCalled()
      const callArgs = mockSendMessage.mock.calls[0][0]
      expect(callArgs).toContain('5 个关键要点')
    })
  })

  describe('/rewrite 指令', () => {
    it('应该重写最后一条用户消息', async () => {
      const messages = [
        { role: 'user', content: '需要重写的消息' },
        { role: 'assistant', content: 'AI 回复' }
      ]
      
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        messages
      }))
      
      const parsed = result.current.parseCommand('/rewrite 更简洁一些')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(mockSendMessage).toHaveBeenCalled()
    })

    it('应该在没有消息时返回错误', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        messages: []
      }))
      
      const parsed = result.current.parseCommand('/rewrite')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(executed.error).toBeTruthy()
    })
  })

  describe('/explain 指令', () => {
    it('应该发送解释请求', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/explain 闭包')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(mockSendMessage).toHaveBeenCalled()
      const callArgs = mockSendMessage.mock.calls[0][0]
      expect(callArgs).toContain('闭包')
    })

    it('应该在没有参数时返回错误', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const parsed = result.current.parseCommand('/explain')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(executed.error).toBeTruthy()
    })
  })

  describe('/clear 指令', () => {
    it('应该清空对话', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        onClear: mockClear
      }))
      
      const parsed = result.current.parseCommand('/clear')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(mockClear).toHaveBeenCalled()
    })

    it('应该允许取消清空', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        onClear: mockClear
      }))
      
      const parsed = result.current.parseCommand('/clear')
      await result.current.executeCommand(parsed)
      
      expect(mockClear).not.toHaveBeenCalled()
    })
  })

  describe('/export 指令', () => {
    it('应该导出对话', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        onExport: mockExport
      }))
      
      const parsed = result.current.parseCommand('/export markdown')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(mockExport).toHaveBeenCalledWith('markdown')
    })

    it('应该使用默认导出格式', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage,
        onExport: mockExport
      }))
      
      const parsed = result.current.parseCommand('/export')
      const executed = await result.current.executeCommand(parsed)
      
      expect(executed.handled).toBe(true)
      expect(mockExport).toHaveBeenCalledWith('json')
    })
  })

  describe('指令建议', () => {
    it('应该提供指令建议', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const suggestions = result.current.getCommandSuggestions('/hel')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].command).toBe('/help')
    })

    it('应该过滤匹配的指令', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const suggestions = result.current.getCommandSuggestions('/sum')
      expect(suggestions.every(s => s.command.startsWith('/sum'))).toBe(true)
    })

    it('应该在没有匹配时返回空数组', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const suggestions = result.current.getCommandSuggestions('/xyz')
      expect(suggestions.length).toBe(0)
    })

    it('应该对非指令输入返回空数组', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const suggestions = result.current.getCommandSuggestions('普通消息')
      expect(suggestions.length).toBe(0)
    })
  })

  describe('输入处理', () => {
    it('应该处理指令输入', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const handled = await result.current.handleInput('/help')
      expect(handled.isCommand).toBe(true)
    })

    it('应该返回非指令输入', async () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const handled = await result.current.handleInput('普通消息')
      expect(handled.isCommand).toBe(false)
    })
  })

  describe('可用指令列表', () => {
    it('应该包含所有支持的指令', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const commands = result.current.availableCommands
      expect(commands.some(c => c.command === '/summarize')).toBe(true)
      expect(commands.some(c => c.command === '/rewrite')).toBe(true)
      expect(commands.some(c => c.command === '/explain')).toBe(true)
      expect(commands.some(c => c.command === '/help')).toBe(true)
      expect(commands.some(c => c.command === '/clear')).toBe(true)
      expect(commands.some(c => c.command === '/export')).toBe(true)
    })

    it('应该包含指令描述', () => {
      const { result } = renderHook(() => useChatCommands({
        onSendMessage: mockSendMessage
      }))
      
      const commands = result.current.availableCommands
      commands.forEach(cmd => {
        expect(cmd.description).toBeTruthy()
        expect(cmd.usage).toBeTruthy()
        expect(cmd.example).toBeTruthy()
      })
    })
  })
})
