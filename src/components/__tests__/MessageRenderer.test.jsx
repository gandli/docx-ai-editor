import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageRenderer, PlainTextMessage } from '../MessageRenderer'

/**
 * MessageRenderer 组件测试
 */
describe('MessageRenderer', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  describe('Markdown 渲染', () => {
    it('应该渲染普通文本', () => {
      render(<MessageRenderer content="这是普通文本" />)
      expect(screen.getByText('这是普通文本')).toBeInTheDocument()
    })

    it('应该渲染粗体', () => {
      render(<MessageRenderer content="这是 **粗体** 文本" />)
      expect(screen.getByText('粗体')).toBeInTheDocument()
    })

    it('应该渲染斜体', () => {
      render(<MessageRenderer content="这是 *斜体* 文本" />)
      expect(screen.getByText('斜体')).toBeInTheDocument()
    })

    it('应该渲染行内代码', () => {
      render(<MessageRenderer content="使用 `console.log()` 输出" />)
      expect(screen.getByText('console.log()')).toBeInTheDocument()
    })

    it('应该渲染链接', () => {
      render(<MessageRenderer content="访问 [Google](https://google.com)" />)
      const link = screen.getByText('Google')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', 'https://google.com')
    })
  })

  describe('标题渲染', () => {
    it('应该渲染 H1 标题', () => {
      render(<MessageRenderer content="# 一级标题" />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('一级标题')
    })

    it('应该渲染 H2 标题', () => {
      render(<MessageRenderer content="## 二级标题" />)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('二级标题')
    })

    it('应该渲染 H3-H6 标题', () => {
      const { rerender } = render(<MessageRenderer content="### 三级标题" />)
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('三级标题')
      
      rerender(<MessageRenderer content="#### 四级标题" />)
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('四级标题')
      
      rerender(<MessageRenderer content="##### 五级标题" />)
      expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('五级标题')
      
      rerender(<MessageRenderer content="###### 六级标题" />)
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('六级标题')
    })
  })

  describe('列表渲染', () => {
    it('应该渲染无序列表', () => {
      const content = `- 项目 1\n- 项目 2\n- 项目 3`
      render(<MessageRenderer content={content} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
      expect(listItems[0]).toHaveTextContent('项目 1')
    })

    it('应该渲染有序列表', () => {
      const content = `1. 第一项\n2. 第二项\n3. 第三项`
      render(<MessageRenderer content={content} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
    })

    it('应该渲染混合列表', () => {
      const content = `- 普通项目\n1. 有序项目\n- 另一个项目`
      render(<MessageRenderer content={content} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(0)
    })
  })

  describe('代码块渲染', () => {
    it('应该渲染代码块', () => {
      const content = '```\nconst x = 1\nconsole.log(x)\n```'
      render(<MessageRenderer content={content} />)
      
      expect(screen.getByText('const x = 1')).toBeInTheDocument()
      expect(screen.getByText('console.log(x)')).toBeInTheDocument()
    })

    it('应该渲染带语言标识的代码块', () => {
      const content = '```javascript\nconst x = 1\n```'
      render(<MessageRenderer content={content} />)
      
      expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    it('应该显示复制按钮', () => {
      const content = '```\n代码内容\n```'
      render(<MessageRenderer content={content} />)
      
      expect(screen.getByText(/复制/)).toBeInTheDocument()
    })

    it('应该允许复制代码', async () => {
      const content = '```\n要复制的代码\n```'
      render(<MessageRenderer content={content} />)
      
      const copyButton = screen.getByText(/复制/)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('要复制的代码\n')
      })
    })

    it('应该在复制后显示成功提示', async () => {
      const content = '```\n代码\n```'
      render(<MessageRenderer content={content} />)
      
      const copyButton = screen.getByText(/复制/)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByText(/已复制/)).toBeInTheDocument()
      }, { timeout: 2500 })
    })
  })

  describe('混合内容', () => {
    it('应该渲染混合 Markdown 内容', () => {
      const content = `# 标题

这是 **粗体** 和 *斜体* 的混合。

- 列表项 1
- 列表项 2

\`\`\`
代码块
\`\`\`

[链接](https://example.com)`

      render(<MessageRenderer content={content} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('标题')
      expect(screen.getByText('粗体')).toBeInTheDocument()
      expect(screen.getByText('斜体')).toBeInTheDocument()
      expect(screen.getByText('链接')).toBeInTheDocument()
    })
  })

  describe('特殊内容处理', () => {
    it('应该处理空内容', () => {
      const { container } = render(<MessageRenderer content="" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('应该处理 null 内容', () => {
      const { container } = render(<MessageRenderer content={null} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('应该处理特殊字符', () => {
      const content = '特殊字符：<>&"\'\\'
      render(<MessageRenderer content={content} />)
      expect(screen.getByText(/特殊字符/)).toBeInTheDocument()
    })

    it('应该处理多行文本', () => {
      const content = '第一行\n第二行\n第三行'
      render(<MessageRenderer content={content} />)
      expect(screen.getByText('第一行')).toBeInTheDocument()
    })
  })

  describe('代码类型', () => {
    it('应该渲染代码类型内容', () => {
      render(<MessageRenderer content="const x = 1" type="code" />)
      expect(screen.getByText('const x = 1')).toBeInTheDocument()
    })
  })

  describe('辅助功能', () => {
    it('应该包含测试 ID', () => {
      const { container } = render(<MessageRenderer content="测试" />)
      expect(container.querySelector('[data-testid="message-renderer"]')).toBeTruthy()
    })
  })
})

describe('PlainTextMessage', () => {
  it('应该渲染纯文本', () => {
    render(<PlainTextMessage content="纯文本内容" />)
    expect(screen.getByText('纯文本内容')).toBeInTheDocument()
  })

  it('应该保留换行', () => {
    render(<PlainTextMessage content="第一行\n第二行" />)
    expect(screen.getByText('第一行\n第二行')).toBeInTheDocument()
  })
})
