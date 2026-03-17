import { useState, useCallback, useEffect } from 'react'

/**
 * 面板状态管理 Hook
 * 管理双面板的宽度、折叠状态、同步等
 */
export function usePanelState(options = {}) {
  const {
    persistState = true,
    storageKey = 'docx-ai-panel-state',
    initialLeftWidth = 60,
    leftMinWidth = 200,
    rightMinWidth = 200
  } = options

  // 面板状态
  const [panelState, setPanelState] = useState(() => {
    if (persistState) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (e) {
        console.warn('Failed to load panel state:', e)
      }
    }
    return {
      leftWidth: initialLeftWidth,
      collapsed: {
        left: false,
        right: false
      }
    }
  })

  // 保存状态到 localStorage
  useEffect(() => {
    if (persistState) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(panelState))
      } catch (e) {
        console.warn('Failed to save panel state:', e)
      }
    }
  }, [panelState, persistState, storageKey])

  // 处理宽度调整
  const handleResize = useCallback((newState) => {
    setPanelState(prev => ({
      ...prev,
      ...newState
    }))
  }, [])

  // 处理折叠状态变化
  const handleCollapseChange = useCallback((collapsed) => {
    setPanelState(prev => ({
      ...prev,
      collapsed
    }))
  }, [])

  // 重置面板状态
  const resetPanelState = useCallback(() => {
    const defaultState = {
      leftWidth: initialLeftWidth,
      collapsed: {
        left: false,
        right: false
      }
    }
    setPanelState(defaultState)
    if (persistState) {
      localStorage.removeItem(storageKey)
    }
  }, [initialLeftWidth, persistState, storageKey])

  // 切换特定面板的折叠状态
  const toggleCollapse = useCallback((side) => {
    setPanelState(prev => ({
      ...prev,
      collapsed: {
        ...prev.collapsed,
        [side]: !prev.collapsed[side]
      }
    }))
  }, [])

  // 展开所有面板
  const expandAll = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      collapsed: {
        left: false,
        right: false
      }
    }))
  }, [])

  // 折叠所有面板（至少保留一个）
  const collapseAll = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      collapsed: {
        left: false,
        right: true
      }
    }))
  }, [])

  // 同步状态到多个标签页
  useEffect(() => {
    if (!persistState) return

    const handleStorageChange = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue)
          setPanelState(newState)
        } catch (err) {
          console.warn('Failed to parse synced panel state:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [persistState, storageKey])

  return {
    // 状态
    leftWidth: panelState.leftWidth,
    rightWidth: 100 - panelState.leftWidth,
    collapsed: panelState.collapsed,
    isLeftCollapsed: panelState.collapsed.left,
    isRightCollapsed: panelState.collapsed.right,
    
    // 回调
    onResize: handleResize,
    onCollapseChange: handleCollapseChange,
    
    // 操作方法
    resetPanelState,
    toggleCollapse,
    expandAll,
    collapseAll,
    
    // 配置
    leftMinWidth,
    rightMinWidth
  }
}

export default usePanelState
