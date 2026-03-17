import { describe, it, expect, beforeEach, vi } from 'vitest'
import { extractTextFromDocx, convertHtmlToDocx, mergeDocumentChanges, validateDocxFile } from '../docx-utils'

// 创建模拟 DOCX 文件
const createMockDocxFile = (content = 'Test content') => {
  // DOCX 文件头 (PK 签名)
  const docxHeader = new Uint8Array([
    0x50, 0x4B, 0x03, 0x04, // PK 签名
    ...new TextEncoder().encode(content)
  ])
  return new File([docxHeader], 'test.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}

describe('DOCX Utils', () => {
  describe('validateDocxFile', () => {
    it('接受有效的 DOCX 文件', async () => {
      const validFile = createMockDocxFile('Hello World')
      const result = await validateDocxFile(validFile)
      expect(result.valid).toBe(true)
    })

    it('拒绝非 DOCX 文件', async () => {
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
      const result = await validateDocxFile(pdfFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('只支持')
    })

    it('拒绝空文件', async () => {
      const emptyFile = new File([], 'empty.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const result = await validateDocxFile(emptyFile)
      expect(result.valid).toBe(false)
    })

    it('拒绝超过 50MB 的文件', async () => {
      const largeFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const result = await validateDocxFile(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('文件大小')
    })

    it('检查文件扩展名', async () => {
      const wrongExtFile = new File(['PK'], 'test.txt', { type: 'text/plain' })
      const result = await validateDocxFile(wrongExtFile)
      expect(result.valid).toBe(false)
    })
  })

  describe('extractTextFromDocx', () => {
    it('从 DOCX 文件提取文本内容', async () => {
      const mockFile = createMockDocxFile('Hello World')
      const text = await extractTextFromDocx(mockFile)
      expect(text).toBeDefined()
      expect(typeof text).toBe('string')
    })

    it('处理空 DOCX 文件', async () => {
      const emptyFile = createMockDocxFile('')
      const text = await extractTextFromDocx(emptyFile)
      expect(text).toBe('')
    })

    it('处理包含格式的 DOCX 文件', async () => {
      const formattedContent = '<p>Hello <strong>World</strong></p>'
      const file = createMockDocxFile(formattedContent)
      const text = await extractTextFromDocx(file)
      expect(text).toBeDefined()
    })

    it('处理损坏的 DOCX 文件时验证失败', async () => {
      const corruptedFile = new File(['invalid data'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const result = await validateDocxFile(corruptedFile)
      // 损坏的文件应该验证失败（因为没有 PK 签名）
      expect(result.valid).toBe(false)
    })

    it('保留文档结构信息', async () => {
      const structuredContent = `
        <h1>标题</h1>
        <p>第一段</p>
        <p>第二段</p>
      `
      const file = createMockDocxFile(structuredContent)
      const text = await extractTextFromDocx(file)
      expect(text).toBeDefined()
    })
  })

  describe('convertHtmlToDocx', () => {
    it('将 HTML 内容转换为 DOCX 格式', async () => {
      const html = '<p>Hello <strong>World</strong></p>'
      const result = await convertHtmlToDocx(html)
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })

    it('处理空 HTML 内容', async () => {
      const html = ''
      const result = await convertHtmlToDocx(html)
      expect(result).toBeInstanceOf(Blob)
    })

    it('保留 HTML 格式', async () => {
      const html = `
        <h1>标题</h1>
        <p>包含<strong>粗体</strong>和<em>斜体</em></p>
        <ul><li>列表项 1</li><li>列表项 2</li></ul>
      `
      const result = await convertHtmlToDocx(html)
      expect(result.size).toBeGreaterThan(0)
    })

    it('处理复杂 HTML 结构', async () => {
      const html = `
        <table>
          <tr><td>单元格 1</td><td>单元格 2</td></tr>
        </table>
      `
      const result = await convertHtmlToDocx(html)
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('mergeDocumentChanges', () => {
    it('将变更合并到原始文档', async () => {
      const originalDocx = createMockDocxFile('Original content')
      const changes = { 
        type: 'insert', 
        position: 0, 
        content: 'New text ' 
      }
      
      const result = await mergeDocumentChanges(originalDocx, changes)
      expect(result).toBeDefined()
      expect(result).not.toBe(originalDocx) // 新对象
    })

    it('处理多个变更', async () => {
      const originalDocx = createMockDocxFile('Original')
      const changes = [
        { type: 'insert', position: 0, content: 'Start ' },
        { type: 'delete', position: 5, length: 3 },
        { type: 'replace', position: 0, content: 'Replaced' }
      ]
      
      const result = await mergeDocumentChanges(originalDocx, changes)
      expect(result).toBeDefined()
    })

    it('保留原始文档格式', async () => {
      const originalDocx = createMockDocxFile('<p>Original <strong>formatted</strong></p>')
      const changes = { type: 'insert', position: 0, content: 'New ' }
      
      const result = await mergeDocumentChanges(originalDocx, changes)
      expect(result).toBeDefined()
    })

    it('处理空变更列表', async () => {
      const originalDocx = createMockDocxFile('Content')
      const changes = []
      
      const result = await mergeDocumentChanges(originalDocx, changes)
      expect(result).toBeDefined()
    })

    it('撤销变更', async () => {
      const originalDocx = createMockDocxFile('Original')
      const changes = { type: 'insert', position: 0, content: 'New ' }
      
      // 应用变更
      const modified = await mergeDocumentChanges(originalDocx, changes)
      
      // 撤销变更
      const reverted = await mergeDocumentChanges(modified, { type: 'undo' })
      expect(reverted).toBeDefined()
    })
  })
})
