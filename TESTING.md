# DOCX AI Editor - TDD/BDD 测试规范

> 本文档定义了项目的完整测试策略，包括单元测试、集成测试和 E2E 测试的规范、场景和验收标准。

## 📋 目录

1. [测试架构](#测试架构)
2. [单元测试规范](#单元测试规范)
3. [集成测试规范](#集成测试规范)
4. [E2E 测试规范](#e2e-测试规范)
5. [测试场景与验收标准](#测试场景与验收标准)
6. [测试数据与 Mock](#测试数据与-mock)
7. [CI/CD 集成](#cicd-集成)

---

## 测试架构

### 技术栈选择

```json
{
  "testRunner": "vitest",
  "componentTesting": "react-testing-library",
  "e2eTesting": "playwright",
  "mocking": "msw + vitest mocks",
  "coverage": "c8/v8"
}
```

### 目录结构

```
docx-ai-editor/
├── src/
│   ├── components/
│   ├── api/
│   ├── hooks/
│   └── utils/
├── __tests__/
│   ├── unit/           # 单元测试
│   │   ├── api/
│   │   ├── components/
│   │   └── utils/
│   ├── integration/    # 集成测试
│   │   ├── superdoc/
│   │   └── llm/
│   └── e2e/           # E2E 测试
│       └── flows/
├── __mocks__/         # Mock 数据
│   ├── fixtures/
│   └── handlers/
└── vitest.config.js
```

---

## 单元测试规范

### 1. API 层测试 (`src/api/`)

#### 1.1 `llm.js` 测试

```javascript
// __tests__/unit/api/llm.test.js

describe('LLM API', () => {
  describe('analyzeDocument', () => {
    // 测试场景 1: 成功调用
    it('should successfully analyze document with qwen3-max', async () => {
      // Given: 有效的 DOCX 文件和用户提示
      const mockDocx = createMockDocxFile()
      const mockPrompt = '请优化这段文字'
      
      // When: 调用 analyzeDocument
      const result = await analyzeDocument(mockDocx, mockPrompt, 'qwen3-max')
      
      // Then: 返回 AI 分析结果
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    // 测试场景 2: 不支持的模型
    it('should throw error for unsupported model', async () => {
      // Given: 无效的模型名称
      const invalidModel = 'invalid-model'
      
      // When & Then: 抛出错误
      await expect(analyzeDocument(mockDocx, mockPrompt, invalidModel))
        .rejects.toThrow('Unsupported model: invalid-model')
    })

    // 测试场景 3: API 调用失败
    it('should handle API failure gracefully', async () => {
      // Given: API 返回错误
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      // When & Then: 抛出错误并记录日志
      await expect(analyzeDocument(mockDocx, mockPrompt))
        .rejects.toThrow()
      expect(console.error).toHaveBeenCalledWith(
        'LLM API error:',
        expect.any(Error)
      )
    })

    // 测试场景 4: 多模型切换
    it.each([
      ['qwen3-max', 'modelstudio'],
      ['claude-opus', 'anyrouter'],
      ['glm-5', 'modelstudio']
    ])('should use correct provider for model %s', async (model, provider) => {
      // Given: 指定模型
      // When: 调用 API
      await analyzeDocument(mockDocx, mockPrompt, model)
      
      // Then: 使用正确的 baseUrl
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(MODEL_CONFIGS[model].baseUrl),
        expect.any(Object)
      )
    })
  })

  describe('applyDocumentChanges', () => {
    it('should apply AI suggestions to original document', async () => {
      // Given: 原始文档和 AI 建议
      const originalDocx = createMockDocxFile()
      const suggestions = '修改建议内容'
      
      // When: 应用修改
      const result = await applyDocumentChanges(originalDocx, suggestions)
      
      // Then: 返回修改后的文档
      expect(result).toBeDefined()
      // TODO: 验证文档内容已更新
    })
  })
})
```

#### 1.2 `docx-utils.js` 测试

```javascript
// __tests__/unit/api/docx-utils.test.js

describe('DOCX Utils', () => {
  describe('extractTextFromDocx', () => {
    it('should extract text content from DOCX file', async () => {
      // Given: 有效的 DOCX 文件
      const mockFile = createMockDocxFile('Hello World')
      
      // When: 提取文本
      const text = await extractTextFromDocx(mockFile)
      
      // Then: 返回文本内容
      expect(text).toBeDefined()
      expect(typeof text).toBe('string')
    })

    it('should handle empty DOCX file', async () => {
      // Given: 空 DOCX 文件
      const emptyFile = createMockDocxFile('')
      
      // When: 提取文本
      const text = await extractTextFromDocx(emptyFile)
      
      // Then: 返回空字符串
      expect(text).toBe('')
    })

    it('should handle corrupted DOCX file', async () => {
      // Given: 损坏的文件
      const corruptedFile = new File(['invalid'], 'test.docx')
      
      // When & Then: 抛出错误或返回空
      await expect(extractTextFromDocx(corruptedFile))
        .rejects.toThrow()
    })
  })

  describe('convertHtmlToDocx', () => {
    it('should convert HTML content to DOCX format', async () => {
      // Given: HTML 内容
      const html = '<p>Hello <strong>World</strong></p>'
      
      // When: 转换
      const result = await convertHtmlToDocx(html)
      
      // Then: 返回 DOCX Blob
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })
  })

  describe('mergeDocumentChanges', () => {
    it('should merge changes into original document', async () => {
      // Given: 原始文档和变更
      const original = createMockDocxFile()
      const changes = { type: 'insert', position: 0, content: 'New text' }
      
      // When: 合并变更
      const result = await mergeDocumentChanges(original, changes)
      
      // Then: 返回合并后的文档
      expect(result).toBeDefined()
      expect(result).not.toBe(original) // 新对象
    })
  })
})
```

---

## 集成测试规范

### 2. SuperDoc 集成测试

#### 2.1 编辑器初始化

```javascript
// __tests__/integration/superdoc/editor.test.js

describe('SuperDoc Integration', () => {
  describe('Editor Initialization', () => {
    it('should initialize SuperDocEditor with valid document URL', async () => {
      // Given: 有效的文档 URL
      const docUrl = createObjectURL(mockDocxBlob)
      
      // When: 渲染编辑器
      render(<SuperDocEditor document={docUrl} documentMode="editing" />)
      
      // Then: 编辑器正常加载
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument()
      })
    })

    it('should call onReady callback when editor is ready', async () => {
      // Given: onReady 回调
      const onReady = vi.fn()
      
      // When: 渲染编辑器
      render(
        <SuperDocEditor 
          document={mockDocUrl}
          documentMode="editing"
          onReady={onReady}
        />
      )
      
      // Then: 回调被调用
      await waitFor(() => {
        expect(onReady).toHaveBeenCalled()
      })
    })

    it('should handle invalid document URL gracefully', async () => {
      // Given: 无效的 URL
      const invalidUrl = 'invalid-url'
      
      // When: 渲染编辑器
      render(<SuperDocEditor document={invalidUrl} documentMode="editing" />)
      
      // Then: 显示错误状态或降级处理
      // (根据 SuperDoc 的实际行为调整)
    })
  })

  describe('Document Mode', () => {
    it.each(['editing', 'viewing', 'commenting'])(
      'should support %s mode',
      async (mode) => {
        // Given: 指定模式
        // When: 渲染编辑器
        render(<SuperDocEditor document={mockDocUrl} documentMode={mode} />)
        
        // Then: 编辑器以正确模式加载
        await waitFor(() => {
          expect(screen.getByRole('application')).toHaveAttribute(
            'data-mode',
            mode
          )
        })
      }
    )
  })
})
```

#### 2.2 文档操作

```javascript
// __tests__/integration/superdoc/operations.test.js

describe('SuperDoc Operations', () => {
  describe('Document Loading', () => {
    it('should load DOCX file from URL', async () => {
      // Given: DOCX 文件 URL
      const docUrl = createObjectURL(mockDocxBlob)
      
      // When: 加载文档
      render(<SuperDocEditor document={docUrl} />)
      
      // Then: 文档内容可见
      await waitFor(() => {
        expect(screen.getByText(/document content/i)).toBeInTheDocument()
      })
    })

    it('should show loading state while document loads', async () => {
      // Given: 慢速加载的文档
      const slowDocUrl = createSlowLoadingDocUrl()
      
      // When: 加载文档
      render(<SuperDocEditor document={slowDocUrl} />)
      
      // Then: 显示加载指示器
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
  })

  describe('Document Export', () => {
    it('should export modified document as DOCX', async () => {
      // Given: 已修改的文档
      const editor = render(<SuperDocEditor document={mockDocUrl} />)
      
      // When: 导出文档
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      // Then: 下载 DOCX 文件
      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalledWith(
          expect.any(Blob),
          expect.stringMatching(/\.docx$/i)
        )
      })
    })

    it('should preserve formatting after export', async () => {
      // Given: 包含格式的文档
      // When: 导出
      // Then: 格式保留
      // (需要实际验证导出的 DOCX 内容)
    })
  })
})
```

### 3. LLM API 集成测试

```javascript
// __tests__/integration/llm/api.test.js

describe('LLM API Integration', () => {
  beforeEach(() => {
    // 设置 MSW 请求拦截
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('Multi-Model Support', () => {
    it('should successfully call Qwen API', async () => {
      // Given: Qwen API mock
      server.use(
        http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', () => {
          return HttpResponse.json({
            choices: [{ message: { content: '分析结果' } }]
          })
        })
      )
      
      // When: 调用 API
      const result = await analyzeDocument(mockDocx, '分析文档', 'qwen3-max')
      
      // Then: 返回正确结果
      expect(result).toBe('分析结果')
    })

    it('should successfully call Claude API', async () => {
      // Given: Claude API mock
      server.use(
        http.post('https://anyrouter.top/chat/completions', () => {
          return HttpResponse.json({
            choices: [{ message: { content: 'Claude 分析' } }]
          })
        })
      )
      
      // When & Then: 类似 Qwen 测试
    })

    it('should handle API rate limiting', async () => {
      // Given: 429 响应
      server.use(
        http.post('/chat/completions', () => {
          return new HttpResponse(null, { status: 429 })
        })
      )
      
      // When & Then: 处理限流
      await expect(analyzeDocument(mockDocx, 'test'))
        .rejects.toThrow()
    })

    it('should retry on transient failures', async () => {
      // Given: 首次失败，第二次成功
      let callCount = 0
      server.use(
        http.post('/chat/completions', () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse(null, { status: 503 })
          }
          return HttpResponse.json({
            choices: [{ message: { content: '成功' } }]
          })
        })
      )
      
      // When: 调用 API（带重试逻辑）
      // Then: 最终成功
    })
  })

  describe('Prompt Construction', () => {
    it('should include document content in system prompt', async () => {
      // Given: 文档内容
      const docContent = '这是文档内容'
      
      // When: 调用 API
      await analyzeDocument(mockDocx, '用户提示')
      
      // Then: 验证请求体
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(docContent)
        })
      )
    })

    it('should include user prompt in messages', async () => {
      // Given: 用户提示
      const userPrompt = '请优化这段文字'
      
      // When: 调用 API
      await analyzeDocument(mockDocx, userPrompt)
      
      // Then: 提示在请求中
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(userPrompt)
        })
      )
    })
  })
})
```

---

## E2E 测试规范

### 4. 双面板交互测试

```javascript
// __tests__/e2e/flows/dual-panel.test.js

import { test, expect } from '@playwright/test'

test.describe('Dual Panel Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display both document and chat panels', async ({ page }) => {
    // Given: 首页已加载
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // Then: 两个面板都可见
    await expect(page.locator('.document-panel')).toBeVisible()
    await expect(page.locator('.chat-panel')).toBeVisible()
  })

  test('should enable chat only after document upload', async ({ page }) => {
    // Given: 初始状态
    
    // When: 检查聊天输入
    const chatInput = page.locator('.chat-input input')
    
    // Then: 初始禁用
    await expect(chatInput).toBeDisabled()
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // Then: 启用聊天
    await expect(chatInput).toBeEnabled()
  })

  test('should maintain panel layout on resize', async ({ page }) => {
    // Given: 文档已加载
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // When: 调整窗口大小
    await page.setViewportSize({ width: 800, height: 600 })
    
    // Then: 布局正常
    await expect(page.locator('.main-layout')).toBeVisible()
    
    // When: 再次调整
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Then: 布局仍然正常
    await expect(page.locator('.document-panel')).toBeInViewport()
    await expect(page.locator('.chat-panel')).toBeInViewport()
  })

  test('should scroll panels independently', async ({ page }) => {
    // Given: 长文档和多个聊天消息
    await page.setInputFiles('input[type="file"]', 'long-doc.docx')
    await sendMultipleChatMessages(page, 10)
    
    // When: 滚动文档面板
    await page.locator('.document-panel').evaluate(el => el.scrollTop = 500)
    
    // Then: 聊天面板不受影响
    const chatScroll = await page.locator('.chat-panel').evaluate(el => el.scrollTop)
    expect(chatScroll).toBe(0)
  })
})
```

### 5. 完整用户流程测试

```javascript
// __tests__/e2e/flows/complete-workflow.test.js

test.describe('Complete User Workflow', () => {
  test('full workflow: upload → analyze → modify → export', async ({ page }) => {
    // Step 1: 上传文档
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    await expect(page.locator('.document-panel')).toContainText('sample')
    
    // Step 2: 发送分析请求
    await page.locator('.chat-input input').fill('请分析文档结构')
    await page.locator('.chat-input button').click()
    
    // Step 3: 等待 AI 响应
    await expect(page.locator('.message.ai').last())
      .toContainText(/分析 | 建议 | 优化/i, { timeout: 30000 })
    
    // Step 4: 应用修改建议
    await page.locator('.apply-changes-button').click()
    await expect(page.locator('.toast')).toContainText('修改已应用')
    
    // Step 5: 导出文档
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.export-button').click()
    ])
    
    // Step 6: 验证下载
    expect(download.suggestedFilename()).toMatch(/\.docx$/i)
    expect((await download.totalSize)).toBeGreaterThan(0)
  })

  test('should handle multiple consecutive analyses', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    
    // When: 多次分析
    const prompts = [
      '分析语法错误',
      '优化写作风格',
      '检查格式问题'
    ]
    
    for (const prompt of prompts) {
      await page.locator('.chat-input input').fill(prompt)
      await page.locator('.chat-input button').click()
      await expect(page.locator('.message.ai').last())
        .toBeVisible({ timeout: 15000 })
    }
    
    // Then: 所有消息都在历史记录中
    const aiMessages = page.locator('.message.ai')
    await expect(aiMessages).toHaveCount(3)
  })

  test('should preserve chat history across sessions', async ({ page, context }) => {
    // Given: 完成一些对话
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    await page.locator('.chat-input input').fill('测试消息')
    await page.locator('.chat-input button').click()
    await expect(page.locator('.message.user')).toContainText('测试消息')
    
    // When: 刷新页面
    await page.reload()
    
    // Then: 聊天记录保留（如果实现了持久化）
    // 或者：显示上传提示（如果没有持久化）
    // 根据实际需求调整
  })
})
```

### 6. 文档导出功能测试

```javascript
// __tests__/e2e/flows/export.test.js

test.describe('Document Export', () => {
  test('should export document in DOCX format', async ({ page }) => {
    // Given: 文档已加载
    await page.setInputFiles('input[type="file"]', 'original.docx')
    
    // When: 点击导出
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export")').click()
    ])
    
    // Then: 验证文件
    expect(download.suggestedFilename()).toMatch(/\.docx$/i)
    
    // 验证文件内容（可选）
    const stream = await download.createReadStream()
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test('should export with modified content', async ({ page }) => {
    // Given: 文档已修改
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    await sendChatMessage(page, '添加一个新段落')
    await applyChanges(page)
    
    // When: 导出
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.export-button').click()
    ])
    
    // Then: 导出的文件包含修改
    // (需要解析 DOCX 验证内容)
  })

  test('should handle large document export', async ({ page }) => {
    // Given: 大文档
    await page.setInputFiles('input[type="file"]', 'large-doc.docx')
    
    // When: 导出
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.export-button').click()
    ])
    
    // Then: 成功下载
    await download.saveAs('/tmp/large-export.docx')
    expect(fs.existsSync('/tmp/large-export.docx')).toBe(true)
  })

  test('should show export progress for large files', async ({ page }) => {
    // Given: 大文档
    await page.setInputFiles('input[type="file"]', 'large-doc.docx')
    
    // When: 导出
    page.locator('.export-button').click()
    
    // Then: 显示进度指示器
    await expect(page.locator('.export-progress')).toBeVisible()
    await expect(page.locator('.export-progress')).toHaveText(/%|processing/i)
    
    // 完成后消失
    await expect(page.locator('.export-progress')).not.toBeVisible({ timeout: 60000 })
  })
})
```

---

## 测试场景与验收标准

### 场景 1: 文档上传与加载

| 测试点 | 预期行为 | 验收标准 |
|--------|----------|----------|
| 上传有效 DOCX | 文件被接受，编辑器加载 | 编辑器在 5 秒内显示文档内容 |
| 上传非 DOCX 文件 | 显示错误提示 | 错误消息清晰说明只支持 DOCX |
| 上传超大文件 (>50MB) | 显示警告或拒绝 | 用户友好提示，不崩溃 |
| 上传损坏文件 | 优雅降级 | 显示错误，不阻塞 UI |
| 取消上传 | 返回初始状态 | 无残留状态 |

### 场景 2: LLM 文档分析

| 测试点 | 预期行为 | 验收标准 |
|--------|----------|----------|
| 发送分析请求 | AI 在 10 秒内响应 | 响应内容相关且有用 |
| 网络失败 | 显示错误，允许重试 | 错误消息清晰，重试按钮可用 |
| API 限流 | 自动重试或提示等待 | 用户知道发生了什么 |
| 长文档分析 | 显示进度指示器 | 进度更新，不超时 |
| 多轮对话 | 保持上下文 | AI 理解之前的对话 |

### 场景 3: 修改应用

| 测试点 | 预期行为 | 验收标准 |
|--------|----------|----------|
| 应用 AI 建议 | 文档内容更新 | 修改可见且正确 |
| 应用失败 | 回滚并提示 | 原始内容保留 |
| 部分应用 | 选择性接受修改 | 用户可选择接受哪些 |
| 多次修改 | 累积应用 | 所有修改都生效 |
| 撤销修改 | 恢复到之前状态 | 撤销功能可用 |

### 场景 4: 文档导出

| 测试点 | 预期行为 | 验收标准 |
|--------|----------|----------|
| 导出未修改文档 | 下载原始文件 | 文件完整且可打开 |
| 导出已修改文档 | 下载包含修改 | 修改保留在 DOCX 中 |
| 导出大文件 | 显示进度 | 进度准确，不超时 |
| 导出中断 | 允许恢复或重试 | 不产生损坏文件 |
| 格式保留 | 样式、格式保留 | 打开后格式正确 |

### 场景 5: 双面板交互

| 测试点 | 预期行为 | 验收标准 |
|--------|----------|----------|
| 面板布局 | 响应式布局 | 各屏幕尺寸正常显示 |
| 独立滚动 | 面板独立滚动 | 互不干扰 |
| 聊天禁用状态 | 上传前禁用 | 视觉反馈清晰 |
| 消息历史 | 滚动查看历史 | 性能良好，不卡顿 |
| 快速连续发送 | 消息顺序正确 | 无丢失或乱序 |

---

## 测试数据与 Mock

### Mock 数据

```javascript
// __mocks__/fixtures/documents.js

export const mockDocxBlob = new Blob([/* DOCX binary */], {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
})

export const mockDocxFile = new File([mockDocxBlob], 'test.docx', {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
})

export const mockExtractedText = `
# 测试文档

这是一个用于测试的 DOCX 文档。

## 第一段
包含一些测试内容。

## 第二段
更多测试内容用于验证提取功能。
`

export const mockAIResponse = `
## 分析结果

### 语法检查
- 发现 2 处语法错误
- 建议修改...

### 风格优化
- 句子结构可以改进
- 建议...

### 内容建议
- 可以添加更多细节
`
```

### MSW Handlers

```javascript
// __mocks__/handlers/llm.handlers.js

import { http, HttpResponse } from 'msw'

export const llmHandlers = [
  // Qwen API
  http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()
    
    // 验证请求格式
    if (!body.model || !body.messages) {
      return new HttpResponse(null, { status: 400 })
    }
    
    return HttpResponse.json({
      id: 'chatcmpl-test',
      choices: [{
        message: { content: mockAIResponse },
        finish_reason: 'stop'
      }],
      usage: { total_tokens: 100 }
    })
  }),
  
  // Claude API
  http.post('https://anyrouter.top/chat/completions', async () => {
    return HttpResponse.json({
      choices: [{ message: { content: 'Claude 分析结果' } }]
    })
  }),
  
  // 错误场景
  http.post('*/chat/completions', () => {
    return new HttpResponse(null, { status: 500 })
  })
]
```

---

## CI/CD 集成

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run unit tests
        run: bun test run __tests__/unit
      
      - name: Run integration tests
        run: bun test run __tests__/integration
      
      - name: Run E2E tests
        uses: playwright-action@v1
        with:
          command: bun test run __tests__/e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage.json
```

### Vite + Vitest 配置

```javascript
// vitest.config.js

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '__tests__/']
    },
    mockReset: true,
    restoreMocks: true
  }
})
```

### Playwright 配置

```javascript
// playwright.config.js

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ],
  webServer: {
    command: 'bun run dev',
    port: 5173,
    timeout: 120000
  }
})
```

---

## 测试执行命令

```bash
# 运行所有测试
bun test

# 运行单元测试
bun test run __tests__/unit

# 运行集成测试
bun test run __tests__/integration

# 运行 E2E 测试
bun test run __tests__/e2e

# 运行特定测试文件
bun test __tests__/unit/api/llm.test.js

# 运行匹配模式的测试
bun test -t "LLM API"

# 带覆盖率
bun test --coverage

# 监听模式
bun test --watch

# E2E 有头模式
bun playwright test --headed

# E2E 特定项目
bun playwright test --project=chromium
```

---

## 附录：测试检查清单

### 开发时

- [ ] 新功能先写测试（TDD）
- [ ] 单元测试覆盖率 > 80%
- [ ] 关键路径有集成测试
- [ ] Mock 外部依赖

### 提交前

- [ ] 所有测试通过
- [ ] 覆盖率无显著下降
- [ ] E2E 关键流程通过
- [ ] 无 console.error/warning

### 发布前

- [ ] 完整测试套件通过
- [ ] 多浏览器 E2E 测试通过
- [ ] 性能测试通过
- [ ] 安全扫描通过

---

*文档版本：1.0*  
*最后更新：2026-03-17*
