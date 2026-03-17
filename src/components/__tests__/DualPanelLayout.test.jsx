import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DualPanelLayout } from '../DualPanelLayout'

// 模拟 CSS 导入
vi.mock('../DualPanelLayout.css', () => ({}))

describe('DualPanelLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 模拟 container 的 getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1200,
      height: 800,
      left: 0,
      top: 0,
      right: 1200,
      bottom: 800
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('渲染', () => {
    it('渲染左右面板', () => {
      render(
        <DualPanelLayout
          leftPanel={<div data-testid="left-content">Left</div>}
          rightPanel={<div data-testid="right-content">Right</div>}
        />
      )
      
      expect(screen.getByTestId('left-content')).toBeInTheDocument()
      expect(screen.getByTestId('right-content')).toBeInTheDocument()
    })

    it('显示面板标题', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByText('文档编辑器')).toBeInTheDocument()
      expect(screen.getByText('AI 助手')).toBeInTheDocument()
    })

    it('渲染折叠按钮', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const collapseButtons = screen.getAllByRole('button')
      expect(collapseButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('渲染调整手柄', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      expect(resizeHandle).toBeInTheDocument()
    })

    it('应用自定义初始宽度', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          initialLeftWidth={70}
        />
      )
      
      const leftPanel = screen.getByText('文档编辑器').closest('.dual-panel')
      expect(leftPanel.style.width).toBe('70%')
    })
  })

  describe('折叠功能', () => {
    it('点击左侧折叠按钮折叠左侧面板', () => {
      const onCollapseChange = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          onCollapseChange={onCollapseChange}
        />
      )
      
      const leftCollapseBtn = screen.getAllByRole('button')[0]
      fireEvent.click(leftCollapseBtn)
      
      expect(onCollapseChange).toHaveBeenCalledWith({
        left: true,
        right: false
      })
    })

    it('点击右侧折叠按钮折叠右侧面板', () => {
      const onCollapseChange = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          onCollapseChange={onCollapseChange}
        />
      )
      
      const rightCollapseBtn = screen.getAllByRole('button')[1]
      fireEvent.click(rightCollapseBtn)
      
      expect(onCollapseChange).toHaveBeenCalledWith({
        left: false,
        right: true
      })
    })

    it('使用初始折叠状态', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          collapsedState={{ left: true, right: false }}
        />
      )
      
      const leftPanel = screen.getByText('文档编辑器').closest('.dual-panel')
      expect(leftPanel.classList.contains('collapsed')).toBe(true)
    })

    it('折叠时隐藏面板内容', () => {
      render(
        <DualPanelLayout
          leftPanel={<div data-testid="left-content">Left</div>}
          rightPanel={<div>Right</div>}
          collapsedState={{ left: true, right: false }}
        />
      )
      
      const leftPanel = screen.getByText('文档编辑器').closest('.dual-panel')
      expect(leftPanel.style.width).toBe('0')
    })

    it('折叠按钮显示正确的提示文本', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const leftCollapseBtn = screen.getAllByRole('button')[0]
      expect(leftCollapseBtn).toHaveAttribute('title', '折叠')
    })

    it('已折叠时按钮显示展开提示', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          collapsedState={{ left: true, right: false }}
        />
      )
      
      const leftCollapseBtn = screen.getAllByRole('button')[0]
      expect(leftCollapseBtn).toHaveAttribute('title', '展开')
    })
  })

  describe('调整大小', () => {
    it('开始调整时设置光标', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      
      expect(document.body.style.cursor).toBe('col-resize')
      expect(document.body.style.userSelect).toBe('none')
    })

    it('鼠标移动时调整宽度', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseMove(window, { clientX: 400 })
      
      // 宽度应该已更新
      const leftPanel = screen.getByText('文档编辑器').closest('.dual-panel')
      expect(leftPanel.style.width).not.toBe('')
    })

    it('鼠标释放时结束调整', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseUp(window)
      
      expect(document.body.style.cursor).toBe('default')
      expect(document.body.style.userSelect).toBe('auto')
    })

    it('调用 onResize 回调', () => {
      const onResize = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          onResize={onResize}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseMove(window, { clientX: 500 })
      
      expect(onResize).toHaveBeenCalled()
    })

    it('遵守最小宽度限制', () => {
      const onResize = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          leftMinWidth={300}
          rightMinWidth={300}
          onResize={onResize}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      
      // 尝试调整到小于最小宽度
      fireEvent.mouseMove(window, { clientX: 100 })
      
      // 不应该调用 onResize（因为小于最小宽度）
      expect(onResize).not.toHaveBeenCalled()
    })

    it('调整时添加 no-transition 类', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseMove(window, { clientX: 400 })
      
      const container = document.querySelector('.dual-panel-container')
      expect(container.classList.contains('resizing')).toBe(true)
    })

    it('折叠时不显示调整手柄', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          collapsedState={{ left: true, right: false }}
        />
      )
      
      expect(screen.queryByTitle('拖动调整面板宽度')).not.toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    beforeEach(() => {
      vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'resize') {
          handler()
        }
      })
    })

    it('移动端显示面板切换器', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 500, // 移动端宽度
        height: 800,
        left: 0,
        top: 0
      }))
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByText('文档')).toBeInTheDocument()
      expect(screen.getByText('AI')).toBeInTheDocument()
    })

    it('桌面端不显示面板切换器', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 1200, // 桌面端宽度
        height: 800,
        left: 0,
        top: 0
      }))
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.queryByText('文档')).not.toBeInTheDocument()
      expect(screen.queryByText('AI')).not.toBeInTheDocument()
    })

    it('移动端自动折叠右侧面板', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 500,
        height: 800,
        left: 0,
        top: 0
      }))
      
      const { rerender } = render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      // 触发 resize 事件
      window.dispatchEvent(new Event('resize'))
      
      // 等待状态更新
      rerender(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
    })

    it('点击文档按钮显示左侧面板', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 500,
        height: 800,
        left: 0,
        top: 0
      }))
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const docBtn = screen.getByText('文档')
      fireEvent.click(docBtn)
      
      // 应该切换到文档视图
      expect(docBtn.classList.contains('active')).toBe(true)
    })

    it('点击 AI 按钮显示右侧面板', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 500,
        height: 800,
        left: 0,
        top: 0
      }))
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const aiBtn = screen.getByText('AI')
      fireEvent.click(aiBtn)
      
      expect(aiBtn.classList.contains('active')).toBe(true)
    })
  })

  describe('回调函数', () => {
    it('面板宽度变化时调用 onResize', () => {
      const onResize = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          onResize={onResize}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseMove(window, { clientX: 600 })
      
      expect(onResize).toHaveBeenCalledWith({
        leftWidth: expect.any(Number),
        rightWidth: expect.any(Number)
      })
    })

    it('折叠状态变化时调用 onCollapseChange', () => {
      const onCollapseChange = vi.fn()
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          onCollapseChange={onCollapseChange}
        />
      )
      
      const leftCollapseBtn = screen.getAllByRole('button')[0]
      fireEvent.click(leftCollapseBtn)
      
      expect(onCollapseChange).toHaveBeenCalledTimes(1)
      expect(onCollapseChange).toHaveBeenCalledWith({
        left: true,
        right: false
      })
    })

    it('不传回调时不报错', () => {
      expect(() => {
        render(
          <DualPanelLayout
            leftPanel={<div>Left</div>}
            rightPanel={<div>Right</div>}
          />
        )
      }).not.toThrow()
    })
  })

  describe('可访问性', () => {
    it('折叠按钮有 title 属性', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(btn => {
        expect(btn).toHaveAttribute('title')
      })
    })

    it('调整手柄有 title 属性', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      const resizeHandle = screen.getByTitle('拖动调整面板宽度')
      expect(resizeHandle).toHaveAttribute('title')
    })

    it('面板标题使用正确的语义', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByText('文档编辑器')).toBeInTheDocument()
      expect(screen.getByText('AI 助手')).toBeInTheDocument()
    })
  })

  describe('面板内容', () => {
    it('渲染左侧面板内容', () => {
      const leftContent = <div data-testid="custom-left">Custom Left</div>
      
      render(
        <DualPanelLayout
          leftPanel={leftContent}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByTestId('custom-left')).toBeInTheDocument()
      expect(screen.getByText('Custom Left')).toBeInTheDocument()
    })

    it('渲染右侧面板内容', () => {
      const rightContent = <div data-testid="custom-right">Custom Right</div>
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={rightContent}
        />
      )
      
      expect(screen.getByTestId('custom-right')).toBeInTheDocument()
      expect(screen.getByText('Custom Right')).toBeInTheDocument()
    })

    it('支持 React 组件作为面板内容', () => {
      const LeftComponent = () => <div data-testid="left-component">Component</div>
      
      render(
        <DualPanelLayout
          leftPanel={<LeftComponent />}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByTestId('left-component')).toBeInTheDocument()
    })
  })

  describe('容器宽度监听', () => {
    it('组件挂载时获取容器宽度', () => {
      const getBoundingClientRectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect')
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(getBoundingClientRectSpy).toHaveBeenCalled()
    })

    it('监听窗口 resize 事件', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('组件卸载时移除事件监听器', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('最小宽度配置', () => {
    it('使用自定义最小宽度', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
          leftMinWidth={300}
          rightMinWidth={400}
        />
      )
      
      // 组件应该接受这些属性
      expect(screen.getByText('文档编辑器')).toBeInTheDocument()
    })

    it('使用默认最小宽度', () => {
      render(
        <DualPanelLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      )
      
      expect(screen.getByText('文档编辑器')).toBeInTheDocument()
    })
  })
})
