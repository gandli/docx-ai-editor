import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIStatus } from '../APIStatus'

// Mock llm API
vi.mock('../../api/llm', () => ({
  isApiKeyConfigured: vi.fn(() => true),
  getSupportedModels: vi.fn(() => [
    { id: 'qwen/qwen3-max', name: 'Qwen3 Max', provider: 'Alibaba' },
    { id: 'anthropic/claude-opus', name: 'Claude Opus', provider: 'Anthropic' }
  ])
}))

describe('APIStatus', () => {
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染 API 状态组件', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    expect(screen.getByTestId('api-status')).toBeInTheDocument()
    expect(screen.getByText('OpenRouter API 已配置')).toBeInTheDocument()
  })

  it('显示配置状态指示器', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const statusDot = screen.getByTestId('api-status').querySelector('.status-dot')
    expect(statusDot).toHaveClass('configured')
  })

  it('当未配置时显示未配置状态', () => {
    const { isApiKeyConfigured } = require('../../api/llm')
    isApiKeyConfigured.mockReturnValue(false)
    
    render(<APIStatus onRefresh={onRefresh} />)
    
    expect(screen.getByText('OpenRouter API 未配置')).toBeInTheDocument()
    
    const statusDot = screen.getByTestId('api-status').querySelector('.status-dot')
    expect(statusDot).toHaveClass('not-configured')
  })

  it('可展开显示详情', async () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    // 默认收起
    expect(screen.queryByText('可用模型:')).not.toBeInTheDocument()
    
    // 点击展开
    const header = screen.getByRole('button')
    fireEvent.click(header)
    
    await waitFor(() => {
      expect(screen.getByText('可用模型:')).toBeInTheDocument()
    })
    
    expect(screen.getByText('2 个')).toBeInTheDocument()
  })

  it('显示模型列表', async () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const header = screen.getByRole('button')
    fireEvent.click(header)
    
    await waitFor(() => {
      expect(screen.getByText('Qwen3 Max')).toBeInTheDocument()
      expect(screen.getByText('Claude Opus')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Alibaba')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
  })

  it('当未配置时显示设置说明', async () => {
    const { isApiKeyConfigured } = require('../../api/llm')
    isApiKeyConfigured.mockReturnValue(false)
    
    render(<APIStatus onRefresh={onRefresh} />)
    
    const header = screen.getByRole('button')
    fireEvent.click(header)
    
    await waitFor(() => {
      expect(screen.getByText('请配置 OpenRouter API 密钥以使用 AI 功能：')).toBeInTheDocument()
    })
    
    expect(screen.getByText('openrouter.ai/keys')).toHaveAttribute(
      'href',
      'https://openrouter.ai/keys'
    )
  })

  it('调用 onRefresh 当点击刷新按钮', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const refreshBtn = screen.getByLabelText('刷新状态')
    fireEvent.click(refreshBtn)
    
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('可以通过键盘展开/收起', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const header = screen.getByRole('button')
    
    // 按 Enter 展开
    fireEvent.keyDown(header, { key: 'Enter' })
    expect(screen.queryByText('可用模型:')).toBeInTheDocument()
    
    // 按空格收起
    fireEvent.keyDown(header, { key: ' ' })
    expect(screen.queryByText('可用模型:')).not.toBeInTheDocument()
  })

  it('显示展开/收起图标', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const expandIcon = screen.getByTestId('api-status').querySelector('.expand-icon')
    expect(expandIcon).not.toHaveClass('expanded')
    
    const header = screen.getByRole('button')
    fireEvent.click(header)
    
    expect(expandIcon).toHaveClass('expanded')
  })

  it('具有正确的可访问性属性', () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const header = screen.getByRole('button')
    expect(header).toHaveAttribute('tabindex', '0')
    expect(header).toHaveAttribute('aria-expanded', 'false')
    
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
  })

  it('详情区域具有正确的角色', async () => {
    render(<APIStatus onRefresh={onRefresh} />)
    
    const header = screen.getByRole('button')
    fireEvent.click(header)
    
    await waitFor(() => {
      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'API 状态详情')
    })
  })
})
