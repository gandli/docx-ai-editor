// Mock DOCX 文件和数据

export const mockDocxBlob = new Blob(
  [
    // 简化的 DOCX 二进制占位符
    new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // PK 签名
      // ... 实际 DOCX 内容
    ])
  ],
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
)

export const mockDocxFile = new File([mockDocxBlob], 'test.docx', {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  lastModified: Date.now()
})

export const mockExtractedText = `# 测试文档

这是一个用于测试的 DOCX 文档。

## 第一段
包含一些测试内容，用于验证文本提取功能。

## 第二段
更多测试内容，确保提取功能可以处理多个段落。

### 子标题
- 列表项 1
- 列表项 2
- 列表项 3

**加粗文本** 和 *斜体文本* 测试。

[链接测试](https://example.com)
`

export const mockAIResponse = `## 文档分析报告

### ✅ 优点
1. 结构清晰，使用了标题分层
2. 包含了列表，增强了可读性

### ⚠️ 改进建议

#### 语法检查
- 未发现明显语法错误

#### 风格优化
- 可以考虑添加更多过渡句
- 部分段落可以进一步展开

#### 内容建议
- 建议添加结论段落
- 可以增加实际案例支撑观点

### 📝 修改示例
原文："包含一些测试内容"
建议："本文档包含了用于验证系统功能的测试内容，涵盖多个方面。"
`

export const mockLargeDocxFile = new File(
  [new Blob([new Array(1024 * 1024 * 10).fill(0)])], // 10MB
  'large-test.docx',
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
)

export const mockCorruptedFile = new File(
  ['invalid content'],
  'corrupted.docx',
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
)

export const mockNonDocxFile = new File(
  ['pdf content'],
  'test.pdf',
  {
    type: 'application/pdf'
  }
)
