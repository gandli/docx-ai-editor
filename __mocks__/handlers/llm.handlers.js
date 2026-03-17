// MSW handlers for LLM API mocking

import { http, HttpResponse } from 'msw'
import { mockAIResponse } from '../fixtures/documents.js'

export const llmHandlers = [
  // Qwen API (modelstudio)
  http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()
    
    // 验证基本请求格式
    if (!body.model || !body.messages) {
      return new HttpResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // 验证 API Key
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return HttpResponse.json({
      id: 'chatcmpl-test-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: mockAIResponse
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
      }
    })
  }),

  // Claude API (anyrouter)
  http.post('https://anyrouter.top/chat/completions', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      id: 'claude-test-' + Date.now(),
      choices: [{
        message: {
          content: '这是 Claude 模型的分析结果...'
        },
        finish_reason: 'stop'
      }],
      usage: {
        total_tokens: 250
      }
    })
  }),

  // GLM API
  http.post('https://coding.dashscope.aliyuncs.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()
    
    if (body.model === 'glm-5') {
      return HttpResponse.json({
        id: 'glm-test-' + Date.now(),
        choices: [{
          message: {
            content: '这是 GLM 模型的分析结果...'
          },
          finish_reason: 'stop'
        }]
      })
    }
  }),

  // 模拟 API 错误 - 500
  http.post('*/api/error-500', () => {
    return new HttpResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  // 模拟 API 限流 - 429
  http.post('*/api/rate-limit', () => {
    return new HttpResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    )
  }),

  // 模拟网络超时
  http.post('*/api/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 30000))
    return HttpResponse.json({ success: true })
  })
]
