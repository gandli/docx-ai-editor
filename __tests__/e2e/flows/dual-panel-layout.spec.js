// 双面板布局 E2E 测试
import { test, expect } from '@playwright/test'

test.describe('双面板布局管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display dual panel layout after document upload', async ({ page }) => {
    // Given: 首页已加载
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000) // 等待处理完成
    
    // Then: 双面板可见
    await expect(page.locator('.dual-panel-container')).toBeVisible()
    await expect(page.locator('.left-panel')).toBeVisible()
    await expect(page.locator('.right-panel')).toBeVisible()
  })

  test('should adjust panel width by dragging resize handle', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 获取初始宽度
    const leftPanel = page.locator('.left-panel')
    const initialWidth = await leftPanel.evaluate(el => el.offsetWidth)
    
    // When: 拖动调整手柄
    const resizeHandle = page.locator('.resize-handle')
    const handleBox = await resizeHandle.boundingBox()
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(handleBox.x - 100, handleBox.y + handleBox.height / 2)
    await page.mouse.up()
    
    // Then: 左侧面板宽度改变
    const newWidth = await leftPanel.evaluate(el => el.offsetWidth)
    expect(newWidth).toBeLessThan(initialWidth)
  })

  test('should collapse left panel', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 点击左侧折叠按钮
    const collapseBtn = page.locator('.left-panel .collapse-btn')
    await collapseBtn.click()
    
    // Then: 左侧面板折叠
    const leftPanel = page.locator('.left-panel')
    await expect(leftPanel).toHaveClass(/collapsed/)
    
    // Then: 右侧面板展开
    const rightPanel = page.locator('.right-panel')
    await expect(rightPanel).not.toHaveClass(/collapsed/)
  })

  test('should collapse right panel', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 点击右侧折叠按钮
    const collapseBtn = page.locator('.right-panel .collapse-btn')
    await collapseBtn.click()
    
    // Then: 右侧面板折叠
    const rightPanel = page.locator('.right-panel')
    await expect(rightPanel).toHaveClass(/collapsed/)
    
    // Then: 左侧面板展开
    const leftPanel = page.locator('.left-panel')
    await expect(leftPanel).not.toHaveClass(/collapsed/)
  })

  test('should expand collapsed panel', async ({ page }) => {
    // Given: 文档已上传且左侧面板已折叠
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    const leftCollapseBtn = page.locator('.left-panel .collapse-btn')
    await leftCollapseBtn.click()
    await expect(page.locator('.left-panel')).toHaveClass(/collapsed/)
    
    // When: 再次点击折叠按钮展开
    await leftCollapseBtn.click()
    
    // Then: 左侧面板展开
    await expect(page.locator('.left-panel')).not.toHaveClass(/collapsed/)
  })

  test('should hide resize handle when panel is collapsed', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 折叠左侧面板
    await page.locator('.left-panel .collapse-btn').click()
    
    // Then: 调整手柄隐藏
    await expect(page.locator('.resize-handle')).not.toBeVisible()
  })

  test('should maintain panel state on page reload', async ({ page }) => {
    // Given: 文档已上传且面板已调整
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 折叠右侧面板
    await page.locator('.right-panel .collapse-btn').click()
    await page.waitForTimeout(500)
    
    // When: 刷新页面
    await page.reload()
    await page.waitForTimeout(1000)
    
    // Then: 面板状态保持
    await expect(page.locator('.right-panel')).toHaveClass(/collapsed/)
  })

  test('should show mobile panel switcher on small screens', async ({ page }) => {
    // Given: 移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // Then: 移动端切换器可见
    await expect(page.locator('.mobile-panel-switcher')).toBeVisible()
    
    // Then: 调整手柄隐藏
    await expect(page.locator('.resize-handle')).not.toBeVisible()
  })

  test('should switch panels on mobile', async ({ page }) => {
    // Given: 移动端视口且文档已上传
    await page.setViewportSize({ width: 375, height: 667 })
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // Given: 初始显示文档面板
    await expect(page.locator('.left-panel')).not.toHaveClass(/collapsed/)
    await expect(page.locator('.right-panel')).toHaveClass(/collapsed/)
    
    // When: 切换到 AI 面板
    const aiBtn = page.locator('.mobile-panel-switcher button:has-text("AI")')
    await aiBtn.click()
    
    // Then: AI 面板显示，文档面板隐藏
    await expect(page.locator('.left-panel')).toHaveClass(/collapsed/)
    await expect(page.locator('.right-panel')).not.toHaveClass(/collapsed/)
  })

  test('should enforce minimum panel width', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 尝试将左侧面板拖到非常小
    const resizeHandle = page.locator('.resize-handle')
    const handleBox = await resizeHandle.boundingBox()
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(100, handleBox.y + handleBox.height / 2) // 拖到接近左边缘
    await page.mouse.up()
    
    // Then: 左侧面板保持最小宽度
    const leftPanel = page.locator('.left-panel')
    const width = await leftPanel.evaluate(el => el.offsetWidth)
    expect(width).toBeGreaterThanOrEqual(300) // 最小宽度
  })

  test('should have responsive layout on tablet', async ({ page }) => {
    // Given: 平板视口
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // When: 上传文档
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // Then: 双面板可见
    await expect(page.locator('.dual-panel-container')).toBeVisible()
    
    // Then: 调整手柄可见（但可能更窄）
    await expect(page.locator('.resize-handle')).toBeVisible()
    
    // Then: 移动端切换器隐藏
    await expect(page.locator('.mobile-panel-switcher')).not.toBeVisible()
  })

  test('should prevent text selection while resizing', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 开始拖动调整手柄
    const resizeHandle = page.locator('.resize-handle')
    await resizeHandle.hover()
    await page.mouse.down()
    
    // Then: body 应该有 user-select: none
    const userSelect = await page.evaluate(() => 
      window.getComputedStyle(document.body).userSelect
    )
    expect(userSelect).toBe('none')
    
    // When: 释放鼠标
    await page.mouse.up()
    
    // Then: 恢复正常
    const userSelectAfter = await page.evaluate(() => 
      window.getComputedStyle(document.body).userSelect
    )
    expect(userSelectAfter).toBe('text')
  })

  test('should change cursor on resize handle hover', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 悬停在调整手柄上
    const resizeHandle = page.locator('.resize-handle')
    await resizeHandle.hover()
    
    // Then: 光标变为 col-resize
    const cursor = await resizeHandle.evaluate(el => 
      window.getComputedStyle(el).cursor
    )
    expect(cursor).toMatch(/col-resize|ew-resize/)
  })

  test('should add resizing class to container during resize', async ({ page }) => {
    // Given: 文档已上传
    await page.setInputFiles('input[type="file"]', 'test.docx')
    await page.waitForTimeout(1000)
    
    // When: 开始拖动
    const resizeHandle = page.locator('.resize-handle')
    await resizeHandle.hover()
    await page.mouse.down()
    
    // Then: 容器有 resizing 类
    const container = page.locator('.dual-panel-container')
    await expect(container).toHaveClass(/resizing/)
    
    // When: 释放鼠标
    await page.mouse.up()
    
    // Then: resizing 类移除
    await expect(container).not.toHaveClass(/resizing/)
  })
})
