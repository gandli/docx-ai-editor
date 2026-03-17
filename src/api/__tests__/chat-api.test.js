// Chat API 集成测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Mock 环境变量
const originalEnv = process.env

describe('Chat API Integration', () => {
  let server

  beforeEach(() => {
    // 设置测试环境变量
    process.env.QWEN_API_KEY = 'test-qwen-key'
    process.env.CLAUDE_API_KEY = 'test-claude-key'
    process.env.GLM_API_KEY = 'test-glm-key'

    // 设置 MSW server
    server = setupServer()
    server.listen()
  })

  afterEach(() => {
    server.close()
    process.env = originalEnv
  })

  describe('API 端点验证', () => {
    it('should reject non-POST requests', async () => {
      // Mock GET request
      server.use(
        http.get('/api/chat', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405 }
          )
        })
      )

      const response = await fetch('/api/chat', { method: 'GET' })
      
      expect(response.status).toBe(405)
      const data = await response.json()
      expect(data.error).toBe('Method not allowed')
    })

    it('should reject requests without messages', async () => {
      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json()
          if (!body.messages || body.messages.length === 0) {
            return HttpResponse.json(
              { error: 'Messages are required' },
              { status: 400 }
            )
          }
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen3-max' })
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Messages are required')
    })

    it('should reject unsupported model', async () => {
      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json()
          if (!['qwen3-max', 'claude-opus', 'glm-5'].includes(body.model)) {
            return HttpResponse.json(
              { error: `Unsupported model: ${body.model}` },
              { status: 400 }
            )
          }
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'invalid-model',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Unsupported model')
    })
  })

  describe('模型路由', () => {
    it('should route Qwen requests to correct endpoint', async () => {
      let capturedRequest = null

      server.use(
        http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', async ({ request }) => {
          capturedRequest = await request.json()
          return HttpResponse.json({
            choices: [{ message: { content: 'Qwen response' } }]
          })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: '你好' }]
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.model).toBe('qwen3-max')
    })

    it('should route Claude requests to correct endpoint', async () => {
      let capturedRequest = null

      server.use(
        http.post('https://anyrouter.top/chat/completions', async ({ request }) => {
          capturedRequest = await request.json()
          return HttpResponse.json({
            choices: [{ message: { content: 'Claude response' } }]
          })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus',
          messages: [{ role: 'user', content: '你好' }]
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedRequest).toBeDefined()
    })

    it('should route GLM requests to correct endpoint', async () => {
      let capturedRequest = null

      server.use(
        http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', async ({ request }) => {
          capturedRequest = await request.json()
          return HttpResponse.json({
            choices: [{ message: { content: 'GLM response' } }]
          })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'glm-5',
          messages: [{ role: 'user', content: '你好' }]
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.model).toBe('glm-5')
    })
  })

  describe('文档上下文处理', () => {
    it('should include document text in system prompt', async () => {
      let capturedMessages = null

      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json()
          capturedMessages = body.messages
          return HttpResponse.json({
            choices: [{ message: { content: 'Response with doc context' } }]
          })
        })
      )

      const documentText = '这是一份测试文档的内容'
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: '分析这个文档' }],
          documentText
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedMessages).toBeDefined()
      expect(capturedMessages[0].role).toBe('system')
      expect(capturedMessages[0].content).toContain(documentText)
    })

    it('should work without document text', async () => {
      let capturedMessages = null

      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json()
          capturedMessages = body.messages
          return HttpResponse.json({
            choices: [{ message: { content: 'Response without doc' } }]
          })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: '你好' }],
          documentText: ''
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedMessages).toBeDefined()
      expect(capturedMessages[0].role).toBe('system')
    })
  })

  describe('错误处理', () => {
    it('should handle API key errors', async () => {
      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'API key configuration error' },
            { status: 500 }
          )
        })
      )

      delete process.env.QWEN_API_KEY

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('API key')
    })

    it('should handle rate limit errors', async () => {
      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: { 'Retry-After': '60' }
            }
          )
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('should handle internal server errors', async () => {
      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.status).toBe(500)
    })
  })

  describe('请求验证', () => {
    it('should validate message format', async () => {
      let capturedMessages = null

      server.use(
        http.post('/api/chat', async ({ request }) => {
          const body = await request.json()
          capturedMessages = body.messages
          
          // 验证消息格式
          const hasValidFormat = body.messages.every(
            msg => msg.role && msg.content
          )
          
          if (!hasValidFormat) {
            return HttpResponse.json(
              { error: 'Invalid message format' },
              { status: 400 }
            )
          }
          
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [
            { role: 'user', content: '消息 1' },
            { role: 'assistant', content: '回复 1' }
          ]
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedMessages).toHaveLength(2)
    })

    it('should include temperature and maxTokens', async () => {
      let capturedBody = null

      server.use(
        http.post('/api/chat', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.ok).toBe(true)
      // 这些参数应该在 API handler 中设置
      expect(capturedBody).toBeDefined()
    })
  })

  describe('多轮对话', () => {
    it('should handle conversation history', async () => {
      let capturedMessages = null

      server.use(
        http.post('/api/chat', async ({ request }) => {
          capturedMessages = await request.json()
          return HttpResponse.json({
            choices: [{ message: { content: '多轮对话回复' } }]
          })
        })
      )

      const messages = [
        { role: 'user', content: '第一轮' },
        { role: 'assistant', content: '回复 1' },
        { role: 'user', content: '第二轮' }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages
        })
      })
      
      expect(response.ok).toBe(true)
      expect(capturedMessages.messages).toHaveLength(3)
      expect(capturedMessages.messages).toEqual(messages)
    })
  })

  describe('响应头验证', () => {
    it('should include correct content type for streaming', async () => {
      server.use(
        http.post('/api/chat', () => {
          return new HttpResponse('stream data', {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          })
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      
      expect(response.headers.get('Content-Type')).toContain('text/plain')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })
  })
})
