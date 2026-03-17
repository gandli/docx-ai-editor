import { useState, useCallback, useMemo } from 'react'

/**
 * 聊天快捷指令 Hook
 * 支持指令：
 * - /summarize - 总结对话内容
 * - /rewrite - 重写指定内容
 * - /explain - 解释概念或代码
 * - /help - 显示帮助信息
 * - /clear - 清空对话
 * - /export - 导出对话
 */
export function useChatCommands(options = {}) {
  const {
    onSendMessage,
    messages = [],
    onExport,
    onClear
  } = options

  const [showHelp, setShowHelp] = useState(false)
  const [pendingCommand, setPendingCommand] = useState(null)

  // 可用的快捷指令列表
  const availableCommands = useMemo(() => [
    {
      command: '/summarize',
      description: '总结当前对话的主要内容',
      usage: '/summarize [要点数量]',
      example: '/summarize 5'
    },
    {
      command: '/rewrite',
      description: '重写选中的文本或最后一条消息',
      usage: '/rewrite [风格要求]',
      example: '/rewrite 更正式一些'
    },
    {
      command: '/explain',
      description: '解释概念、术语或代码',
      usage: '/explain [内容]',
      example: '/explain 什么是闭包'
    },
    {
      command: '/clear',
      description: '清空当前对话历史',
      usage: '/clear',
      example: '/clear'
    },
    {
      command: '/export',
      description: '导出当前对话',
      usage: '/export [格式]',
      example: '/export markdown'
    },
    {
      command: '/help',
      description: '显示帮助信息',
      usage: '/help',
      example: '/help'
    }
  ], [])

  // 解析输入中的指令
  const parseCommand = useCallback((input) => {
    const trimmed = input.trim()
    
    if (!trimmed.startsWith('/')) {
      return null
    }

    const parts = trimmed.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    return { command, args, fullInput: trimmed }
  }, [])

  // 执行指令
  const executeCommand = useCallback(async (parsed) => {
    const { command, args } = parsed

    switch (command) {
      case '/help':
        setShowHelp(true)
        return { handled: true, showHelp: true }

      case '/clear':
        if (onClear) {
          const confirmed = window.confirm('确定要清空当前对话吗？此操作不可恢复。')
          if (confirmed) {
            onClear()
            return { handled: true, cleared: true }
          }
        }
        return { handled: false }

      case '/export':
        if (onExport) {
          const format = args || 'json'
          onExport(format)
          return { handled: true, exported: true, format }
        }
        return { handled: false }

      case '/summarize':
        const summaryCount = args ? parseInt(args, 10) : 5
        const userMessages = messages.filter(m => m.role === 'user')
        const aiMessages = messages.filter(m => m.role === 'assistant')
        
        const summaryPrompt = `请总结我们对话的主要内容，列出${summaryCount}个关键要点。

对话历史：
${messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}

请用简洁的格式总结关键要点。`

        if (onSendMessage) {
          onSendMessage(summaryPrompt)
          return { handled: true, command: 'summarize', messageCount: messages.length }
        }
        return { handled: false }

      case '/rewrite':
        if (messages.length === 0) {
          return { handled: true, error: '没有可重写的消息' }
        }

        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
        if (!lastUserMessage) {
          return { handled: true, error: '没有找到用户消息' }
        }

        const rewriteStyle = args || '改进表达，使其更清晰流畅'
        const rewritePrompt = `请重写以下内容：${rewriteStyle}

原文：
${lastUserMessage.content}

请提供重写后的版本。`

        if (onSendMessage) {
          onSendMessage(rewritePrompt)
          return { handled: true, command: 'rewrite', originalContent: lastUserMessage.content }
        }
        return { handled: false }

      case '/explain':
        if (!args) {
          return { handled: true, error: '请指定要解释的内容，例如：/explain 什么是闭包' }
        }

        const explainPrompt = `请详细解释以下内容：${args}

请用清晰易懂的语言，提供：
1. 基本概念
2. 关键特点
3. 使用场景
4. 示例说明（如适用）`

        if (onSendMessage) {
          onSendMessage(explainPrompt)
          return { handled: true, command: 'explain', topic: args }
        }
        return { handled: false }

      default:
        // 未知指令
        return { handled: false, error: `未知指令：${command}。输入 /help 查看可用指令。` }
    }
  }, [messages, onSendMessage, onExport, onClear])

  // 处理输入（在发送前检查是否是指令）
  const handleInput = useCallback(async (input) => {
    const parsed = parseCommand(input)
    
    if (!parsed) {
      return { isCommand: false }
    }

    const result = await executeCommand(parsed)
    return { isCommand: true, ...result }
  }, [parseCommand, executeCommand])

  // 获取指令建议（用于自动完成）
  const getCommandSuggestions = useCallback((input) => {
    const trimmed = input.trim()
    
    if (!trimmed.startsWith('/')) {
      return []
    }

    const inputLower = trimmed.toLowerCase()
    return availableCommands
      .filter(cmd => cmd.command.startsWith(inputLower))
      .map(cmd => ({
        command: cmd.command,
        description: cmd.description
      }))
  }, [availableCommands])

  // 渲染帮助信息
  const renderHelp = useMemo(() => {
    return {
      title: '快捷指令帮助',
      commands: availableCommands
    }
  }, [availableCommands])

  return {
    // 状态
    showHelp,
    setShowHelp,
    pendingCommand,
    
    // 方法
    handleInput,
    parseCommand,
    executeCommand,
    getCommandSuggestions,
    
    // 信息
    availableCommands,
    renderHelp
  }
}

export default useChatCommands
