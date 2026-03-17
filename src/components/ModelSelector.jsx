import React from 'react'
import { getSupportedModels, DEFAULT_MODEL } from '../api/llm'
import './ModelSelector.css'

/**
 * 模型选择器组件
 * 允许用户在 UI 中选择要使用的 LLM 模型
 */
export function ModelSelector({ 
  selectedModel = DEFAULT_MODEL, 
  onModelChange,
  disabled = false 
}) {
  const models = getSupportedModels()

  const handleChange = (e) => {
    const newModel = e.target.value
    if (onModelChange) {
      onModelChange(newModel)
    }
  }

  const selectedModelInfo = models.find(m => m.id === selectedModel)

  return (
    <div className="model-selector-container" data-testid="model-selector">
      <label htmlFor="model-select" className="model-selector-label">
        AI 模型
      </label>
      <div className="model-selector-wrapper">
        <select
          id="model-select"
          className="model-selector"
          value={selectedModel}
          onChange={handleChange}
          disabled={disabled}
          aria-label="选择 AI 模型"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        {selectedModelInfo && (
          <div className="model-info" aria-live="polite">
            <span className="model-context">
              上下文：{(selectedModelInfo.contextWindow / 1000).toFixed(0)}K
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelSelector
