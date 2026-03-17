import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModelSelector } from '../ModelSelector'

// Mock llm API
vi.mock('../../api/llm', () => ({
  getSupportedModels: vi.fn(() => [
    { id: 'qwen/qwen3-max', name: 'Qwen3 Max', provider: 'Alibaba', contextWindow: 256000 },
    { id: 'anthropic/claude-opus', name: 'Claude Opus', provider: 'Anthropic', contextWindow: 200000 },
    { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro', provider: 'Google', contextWindow: 1000000 }
  ]),
  DEFAULT_MODEL: 'qwen/qwen3-max'
}))

describe('ModelSelector', () => {
  const onModelChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染模型选择器', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    expect(screen.getByLabelText('选择 AI 模型')).toBeInTheDocument()
    expect(screen.getByText('AI 模型')).toBeInTheDocument()
  })

  it('显示所有支持的模型', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    const select = screen.getByLabelText('选择 AI 模型')
    expect(select).toHaveValue('qwen/qwen3-max')
    
    // 检查选项
    expect(screen.getByText('Qwen3 Max (Alibaba)')).toBeInTheDocument()
    expect(screen.getByText('Claude Opus (Anthropic)')).toBeInTheDocument()
    expect(screen.getByText('Gemini 2.5 Pro (Google)')).toBeInTheDocument()
  })

  it('调用 onModelChange 当选择改变时', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    const select = screen.getByLabelText('选择 AI 模型')
    fireEvent.change(select, { target: { value: 'anthropic/claude-opus' } })
    
    expect(onModelChange).toHaveBeenCalledWith('anthropic/claude-opus')
    expect(onModelChange).toHaveBeenCalledTimes(1)
  })

  it('显示选中模型的上下文窗口信息', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    expect(screen.getByText('上下文：256K')).toBeInTheDocument()
  })

  it('当禁用时无法交互', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} disabled />)
    
    const select = screen.getByLabelText('选择 AI 模型')
    expect(select).toBeDisabled()
    
    fireEvent.change(select, { target: { value: 'anthropic/claude-opus' } })
    expect(onModelChange).not.toHaveBeenCalled()
  })

  it('使用默认模型', () => {
    const { container } = render(<ModelSelector onModelChange={onModelChange} />)
    
    const select = container.querySelector('select')
    expect(select).toHaveValue('qwen/qwen3-max')
  })

  it('当模型改变时更新上下文窗口显示', () => {
    const { rerender } = render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    expect(screen.getByText('上下文：256K')).toBeInTheDocument()
    
    rerender(<ModelSelector selectedModel="google/gemini-2.5-pro-exp-03-25" onModelChange={onModelChange} />)
    
    expect(screen.getByText('上下文：1000K')).toBeInTheDocument()
  })

  it('具有正确的可访问性属性', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    const select = screen.getByLabelText('选择 AI 模型')
    expect(select).toHaveAttribute('aria-label', '选择 AI 模型')
    expect(select).toHaveAttribute('id', 'model-select')
  })

  it('具有正确的测试 ID', () => {
    render(<ModelSelector selectedModel="qwen/qwen3-max" onModelChange={onModelChange} />)
    
    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
  })
})
