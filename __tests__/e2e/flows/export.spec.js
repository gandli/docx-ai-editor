// 文档导出功能 E2E 测试
import { test, expect } from '@playwright/test'
import fs from 'fs'

test.describe('Document Export', () => {
  test('should export document in DOCX format', async ({ page }) => {
    // Given: 文档已加载
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', 'original.docx')
    
    // When: 点击导出
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export")').click()
    ])
    
    // Then: 验证文件
    expect(download.suggestedFilename()).toMatch(/\.docx$/i)
    
    // 验证文件内容
    const stream = await download.createReadStream()
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test('should show export button after upload', async ({ page }) => {
    // Given
    await page.goto('/')
    
    // When
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // Then
    await expect(page.locator('.export-button')).toBeVisible()
    await expect(page.locator('.export-button')).toBeEnabled()
  })

  test('should handle large document export', async ({ page }) => {
    // Given: 大文档
    await page.goto('/')
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

  test('should allow multiple exports', async ({ page }) => {
    // Given: 文档已加载
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', 'test.docx')
    
    // When: 多次导出
    const downloads = []
    for (let i = 0; i < 3; i++) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('.export-button').click()
      ])
      downloads.push(download)
    }
    
    // Then: 所有下载都成功
    expect(downloads).toHaveLength(3)
    for (const download of downloads) {
      expect(download.suggestedFilename()).toMatch(/\.docx$/i)
    }
  })

  test('should export with original filename', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', 'my-document.docx')
    
    // When
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.export-button').click()
    ])
    
    // Then
    expect(download.suggestedFilename()).toContain('my-document')
  })

  test('should handle export during loading', async ({ page }) => {
    // Given: 文档正在加载
    await page.goto('/')
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('input[type="file"]')
    const fileChooser = await fileChooserPromise
    
    // When: 在加载完成前尝试导出
    // TODO: 实现加载状态测试
    
    // Then: 应该等待或显示适当状态
  })
})
