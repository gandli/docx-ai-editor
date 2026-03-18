import React, { useState, useCallback, useEffect } from 'react';
import './DualPanelLayout.css';

/**
 * DualPanelLayout - Responsive two-panel layout component
 * Supports resize, collapse/expand, and mobile-responsive behavior
 */
export function DualPanelLayout({
  leftPanel,
  rightPanel,
  leftMinWidth = 320,
  rightMinWidth = 280,
  initialLeftWidth = 55,
  onResize,
  collapsedState,
  onCollapseChange,
}) {
  // Panel width state (percentage)
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Collapse state
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(
    collapsedState?.left || false
  );
  const [isRightCollapsed, setIsRightCollapsed] = useState(
    collapsedState?.right || false
  );

  // Update container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.dual-panel-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Handle mouse move (resize)
  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || containerWidth === 0) return;

      const container = document.querySelector('.dual-panel-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

      // Check minimum width constraints
      const leftPx = (newLeftWidth / 100) * rect.width;
      const rightPx = ((100 - newLeftWidth) / 100) * rect.width;

      if (leftPx >= leftMinWidth && rightPx >= rightMinWidth) {
        setLeftWidth(newLeftWidth);
        if (onResize) {
          onResize({ leftWidth: newLeftWidth, rightWidth: 100 - newLeftWidth });
        }
      }
    },
    [isResizing, containerWidth, leftMinWidth, rightMinWidth, onResize]
  );

  // Handle mouse up (stop resize)
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  // Start resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Toggle collapse
  const handleCollapse = useCallback(
    (side) => {
      const newState = {
        left: side === 'left' ? !isLeftCollapsed : isLeftCollapsed,
        right: side === 'right' ? !isRightCollapsed : isRightCollapsed,
      };

      if (side === 'left') {
        setIsLeftCollapsed(!isLeftCollapsed);
      } else {
        setIsRightCollapsed(!isRightCollapsed);
      }

      if (onCollapseChange) {
        onCollapseChange(newState);
      }
    },
    [isLeftCollapsed, isRightCollapsed, onCollapseChange]
  );

  // Global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Responsive breakpoints
  const isMobile = containerWidth < 768;
  const isTablet = containerWidth >= 768 && containerWidth < 1024;

  // Mobile: auto-collapse right panel
  useEffect(() => {
    if (isMobile && !isLeftCollapsed) {
      setIsRightCollapsed(true);
    } else if (!isMobile && !isTablet && !collapsedState?.right) {
      setIsRightCollapsed(false);
    }
  }, [isMobile, isTablet, isLeftCollapsed, collapsedState?.right]);

  return (
    <div
      className={`dual-panel-container ${isResizing ? 'resizing' : ''}`}
      data-testid="dual-panel-layout"
    >
      {/* Left Panel */}
      <div
        className={`dual-panel left-panel ${isLeftCollapsed ? 'collapsed' : ''} ${
          isResizing ? 'no-transition' : ''
        }`}
        style={{
          width: isLeftCollapsed ? '0' : `${leftWidth}%`,
          minWidth: isLeftCollapsed ? '0' : `${leftMinWidth}px`,
        }}
        data-testid="left-panel"
      >
        <div className="panel-header">
          <span className="panel-title">文档</span>
          <button
            className="collapse-btn"
            onClick={() => handleCollapse('left')}
            title={isLeftCollapsed ? '展开' : '折叠'}
            aria-label={isLeftCollapsed ? '展开左侧面板' : '折叠左侧面板'}
          >
            {isLeftCollapsed ? '→' : '←'}
          </button>
        </div>
        <div className="panel-content">{leftPanel}</div>
      </div>

      {/* Resize Handle */}
      {!isLeftCollapsed && !isRightCollapsed && !isMobile && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          title="拖动调整面板宽度"
          data-testid="resize-handle"
        >
          <div className="resize-grip"></div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className={`dual-panel right-panel ${
          isRightCollapsed ? 'collapsed' : ''
        } ${isResizing ? 'no-transition' : ''}`}
        style={{
          width: isRightCollapsed ? '0' : `${100 - leftWidth}%`,
          minWidth: isRightCollapsed ? '0' : `${rightMinWidth}px`,
        }}
        data-testid="right-panel"
      >
        <div className="panel-header">
          <span className="panel-title">审查结果</span>
          <button
            className="collapse-btn"
            onClick={() => handleCollapse('right')}
            title={isRightCollapsed ? '展开' : '折叠'}
            aria-label={isRightCollapsed ? '展开右侧面板' : '折叠右侧面板'}
          >
            {isRightCollapsed ? '←' : '→'}
          </button>
        </div>
        <div className="panel-content">{rightPanel}</div>
      </div>

      {/* Mobile Panel Switcher */}
      {isMobile && (
        <div className="mobile-panel-switcher" data-testid="mobile-switcher">
          <button
            className={`switch-btn ${!isLeftCollapsed ? 'active' : ''}`}
            onClick={() => {
              setIsLeftCollapsed(false);
              setIsRightCollapsed(true);
            }}
          >
            文档
          </button>
          <button
            className={`switch-btn ${!isRightCollapsed ? 'active' : ''}`}
            onClick={() => {
              setIsLeftCollapsed(true);
              setIsRightCollapsed(false);
            }}
          >
            审查
          </button>
        </div>
      )}
    </div>
  );
}

export default DualPanelLayout;
