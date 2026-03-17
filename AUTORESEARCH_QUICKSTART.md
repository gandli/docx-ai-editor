# DOCX AI Editor - Autoresearch 快速启动指南

## 🚀 5 分钟快速配置

### 步骤 1: 安装依赖

```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor

# 安装所有依赖 (包括测试和基准测试工具)
bun install
```

### 步骤 2: 验证测试设置

```bash
# 运行测试确保配置正确
bun test

# 运行覆盖率报告
bun run test:coverage
```

### 步骤 3: 运行基准测试

```bash
# API 性能基准测试
bun run benchmark

# 代码质量评分
bun run quality
```

### 步骤 4: 记录基线指标

创建或更新 `baseline-metrics.md`:

```bash
# 获取当前指标
echo "# 基线指标 - $(date)" > baseline-metrics.md
echo "" >> baseline-metrics.md
echo "## 测试覆盖率" >> baseline-metrics.md
bun run test:coverage --silent 2>&1 | grep "All files" >> baseline-metrics.md
echo "" >> baseline-metrics.md
echo "## API P95 响应时间" >> baseline-metrics.md
bun run benchmark 2>&1 | grep "p95" >> baseline-metrics.md
echo "" >> baseline-metrics.md
echo "## 代码质量评分" >> baseline-metrics.md
bun run quality >> baseline-metrics.md
```

### 步骤 5: 启动 Autoresearch

使用以下命令之一：

#### 选项 A: 使用交互式配置 (推荐新手)

```bash
/autoresearch:plan
Goal: 提高测试覆盖率到 90% 以上
```

这会启动一个交互式向导，帮你配置所有参数。

#### 选项 B: 直接启动 (快速)

```bash
# 测试覆盖率优化 (25 次迭代)
/loop 25 /autoresearch
Goal: 提高测试覆盖率到 90% 以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: bun run test:coverage --silent 2>&1 | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: bun test
Direction: higher
```

```bash
# API 性能优化 (20 次迭代)
/loop 20 /autoresearch
Goal: 优化 API 响应时间到 100ms 以下
Scope: src/api/**/*.js
Metric: P95 响应时间 (更低更好)
Verify: bun run benchmark 2>&1 | grep "p95" | awk '{print $2}'
Guard: bun test
Direction: lower
```

```bash
# 代码质量优化 (20 次迭代)
/loop 20 /autoresearch
Goal: 提高代码质量评分到 8 分以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 代码质量评分 (更高更好)
Verify: bun run quality
Guard: bun test
Direction: higher
```

---

## 📊 目标指标

| 指标 | 基线 | 目标 | 当前状态 |
|------|------|------|----------|
| 测试覆盖率 | TBD | > 90% | ⏳ 待测量 |
| API P95 响应时间 | TBD | < 100ms | ⏳ 待测量 |
| 代码质量评分 | TBD | > 8.0/10 | ⏳ 待测量 |

---

## 🔧 故障排除

### 问题：测试运行失败

```bash
# 检查测试文件
ls -la src/__tests__/

# 检查 vitest 配置
cat vitest.config.js

# 手动运行单个测试
bun test src/__tests__/App.test.jsx
```

### 问题：覆盖率报告不显示

```bash
# 检查 coverage 配置
cat vitest.config.js | grep -A 10 coverage

# 清除缓存重试
rm -rf node_modules/.vite
bun run test:coverage
```

### 问题：Benchmark 脚本失败

```bash
# 检查脚本是否存在
ls -la scripts/benchmark-api.js

# 检查 Node.js 版本
node --version

# 手动运行脚本
bun scripts/benchmark-api.js
```

### 问题：Autoresearch 不工作

```bash
# 检查 SKILL.md 配置
cat ~/.agents/skills/autoresearch/SKILL.md

# 验证 Verify 命令
bun run test:coverage --silent 2>&1 | grep "All files"

# 检查 Git 状态
git status
```

---

## 📈 监控进度

### 查看结果日志

```bash
# 查看迭代历史
cat autoresearch-results.tsv

# 查看最近 10 次迭代
tail -n 10 autoresearch-results.tsv
```

### 生成进度报告

```bash
# 每 10 次迭代后运行
echo "=== 进度报告 ===" 
echo "基线覆盖率：$(head -2 autoresearch-results.tsv | tail -1 | cut -f3)%"
echo "当前覆盖率：$(tail -1 autoresearch-results.tsv | cut -f3)%"
echo "总迭代次数：$(tail -1 autoresearch-results.tsv | cut -f1)"
echo "成功保持：$(grep -c "keep" autoresearch-results.tsv)"
echo "被丢弃：$(grep -c "discard" autoresearch-results.tsv)"
```

---

## 🎯 最佳实践

### 1. 小步迭代
- 每次只做一个小改动
- 让 autoresearch 自动验证
- 失败的改动会自动回滚

### 2. 保护测试
- 不要修改测试文件
- Guard 命令必须始终通过
- 测试覆盖率是目标，不是手段

### 3. 定期检查
- 每 10 次迭代检查一次进度
- 如果卡住了，手动干预
- 记录学到的经验

### 4. 合理中断
- 达到目标后可以停止
- 发现不良趋势及时停止
- 使用 Ctrl+C 安全中断

---

## 📚 相关文档

- [完整配置](./AUTORESEARCH_CONFIG.md)
- [Autoresearch SKILL](~/.agents/skills/autoresearch/SKILL.md)
- [结果日志协议](~/.agents/skills/autoresearch/references/results-logging.md)

---

**最后更新:** 2026-03-17
