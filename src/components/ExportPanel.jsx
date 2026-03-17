import React, { useState, useCallback } from 'react'
import { 
  exportDocxDocument, 
  downloadBlob, 
  previewDocxContent,
  formatFileSize,
  ExportError 
} from '../api/docx-utils'
import './ExportPanel.css'

/**
 * 导出面板组件
 * 支持导出前预览、进度指示、大文件处理和错误处理
 */
export function ExportPanel({
  editorRef,
  originalFileName = 'document',
  onExportComplete,
  onExportError,
  disabled = false
}) {
  // 状态管理
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState(null)
  const [exportedBlob, setExportedBlob] = useState(null)
  const [exportInfo, setExportInfo] = useState(null)

  // 生成导出文件名
  const generateFileName = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    const baseName = originalFileName.replace(/\.docx$/i, '')
    return `${baseName}_edited_${timestamp}.docx`
  }

  // 预览导出内容
  const handlePreview = useCallback(async () => {
    if (!editorRef || !editorRef.current) {
      setExportError('编辑器未就绪，无法预览')
      return
    }

    try {
      setShowPreview(true)
      setExportError(null)

      // 获取预览内容
      const content = editorRef.current.getContent?.() || 
                     editorRef.current.getHTML?.() ||
                     editorRef.current.getText?.() ||
                     ''

      setPreviewContent({
        text: content.substring(0, 1000),
        length: content.length,
        truncated: content.length > 1000
      })
    } catch (error) {
      setExportError(`预览失败：${error.message}`)
      setShowPreview(false)
    }
  }, [editorRef])

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setShowPreview(false)
    setPreviewContent(null)
  }, [])

  // 执行导出
  const handleExport = useCallback(async () => {
    if (!editorRef || !editorRef.current) {
      const error = {
        type: ExportError.EDITOR_NOT_READY,
        message: '编辑器未就绪'
      }
      setExportError(error.message)
      onExportError?.(error)
      return
    }

    try {
      setIsExporting(true)
      setExportProgress(0)
      setExportError(null)
      setExportedBlob(null)
      setExportInfo(null)

      const fileName = generateFileName()

      // 执行导出
      const result = await exportDocxDocument(
        editorRef,
        fileName,
        (progress) => setExportProgress(progress)
      )

      if (result.success) {
        setExportedBlob(result.blob)
        setExportInfo({
          fileName,
          size: result.size,
          sizeFormatted: formatFileSize(result.size),
          isLargeFile: result.isLargeFile
        })

        // 自动下载
        downloadBlob(result.blob, fileName)

        // 回调通知
        onExportComplete?.({
          fileName,
          blob: result.blob,
          size: result.size
        })
      } else {
        const error = {
          type: ExportError.EXPORT_FAILED,
          message: result.error
        }
        setExportError(error.message)
        onExportError?.(error)
      }
    } catch (error) {
      console.error('导出异常:', error)
      const exportError = {
        type: ExportError.UNKNOWN,
        message: error.message || '导出过程中发生未知错误'
      }
      setExportError(exportError.message)
      onExportError?.(exportError)
    } finally {
      setIsExporting(false)
    }
  }, [editorRef, originalFileName, onExportComplete, onExportError])

  // 取消导出
  const handleCancel = useCallback(() => {
    setIsExporting(false)
    setExportProgress(0)
    const error = {
      type: ExportError.CANCELLED,
      message: '导出已取消'
    }
    setExportError(error.message)
    onExportError?.(error)
  }, [onExportError])

  // 重试导出
  const handleRetry = useCallback(() => {
    setExportError(null)
    handleExport()
  }, [handleExport])

  // 渲染进度条
  const renderProgressBar = () => {
    if (!isExporting) return null

    return (
      <div className="export-progress" role="progressbar" aria-valuenow={exportProgress} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${exportProgress}%` }}
          />
        </div>
        <div className="progress-text">
          {exportProgress < 100 ? `导出中... ${exportProgress}%` : '导出完成！'}
        </div>
        
        {exportProgress < 100 && (
          <button
            className="cancel-button"
            onClick={handleCancel}
            disabled={exportProgress >= 90}
            type="button"
          >
            取消
          </button>
        )}
      </div>
    )
  }

  // 渲染错误信息
  const renderError = () => {
    if (!exportError) return null

    return (
      <div className="export-error" role="alert">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{exportError}</div>
        {!isExporting && (
          <button
            className="retry-button"
            onClick={handleRetry}
            type="button"
          >
            重试
          </button>
        )}
      </div>
    )
  }

  // 渲染导出信息
  const renderExportInfo = () => {
    if (!exportInfo) return null

    return (
      <div className="export-info">
        <div className="info-row">
          <span className="info-label">文件名:</span>
          <span className="info-value">{exportInfo.fileName}</span>
        </div>
        <div className="info-row">
          <span className="info-label">大小:</span>
          <span className={`info-value ${exportInfo.isLargeFile ? 'large-file' : ''}`}>
            {exportInfo.sizeFormatted}
            {exportInfo.isLargeFile && (
              <span className="large-file-badge">大文件</span>
            )}
          </span>
        </div>
        <div className="success-message">
          ✅ 导出成功！文件已开始下载
        </div>
      </div>
    )
  }

  // 渲染预览面板
  const renderPreview = () => {
    if (!showPreview || !previewContent) return null

    return (
      <div className="export-preview-overlay" onClick={handleClosePreview}>
        <div className="export-preview" onClick={e => e.stopPropagation()}>
          <div className="preview-header">
            <h3>📄 导出预览</h3>
            <button
              className="close-preview"
              onClick={handleClosePreview}
              aria-label="关闭预览"
              type="button"
            >
              ✕
            </button>
          </div>
          
          <div className="preview-content">
            <div className="preview-stats">
              <span>字符数：{previewContent.length}</span>
              {previewContent.truncated && (
                <span className="truncated-notice">（仅显示前 1000 字符）</span>
              )}
            </div>
            <div className="preview-text">
              {previewContent.text || '(空文档)'}
            </div>
          </div>

          <div className="preview-footer">
            <button
              className="export-now-button"
              onClick={() => {
                handleClosePreview()
                handleExport()
              }}
              disabled={disabled || isExporting}
              type="button"
            >
              确认导出
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染大文件警告
  const renderLargeFileWarning = () => {
    // 这里可以添加基于编辑器内容大小的预估
    // 暂时简化处理
    return null
  }

  return (
    <div className="export-panel" data-testid="export-panel">
      {renderPreview()}
      
      <div className="export-actions">
        <button
          className="preview-button"
          onClick={handlePreview}
          disabled={disabled || isExporting}
          aria-label="预览导出内容"
          type="button"
        >
          👁️ 预览
        </button>
        
        <button
          className="export-button"
          onClick={handleExport}
          disabled={disabled || isExporting}
          aria-label="导出文档"
          type="button"
        >
          {isExporting ? '⏳ 导出中...' : '📥 导出'}
        </button>
      </div>

      {renderLargeFileWarning()}
      {renderProgressBar()}
      {renderError()}
      {renderExportInfo()}
    </div>
  )
}

export default ExportPanel
