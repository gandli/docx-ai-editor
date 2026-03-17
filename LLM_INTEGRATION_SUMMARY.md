# LLM API 集成实现总结

## 完成的功能

### 1. OpenRouter API 集成 ✅
- 使用 OpenRouter 作为统一的 LLM API 网关
- 支持多模型切换（Qwen3 Max, Claude Opus, Gemini 2.5 Pro, Llama 3.3, DeepSeek）
- 正确的 API 请求头和参数配置

### 2. 流式响应 ✅
- 使用 Vercel AI SDK (`ai` 包) 实现流式响应
- 实时显示 AI 响应内容
- 支持文本块回调和完成回调

### 3. 错误处理和重试机制 ✅
- API 密钥验证
- 模型支持验证
- 网络错误重试（指数退避）
- 友好的错误提示

### 4. 模型配置 UI ✅
- `ModelSelector` 组件：允许用户在 UI 中选择模型
- 显示模型提供商和上下文窗口信息
- 实时切换模型

### 5. API 密钥管理 ✅
- 从环境变量读取 API 密钥
- `.env` 和 `.env.example` 配置文件
- API 状态指示器组件

### 6. 自定义 Hook ✅
- `useLLM` Hook 封装所有 LLM 操作
- 提供流式和非流式分析方法
- 状态管理（loading, error, response）

## 文件结构

```
src/
├── api/
│   ├── llm.js              # OpenRouter API 集成（非流式）
│   ├── llm-stream.js       # 流式 API 集成
│   └── __tests__/
│       ├── llm.test.js
│       └── llm-stream.test.js
├── components/
│   ├── ModelSelector.jsx   # 模型选择器组件
│   ├── ModelSelector.css
│   ├── APIStatus.jsx       # API 状态指示器
│   └── APIStatus.css
├── hooks/
│   ├── useLLM.js           # LLM 自定义 Hook
│   └── __tests__/
│       └── useLLM.test.js
└── App.jsx                 # 主应用（集成所有功能）
```

## 环境变量配置

创建 `.env` 文件：

```bash
# OpenRouter API 密钥（必需）
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# 可选配置
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_SITE_NAME=DOCX AI Editor
```

## 支持的模型

| 模型 ID | 名称 | 提供商 | 上下文窗口 |
|---------|------|--------|-----------|
| qwen/qwen3-max | Qwen3 Max | Alibaba | 256K |
| anthropic/claude-opus | Claude Opus | Anthropic | 200K |
| google/gemini-2.5-pro-exp-03-25 | Gemini 2.5 Pro | Google | 1M |
| meta-llama/llama-3.3-70b-instruct | Llama 3.3 70B | Meta | 128K |
| deepseek/deepseek-chat | DeepSeek Chat | DeepSeek | 128K |

## 使用示例

### 在组件中使用

```jsx
import { useLLM } from './hooks/useLLM'
import { ModelSelector } from './components/ModelSelector'

function MyComponent() {
  const { streamAnalyze, isLoading, error, currentResponse } = useLLM()
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-max')

  const handleAnalyze = async () => {
    try {
      await streamAnalyze(docxFile, '请分析这个文档', {
        model: selectedModel,
        onChunk: (textPart, fullText) => {
          console.log('收到文本块:', textPart)
        },
        onComplete: (result) => {
          console.log('分析完成:', result)
        }
      })
    } catch (err) {
      console.error('分析失败:', err)
    }
  }

  return (
    <>
      <ModelSelector 
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      <button onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? '分析中...' : '分析文档'}
      </button>
      {error && <div className="error">{error}</div>}
      {currentResponse && <div>{currentResponse}</div>}
    </>
  )
}
```

### API 直接使用

```jsx
import { analyzeDocument, callLLM, getSupportedModels } from './api/llm'

// 获取支持的模型
const models = getSupportedModels()

// 非流式调用
const response = await analyzeDocument(docxFile, '请总结这个文档', 'qwen/qwen3-max')

// 直接调用 LLM
const response = await callLLM({
  model: 'qwen/qwen3-max',
  messages: [
    { role: 'system', content: '你是一个助手' },
    { role: 'user', content: '你好' }
  ],
  temperature: 0.7,
  maxTokens: 1000
})
```

## 测试

运行测试：

```bash
# 运行所有测试
bun test

# 运行 LLM API 测试
bun test src/api/__tests__/llm.test.js
bun test src/api/__tests__/llm-stream.test.js

# 运行组件测试
bun test src/components/__tests__/ModelSelector.test.jsx
bun test src/components/__tests__/APIStatus.test.jsx

# 运行 Hook 测试
bun test src/hooks/__tests__/useLLM.test.js
```

## 注意事项

1. **API 密钥安全**: 不要将 `.env` 文件提交到版本控制
2. **模型选择**: 不同模型有不同的能力和价格，请根据需求选择
3. **流式响应**: 推荐使用流式响应以获得更好的用户体验
4. **错误处理**: 始终处理可能的 API 错误和网络错误
5. **速率限制**: OpenRouter 可能有速率限制，请监控使用情况

## 获取 API 密钥

1. 访问 [openrouter.ai/keys](https://openrouter.ai/keys)
2. 创建账户并生成 API 密钥
3. 将密钥添加到 `.env` 文件

## 下一步

- [ ] 添加模型使用统计
- [ ] 实现对话历史保存
- [ ] 添加更多模型选项
- [ ] 优化提示词模板
- [ ] 添加文档修改应用功能
