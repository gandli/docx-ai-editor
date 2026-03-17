import React, { useState, useCallback } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { DocumentEditor } from './components/DocumentEditor'
import { DualPanelLayout } from './components/DualPanelLayout'
import { FileUpload } from './components/FileUpload'
import './App.css'

/**
 * DOCX AI Editor 主应用
 * 集成文档编辑和 AI 聊天功能
 */
function App() {
  const [document, setDocument] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 处理文件上传
  const handleFileUpload = useCallback(async (file) => {
    setIsProcessing(true)
    try {
      // 这里可以添加文档处理逻辑
      console.log('File uploaded:', file)
      setDocument({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      })
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // 处理发送消息到 AI
  const handleSendMessage = useCallback(async (message) => {
    if (!document) {
      return '请先上传文档'
    }

    setIsProcessing(true)
    try {
      // TODO: 连接到实际的 AI 服务
      // 这里模拟一个延迟响应
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return `收到您的消息：${message}\n\n这是一个示例响应。请配置实际的 AI 服务来获取真实响应。`
    } catch (error) {
      console.error('AI response error:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [document])

  return (
    <div className="app" data-testid="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📝 DOCX AI Editor</h1>
          <p className="header-subtitle">智能文档编辑助手</p>
        </div>
      </header>

      <DualPanelLayout>
        {/* 左侧：文档编辑器 */}
        <div className="left-panel" data-testid="left-panel">
          {!document ? (
            <div className="upload-placeholder">
              <FileUpload onFileSelect={handleFileUpload} disabled={isProcessing} />
              <div className="upload-info">
                <h3>上传 DOCX 文档</h3>
                <p>支持 .docx 格式文件</p>
                <p className="upload-tip">💡 上传后可与 AI 助手讨论文档内容</p>
              </div>
            </div>
          ) : (
            <div className="document-container">
              <div className="document-info">
                <span className="document-name">{document.name}</span>
                <button 
                  className="clear-doc-btn"
                  onClick={() => setDocument(null)}
                  title="清除文档"
                >
                  ✕
                </button>
              </div>
              <DocumentEditor 
                document={document}
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        {/* 右侧：AI 聊天面板 */}
        <div className="right-panel" data-testid="right-panel">
          <ChatPanel 
            onSendMessage={handleSendMessage}
            isLoading={isProcessing}
            disabled={!document}
          />
        </div>
      </DualPanelLayout>
    </div>
  )
}

export default App
