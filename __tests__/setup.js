import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { llmHandlers } from '../__mocks__/handlers/llm.handlers.js'

// 设置 MSW server
export const server = setupServer(...llmHandlers)

// 在所有测试之前启动 server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// 在每个测试之后重置 handlers
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// 在所有测试之后关闭 server
afterAll(() => server.close())

// Mock fetch
global.fetch = vi.fn()

// Mock console.error 避免测试输出污染
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
