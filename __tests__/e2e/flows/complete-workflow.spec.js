// 完整用户流程 E2E 测试
import { test, expect } from '@playwright/test'

test.describe('Complete User Workflow', () => {
  test('full workflow: upload → analyze → modify → export', async ({ page }) => {
    // Step 1: 上传文档
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    await expect(page.locator('.document-panel')).toBeVisible()
    
    // Step 2: 发送分析请求
    await page.locator('.chat-input input').fill('请分析文档结构')
    await page.locator('.chat-input button').click()
    
    // Step 3: 等待 AI 响应（TODO: 实际实现后启用）
    // await expect(page.locator('.message.ai').last())
    //   .toContainText(/分析 | 建议 | 优化/i, { timeout: 30000 })
    
    // Step 4: 验证用户消息已显示
    await expect(page.locator('.message.user')).toContainText('请分析文档结构')
    
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
      await expect(page.locator('.message.user')).toContainText(prompt)
    }
    
    // Then: 所有用户消息都在历史记录中
    const userMessages = page.locator('.message.user')
    await expect(userMessages).toHaveCount(3)
  })

  test('should handle empty message submission', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    
    // When: 尝试发送空消息
    await page.locator('.chat-input button').click()
    
    // Then: 没有新消息
    expect(await page.locator('.message').count()).toBe(0)
  })

  test('should handle whitespace only message', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    
    // When: 发送空白消息
    await page.locator('.chat-input input').fill('   ')
    await page.locator('.chat-input button').click()
    
    // Then: 没有新消息
    expect(await page.locator('.message').count()).toBe(0)
  })

  test('should preserve chat input on panel scroll', async ({ page }) => {
    // Given: 文档已上传，有输入内容
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    await page.locator('.chat-input input').fill('测试内容')
    
    // When: 滚动文档面板
    await page.locator('.document-panel').evaluate(el => el.scrollTop = 100)
    
    // Then: 输入内容保留
    await expect(page.locator('.chat-input input')).toHaveValue('测试内容')
  })

  test('should show loading state during API call', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    
    // When: 发送消息
    await page.locator('.chat-input input').fill('分析文档')
    await page.locator('.chat-input button').click()
    
    // Then: 显示加载状态（TODO: 实现后启用）
    // await expect(page.locator('.loading-indicator')).toBeVisible()
  })

  test('should handle rapid message sending', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'sample.docx')
    
    // When: 快速发送多条消息
    const messages = ['消息 1', '消息 2', '消息 3']
    for (const msg of messages) {
      await page.locator('.chat-input input').fill(msg)
      await page.locator('.chat-input button').click()
    }
    
    // Then: 所有消息都显示
    for (const msg of messages) {
      await expect(page.locator('.message.user')).toContainText(msg)
    }
  })
})
