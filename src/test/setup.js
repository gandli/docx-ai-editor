// 测试设置文件
import '@testing-library/jest-dom'

// 全局 mock
global.fetch = vi.fn()

// 清理 mocks
beforeEach(() => {
  vi.clearAllMocks()
})
