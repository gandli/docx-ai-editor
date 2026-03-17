# DOCX AI Editor - Autoresearch 配置

## 🎯 项目目标

使用 autoresearch 循环自动化优化 DOCX AI Editor 项目，实现以下目标：

### 核心优化目标

1. **测试覆盖率 > 90%**
2. **API 响应时间 < 100ms**
3. **代码质量评分 > 8/10**

---

## 📋 Autoresearch 配置

### 配置 1: 测试覆盖率优化

```bash
/autoresearch
Goal: 提高测试覆盖率到 90% 以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: npm run test:coverage --silent | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: npm run test
Direction: higher
```

**验证命令说明:**
- 运行测试覆盖率报告
- 提取 "All files" 行的覆盖率百分比
- 输出纯数字 (如：87.5)

**基准测试命令:**
```bash
npm run test:coverage --silent
```

---

### 配置 2: API 响应时间优化

```bash
/autoresearch
Goal: 优化 API 响应时间到 100ms 以下
Scope: src/api/**/*.js
Metric: P95 响应时间毫秒数 (更低更好)
Verify: node scripts/benchmark-api.js | grep "p95" | awk '{print $2}'
Guard: npm run test
Direction: lower
```

**需要创建 benchmark 脚本:**
```javascript
// scripts/benchmark-api.js
import { measureLLMResponse } from '../src/api/llm.js'

async function benchmark() {
  const latencies = []
  
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    await measureLLMResponse('test prompt')
    const end = performance.now()
    latencies.push(end - start)
  }
  
  latencies.sort((a, b) => a - b)
  const p95 = latencies[Math.floor(latencies.length * 0.95)]
  
  console.log(`p95: ${p95.toFixed(2)}ms`)
  console.log(`avg: ${(latencies.reduce((a,b) => a+b, 0) / latencies.length).toFixed(2)}ms`)
}

benchmark()
```

---

### 配置 3: 代码质量优化

```bash
/autoresearch
Goal: 提高代码质量评分到 8 分以上
Scope: src/**/*.jsx, src/**/*.js
Metric: ESLint + 复杂度综合评分 (更高更好)
Verify: node scripts/code-quality-score.js
Guard: npm run test
Direction: higher
```

**需要创建质量评分脚本:**
```javascript
// scripts/code-quality-score.js
import { execSync } from 'child_process'

function calculateQualityScore() {
  let score = 10.0
  
  // 1. ESLint 错误扣分 (每个 -0.5)
  try {
    const lintResult = execSync('npx eslint src/ --format json', { encoding: 'utf8' })
    const issues = JSON.parse(lintResult)
    const errorCount = issues.reduce((sum, f) => sum + f.errorCount, 0)
    score -= errorCount * 0.5
  } catch (e) {
    // ESLint 有错误时也会抛出
    const match = e.stdout?.match(/(\d+)\s+errors/)
    if (match) {
      score -= parseInt(match[1]) * 0.5
    }
  }
  
  // 2. 代码复杂度扣分 (每个复杂函数 -0.3)
  try {
    const complexityResult = execSync('npx complexity-report src/ --max=10 --format json', { encoding: 'utf8' })
    const report = JSON.parse(complexityResult)
    const highComplexity = report.filter(f => f.complexity > 10).length
    score -= highComplexity * 0.3
  } catch (e) {
    // 忽略复杂度工具错误
  }
  
  // 3. 代码重复率扣分
  try {
    const duplicationResult = execSync('npx jscpd src/ --threshold 10 --format json', { encoding: 'utf8' })
    const duplicates = JSON.parse(duplicationResult)
    const dupCount = duplicates.length || 0
    score -= Math.min(dupCount * 0.2, 2.0)
  } catch (e) {
    // 忽略重复检测工具错误
  }
  
  // 4. 文件过大扣分 (超过 300 行的文件每个 -0.2)
  try {
    const largeFiles = execSync('find src -name "*.js" -o -name "*.jsx" | xargs wc -l | grep -v total | awk \'$1 > 300 {count++} END {print count || 0}\'', { encoding: 'utf8' })
    score -= parseInt(largeFiles.trim()) * 0.2
  } catch (e) {
    // 忽略统计错误
  }
  
  console.log(Math.max(0, score).toFixed(1))
}

calculateQualityScore()
```

---

## 🔄 自动改进循环协议

### 循环执行策略

使用 **bounded loop** 模式进行可控优化：

```bash
# 第一阶段：测试覆盖率 (25 次迭代)
/loop 25 /autoresearch
Goal: 提高测试覆盖率到 90% 以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: npm run test:coverage --silent | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: npm run test
Direction: higher

# 第二阶段：API 性能 (20 次迭代)
/loop 20 /autoresearch
Goal: 优化 API 响应时间到 100ms 以下
Scope: src/api/**/*.js
Metric: P95 响应时间毫秒数 (更低更好)
Verify: node scripts/benchmark-api.js | grep "p95" | awk '{print $2}'
Guard: npm run test
Direction: lower

# 第三阶段：代码质量 (20 次迭代)
/loop 20 /autoresearch
Goal: 提高代码质量评分到 8 分以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 代码质量评分 (更高更好)
Verify: node scripts/code-quality-score.js
Guard: npm run test
Direction: higher
```

### 循环决策规则

```
每次迭代:
  1. 读取当前状态 + git 历史 + 结果日志
  2. 选择一个焦点变更 (基于目标和过往结果)
  3. 执行单一原子修改
  4. Git commit 变更
  5. 运行 Verify 命令获取指标
  6. 运行 Guard 命令 (npm test)
  7. 决策:
     - 指标改进 + Guard 通过 → KEEP (保留 commit)
     - 指标改进 + Guard 失败 → 尝试修复 (最多 2 次), 仍失败则 DISCARD
     - 指标未改进 → DISCARD (git revert)
     - 崩溃 → 尝试修复 (最多 3 次), 仍失败则记录 CRASH
  8. 记录到结果日志
  9. 重复
```

---

## 📊 量化成功指标

### 主要指标 (Primary Metrics)

| 指标 | 目标值 | 测量方式 | 频率 |
|------|--------|----------|------|
| 测试覆盖率 | > 90% | `npm run test:coverage` | 每次迭代 |
| API P95 响应时间 | < 100ms | `node scripts/benchmark-api.js` | 每次迭代 |
| 代码质量评分 | > 8.0/10 | `node scripts/code-quality-score.js` | 每次迭代 |

### 次要指标 (Secondary Metrics)

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| 构建时间 | < 5s | `time npm run build` |
| Bundle 大小 | < 500KB | `npm run build` 输出 |
| Lighthouse 性能 | > 90 | `npx lighthouse` |
| TypeScript 错误 | 0 | `npx tsc --noEmit` |

### 复合指标 (Composite Metric)

用于整体进度追踪：

```
overall_score = 
  (test_coverage / 90) * 40 + 
  (100 / api_p95_ms) * 30 + 
  (code_quality / 8) * 30

满分 100 分，80 分以上为合格
```

---

## 📁 结果日志格式

创建 `docx-ai-editor/autoresearch-results.tsv`:

```tsv
# metric_direction: higher_is_better (coverage), lower_is_better (api_time), higher_is_better (quality)
iteration	commit	metric	delta	guard	status	description	goal_type
```

### 示例记录

```tsv
iteration	commit	metric	delta	guard	status	description	goal_type
0	a1b2c3d	72.5	0.0	pass	baseline	初始状态 — 测试覆盖率 72.5%	coverage
1	b2c3d4e	75.8	+3.3	pass	keep	添加 API 模块单元测试	coverage
2	c3d4e5f	78.2	+2.4	pass	keep	添加组件渲染测试	coverage
3	-	76.1	-2.1	fail	discard	重构测试工具 (破坏了 3 个测试)	coverage
4	d4e5f6g	81.5	+3.3	pass	keep	添加集成测试覆盖 LLM 调用	coverage
```

---

## 🛠️ 必需脚本

### 1. 测试覆盖率脚本 (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage --reporter=verbose",
    "test:watch": "vitest",
    "build": "vite build",
    "lint": "eslint src/",
    "benchmark": "node scripts/benchmark-api.js",
    "quality": "node scripts/code-quality-score.js"
  }
}
```

### 2. 依赖安装

```bash
# 测试框架
bun add -d vitest @vitest/coverage-v8

# 代码质量工具
bun add -d eslint eslint-plugin-react complexity-report jscpd

# Benchmark 工具
bun add -d autocannon
```

---

## 🚀 快速启动

### 第一步：设置项目

```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor

# 安装测试依赖
bun add -d vitest @vitest/coverage-v8

# 创建测试目录
mkdir -p src/__tests__

# 创建脚本目录
mkdir -p scripts
```

### 第二步：创建基础测试

```javascript
// src/__tests__/App.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the header', () => {
    render(<App />)
    expect(screen.getByText('DOCX AI Editor')).toBeInTheDocument()
  })
})
```

### 第三步：运行基线测试

```bash
# 获取基线指标
npm run test:coverage
node scripts/benchmark-api.js
node scripts/code-quality-score.js

# 记录为 iteration 0
```

### 第四步：启动 autoresearch

```bash
# 使用 /autoresearch:plan 交互式配置
/autoresearch:plan
Goal: 提高测试覆盖率到 90% 以上

# 或直接启动
/loop 25 /autoresearch
Goal: 提高测试覆盖率到 90% 以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: npm run test:coverage --silent | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: npm run test
Direction: higher
```

---

## 📈 进度追踪

### 每 10 次迭代输出摘要

```
=== DOCX AI Editor 优化进度 (iteration 10) ===

【测试覆盖率】
基线：72.5% → 当前：84.3% (+11.8%)
保持：6 | 丢弃：3 | 崩溃：1
最近 5 次：keep, keep, discard, keep, keep

【API 响应时间】
基线：245ms → 当前：132ms (-113ms)
保持：4 | 丢弃：5 | 崩溃：1

【代码质量】
基线：6.2/10 → 当前：7.8/10 (+1.6)
保持：5 | 丢弃：4 | 崩溃：1

【综合得分】
(84.3/90)*40 + (100/132)*30 + (7.8/8)*30 = 37.5 + 22.7 + 29.3 = 89.5/100 ✅
```

---

## ⚠️ 注意事项

### 安全边界

1. **不修改测试文件** - 测试文件作为 Guard，不应被 autoresearch 修改
2. **不修改配置文件** - package.json, vite.config.js 等保持手动控制
3. **Scope 限制** - 仅允许修改 `src/**/*.jsx` 和 `src/**/*.js`
4. **Guard 必须通过** - 任何破坏现有测试的变更都会被拒绝

### 回滚策略

```bash
# 如果 autoresearch 产生不良结果
git log --oneline -20  # 查看最近的 commits
git revert <commit-hash>  # 回滚特定 commit
git reset --hard <good-commit>  # 回滚到安全点
```

### 中断与恢复

```bash
# 手动中断
# (在 Claude Code 中按 Ctrl+C)

# 恢复进度
# 读取 autoresearch-results.tsv 了解最后一次成功迭代
# 从该状态继续

/autoresearch
Goal: 继续优化测试覆盖率
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: npm run test:coverage --silent | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: npm run test
Direction: higher
```

---

## 📚 参考资料

- [Autoresearch SKILL.md](~/.agents/skills/autoresearch/SKILL.md)
- [Plan Workflow](~/.agents/skills/autoresearch/references/plan-workflow.md)
- [Autonomous Loop Protocol](~/.agents/skills/autoresearch/references/autonomous-loop-protocol.md)
- [Results Logging](~/.agents/skills/autoresearch/references/results-logging.md)

---

**最后更新:** 2026-03-17
**配置版本:** 1.0.0
