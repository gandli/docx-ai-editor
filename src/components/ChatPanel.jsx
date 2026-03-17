import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageRenderer } from './MessageRenderer'
import { useChatHistory } from '../hooks/useChatHistory'
import { useChatCommands } from '../hooks/useChatCommands'
import './ChatPanel.css'

/**
 * 增强版聊天面板组件
 * 功能：
 * - 消息历史持久化（localStorage）
 * - 对话上下文管理
 * - 快捷指令（/summarize, /rewrite, /explain）
 * - 代码块渲染和复制
 * - Markdown 渲染支持
 * - 消息编辑和删除
 * - 对话导出功能
 */
export function ChatPanel({ 
  onSendMessage: parentSendMessage,
  isLoading = false,
  disabled = false 
}) {
  // 使用聊天历史 hook
  const {
    messages,
    conversations,
    currentConversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    clearConversation,
    createConversation,
    switchConversation,
    deleteConversation,
    downloadExport,
    getConversationStats
  } = useChatHistory({
    storageKey: 'docx-ai-chat-history',
    maxMessages: 100,
    autoSave: true
  })

  // 本地状态
  const [inputMessage, setInputMessage] = useState('')
  const [isLocalLoading, setIsLocalLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showConversationList, setShowConversationList] = useState(false)
  const [showStats, setShowStats] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMessage])

  // 处理发送消息
  const handleSendMessage = useCallback(async (content = inputMessage) => {
    if (!content.trim() || isLoading || isLocalLoading || disabled) return
    
    const trimmedContent = content.trim()
    
    // 添加用户消息
    addMessage({
      role: 'user',
      content: trimmedContent,
      type: 'text'
    })
    
    setInputMessage('')
    setIsLocalLoading(true)
    
    // 调用父组件的发送函数
    if (parentSendMessage) {
      try {
        const response = await parentSendMessage(trimmedContent)
        
        // 添加 AI 响应
        if (response) {
          addMessage({
            role: 'assistant',
            content: response,
            type: 'markdown'
          })
        }
      } catch (error) {
        console.error('Send message error:', error)
        addMessage({
          role: 'assistant',
          content: `抱歉，发生错误：${error.message}`,
          type: 'text',
          metadata: { isError: true }
        })
      } finally {
        setIsLocalLoading(false)
      }
    } else {
      // 模拟响应（用于测试）
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `收到您的消息：${trimmedContent}\n\n这是一个测试响应。请连接实际的 AI 服务。`,
          type: 'markdown'
        })
        setIsLocalLoading(false)
      }, 1000)
    }
    
    // 重新聚焦输入框
    inputRef.current?.focus()
  }, [inputMessage, isLoading, isLocalLoading, disabled, parentSendMessage, addMessage])

  // 处理键盘事件
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // 处理输入（检查快捷指令）
  const { handleInput: handleCommandInput } = useChatCommands({
    onSendMessage: (content) => handleSendMessage(content),
    messages,
    onExport: (format) => downloadExport(format),
    onClear: () => clearConversation()
  })

  // 处理输入变化
  const handleInputChange = useCallback(async (e) => {
    const value = e.target.value
    setInputMessage(value)
    
    // 检查是否是指令
    if (value.startsWith('/')) {
      await handleCommandInput(value)
    }
  }, [handleCommandInput])

  // 开始编辑消息
  const startEditMessage = useCallback((message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }, [])

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (editingMessageId && editContent.trim()) {
      updateMessage(editingMessageId, {
        content: editContent.trim(),
        edited: true,
        editedAt: Date.now()
      })
      setEditingMessageId(null)
      setEditContent('')
    }
  }, [editingMessageId, editContent, updateMessage])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditContent('')
  }, [])

  // 处理编辑键盘事件
  const handleEditKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }, [saveEdit, cancelEdit])

  // 删除消息
  const handleDeleteMessage = useCallback((messageId) => {
    const confirmed = window.confirm('确定要删除这条消息吗？')
    if (confirmed) {
      deleteMessage(messageId)
    }
  }, [deleteMessage])

  // 重新发送消息
  const handleRetryMessage = useCallback((content) => {
    handleSendMessage(content)
  }, [handleSendMessage])

  // 导出对话
  const handleExport = useCallback((format = 'json') => {
    downloadExport(format)
  }, [downloadExport])

  // 获取统计信息
  const stats = getConversationStats()

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 格式化相对时间
  const formatRelativeTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  return (
    <div className="chat-panel-container" data-testid="chat-panel">
      {/* 顶部工具栏 */}
      <div className="chat-toolbar">
        <div className="toolbar-left">
          <button 
            className="toolbar-btn"
            onClick={() => setShowConversationList(!showConversationList)}
            title="对话列表"
          >
            💬 {conversations.length}
          </button>
          <button 
            className="toolbar-btn"
            onClick={() => createConversation()}
            title="新对话"
          >
            ➕
          </button>
        </div>
        
        <div className="toolbar-right">
          {stats && (
            <button 
              className="toolbar-btn toolbar-stats"
              onClick={() => setShowStats(!showStats)}
              title="对话统计"
            >
              📊 {stats.totalMessages} 条消息
            </button>
          )}
          <button 
            className="toolbar-btn"
            onClick={() => handleExport('markdown')}
            title="导出为 Markdown"
          >
            📥 MD
          </button>
          <button 
            className="toolbar-btn"
            onClick={() => handleExport('json')}
            title="导出为 JSON"
          >
            📥 JSON
          </button>
        </div>
      </div>

      {/* 对话列表侧边栏 */}
      {showConversationList && (
        <div className="conversation-sidebar">
          <div className="sidebar-header">
            <h3>对话历史</h3>
            <button 
              className="close-sidebar-btn"
              onClick={() => setShowConversationList(false)}
            >
              ✕
            </button>
          </div>
          <div className="conversation-list">
            {conversations.map(conv => (
              <div 
                key={conv.id}
                className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                onClick={() => {
                  switchConversation(conv.id)
                  setShowConversationList(false)
                }}
              >
                <div className="conversation-title">{conv.title}</div>
                <div className="conversation-meta">
                  <span className="conversation-time">{formatRelativeTime(conv.updatedAt)}</span>
                  <span className="conversation-count">{conv.messages.length}条</span>
                </div>
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  title="删除对话"
                >
                  🗑️
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="no-conversations">暂无对话历史</div>
            )}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="chat-messages" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">💬</div>
            <h3>开始对话</h3>
            <p>上传文档后，向 AI 助手提问或请求修改建议</p>
            <div className="quick-actions">
              <button 
                className="quick-action-btn"
                onClick={() => handleSendMessage('请总结这个文档的主要内容')}
              >
                📝 总结文档
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleSendMessage('请检查文档中的语法错误')}
              >
                ✓ 检查语法
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleSendMessage('请改进文档的结构')}
              >
                📋 优化结构
              </button>
            </div>
            <div className="command-hints">
              <p>💡 快捷指令：</p>
              <code>/summarize</code>
              <code>/rewrite</code>
              <code>/explain</code>
              <code>/help</code>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div 
                key={msg.id} 
                className={`message ${msg.role} ${msg.metadata?.isError ? 'error' : ''} ${editingMessageId === msg.id ? 'editing' : ''}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'user' ? '您' : 'AI 助手'}
                    </span>
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                      {msg.edited && <span className="edited-badge"> (已编辑)</span>}
                    </span>
                  </div>
                  
                  {editingMessageId === msg.id ? (
                    <div className="message-edit-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={handleEditKeyPress}
                        className="edit-textarea"
                        rows={3}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="save-edit-btn" onClick={saveEdit}>
                          ✓ 保存
                        </button>
                        <button className="cancel-edit-btn" onClick={cancelEdit}>
                          ✕ 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="message-text">
                        {msg.type === 'markdown' || msg.type === 'text' ? (
                          <MessageRenderer content={msg.content} type={msg.type} />
                        ) : (
                          <div className="plain-message">{msg.content}</div>
                        )}
                      </div>
                      
                      {msg.metadata?.isError && (
                        <button 
                          className="retry-btn"
                          onClick={() => handleRetryMessage(msg.content)}
                          disabled={isLoading || isLocalLoading}
                        >
                          🔄 重试
                        </button>
                      )}
                      
                      {/* 消息操作按钮 */}
                      <div className="message-actions">
                        {msg.role === 'user' && (
                          <button 
                            className="action-btn"
                            onClick={() => startEditMessage(msg)}
                            title="编辑"
                          >
                            ✏️
                          </button>
                        )}
                        <button 
                          className="action-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content)
                          }}
                          title="复制"
                        >
                          📋
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading || isLocalLoading ? (
              <div className="message ai loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="loading-indicator">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                  <span className="loading-text">AI 正在思考...</span>
                </div>
              </div>
            ) : null}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 统计信息弹窗 */}
      {showStats && stats && (
        <div className="stats-popup">
          <div className="stats-header">
            <h4>对话统计</h4>
            <button onClick={() => setShowStats(false)}>✕</button>
          </div>
          <div className="stats-content">
            <div className="stat-item">
              <span className="stat-label">总消息数</span>
              <span className="stat-value">{stats.totalMessages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">用户消息</span>
              <span className="stat-value">{stats.userMessages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">AI 消息</span>
              <span className="stat-value">{stats.aiMessages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">对话时长</span>
              <span className="stat-value">{Math.round(stats.duration / 60000)} 分钟</span>
            </div>
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "请先上传文档" : "输入您的问题或请求... (支持 /summarize, /rewrite, /explain 等指令)"}
            disabled={disabled || isLoading || isLocalLoading}
            rows={1}
            maxLength={2000}
          />
          <button 
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={disabled || isLoading || isLocalLoading || !inputMessage.trim()}
            title="发送消息 (Enter)"
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
        <div className="input-hints">
          <span>Enter 发送</span>
          <span>Shift + Enter 换行</span>
          <span>/help 查看指令</span>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
