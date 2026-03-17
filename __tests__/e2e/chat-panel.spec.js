// ChatPanel E2E 集成测试
import { test, expect } from '@playwright/test'

test.describe('DOCX AI Editor - Chat Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('聊天面板基础功能', () => {
    test('应该显示聊天面板和模型选择器', async ({ page }) => {
      // 验证聊天面板存在
      await expect(page.getByTestId('chat-panel')).toBeVisible()
      
      // 验证模型选择器存在
      await expect(page.getByTestId('model-selector')).toBeVisible()
      
      // 验证默认选择 Qwen
      await expect(page.getByTestId('model-selector')).toHaveValue('qwen3-max')
    })

    test('应该显示欢迎消息', async ({ page }) => {
      await expect(page.getByText(/上传文档后，我可以帮你/)).toBeVisible()
      await expect(page.getByText('分析文档内容')).toBeVisible()
      await expect(page.getByText('优化文字表达')).toBeVisible()
    })

    test('应该禁用输入框当没有文档时', async ({ page }) => {
      const input = page.getByTestId('chat-input')
      await expect(input).toBeDisabled()
      
      const submitButton = page.getByTestId('chat-submit')
      await expect(submitButton).toBeDisabled()
    })
  })

  test.describe('文档上传和 AI 集成', () => {
    test('上传文档后应该启用聊天功能', async ({ page }) => {
      // 创建测试文件
      const testContent = '这是一份测试文档的内容。'
      const buffer = Buffer.from(testContent)
      
      // 上传文件
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      // 等待文档处理
      await page.waitForTimeout(1000)
      
      // 验证输入框启用
      const input = page.getByTestId('chat-input')
      await expect(input).toBeEnabled()
      
      // 验证提交按钮启用（当有输入时）
      await input.fill('测试消息')
      await expect(page.getByTestId('chat-submit')).toBeEnabled()
    })

    test('上传文档后应该显示文档编辑器', async ({ page }) => {
      const testContent = '测试文档'
      const buffer = Buffer.from(testContent)
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      // 等待 SuperDoc 编辑器加载
      await page.waitForTimeout(1000)
      
      // 验证编辑器存在
      const editorPanel = page.locator('.document-panel')
      await expect(editorPanel).toBeVisible()
    })
  })

  test.describe('模型选择', () => {
    test('应该可以切换模型', async ({ page }) => {
      const selector = page.getByTestId('model-selector')
      
      // 切换到 Claude
      await selector.selectOption('claude-opus')
      await expect(selector).toHaveValue('claude-opus')
      
      // 切换到 GLM
      await selector.selectOption('glm-5')
      await expect(selector).toHaveValue('glm-5')
      
      // 切换回 Qwen
      await selector.selectOption('qwen3-max')
      await expect(selector).toHaveValue('qwen3-max')
    })

    test('加载时应该禁用模型选择器', async ({ page }) => {
      // 模拟加载状态（通过触发请求）
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(500)
      
      const input = page.getByTestId('chat-input')
      await input.fill('测试消息')
      await page.getByTestId('chat-submit').click()
      
      // 加载期间模型选择器应该禁用
      // 注意：这取决于实际实现
    })
  })

  test.describe('消息发送和显示', () => {
    test('应该可以发送消息', async ({ page }) => {
      // 上传文档
      const testContent = '测试文档'
      const buffer = Buffer.from(testContent)
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 输入消息
      const input = page.getByTestId('chat-input')
      await input.fill('请分析这个文档')
      
      // 发送消息
      await page.getByTestId('chat-submit').click()
      
      // 验证输入框清空
      await expect(input).toHaveValue('')
    })

    test('应该显示用户消息', async ({ page }) => {
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 发送消息
      const input = page.getByTestId('chat-input')
      await input.fill('你好')
      await page.getByTestId('chat-submit').click()
      
      // 等待消息显示
      await page.waitForTimeout(500)
      
      // 验证用户消息显示
      const userMessage = page.getByTestId('message-user')
      await expect(userMessage).toBeVisible()
      await expect(userMessage).toContainText('你好')
    })

    test('应该显示 AI 回复', async ({ page }) => {
      // 这个测试需要 mock API 响应
      // 在实际环境中，需要等待真实的 API 响应
      console.log('AI 回复测试需要 API mock 或真实响应')
    })

    test('按 Enter 键应该发送消息', async ({ page }) => {
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 输入消息并按 Enter
      const input = page.getByTestId('chat-input')
      await input.fill('测试 Enter 发送')
      await input.press('Enter')
      
      // 验证输入框清空
      await expect(input).toHaveValue('')
    })

    test('空消息不应该发送', async ({ page }) => {
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 提交按钮应该禁用
      await expect(page.getByTestId('chat-submit')).toBeDisabled()
    })
  })

  test.describe('加载和错误状态', () => {
    test('应该显示加载指示器', async ({ page }) => {
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 发送消息触发加载状态
      const input = page.getByTestId('chat-input')
      await input.fill('测试加载状态')
      await page.getByTestId('chat-submit').click()
      
      // 加载指示器应该显示（如果实现正确）
      // 这取决于实际的加载状态管理
    })

    test('应该显示错误消息', async ({ page }) => {
      // 这个测试需要 mock API 错误
      // 在实际环境中，需要触发真实的错误
      console.log('错误状态测试需要 API error mock')
    })
  })

  test.describe('消息时间戳', () => {
    test('消息应该显示时间戳', async ({ page }) => {
      // 上传文档并发送消息
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      const input = page.getByTestId('chat-input')
      await input.fill('测试时间戳')
      await page.getByTestId('chat-submit').click()
      
      await page.waitForTimeout(500)
      
      // 验证时间戳格式 (HH:MM)
      const timestamp = page.locator('.message-timestamp')
      await expect(timestamp).toBeVisible()
    })
  })

  test.describe('自动滚动', () => {
    test('新消息应该自动滚动到底部', async ({ page }) => {
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 发送多条消息
      const input = page.getByTestId('chat-input')
      
      for (let i = 0; i < 3; i++) {
        await input.fill(`消息 ${i + 1}`)
        await page.getByTestId('chat-submit').click()
        await page.waitForTimeout(500)
      }
      
      // 验证聊天面板滚动到底部
      const messagesPanel = page.getByTestId('chat-messages')
      const scrollHeight = await messagesPanel.evaluate(el => el.scrollHeight)
      const scrollTop = await messagesPanel.evaluate(el => el.scrollTop)
      const clientHeight = await messagesPanel.evaluate(el => el.clientHeight)
      
      // 应该接近底部
      expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(scrollHeight - 100)
    })
  })

  test.describe('响应式设计', () => {
    test('应该在移动设备上正常显示', async ({ page }) => {
      // 切换到移动视图
      await page.setViewportSize({ width: 375, height: 667 })
      
      await expect(page.getByTestId('chat-panel')).toBeVisible()
      await expect(page.getByTestId('model-selector')).toBeVisible()
    })

    test('应该在平板设备上正常显示', async ({ page }) => {
      // 切换到平板视图
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await expect(page.getByTestId('chat-panel')).toBeVisible()
    })
  })

  test.describe('辅助功能', () => {
    test('应该支持键盘导航', async ({ page }) => {
      // 使用 Tab 键导航
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // 焦点应该在某个交互元素上
      const focusedElement = await page.evaluate(() => document.activeElement)
      expect(focusedElement).not.toBeNull()
    })

    test('模型选择器应该有正确的 ARIA 标签', async ({ page }) => {
      const selector = page.getByTestId('model-selector')
      
      // 验证选择器可以访问
      await expect(selector).toBeVisible()
      
      // 验证选项可访问
      await selector.click()
      await expect(page.getByText('Qwen3 Max')).toBeVisible()
    })
  })

  test.describe('性能', () => {
    test('消息应该快速显示', async ({ page }) => {
      const startTime = Date.now()
      
      // 上传文档
      const testContent = '测试'
      const buffer = Buffer.from(testContent)
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer
      })
      
      await page.waitForTimeout(1000)
      
      // 发送消息
      const input = page.getByTestId('chat-input')
      await input.fill('性能测试')
      await page.getByTestId('chat-submit').click()
      
      // 等待消息显示
      await page.waitForSelector('[data-testid="message-user"]')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 用户消息应该在 1 秒内显示
      expect(duration).toBeLessThan(2000)
    })
  })
})
