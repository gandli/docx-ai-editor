# 测试目录结构

```
__tests__/
├── setup.js                    # 测试配置文件
├── README.md                   # 本文件
├── unit/                       # 单元测试
│   ├── api/
│   │   ├── llm.test.js        # LLM API 测试
│   │   └── docx-utils.test.js # DOCX 工具测试
│   └── components/
│       └── App.test.jsx       # App 组件测试
├── integration/                # 集成测试
│   ├── superdoc/              # SuperDoc 集成测试
│   └── llm/                   # LLM API 集成测试
├── e2e/                        # E2E 测试
│   └── flows/
│       ├── dual-panel.spec.js      # 双面板交互测试
│       ├── complete-workflow.spec.js # 完整流程测试
│       └── export.spec.js          # 导出功能测试
└── bdd/                        # BDD 风格测试
    └── document-analysis.bdd.test.js
```

## 运行测试

### 所有测试
```bash
bun test
```

### 单元测试
```bash
bun test:unit
```

### 集成测试
```bash
bun test:integration
```

### E2E 测试
```bash
bun test:e2e
```

### 带覆盖率
```bash
bun test:coverage
```

### 监听模式
```bash
bun test --watch
```

### E2E 有头模式
```bash
bun test:e2e:headed
```

## 测试规范

### 单元测试
- 测试单个函数/组件
- 使用 Mock 隔离外部依赖
- 快速执行 (< 100ms)
- 覆盖率目标：> 80%

### 集成测试
- 测试模块间交互
- 使用 MSW Mock HTTP 请求
- 验证数据流
- 覆盖率目标：> 60%

### E2E 测试
- 测试完整用户流程
- 使用真实浏览器
- 模拟用户行为
- 关键路径覆盖

### BDD 测试
- 使用 Given-When-Then 格式
- 描述用户故事
- 业务逻辑验证

## 编写测试

### 单元测试示例
```javascript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected value', () => {
    // Given
    const input = 'test'
    
    // When
    const result = myFunction(input)
    
    // Then
    expect(result).toBe('expected')
  })
})
```

### E2E 测试示例
```javascript
import { test, expect } from '@playwright/test'

test('should work', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('My App')
})
```

## 最佳实践

1. **测试命名**: 使用描述性名称，说明测试场景
2. **AAA 模式**: Arrange-Act-Assert 结构清晰
3. **独立测试**: 每个测试独立，不依赖其他测试
4. **Mock 外部依赖**: API、数据库等使用 Mock
5. **测试数据**: 使用 fixtures 提供测试数据
6. **清理**: 每个测试后清理状态

## 调试测试

### Vitest
```bash
# 运行特定测试
bun test -t "LLM API"

# 调试模式
bun test --inspect
```

### Playwright
```bash
# 有头模式
bun test:e2e:headed

# 特定浏览器
bun test:e2e --project=chromium

# 调试
bun test:e2e --debug
```

## 常见问题

### 测试失败
1. 检查 Mock 是否正确设置
2. 验证测试数据
3. 查看错误堆栈

### 测试慢
1. 减少不必要的等待
2. 并行运行测试
3. 优化 Mock

### 覆盖率低
1. 添加边界条件测试
2. 测试错误处理
3. 测试所有分支
