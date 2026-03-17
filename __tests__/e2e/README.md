# 双面板协同功能 - E2E 测试文档

> 本文档描述了 DOCX AI Editor 双面板协同功能的完整 E2E 测试用例。

## 📋 测试文件清单

### 1. 双面板布局测试 (`dual-panel-layout.spec.js`)

测试双面板的核心布局功能：

| 测试用例 | 描述 | 验收标准 |
|---------|------|---------|
| `should display dual panel layout` | 上传文档后显示双面板 | 左右面板都可见 |
| `should adjust panel width` | 拖动调整手柄改变宽度 | 宽度变化符合预期 |
| `should collapse left panel` | 折叠左侧面板 | 左侧面板添加 collapsed 类 |
| `should collapse right panel` | 折叠右侧面板 | 右侧面板添加 collapsed 类 |
| `should expand collapsed panel` | 展开已折叠面板 | collapsed 类移除 |
| `should hide resize handle` | 面板折叠时隐藏调整手柄 | 手柄不可见 |
| `should maintain panel state` | 刷新后保持面板状态 | localStorage 持久化 |
| `should show mobile switcher` | 移动端显示面板切换器 | 切换器可见，手柄隐藏 |
| `should switch panels on mobile` | 移动端切换面板 | 面板显示/隐藏正确 |
| `should enforce minimum width` | 强制最小平宽限制 | 宽度不小于设定值 |
| `should have responsive tablet` | 平板响应式布局 | 布局正常，手柄可见 |
| `should prevent text selection` | 调整时防止文本选择 | user-select 正确设置 |
| `should change cursor on hover` | 悬停时光标变化 | cursor 为 col-resize |
| `should add resizing class` | 调整时添加 resizing 类 | 类名正确添加/移除 |

### 2. 聊天面板交互测试 (`chat-panel-interaction.spec.js`)

测试聊天面板的交互功能：

| 测试用例 | 描述 | 验收标准 |
|---------|------|---------|
| `should show welcome message` | 上传后显示欢迎消息 | AI 消息可见且包含欢迎文本 |
| `should enable chat input` | 上传后启用输入 | 输入框和发送按钮启用 |
| `should send message and receive` | 发送消息并接收响应 | 用户消息和 AI 响应都显示 |
| `should send on Enter key` | Enter 键发送消息 | 消息成功发送 |
| `should not send empty message` | 不发送空消息 | 无新消息产生 |
| `should disable on empty input` | 空输入时禁用发送 | 发送按钮禁用状态正确 |
| `should auto-scroll to latest` | 自动滚动到最新消息 | 最新消息在视口中 |
| `should show loading indicator` | 显示加载指示器 | 加载动画可见 |
| `should show message timestamp` | 显示消息时间戳 | 时间戳可见 |
| `should handle consecutive messages` | 处理连续消息 | 所有消息都显示 |
| `should clear input after send` | 发送后清空输入 | 输入框值为空 |
| `should focus input after send` | 发送后聚焦输入 | 输入框获得焦点 |
| `should show error message` | 显示错误消息 | 错误消息可见 |
| `should show retry button` | 显示重试按钮 | 错误消息有重试按钮 |
| `should support Shift+Enter` | 支持 Shift+Enter 换行 | 输入包含换行符 |
| `should have character limit` | 字符限制 | 输入不超过 2000 字符 |
| `should display formatting` | 显示消息格式 | 格式正确保留 |
| `should show input hints` | 显示输入提示 | 提示可见 |
| `should hide hints on mobile` | 移动端隐藏提示 | 提示不可见 |

### 3. 响应式设计和状态同步测试 (`responsive-design.spec.js`)

测试响应式布局和状态管理：

| 测试用例 | 描述 | 验收标准 |
|---------|------|---------|
| `should adapt for desktop` | 桌面布局适配 | 水平排列，手柄可见 |
| `should adapt for tablet` | 平板布局适配 | 布局正常 |
| `should adapt for mobile` | 移动布局适配 | 切换器可见，手柄隐藏 |
| `should auto-collapse on mobile` | 移动端自动折叠 | 右侧面板自动折叠 |
| `should persist state on reload` | 刷新保持状态 | 宽度状态保持 |
| `should persist collapse state` | 保持折叠状态 | 折叠状态保持 |
| `should sync across tabs` | 多标签页同步 | localStorage 同步 |
| `should handle window resize` | 处理窗口调整 | 布局不崩溃 |
| `should restore on reset` | 重置恢复默认 | 文档清空 |
| `should work on extreme resize` | 极端尺寸工作 | 布局正常 |
| `should work in narrow viewport` | 窄视口工作 | 切换器可用 |
| `should handle rapid resize` | 处理快速调整 | 布局稳定 |
| `should preserve messages` | 保持聊天消息 | 消息数量不变 |
| `should show correct titles` | 显示正确标题 | 面板标题正确 |
| `should have accessible buttons` | 可访问的按钮 | title 属性存在 |
| `should support keyboard nav` | 支持键盘导航 | Tab 键可导航 |

## 🚀 运行测试

### 前置条件

1. 安装依赖：
```bash
bun install
```

2. 安装 Playwright 浏览器：
```bash
bun playwright install
```

### 运行测试命令

```bash
# 运行所有 E2E 测试
bun playwright test __tests__/e2e

# 运行特定测试文件
bun playwright test __tests__/e2e/flows/dual-panel-layout.spec.js
bun playwright test __tests__/e2e/flows/chat-panel-interaction.spec.js
bun playwright test __tests__/e2e/flows/responsive-design.spec.js

# 运行特定测试用例
bun playwright test -g "should display dual panel"
bun playwright test -g "should send message"

# 有头模式（查看浏览器）
bun playwright test --headed

# 特定浏览器
bun playwright test --project=chromium
bun playwright test --project=firefox
bun playwright test --project=webkit

# 调试模式
bun playwright test --debug

# 生成报告
bun playwright test --reporter=html
bun playwright show-report
```

## 📊 测试覆盖率

目标覆盖率：
- 双面板布局组件：>90%
- 聊天面板组件：>90%
- 面板状态 Hook: >95%
- 响应式逻辑：>85%

## 🔧 Mock 数据

测试使用的 Mock 文件：

```javascript
// __mocks__/fixtures/documents.js
export const mockDocxFile = new File(['test content'], 'test.docx', {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
})

export const mockLongDocxFile = new File(['long content...'], 'long-doc.docx', {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
})
```

## ⚠️ 注意事项

1. **时序问题**: 部分测试使用 `waitForTimeout` 模拟延迟，实际运行时可能需要调整
2. **本地存储**: 测试会操作 localStorage，确保测试间清理状态
3. **视口调整**: 响应式测试会频繁调整视口，可能需要额外等待时间
4. **文件上传**: 使用 `setInputFiles` 模拟上传，需要确保文件路径正确

## 🐛 已知问题

1. 多标签页同步测试需要特殊处理（目前仅记录日志）
2. 错误消息测试需要实际 API 错误场景（目前使用示例响应）
3. 重试按钮测试需要完整的错误处理流程

## 📝 测试报告

运行测试后生成 HTML 报告：

```bash
bun playwright test --reporter=html
bun playwright show-report
```

报告包含：
- ✅ 通过的测试
- ❌ 失败的测试
- ⏭️ 跳过的测试
- 📸 失败截图
- 🎥 失败视频
- 📊 执行时间统计

## 🔍 调试技巧

1. **慢动作模式**:
```bash
bun playwright test --debug
```

2. **单独运行测试**:
```bash
bun playwright test --grep "test name"
```

3. **查看浏览器**:
```bash
bun playwright test --headed
```

4. **添加断点**:
```javascript
test('debug test', async ({ page }) => {
  await page.pause() // 暂停并打开调试工具
  // ... test code
})
```

## 📈 性能指标

关键性能指标：
- 面板调整响应时间：<100ms
- 折叠/展开动画：300ms
- 消息发送延迟：<2s（含 AI 响应）
- 移动端切换：<200ms

---

*测试文档版本：1.0*  
*最后更新：2026-03-17*
