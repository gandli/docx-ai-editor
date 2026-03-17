import React, { useState, useCallback, useEffect } from 'react'
import './DualPanelLayout.css'

/**
 * 双面板布局组件
 * 支持左右面板、宽度调整、折叠/展开、响应式设计
 */
export function DualPanelLayout({ 
  leftPanel, 
  rightPanel, 
  leftMinWidth = 200,
  rightMinWidth = 200,
  initialLeftWidth = 60,
  onResize,
  collapsedState,
  onCollapseChange
}) {
  // 面板宽度状态（百分比）
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  
  // 折叠状态
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(collapsedState?.left || false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(collapsedState?.right || false)

  // 监听容器宽度变化
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.dual-panel-container')
      if (container) {
        setContainerWidth(container.offsetWidth)
      }
    }

    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)
    return () => window.removeEventListener('resize', updateContainerWidth)
  }, [])

  // 处理鼠标移动（调整宽度）
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || containerWidth === 0) return

    const container = document.querySelector('.dual-panel-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100

    // 检查是否满足最小宽度限制
    const leftPx = (newLeftWidth / 100) * rect.width
    const rightPx = ((100 - newLeftWidth) / 100) * rect.width

    if (leftPx >= leftMinWidth && rightPx >= rightMinWidth) {
      setLeftWidth(newLeftWidth)
      if (onResize) {
        onResize({ leftWidth: newLeftWidth, rightWidth: 100 - newLeftWidth })
      }
    }
  }, [isResizing, containerWidth, leftMinWidth, rightMinWidth, onResize])

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  // 开始调整宽度
  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // 切换折叠状态
  const handleCollapse = useCallback((side) => {
    const newState = {
      left: side === 'left' ? !isLeftCollapsed : isLeftCollapsed,
      right: side === 'right' ? !isRightCollapsed : isRightCollapsed
    }
    
    if (side === 'left') {
      setIsLeftCollapsed(!isLeftCollapsed)
    } else {
      setIsRightCollapsed(!isRightCollapsed)
    }

    if (onCollapseChange) {
      onCollapseChange(newState)
    }
  }, [isLeftCollapsed, isRightCollapsed, onCollapseChange])

  // 监听全局鼠标事件
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // 响应式断点
  const isMobile = containerWidth < 768
  const isTablet = containerWidth >= 768 && containerWidth < 1024

  // 移动端自动折叠右侧面板
  useEffect(() => {
    if (isMobile && !isLeftCollapsed) {
      setIsRightCollapsed(true)
    } else if (!isMobile && !isTablet) {
      setIsRightCollapsed(false)
    }
  }, [isMobile, isTablet, isLeftCollapsed])

  return (
    <div className={`dual-panel-container ${isResizing ? 'resizing' : ''}`}>
      {/* 左侧面板 */}
      <div 
        className={`dual-panel left-panel ${isLeftCollapsed ? 'collapsed' : ''} ${isResizing ? 'no-transition' : ''}`}
        style={{ 
          width: isLeftCollapsed ? '0' : `${leftWidth}%`,
          minWidth: isLeftCollapsed ? '0' : `${leftMinWidth}px`
        }}
      >
        <div className="panel-header">
          <span className="panel-title">文档编辑器</span>
          <button 
            className="collapse-btn"
            onClick={() => handleCollapse('left')}
            title={isLeftCollapsed ? '展开' : '折叠'}
          >
            {isLeftCollapsed ? '→' : '←'}
          </button>
        </div>
        <div className="panel-content">
          {leftPanel}
        </div>
      </div>

      {/* 调整手柄 */}
      {!isLeftCollapsed && !isRightCollapsed && !isMobile && (
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
          title="拖动调整面板宽度"
        >
          <div className="resize-grip"></div>
        </div>
      )}

      {/* 右侧面板 */}
      <div 
        className={`dual-panel right-panel ${isRightCollapsed ? 'collapsed' : ''} ${isResizing ? 'no-transition' : ''}`}
        style={{ 
          width: isRightCollapsed ? '0' : `${100 - leftWidth}%`,
          minWidth: isRightCollapsed ? '0' : `${rightMinWidth}px`
        }}
      >
        <div className="panel-header">
          <span className="panel-title">AI 助手</span>
          <button 
            className="collapse-btn"
            onClick={() => handleCollapse('right')}
            title={isRightCollapsed ? '展开' : '折叠'}
          >
            {isRightCollapsed ? '←' : '→'}
          </button>
        </div>
        <div className="panel-content">
          {rightPanel}
        </div>
      </div>

      {/* 移动端切换按钮 */}
      {isMobile && (
        <div className="mobile-panel-switcher">
          <button 
            className={`switch-btn ${!isLeftCollapsed ? 'active' : ''}`}
            onClick={() => {
              setIsLeftCollapsed(false)
              setIsRightCollapsed(true)
            }}
          >
            文档
          </button>
          <button 
            className={`switch-btn ${!isRightCollapsed ? 'active' : ''}`}
            onClick={() => {
              setIsLeftCollapsed(true)
              setIsRightCollapsed(false)
            }}
          >
            AI
          </button>
        </div>
      )}
    </div>
  )
}

export default DualPanelLayout
