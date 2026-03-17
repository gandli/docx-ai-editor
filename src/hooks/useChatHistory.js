import { useState, useCallback, useEffect } from 'react'

/**
 * 聊天历史管理 Hook
 * 功能：
 * 1. 消息历史持久化（localStorage）
 * 2. 对话上下文管理
 * 3. 对话导出功能
 */
export function useChatHistory(options = {}) {
  const {
    storageKey = 'docx-ai-chat-history',
    maxMessages = 100,
    autoSave = true
  } = options

  // 聊天消息状态
  const [messages, setMessages] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [conversations, setConversations] = useState([])

  // 从 localStorage 加载聊天历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        setConversations(parsed.conversations || [])
        
        // 恢复当前对话
        if (parsed.currentConversationId) {
          setCurrentConversationId(parsed.currentConversationId)
          const currentConv = parsed.conversations.find(
            c => c.id === parsed.currentConversationId
          )
          if (currentConv) {
            setMessages(currentConv.messages || [])
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error)
    }
  }, [storageKey])

  // 保存聊天历史到 localStorage
  useEffect(() => {
    if (!autoSave) return
    
    try {
      const historyData = {
        conversations,
        currentConversationId,
        lastUpdated: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(historyData))
    } catch (error) {
      console.warn('Failed to save chat history:', error)
    }
  }, [conversations, currentConversationId, autoSave, storageKey])

  // 创建新对话
  const createConversation = useCallback((title = '新对话') => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newConversation = {
      id: newId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    }
    
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newId)
    setMessages([])
    
    return newId
  }, [])

  // 切换到指定对话
  const switchConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages || [])
    }
  }, [conversations])

  // 添加消息
  const addMessage = useCallback((message) => {
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: message.role, // 'user' | 'assistant' | 'system'
      content: message.content,
      timestamp: Date.now(),
      type: message.type || 'text', // 'text' | 'code' | 'markdown'
      metadata: message.metadata || {}
    }

    setMessages(prev => {
      const updated = [...prev, newMessage]
      // 限制消息数量
      if (updated.length > maxMessages) {
        return updated.slice(updated.length - maxMessages)
      }
      return updated
    })

    // 更新对话信息
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        // 如果是第一条消息，更新标题
        const isFirstMessage = conv.messages.length === 0 && message.role === 'user'
        return {
          ...conv,
          title: isFirstMessage ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '') : conv.title,
          messages: [...(conv.messages || []), newMessage].slice(-maxMessages),
          updatedAt: Date.now()
        }
      }
      return conv
    }))

    return newMessage.id
  }, [currentConversationId, maxMessages])

  // 更新消息
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates, updatedAt: Date.now() } : msg
    ))

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates, updatedAt: Date.now() } : msg
          ),
          updatedAt: Date.now()
        }
      }
      return conv
    }))
  }, [currentConversationId])

  // 删除消息
  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.filter(msg => msg.id !== messageId),
          updatedAt: Date.now()
        }
      }
      return conv
    }))
  }, [currentConversationId])

  // 清空当前对话
  const clearConversation = useCallback(() => {
    setMessages([])
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [],
          updatedAt: Date.now()
        }
      }
      return conv
    }))
  }, [currentConversationId])

  // 删除对话
  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    
    if (conversationId === currentConversationId) {
      const remaining = conversations.filter(c => c.id !== conversationId)
      if (remaining.length > 0) {
        switchConversation(remaining[0].id)
      } else {
        createConversation()
      }
    }
  }, [conversations, currentConversationId, switchConversation, createConversation])

  // 导出对话
  const exportConversation = useCallback((format = 'json') => {
    const conversation = conversations.find(c => c.id === currentConversationId)
    if (!conversation) return null

    if (format === 'json') {
      return JSON.stringify(conversation, null, 2)
    }
    
    if (format === 'markdown') {
      const md = conversation.messages.map(msg => {
        const role = msg.role === 'user' ? '👤 用户' : '🤖 AI'
        const time = new Date(msg.timestamp).toLocaleString('zh-CN')
        return `### ${role} - ${time}\n\n${msg.content}\n`
      }).join('\n---\n\n')
      
      return `# ${conversation.title}\n\n创建时间：${new Date(conversation.createdAt).toLocaleString('zh-CN')}\n\n${md}`
    }
    
    if (format === 'txt') {
      return conversation.messages.map(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI'
        const time = new Date(msg.timestamp).toLocaleString('zh-CN')
        return `[${time}] ${role}: ${msg.content}`
      }).join('\n\n')
    }

    return null
  }, [conversations, currentConversationId])

  // 下载导出文件
  const downloadExport = useCallback((format = 'json', filename = null) => {
    const content = exportConversation(format)
    if (!content) return

    const conversation = conversations.find(c => c.id === currentConversationId)
    const defaultName = conversation ? conversation.title.replace(/[^a-z0-9]/gi, '_') : 'conversation'
    const ext = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'
    const finalFilename = filename || `${defaultName}.${ext}`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [exportConversation, conversations, currentConversationId])

  // 获取对话统计
  const getConversationStats = useCallback(() => {
    const conversation = conversations.find(c => c.id === currentConversationId)
    if (!conversation) return null

    const userMessages = conversation.messages.filter(m => m.role === 'user').length
    const aiMessages = conversation.messages.filter(m => m.role === 'assistant').length
    
    return {
      totalMessages: conversation.messages.length,
      userMessages,
      aiMessages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      duration: conversation.updatedAt - conversation.createdAt
    }
  }, [conversations, currentConversationId])

  // 初始化（如果没有当前对话）
  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      createConversation('新对话')
    }
  }, [currentConversationId, conversations.length, createConversation])

  return {
    // 状态
    messages,
    conversations,
    currentConversationId,
    
    // 消息操作
    addMessage,
    updateMessage,
    deleteMessage,
    clearConversation,
    
    // 对话管理
    createConversation,
    switchConversation,
    deleteConversation,
    
    // 导出功能
    exportConversation,
    downloadExport,
    getConversationStats
  }
}

export default useChatHistory
