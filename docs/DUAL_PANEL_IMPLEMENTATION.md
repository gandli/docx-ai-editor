# 双面板协同功能实现文档

> 本文档详细描述了 DOCX AI Editor 双面板协同功能的实现细节。

## 📐 架构设计

### 组件结构

```
App
├── DualPanelLayout (双面板布局容器)
│   ├── LeftPanel (左侧面板)
│   │   └── SuperDocEditor (文档编辑器)
│   ├── ResizeHandle (调整手柄)
│   └── RightPanel (右侧面板)
│       └── ChatPanel (聊天面板)
└── usePanelState Hook (状态管理)
```

### 核心组件

#### 1. DualPanelLayout 组件

**位置**: `src/components/DualPanelLayout.jsx`

**功能**:
- 左右面板布局管理
- 面板宽度调整（拖动）
- 面板折叠/展开
- 响应式断点处理
- 移动端面板切换

**Props**:
```javascript
{
  leftPanel: React.Node,        // 左侧面板内容
  rightPanel: React.Node,       // 右侧面板内容
  leftMinWidth: number,         // 左侧最小宽度 (px)
  rightMinWidth: number,        // 右侧最小宽度 (px)
  initialLeftWidth: number,     // 初始左侧宽度 (%)
  onResize: Function,           // 宽度调整回调
  collapsedState: Object,       // 折叠状态 { left, right }
  onCollapseChange: Function    // 折叠变化回调
}
```

**状态管理**:
```javascript
const [leftWidth, setLeftWidth] = useState(initialLeftWidth)  // 左侧宽度%
const [isResizing, setIsResizing] = useState(false)           // 是否正在调整
const [containerWidth, setContainerWidth] = useState(0)       // 容器宽度
const [isLeftCollapsed, setIsLeftCollapsed] = useState(false) // 左侧折叠
const [isRightCollapsed, setIsRightCollapsed] = useState(false) // 右侧折叠
```

#### 2. ChatPanel 组件

**位置**: `src/components/ChatPanel.jsx`

**功能**:
- 消息列表显示
- 消息输入和发送
- 加载状态指示
- 错误处理和重试
- 自动滚动

**Props**:
```javascript
{
  messages: Array,      // 消息列表 [{ role, content, timestamp, isError }]
  onSendMessage: Function,  // 发送消息回调
  isLoading: boolean,   // 是否正在加载
  disabled: boolean     // 是否禁用
}
```

#### 3. usePanelState Hook

**位置**: `src/hooks/usePanelState.js`

**功能**:
- 面板状态持久化（localStorage）
- 跨标签页同步
- 状态重置
- 折叠控制

**配置**:
```javascript
{
  persistState: true,           // 是否持久化
  storageKey: 'docx-ai-panel-state-v1',  // localStorage 键
  initialLeftWidth: 65,         // 初始宽度%
  leftMinWidth: 300,            // 最小宽度 px
  rightMinWidth: 280            // 最小宽度 px
}
```

**返回值**:
```javascript
{
  leftWidth: number,            // 左侧宽度%
  rightWidth: number,           // 右侧宽度%
  collapsed: { left, right },   // 折叠状态
  isLeftCollapsed: boolean,
  isRightCollapsed: boolean,
  onResize: Function,           // 调整回调
  onCollapseChange: Function,   // 折叠回调
  resetPanelState: Function,    // 重置
  toggleCollapse: Function,     // 切换折叠
  expandAll: Function,          // 全部展开
  collapseAll: Function         // 全部折叠
}
```

## 🎨 样式设计

### CSS 架构

```
DualPanelLayout.css
├── 容器样式 (.dual-panel-container)
├── 面板样式 (.dual-panel, .left-panel, .right-panel)
├── 面板头部 (.panel-header)
├── 调整手柄 (.resize-handle)
├── 移动端切换器 (.mobile-panel-switcher)
└── 响应式断点

ChatPanel.css
├── 消息列表 (.chat-messages)
├── 消息样式 (.message, .message.user, .message.ai)
├── 输入区域 (.chat-input-area)
├── 加载指示器 (.loading-indicator)
└── 响应式适配

App.css
├── 全局布局 (.app, .app-header, .app-main)
├── 头部样式 (.app-title, .header-actions)
├── 文档占位符 (.document-placeholder)
└── 响应式设计
```

### 响应式断点

```css
/* 移动端 */
@media (max-width: 768px) {
  /* 垂直布局，面板切换器 */
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1024px) {
  /* 水平布局，限制最小宽度 */
}

/* 桌面 */
@media (min-width: 1024px) {
  /* 完整双面板，可调整 */
}
```

### 深色模式

```css
@media (prefers-color-scheme: dark) {
  /* 自动适配系统深色模式 */
}
```

## 🔄 状态同步机制

### localStorage 持久化

```javascript
// 保存状态
useEffect(() => {
  if (persistState) {
    localStorage.setItem(storageKey, JSON.stringify(panelState))
  }
}, [panelState])

// 加载状态
const [panelState, setPanelState] = useState(() => {
  const saved = localStorage.getItem(storageKey)
  return saved ? JSON.parse(saved) : defaultState
})
```

### 跨标签页同步

```javascript
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === storageKey && e.newValue) {
      const newState = JSON.parse(e.newValue)
      setPanelState(newState)
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [])
```

## 🎯 交互优化

### 1. 面板宽度调整

**实现逻辑**:
```javascript
// 鼠标按下
const handleMouseDown = () => {
  setIsResizing(true)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// 鼠标移动
const handleMouseMove = (e) => {
  if (!isResizing) return
  
  const rect = container.getBoundingClientRect()
  const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100
  
  // 检查最小宽度
  const leftPx = (newLeftWidth / 100) * rect.width
  const rightPx = ((100 - newLeftWidth) / 100) * rect.width
  
  if (leftPx >= leftMinWidth && rightPx >= rightMinWidth) {
    setLeftWidth(newLeftWidth)
  }
}

// 鼠标释放
const handleMouseUp = () => {
  setIsResizing(false)
  document.body.style.cursor = 'default'
  document.body.style.userSelect = 'auto'
}
```

**优化点**:
- 调整时禁用文本选择
- 最小宽度限制
- 平滑过渡动画
- 调整时光标变化

### 2. 折叠/展开动画

```css
.dual-panel {
  transition: width 0.3s ease, min-width 0.3s ease;
}

.dual-panel.no-transition {
  transition: none;
}

.dual-panel.collapsed .panel-content {
  opacity: 0;
  visibility: hidden;
}
```

### 3. 移动端适配

**自动折叠逻辑**:
```javascript
const isMobile = containerWidth < 768

useEffect(() => {
  if (isMobile && !isLeftCollapsed) {
    setIsRightCollapsed(true)
  }
}, [isMobile, isLeftCollapsed])
```

**面板切换器**:
```jsx
{isMobile && (
  <div className="mobile-panel-switcher">
    <button onClick={() => {
      setIsLeftCollapsed(false)
      setIsRightCollapsed(true)
    }}>文档</button>
    <button onClick={() => {
      setIsLeftCollapsed(true)
      setIsRightCollapsed(false)
    }}>AI</button>
  </div>
)}
```

### 4. 聊天面板优化

**自动滚动**:
```javascript
const messagesEndRef = useRef(null)

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}

useEffect(() => {
  scrollToBottom()
}, [messages])
```

**输入优化**:
```javascript
// Enter 发送，Shift+Enter 换行
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

// 自动聚焦
const inputRef = useRef(null)
inputRef.current?.focus()
```

## 📊 性能优化

### 1. useCallback 优化

```javascript
const handleSendMessage = useCallback(async (message) => {
  // ... 处理逻辑
}, [document, documentText])
```

### 2. 防抖处理

```javascript
// 调整大小时的状态更新
useEffect(() => {
  const updateContainerWidth = () => {
    const container = document.querySelector('.dual-panel-container')
    if (container) {
      setContainerWidth(container.offsetWidth)
    }
  }

  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  return () => window.removeEventListener('resize', updateContainerWidth)
}, [])
```

### 3. CSS 优化

```css
/* 使用 transform 而非 width 进行动画 */
.dual-panel {
  transition: width 0.3s ease;
}

/* 折叠时使用 transform */
.dual-panel.collapsed {
  transform: translateX(-100%);
}
```

## 🔐 无障碍支持

### 键盘导航

```jsx
<button 
  className="collapse-btn"
  onClick={() => handleCollapse('left')}
  title={isLeftCollapsed ? '展开' : '折叠'}
  tabIndex={0}
>
```

### 焦点管理

```css
.collapse-btn:focus,
.switch-btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
```

### ARIA 属性

```jsx
<div 
  className="resize-handle"
  role="separator"
  aria-label="拖动调整面板宽度"
  tabIndex={0}
>
```

## 🧪 测试策略

### 单元测试

测试组件渲染和基础交互：
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { DualPanelLayout } from './DualPanelLayout'

test('should render both panels', () => {
  render(<DualPanelLayout leftPanel={<div>Left</div>} rightPanel={<div>Right</div>} />)
  expect(screen.getByText('Left')).toBeInTheDocument()
  expect(screen.getByText('Right')).toBeInTheDocument()
})
```

### 集成测试

测试组件间交互：
```javascript
test('should adjust panel width on drag', async () => {
  const { container } = render(<DualPanelLayout {...props} />)
  const handle = container.querySelector('.resize-handle')
  
  fireEvent.mouseDown(handle)
  fireEvent.mouseMove(handle, { clientX: 500 })
  fireEvent.mouseUp(handle)
  
  // 验证宽度变化
})
```

### E2E 测试

完整用户流程测试：
```javascript
test('should complete dual panel workflow', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', 'test.docx')
  await expect(page.locator('.dual-panel-container')).toBeVisible()
  
  // 调整面板
  const handle = page.locator('.resize-handle')
  await handle.dragTo({ x: 500, y: 100 })
  
  // 折叠面板
  await page.locator('.collapse-btn').click()
  await expect(page.locator('.left-panel')).toHaveClass(/collapsed/)
})
```

## 📦 依赖管理

### 新增依赖

```json
{
  "dependencies": {
    "@superdoc-dev/react": "^1.0.0-rc.2",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 已有依赖

- Vite: 构建工具
- SuperDoc: 文档编辑器
- Playwright: E2E 测试

## 🚀 部署考虑

### 1. 构建优化

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'dual-panel': ['./src/components/DualPanelLayout'],
          'chat-panel': ['./src/components/ChatPanel']
        }
      }
    }
  }
}
```

### 2. 资源加载

- 组件懒加载
- CSS 代码分割
- 图片优化

### 3. 浏览器兼容

- Chrome/Edge: 完全支持
- Firefox: 完全支持
- Safari: 完全支持
- 移动端浏览器：响应式适配

## 🔧 未来改进

### 短期

- [ ] 添加面板布局预设（50/50, 60/40, 70/30）
- [ ] 实现面板位置记忆（不仅宽度，还有滚动位置）
- [ ] 添加键盘快捷键（Cmd+Shift+L 切换面板）

### 中期

- [ ] 支持多文档标签页
- [ ] 实现面板内容缓存
- [ ] 添加自定义主题支持

### 长期

- [ ] 支持三面板布局
- [ ] 实现协作编辑
- [ ] 添加 AI 建议面板

---

*实现文档版本：1.0*  
*最后更新：2026-03-17*
