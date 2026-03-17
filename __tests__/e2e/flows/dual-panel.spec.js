// 双面板交互 E2E 测试
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
    
    // 发送多条消息
    for (let i = 0; i < 5; i++) {
      await page.locator('.chat-input input').fill(`消息 ${i}`)
      await page.locator('.chat-input button').click()
      await page.waitForTimeout(100)
    }
    
    // When: 滚动文档面板
    await page.locator('.document-panel').evaluate(el => el.scrollTop = 500)
    const docScroll = await page.locator('.document-panel').evaluate(el => el.scrollTop)
    
    // Then: 聊天面板不受影响
    const chatScroll = await page.locator('.chat-panel').evaluate(el => el.scrollTop)
    expect(docScroll).toBeGreaterThan(0)
    expect(chatScroll).toBe(0)
  })

  test('should show send button enabled state', async ({ page }) => {
    // Given: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // When: 输入消息
    await page.locator('.chat-input input').fill('测试消息')
    
    // Then: 发送按钮启用
    await expect(page.locator('.chat-input button')).toBeEnabled()
  })

  test('should show send button disabled when no document', async ({ page }) => {
    // Given: 无文档状态
    
    // Then: 发送按钮禁用
    await expect(page.locator('.chat-input button')).toBeDisabled()
  })
})
