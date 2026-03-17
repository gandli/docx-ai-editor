import React, { useState, useCallback, useRef } from 'react'
import { validateDocxFile } from '../api/docx-utils'
import './FileUpload.css'

/**
 * 文件上传组件
 * 支持点击上传和拖放上传
 * 验证 DOCX 文件格式和大小
 */
export function FileUpload({ onFileSelect, maxSize = 50 * 1024 * 1024 }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // 处理文件验证
  const handleFile = useCallback(async (file) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await validateDocxFile(file, maxSize)
      
      if (result.valid) {
        onFileSelect && onFileSelect(file)
      } else {
        setError(result.error || '文件验证失败')
      }
    } catch (err) {
      setError(err.message || '文件处理失败')
    } finally {
      setIsLoading(false)
    }
  }, [onFileSelect, maxSize])

  // 处理文件选择
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  // 处理拖放进入
  const handleDragEnter = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(true)
  }, [])

  // 处理拖放离开
  const handleDragLeave = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
  }, [])

  // 处理拖放经过
  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // 处理文件拖放
  const handleDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  // 处理点击浏览
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="file-upload-container">
      <div
        className={`file-dropzone ${isDragActive ? 'drag-active' : ''}`}
        data-testid="file-dropzone"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="上传 DOCX 文件"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="file-input"
          data-testid="file-input"
          aria-label="上传 DOCX 文件"
        />
        
        {isLoading ? (
          <div className="loading-state" data-testid="loading-indicator" aria-live="polite">
            <div className="loading-spinner"></div>
            <span>正在验证文件...</span>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <div className="upload-text">
              <h3>上传 DOCX 文件</h3>
              <p>拖放文件到此处，或点击浏览按钮</p>
              <p className="file-type-hint">支持 .docx 格式，最大 50MB</p>
            </div>
            <button 
              className="browse-button"
              onClick={handleBrowseClick}
              type="button"
            >
              浏览
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert" data-testid="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default FileUpload
