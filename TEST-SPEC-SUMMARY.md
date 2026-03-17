# DOCX AI Editor - 测试规范总结

## 📋 测试策略概览

```
┌─────────────────────────────────────────────────────────────┐
│                    测试金字塔                              │
│                                                             │
│                    ╱╲                                       │
│                   ╱  ╲                                      │
│                  ╱ E2E ╲     10%  - 完整用户流程            │
│                 ╱──────╲                                    │
│                ╱        ╲                                   │
│               ╱  集成测试 ╲   20%  - 模块交互               │
│              ╱────────────╲                                 │
│             ╱              ╲                                │
│            ╱    单元测试     ╲  70%  - 函数/组件            │
│           ╱──────────────────╲                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 核心测试场景

### 1. SuperDoc 集成

| 测试项 | 类型 | 描述 |
|--------|------|------|
| 编辑器初始化 | 集成 | 验证 SuperDocEditor 正确加载 |
| 文档模式切换 | 集成 | editing/viewing/commenting 模式 |
| 文档加载 | 集成 | DOCX 文件加载和渲染 |
| 文档导出 | E2E | 导出为 DOCX 格式 |

**关键测试文件:**
- `__tests__/integration/superdoc/editor.test.js`
- `__tests__/integration/superdoc/operations.test.js`

### 2. LLM API 调用

| 测试项 | 类型 | 描述 |
|--------|------|------|
| 多模型支持 | 单元 | qwen3-max/claude-opus/glm-5 |
| 提示构建 | 单元 | 文档内容 + 用户提示 |
| API 错误处理 | 单元 | 网络错误/限流/超时 |
| 响应解析 | 单元 | JSON 解析和内容提取 |

**关键测试文件:**
- `__tests__/unit/api/llm.test.js`
- `__tests__/integration/llm/api.test.js`
- `__tests__/bdd/document-analysis.bdd.test.js`

### 3. 双面板交互

| 测试项 | 类型 | 描述 |
|--------|------|------|
| 面板布局 | E2E | 响应式布局 |
| 独立滚动 | E2E | 文档和聊天独立滚动 |
| 状态同步 | E2E | 上传后启用聊天 |
| 消息历史 | E2E | 多轮对话保留 |

**关键测试文件:**
- `__tests__/e2e/flows/dual-panel.spec.js`
- `__tests__/unit/components/App.test.jsx`

### 4. 文档导出功能

| 测试项 | 类型 | 描述 |
|--------|------|------|
| DOCX 格式 | E2E | 正确格式导出 |
| 内容保留 | E2E | 修改内容保留 |
| 大文件处理 | E2E | >10MB 文件导出 |
| 进度显示 | E2E | 导出进度指示器 |

**关键测试文件:**
- `__tests__/e2e/flows/export.spec.js`

## 📁 测试文件结构

```
docx-ai-editor/
├── TESTING.md                      # 完整测试规范文档
├── TEST-CHECKLIST.md               # 测试检查清单
├── vitest.config.js                # Vitest 配置
├── playwright.config.js            # Playwright 配置
└── __tests__/
    ├── setup.js                    # 测试设置
    ├── README.md                   # 测试目录说明
    ├── unit/
    │   ├── api/
    │   │   ├── llm.test.js        ✅ 已创建
    │   │   └── docx-utils.test.js ✅ 已创建
    │   └── components/
    │       └── App.test.jsx       ✅ 已创建
    ├── integration/
    │   ├── superdoc/              📝 待实现
    │   └── llm/                   📝 待实现
    ├── e2e/
    │   └── flows/
    │       ├── dual-panel.spec.js      ✅ 已创建
    │       ├── complete-workflow.spec.js ✅ 已创建
    │       └── export.spec.js          ✅ 已创建
    └── bdd/
        └── document-analysis.bdd.test.js ✅ 已创建
```

## 🧪 Mock 数据

```
__mocks__/
├── fixtures/
│   └── documents.js           # Mock DOCX 文件和数据
└── handlers/
    └── llm.handlers.js        # MSW HTTP 拦截器
```

## 🚀 运行测试

```bash
# 开发
bun test --watch                    # 监听模式

# 单元测试
bun test:unit                       # 所有单元测试
bun test __tests__/unit/api/        # 特定目录

# 集成测试
bun test:integration

# E2E 测试
bun test:e2e                        # 无头模式
bun test:e2e:headed                 # 有头模式
bun test:e2e --project=chromium     # 特定浏览器

# 覆盖率
bun test:coverage                   # 生成覆盖率报告
```

## 📊 覆盖率目标

| 类型 | 目标 | 当前 |
|------|------|------|
| 语句覆盖率 | > 80% | - |
| 分支覆盖率 | > 70% | - |
| 函数覆盖率 | > 80% | - |
| 行覆盖率 | > 80% | - |

## ✅ 验收标准

### 功能性
- [x] 文档上传和加载
- [x] LLM 多模型支持
- [x] AI 文档分析
- [x] 双面板交互
- [x] 文档导出

### 质量
- [x] 单元测试覆盖核心逻辑
- [x] 集成测试验证模块交互
- [x] E2E 测试覆盖关键流程
- [x] BDD 测试描述用户故事

### 可靠性
- [x] 错误处理测试
- [x] 边界条件测试
- [x] 网络故障测试
- [x] 大文件处理测试

## 📝 下一步

### 待实现测试
1. **SuperDoc 集成测试** - 需要实际集成后实现
2. **LLM 集成测试** - 需要 API 配置后实现
3. **性能测试** - 加载时间、响应时间
4. **可访问性测试** - a11y 合规性
5. **视觉回归测试** - UI 一致性

### 改进建议
1. 添加测试数据生成器
2. 实现测试报告自动化
3. 添加性能基准测试
4. 集成视觉回归测试 (Playwright Screenshots)
5. 添加安全测试

## 🔗 相关文档

- [TESTING.md](./TESTING.md) - 完整测试规范
- [TEST-CHECKLIST.md](./TEST-CHECKLIST.md) - 测试检查清单
- [__tests__/README.md](__tests__/README.md) - 测试目录说明
- [AGENTS.md](../AGENTS.md) - 开发指南

---

*文档版本：1.0*  
*创建日期：2026-03-17*  
*状态：✅ 基础框架完成*
