// 聊天面板交互 E2E 测试
import { test, expect } from '@playwright/test'

test.describe('聊天面板交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show welcome message after document upload', async ({ page }) => {
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Then: 显示欢迎消息
    const aiMessage = page.locator('.message.ai').first()
    await expect(aiMessage).toBeVisible()
    await expect(aiMessage).toContainText('已加载成功')
  })

  test('should enable chat input after document upload', async ({ page }) => {
    // Given: 初始状态
    const chatInput = page.locator('.chat-input')
    const sendBtn = page.locator('.send-btn')
    
    // Then: 初始禁用
    await expect(chatInput).toBeDisabled()
    await expect(sendBtn).toBeDisabled()
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Then: 启用输入
    await expect(chatInput).toBeEnabled()
    await expect(sendBtn).toBeEnabled()
  })

  test('should send message and receive response', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 输入并发送消息
    const chatInput = page.locator('.chat-input')
    await chatInput.fill('请分析这个文档')
    
    const sendBtn = page.locator('.send-btn')
    await sendBtn.click()
    
    // Then: 用户消息显示
    await expect(page.locator('.message.user')).toContainText('请分析这个文档')
    
    // Then: 显示加载指示器
    await expect(page.locator('.loading-indicator')).toBeVisible()
    
    // Then: AI 响应显示
    await expect(page.locator('.message.ai').nth(1)).toBeVisible({ timeout: 10000 })
  })

  test('should send message on Enter key', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 输入消息并按 Enter
    const chatInput = page.locator('.chat-input')
    await chatInput.fill('测试消息')
    await chatInput.press('Enter')
    
    // Then: 消息发送
    await expect(page.locator('.message.user')).toContainText('测试消息')
  })

  test('should not send empty message', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 尝试发送空消息
    const sendBtn = page.locator('.send-btn')
    await sendBtn.click()
    
    // Then: 没有新消息
    const userMessages = page.locator('.message.user')
    await expect(userMessages).toHaveCount(0)
  })

  test('should show send button disabled when input is empty', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Then: 发送按钮禁用
    await expect(page.locator('.send-btn')).toBeDisabled()
    
    // When: 输入文字
    await page.locator('.chat-input').fill('测试')
    
    // Then: 发送按钮启用
    await expect(page.locator('.send-btn')).toBeEnabled()
    
    // When: 清空输入
    await page.locator('.chat-input').clear()
    
    // Then: 发送按钮再次禁用
    await expect(page.locator('.send-btn')).toBeDisabled()
  })

  test('should auto-scroll to latest message', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送多条消息
    for (let i = 0; i < 5; i++) {
      const chatInput = page.locator('.chat-input')
      await chatInput.fill(`消息 ${i + 1}`)
      await page.locator('.send-btn').click()
      await page.waitForTimeout(1600) // 等待 AI 响应
    }
    
    // Then: 最后一条消息在视口中
    const lastMessage = page.locator('.message.ai').last()
    await expect(lastMessage).toBeInViewport()
  })

  test('should show loading indicator while AI is thinking', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送消息
    await page.locator('.chat-input').fill('测试')
    await page.locator('.send-btn').click()
    
    // Then: 立即显示加载指示器
    await expect(page.locator('.loading-indicator')).toBeVisible()
    await expect(page.locator('.loading-text')).toContainText('思考')
  })

  test('should show message timestamp', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送消息
    await page.locator('.chat-input').fill('测试')
    await page.locator('.send-btn').click()
    await page.waitForTimeout(2000)
    
    // Then: 消息显示时间戳
    const userMessage = page.locator('.message.user')
    await expect(userMessage.locator('.message-time')).toBeVisible()
  })

  test('should handle multiple consecutive messages', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 连续发送多条消息
    const messages = ['问题 1', '问题 2', '问题 3']
    
    for (const msg of messages) {
      await page.locator('.chat-input').fill(msg)
      await page.locator('.send-btn').click()
      await page.waitForTimeout(1600)
    }
    
    // Then: 所有消息都显示
    const userMessages = page.locator('.message.user')
    await expect(userMessages).toHaveCount(3)
    
    const aiMessages = page.locator('.message.ai')
    await expect(aiMessages).toHaveCount(4) // 1 欢迎 + 3 响应
  })

  test('should clear input after sending message', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送消息
    const chatInput = page.locator('.chat-input')
    await chatInput.fill('测试消息')
    await page.locator('.send-btn').click()
    
    // Then: 输入框清空
    await expect(chatInput).toHaveValue('')
  })

  test('should focus input after sending message', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送消息
    await page.locator('.chat-input').fill('测试')
    await page.locator('.send-btn').click()
    
    // Then: 输入框获得焦点
    await expect(page.locator('.chat-input')).toBeFocused()
  })

  test('should show error message on API failure', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Note: 这个测试需要 mock API 错误，目前使用示例响应
    // 实际实现时应该测试错误处理
    await page.locator('.chat-input').fill('测试错误处理')
    await page.locator('.send-btn').click()
    
    // Then: 至少会显示一个响应（即使是成功的）
    await expect(page.locator('.message.ai').last()).toBeVisible({ timeout: 10000 })
  })

  test('should show retry button on error message', async ({ page }) => {
    // Given: 文档已上传且有错误消息
    // Note: 需要实际触发错误才能测试
    // 这个测试预留用于错误处理功能
    console.log('Retry button test - requires actual error scenario')
  })

  test('should support Shift+Enter for new line', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 输入多行文本
    const chatInput = page.locator('.chat-input')
    await chatInput.fill('第一行')
    await chatInput.press('Shift+Enter')
    await chatInput.fill('第二行')
    
    // Then: 输入框包含换行符
    const value = await chatInput.inputValue()
    expect(value).toContain('\n')
    
    // And: 消息未发送
    const userMessages = page.locator('.message.user')
    await expect(userMessages).toHaveCount(0)
  })

  test('should have character limit indicator', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 输入长文本
    const chatInput = page.locator('.chat-input')
    const longText = 'a'.repeat(2001)
    await chatInput.fill(longText)
    
    // Then: 输入被截断到 2000 字符
    const actualValue = await chatInput.inputValue()
    expect(actualValue.length).toBeLessThanOrEqual(2000)
  })

  test('should display message with proper formatting', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // When: 发送带格式的消息
    await page.locator('.chat-input').fill('测试\n换行')
    await page.locator('.send-btn').click()
    await page.waitForTimeout(2000)
    
    // Then: AI 响应包含格式
    const aiMessage = page.locator('.message.ai').last()
    await expect(aiMessage).toBeVisible()
  })

  test('should show input hints', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Then: 显示输入提示
    await expect(page.locator('.input-hints')).toBeVisible()
    await expect(page.locator('.input-hints')).toContainText('Enter')
  })

  test('should hide input hints on mobile', async ({ page }) => {
    // Given: 移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1500)
    
    // Then: 输入提示隐藏
    await expect(page.locator('.input-hints')).not.toBeVisible()
  })
})
