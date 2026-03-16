import React, { useState } from 'react'
import { SuperDocEditor } from '@superdoc-dev/react'

function App() {
  const [document, setDocument] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setDocument(URL.createObjectURL(file))
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !document) return
    
    // 添加用户消息
    const newMessage = { role: 'user', content: inputMessage }
    setChatMessages(prev => [...prev, newMessage])
    setInputMessage('')
    
    // TODO: 调用 LLM API 进行文档分析
    // 这里将集成你的多模型支持
  }

  return (
    <div className="app">
      <header>
        <h1>DOCX AI Editor</h1>
        <input 
          type="file" 
          accept=".docx" 
          onChange={handleFileUpload}
          style={{ margin: '10px' }}
        />
      </header>
      
      <div className="main-layout">
        {/* 左侧文档编辑器 */}
        <div className="document-panel">
          {document ? (
            <SuperDocEditor 
              document={document}
              documentMode="editing"
              onReady={() => console.log('SuperDoc ready!')}
            />
          ) : (
            <div className="placeholder">请上传 DOCX 文件</div>
          )}
        </div>
        
        {/* 右侧聊天面板 */}
        <div className="chat-panel">
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI to analyze/modify your document..."
              disabled={!document}
            />
            <button onClick={handleSendMessage} disabled={!document}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App