// 测试设置文件
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import ResizeObserver from 'resize-observer-polyfill'

// 模拟全局变量
global.ResizeObserver = ResizeObserver
if (!global.window) {
  global.window = {}
}
if (!global.document) {
  global.document = {}
}

// 全局 mock
global.fetch = vi.fn()

// 清理 mocks
beforeEach(() => {
  vi.clearAllMocks()
})
