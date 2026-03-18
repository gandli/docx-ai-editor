import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react'
import { SuperDocEditor } from '@superdoc-dev/react'
import { ExportPanel } from './ExportPanel'
import './DocumentEditor.css'

/**
 * 文档编辑器组件
 * 集成 SuperDoc 实现 DOCX 原生编辑
 * 支持编辑、查看、评论模式
 * 集成导出功能：预览、进度指示、大文件处理、错误处理
 * 集成查找和替换建议功能
 */
export function DocumentEditor({
  document,
  documentMode = 'editing',
  onReady,
  onChange,
  onExport,
  onExportComplete,
  onExportError,
  onRetry,
  onNavigateToFinding,
  onApplySuggestion
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [showExportPanel, setShowExportPanel] = useState(false)
  
  // 创建编辑器 ref 用于访问导出方法
  const editorRef = useRef(null)

  // 监听文档 URL 变化
  useEffect(() => {
    if (document) {
      setIsLoading(true)
      setHasError(false)
      setEditorReady(false)
      setShowExportPanel(false)
    }
  }, [document])

  // 处理编辑器就绪
  const handleReady = useCallback(() => {
    setIsLoading(false)
    setEditorReady(true)
    onReady && onReady()
  }, [onReady])

  // 处理文档变更
  const handleChange = useCallback((content) => {
    onChange && onChange(content)
  }, [onChange])

  // 处理导出完成
  const handleExportComplete = useCallback((exportData) => {
    onExportComplete && onExportComplete(exportData)
    // 导出成功后可以选择关闭面板或保持显示
    // setShowExportPanel(false)
  }, [onExportComplete])

  // 处理导出错误
  const handleExportError = useCallback((error) => {
    onExportError && onExportError(error)
  }, [onExportError])

  // 处理重试
  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    onRetry && onRetry()
  }, [onRetry])

  // 切换导出面板显示
  const toggleExportPanel = useCallback(() => {
    setShowExportPanel(prev => !prev)
  }, [])

  // Navigate to a specific finding in the document
  const navigateToFinding = useCallback(async (finding) => {
    if (!finding || !finding.location) {
      console.warn('No location provided for finding navigation');
      return;
    }
    
    try {
      // If SuperDoc provides a method to navigate to specific content
      if (editorRef.current && typeof editorRef.current.navigateTo === 'function') {
        await editorRef.current.navigateTo(finding.location);
      } else if (editorRef.current && typeof editorRef.current.focus === 'function') {
        // Alternative method to focus on content
        await editorRef.current.focus();
      }
      
      // Call the callback if provided
      if (onNavigateToFinding) {
        onNavigateToFinding(finding);
      }
    } catch (error) {
      console.error('Failed to navigate to finding:', error);
    }
  }, [onNavigateToFinding]);

  // Apply a suggestion to the document
  const applySuggestionToDocument = useCallback(async (suggestion) => {
    if (!suggestion) {
      console.warn('No suggestion provided');
      return { success: false, error: 'No suggestion provided' };
    }
    
    try {
      // For now, we'll pass the suggestion to the callback
      // In a real implementation, we would apply the suggestion directly to the document
      if (onApplySuggestion) {
        return await onApplySuggestion(suggestion);
      } else {
        // Fallback: use the suggestion applier service
        // Note: In a real implementation, we would need to get the current segments from the editor
        // and pass them to the suggestion applier
        console.warn('onApplySuggestion callback not provided, using fallback behavior');
        return { success: true, message: 'Suggestion received but not applied (callback not provided)' };
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      return { success: false, error: error.message };
    }
  }, [onApplySuggestion]);

  // Expose methods via ref if needed by parent components
  useImperativeHandle(editorRef, () => ({
    ...editorRef.current,
    navigateToFinding,
    applySuggestion: applySuggestionToDocument
  }), [navigateToFinding, applySuggestionToDocument]);

  // 没有文档时显示占位符
  if (!document) {
    return (
      <div className="editor-container" data-testid="editor-container">
        <div className="editor-placeholder">
          <div className="placeholder-icon">📝</div>
          <h3>请上传 DOCX 文档</h3>
          <p>上传后即可在左侧编辑器中查看和编辑</p>
        </div>
      </div>
    )
  }

  // 加载状态
  if (isLoading && !editorReady) {
    return (
      <div className="editor-container" data-testid="editor-container">
        <div 
          className="loading-state" 
          data-testid="loading-indicator"
          aria-live="polite"
        >
          <div className="loading-spinner"></div>
          <span>正在加载文档...</span>
        </div>
      </div>
    )
  }

  // 错误状态
  if (hasError || !editorReady) {
    return (
      <div className="editor-container" data-testid="editor-container">
        <div className="error-state" role="alert">
          <div className="error-icon">⚠️</div>
          <h3>加载失败</h3>
          <p>无法加载文档，请检查文件格式</p>
          <button 
            className="retry-button"
            onClick={handleRetry}
            type="button"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container" data-testid="editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">
            📄 {document.name || '未命名文档'}
          </span>
        </div>
        
        <div className="toolbar-right">
          <button
            className="toggle-export-button"
            onClick={toggleExportPanel}
            disabled={!editorReady}
            aria-label={showExportPanel ? '关闭导出面板' : '打开导出面板'}
            aria-expanded={showExportPanel}
            type="button"
          >
            {showExportPanel ? '✕ 关闭' : '📥 导出'}
          </button>
        </div>
      </div>
      
      <div className="editor-wrapper">
        <SuperDocEditor
          ref={editorRef}
          document={document}
          documentMode={documentMode}
          onReady={handleReady}
          onChange={handleChange}
          className="superdoc-editor"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      {/* 导出面板 */}
      {showExportPanel && editorReady && (
        <div className="export-panel-container">
          <ExportPanel
            editorRef={editorRef}
            originalFileName={document.name || 'document.docx'}
            onExportComplete={handleExportComplete}
            onExportError={handleExportError}
            disabled={!editorReady}
          />
        </div>
      )}
    </div>
  )
}

export default DocumentEditor
