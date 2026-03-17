import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanelState } from '../usePanelState'

describe('usePanelState', () => {
  // 模拟 localStorage
  const localStorageMock = (() => {
    let store = {}
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString()
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      })
    }
  })()

  // 模拟 storage 事件
  const storageEventListeners = new Map()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })
    
    // 重置 storage 事件监听器
    storageEventListeners.clear()
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'storage') {
        storageEventListeners.set(handler, handler)
      }
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'storage') {
        storageEventListeners.delete(handler)
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorageMock.clear()
  })

  describe('初始化', () => {
    it('使用默认初始状态', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => usePanelState())
      
      expect(result.current.leftWidth).toBe(60)
      expect(result.current.rightWidth).toBe(40)
      expect(result.current.isLeftCollapsed).toBe(false)
      expect(result.current.isRightCollapsed).toBe(false)
    })

    it('使用自定义初始宽度', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => usePanelState({ initialLeftWidth: 50 }))
      
      expect(result.current.leftWidth).toBe(50)
      expect(result.current.rightWidth).toBe(50)
    })

    it('从 localStorage 加载保存的状态', () => {
      const savedState = {
        leftWidth: 70,
        collapsed: { left: true, right: false }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))
      
      const { result } = renderHook(() => usePanelState())
      
      expect(result.current.leftWidth).toBe(70)
      expect(result.current.isLeftCollapsed).toBe(true)
      expect(result.current.isRightCollapsed).toBe(false)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('docx-ai-panel-state')
    })

    it('处理 localStorage 解析错误', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const { result } = renderHook(() => usePanelState())
      
      expect(result.current.leftWidth).toBe(60) // 回退到默认值
    })

    it('禁用持久化时不从 localStorage 加载', () => {
      const savedState = { leftWidth: 80, collapsed: { left: false, right: false } }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))
      
      const { result } = renderHook(() => usePanelState({ persistState: false }))
      
      expect(result.current.leftWidth).toBe(60) // 使用默认值
      expect(localStorageMock.getItem).not.toHaveBeenCalled()
    })

    it('使用自定义存储键', () => {
      const savedState = { leftWidth: 75, collapsed: { left: false, right: true } }
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'custom-key') return JSON.stringify(savedState)
        return null
      })
      
      const { result } = renderHook(() => usePanelState({ storageKey: 'custom-key' }))
      
      expect(result.current.leftWidth).toBe(75)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('custom-key')
    })
  })

  describe('调整大小', () => {
    it('处理面板宽度调整', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.onResize({ leftWidth: 50 })
      })
      
      expect(result.current.leftWidth).toBe(50)
      expect(result.current.rightWidth).toBe(50)
    })

    it('接受完整的状态对象', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.onResize({ 
          leftWidth: 45,
          collapsed: { left: false, right: true }
        })
      })
      
      expect(result.current.leftWidth).toBe(45)
      expect(result.current.isRightCollapsed).toBe(true)
    })
  })

  describe('折叠状态', () => {
    it('处理折叠状态变化', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.onCollapseChange({ left: true, right: false })
      })
      
      expect(result.current.isLeftCollapsed).toBe(true)
      expect(result.current.isRightCollapsed).toBe(false)
    })

    it('切换左侧面板折叠状态', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.toggleCollapse('left')
      })
      
      expect(result.current.isLeftCollapsed).toBe(true)
      expect(result.current.isRightCollapsed).toBe(false)
    })

    it('切换右侧面板折叠状态', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.toggleCollapse('right')
      })
      
      expect(result.current.isLeftCollapsed).toBe(false)
      expect(result.current.isRightCollapsed).toBe(true)
    })

    it('多次切换同一面板', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.toggleCollapse('left')
        result.current.toggleCollapse('left')
      })
      
      expect(result.current.isLeftCollapsed).toBe(false) // 回到初始状态
    })

    it('展开所有面板', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ leftWidth: 60, collapsed: { left: true, right: true } })
      )
      
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.expandAll()
      })
      
      expect(result.current.isLeftCollapsed).toBe(false)
      expect(result.current.isRightCollapsed).toBe(false)
    })

    it('折叠所有面板（保留左侧）', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.collapseAll()
      })
      
      expect(result.current.isLeftCollapsed).toBe(false)
      expect(result.current.isRightCollapsed).toBe(true)
    })
  })

  describe('重置', () => {
    it('重置为默认状态', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ leftWidth: 80, collapsed: { left: true, right: true } })
      )
      
      const { result } = renderHook(() => usePanelState())
      
      // 确认已加载保存的状态
      expect(result.current.leftWidth).toBe(80)
      
      act(() => {
        result.current.resetPanelState()
      })
      
      expect(result.current.leftWidth).toBe(60)
      expect(result.current.isLeftCollapsed).toBe(false)
      expect(result.current.isRightCollapsed).toBe(false)
    })

    it('重置时清除 localStorage', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.resetPanelState()
      })
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('docx-ai-panel-state')
    })

    it('禁用持久化时不清除 localStorage', () => {
      const { result } = renderHook(() => usePanelState({ persistState: false }))
      
      act(() => {
        result.current.resetPanelState()
      })
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('使用自定义初始宽度重置', () => {
      const { result } = renderHook(() => usePanelState({ initialLeftWidth: 55 }))
      
      act(() => {
        result.current.resetPanelState()
      })
      
      expect(result.current.leftWidth).toBe(55)
    })
  })

  describe('持久化', () => {
    it('状态变化时保存到 localStorage', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.onResize({ leftWidth: 65 })
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.leftWidth).toBe(65)
    })

    it('禁用持久化时不保存', () => {
      const { result } = renderHook(() => usePanelState({ persistState: false }))
      
      act(() => {
        result.current.onResize({ leftWidth: 65 })
      })
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('保存折叠状态', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.toggleCollapse('left')
      })
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.collapsed.left).toBe(true)
    })
  })

  describe('跨标签页同步', () => {
    it('监听 storage 事件', () => {
      const { result } = renderHook(() => usePanelState())
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      )
    })

    it('禁用持久化时不监听 storage 事件', () => {
      const { unmount } = renderHook(() => usePanelState({ persistState: false }))
      
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      )
      
      unmount()
    })

    it('同步其他标签页的状态变化', () => {
      const { result } = renderHook(() => usePanelState())
      
      const newState = { leftWidth: 40, collapsed: { left: false, right: true } }
      const event = new StorageEvent('storage', {
        key: 'docx-ai-panel-state',
        newValue: JSON.stringify(newState)
      })
      
      act(() => {
        storageEventListeners.forEach(handler => handler(event))
      })
      
      expect(result.current.leftWidth).toBe(40)
      expect(result.current.isRightCollapsed).toBe(true)
    })

    it('忽略其他键的 storage 事件', () => {
      const { result } = renderHook(() => usePanelState())
      const initialWidth = result.current.leftWidth
      
      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify({ leftWidth: 30 })
      })
      
      act(() => {
        storageEventListeners.forEach(handler => handler(event))
      })
      
      expect(result.current.leftWidth).toBe(initialWidth) // 未变化
    })

    it('处理无效的 JSON 数据', () => {
      const { result } = renderHook(() => usePanelState())
      const initialWidth = result.current.leftWidth
      
      const event = new StorageEvent('storage', {
        key: 'docx-ai-panel-state',
        newValue: 'invalid json'
      })
      
      act(() => {
        storageEventListeners.forEach(handler => handler(event))
      })
      
      expect(result.current.leftWidth).toBe(initialWidth) // 保持不变
    })

    it('卸载时移除事件监听器', () => {
      const { unmount } = renderHook(() => usePanelState())
      
      unmount()
      
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      )
    })
  })

  describe('配置', () => {
    it('返回最小宽度配置', () => {
      const { result } = renderHook(() => usePanelState({
        leftMinWidth: 250,
        rightMinWidth: 300
      }))
      
      expect(result.current.leftMinWidth).toBe(250)
      expect(result.current.rightMinWidth).toBe(300)
    })

    it('使用默认最小宽度', () => {
      const { result } = renderHook(() => usePanelState())
      
      expect(result.current.leftMinWidth).toBe(200)
      expect(result.current.rightMinWidth).toBe(200)
    })
  })

  describe('返回的 API', () => {
    it('返回所有必需的方法和属性', () => {
      const { result } = renderHook(() => usePanelState())
      
      // 状态属性
      expect(result.current).toHaveProperty('leftWidth')
      expect(result.current).toHaveProperty('rightWidth')
      expect(result.current).toHaveProperty('collapsed')
      expect(result.current).toHaveProperty('isLeftCollapsed')
      expect(result.current).toHaveProperty('isRightCollapsed')
      
      // 回调方法
      expect(result.current).toHaveProperty('onResize')
      expect(result.current).toHaveProperty('onCollapseChange')
      
      // 操作方法
      expect(result.current).toHaveProperty('resetPanelState')
      expect(result.current).toHaveProperty('toggleCollapse')
      expect(result.current).toHaveProperty('expandAll')
      expect(result.current).toHaveProperty('collapseAll')
      
      // 配置
      expect(result.current).toHaveProperty('leftMinWidth')
      expect(result.current).toHaveProperty('rightMinWidth')
    })

    it('collapsed 对象包含 left 和 right 属性', () => {
      const { result } = renderHook(() => usePanelState())
      
      expect(result.current.collapsed).toHaveProperty('left')
      expect(result.current.collapsed).toHaveProperty('right')
    })

    it('rightWidth 自动计算为 100 - leftWidth', () => {
      const { result } = renderHook(() => usePanelState())
      
      act(() => {
        result.current.onResize({ leftWidth: 70 })
      })
      
      expect(result.current.leftWidth).toBe(70)
      expect(result.current.rightWidth).toBe(30)
    })
  })
})
