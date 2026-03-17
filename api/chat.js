// Vercel Edge Function - AI 聊天 API
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export const config = {
  runtime: 'edge'
}

// 模型配置
const MODEL_CONFIGS = {
  'qwen3-max': {
    createClient: () => createOpenAI({
      baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
      apiKey: process.env.QWEN_API_KEY
    }),
    modelId: 'qwen3-max'
  },
  'claude-opus': {
    createClient: () => createAnthropic({
      baseURL: 'https://anyrouter.top',
      apiKey: process.env.CLAUDE_API_KEY
    }),
    modelId: 'claude-opus-20240229'
  },
  'glm-5': {
    createClient: () => createOpenAI({
      baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
      apiKey: process.env.GLM_API_KEY
    }),
    modelId: 'glm-5'
  }
}

export default async function handler(req) {
  // 只处理 POST 请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { messages, model: selectedModel = 'qwen3-max', documentText } = await req.json()

    // 验证模型
    const config = MODEL_CONFIGS[selectedModel]
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unsupported model: ${selectedModel}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证消息
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建模型客户端
    const client = config.createClient()
    const model = client(config.modelId)

    // 构建系统提示
    const systemPrompt = documentText
      ? `你是一个专业的文档编辑助手。请分析用户提供的文档并提供改进建议。

文档内容：
${documentText}

你的职责包括：
1. 语法校对 - 指出并修正语法错误
2. 风格润色 - 优化表达方式，使文字更流畅
3. 内容优化 - 提供内容改进建议
4. 格式建议 - 如有必要，提供格式调整建议

请用中文回复，保持专业友好的语气。`
      : `你是一个专业的文档编辑助手。请用中文回复，保持专业友好的语气。`

    // 创建流式响应
    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 2000
    })

    // 返回流式响应
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('API error:', error)

    // 处理不同类型的错误
    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({ error: 'API key configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (error.message?.includes('rate limit')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
