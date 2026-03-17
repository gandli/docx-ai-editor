import React, { useState, useEffect } from 'react'
import { isApiKeyConfigured, getSupportedModels } from '../api/llm'
import './APIStatus.css'

/**
 * API 状态指示器组件
 * 显示 OpenRouter API 配置状态和模型可用性
 */
export function APIStatus({ onRefresh }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [modelCount, setModelCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const checkStatus = () => {
      const configured = isApiKeyConfigured()
      setIsConfigured(configured)
      if (configured) {
        const models = getSupportedModels()
        setModelCount(models.length)
      } else {
        setModelCount(0)
      }
    }

    checkStatus()
  }, [])

  const handleRefresh = () => {
    const configured = isApiKeyConfigured()
    setIsConfigured(configured)
    if (configured) {
      const models = getSupportedModels()
      setModelCount(models.length)
    }
    if (onRefresh) {
      onRefresh()
    }
  }

  const models = getSupportedModels()

  return (
    <div className="api-status-container" data-testid="api-status">
      <div 
        className="api-status-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded)
          }
        }}
      >
        <div className="api-status-indicator">
          <span className={`status-dot ${isConfigured ? 'configured' : 'not-configured'}`}></span>
          <span className="status-text">
            {isConfigured ? 'OpenRouter API 已配置' : 'OpenRouter API 未配置'}
          </span>
        </div>
        <button 
          className="refresh-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleRefresh()
          }}
          aria-label="刷新状态"
          title="刷新状态"
        >
          🔄
        </button>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="api-status-details" role="region" aria-label="API 状态详情">
          {isConfigured ? (
            <>
              <div className="status-info">
                <span className="info-label">可用模型:</span>
                <span className="info-value">{modelCount} 个</span>
              </div>
              <div className="models-list">
                {models.map((model) => (
                  <div key={model.id} className="model-item">
                    <span className="model-name">{model.name}</span>
                    <span className="model-provider">{model.provider}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="setup-instructions">
              <p>请配置 OpenRouter API 密钥以使用 AI 功能：</p>
              <ol>
                <li>访问 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a></li>
                <li>创建或复制您的 API 密钥</li>
                <li>在项目根目录创建 <code>.env</code> 文件</li>
                <li>添加：<code>OPENROUTER_API_KEY=sk-or-v1-your-key</code></li>
                <li>重启开发服务器</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default APIStatus
