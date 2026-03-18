import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageRenderer } from './MessageRenderer';
import { useChatHistory } from '../hooks/useChatHistory';
import { useChatCommands } from '../hooks/useChatCommands';
import './ChatPanel.css';

/**
 * ChatPanel - Auxiliary chat component for AI assistance
 * Demoted from primary result surface to auxiliary support role
 */
export function ChatPanel({
  onSendMessage: parentSendMessage,
  isLoading = false,
  disabled = false,
  compact = true,
}) {
  // Use chat history hook
  const {
    messages,
    addMessage,
    deleteMessage,
    downloadExport,
    clearConversation,
  } = useChatHistory({
    storageKey: 'docx-ai-chat-history',
    maxMessages: 50,
    autoSave: true,
  });

  // Local state
  const [inputMessage, setInputMessage] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [inputMessage]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content = inputMessage) => {
      if (!content.trim() || isLoading || isLocalLoading || disabled) return;

      const trimmedContent = content.trim();

      // Add user message
      addMessage({
        role: 'user',
        content: trimmedContent,
        type: 'text',
      });

      setInputMessage('');
      setIsLocalLoading(true);

      // Call parent send function
      if (parentSendMessage) {
        try {
          const response = await parentSendMessage(trimmedContent);

          if (response) {
            addMessage({
              role: 'assistant',
              content: response,
              type: 'markdown',
            });
          }
        } catch (error) {
          console.error('Send message error:', error);
          addMessage({
            role: 'assistant',
            content: `抱歉，发生错误：${error.message}`,
            type: 'text',
            metadata: { isError: true },
          });
        } finally {
          setIsLocalLoading(false);
        }
      } else {
        // Mock response for testing
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: `收到您的消息：${trimmedContent}\\n\\n这是一个测试响应。`,
            type: 'markdown',
          });
          setIsLocalLoading(false);
        }, 1000);
      }
    },
    [inputMessage, isLoading, isLocalLoading, disabled, parentSendMessage, addMessage]
  );

  // Handle keyboard events
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`chat-panel-container ${compact ? 'compact' : ''}`}
      data-testid="chat-panel"
    >
      {/* Messages */}
      <div className="chat-messages" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">💬</div>
            <h3>AI 助手</h3>
            <p>输入问题获取帮助</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.role} ${msg.metadata?.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'user' ? '您' : 'AI'}
                    </span>
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="message-text">
                    <MessageRenderer content={msg.content} type={msg.type} />
                  </div>
                  {msg.metadata?.isError && (
                    <button
                      className="retry-btn"
                      onClick={() => handleSendMessage(msg.content)}
                    >
                      重试
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(isLoading || isLocalLoading) && (
              <div className="message ai loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="loading-indicator">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? '请先上传文档' : '输入问题...'}
            disabled={disabled || isLoading || isLocalLoading}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={disabled || isLoading || isLocalLoading || !inputMessage.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
