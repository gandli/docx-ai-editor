# 🚀 快速启动指南

## 立即开始

### 1. 安装依赖

```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor
bun install
```

### 2. 启动开发服务器

```bash
bun run dev
```

浏览器会自动打开 http://localhost:3000

### 3. 上传文档测试

1. 点击 "📁 上传文档" 按钮
2. 选择任意 .docx 文件
3. 查看双面板布局
4. 尝试以下操作：
   - 拖动中间手柄调整面板宽度
   - 点击折叠按钮隐藏/展开面板
   - 在聊天面板输入消息
   - 在移动端切换面板

## 📱 响应式测试

### 桌面端 (>1024px)
- 完整双面板布局
- 可拖动调整宽度
- 所有功能可用

### 平板端 (768-1024px)
- 双面板布局
- 限制最小宽度
- 可调整但范围受限

### 移动端 (<768px)
- 单面板显示
- 底部切换器切换面板
- 自动折叠右侧面板

## 🧪 运行测试

### 安装 Playwright 浏览器

```bash
bun playwright install
```

### 运行 E2E 测试

```bash
# 所有测试
bun playwright test __tests__/e2e

# 双面板测试
bun playwright test -g "dual panel"

# 聊天面板测试
bun playwright test -g "chat"

# 响应式测试
bun playwright test -g "responsive"

# 有头模式（查看浏览器）
bun playwright test --headed

# 生成 HTML 报告
bun playwright test --reporter=html
bun playwright show-report
```

## 📦 生产构建

```bash
bun run build
bun run preview
```

构建产物在 `dist/` 目录

## 🎯 核心功能演示

### 调整面板宽度
1. 将鼠标移到两个面板中间
2. 光标变为 ↔️
3. 拖动调整宽度
4. 松开鼠标保存状态

### 折叠面板
1. 点击面板头部的 ← 或 → 按钮
2. 面板折叠
3. 再次点击展开

### 发送消息
1. 在聊天面板输入框输入文字
2. 按 Enter 或点击发送按钮
3. 等待 AI 响应（当前为示例响应）

### 移动端使用
1. 上传文档后默认显示文档面板
2. 点击底部 "AI" 按钮切换到聊天面板
3. 点击 "文档" 按钮切换回文档面板

## 💡 提示和技巧

### 键盘快捷键
- `Enter`: 发送消息
- `Shift + Enter`: 换行
- `Tab`: 导航

### 状态持久化
- 面板宽度自动保存
- 折叠状态自动保存
- 刷新页面后恢复
- 跨标签页同步

### 性能优化
- 调整时禁用文本选择
- 平滑过渡动画
- 自动滚动到最新消息
- 输入框自动聚焦

## 🔧 故障排除

### 开发服务器无法启动
```bash
# 检查端口占用
lsof -i :3000

# 或使用不同端口
bun run dev --port 5173
```

### 构建失败
```bash
# 清理依赖
rm -rf node_modules bun.lock
bun install

# 重新构建
bun run build
```

### 测试失败
```bash
# 清理 Playwright 缓存
rm -rf playwright-report

# 重新运行测试
bun playwright test --reporter=list
```

## 📚 文档链接

- [实现文档](./docs/DUAL_PANEL_IMPLEMENTATION.md)
- [测试文档](__tests__/e2e/README.md)
- [功能总结](./IMPLEMENTATION_SUMMARY.md)
- [测试规范](./TESTING.md)

## 🎉 下一步

1. 集成真实 LLM API
2. 添加更多聊天功能
3. 实现文档导出
4. 添加协作编辑

---

*快速启动指南版本：1.0*  
*更新时间：2026-03-17*
