// LLM API 集成框架 - 支持多模型
import { extractTextFromDocx } from './docx-utils'

// 支持的模型配置
const MODEL_CONFIGS = {
  'qwen3-max': {
    provider: 'modelstudio',
    baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
    apiKey: process.env.QWEN_API_KEY
  },
  'claude-opus': {
    provider: 'anyrouter',
    baseUrl: 'https://anyrouter.top',
    apiKey: process.env.CLAUDE_API_KEY
  },
  'glm-5': {
    provider: 'modelstudio', 
    baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
    apiKey: process.env.GLM_API_KEY
  }
}

export async function analyzeDocument(docxFile, userPrompt, selectedModel = 'qwen3-max') {
  try {
    // 1. 提取 DOCX 文本内容
    const docxText = await extractTextFromDocx(docxFile)
    
    // 2. 构建分析提示
    const systemPrompt = `你是一个专业的文档编辑助手。请分析以下文档并提供改进建议。
    文档内容：
    ${docxText}
    
    用户请求：${userPrompt}
    
    请提供具体的修改建议，包括语法校对、风格润色、内容优化等。`
    
    // 3. 调用 LLM API
    const config = MODEL_CONFIGS[selectedModel]
    if (!config) {
      throw new Error(`Unsupported model: ${selectedModel}`)
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    const result = await response.json()
    return result.choices[0].message.content
    
  } catch (error) {
    console.error('LLM API error:', error)
    throw error
  }
}

// 文档修改应用函数
export async function applyDocumentChanges(originalDocx, aiSuggestions) {
  // TODO: 使用 SuperDoc 的 Headless 模式应用修改
  // 这将利用 SuperDoc 的原生 DOCX 处理能力
  console.log('Applying changes to document...')
  return originalDocx // 返回修改后的文档
}