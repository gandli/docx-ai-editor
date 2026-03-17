# 🚀 DOCX AI Editor - Autoresearch 使用指南

## 📋 配置完成清单

✅ **配置文件已创建:**
- `AUTORESEARCH_CONFIG.md` - 完整技术配置
- `AUTORESEARCH_QUICKSTART.md` - 5 分钟快速启动
- `AUTORESEARCH_SUMMARY.md` - 配置总结

✅ **脚本已就绪:**
- `scripts/benchmark-api.js` - API 性能基准测试
- `scripts/code-quality-score.js` - 代码质量评分

✅ **测试配置:**
- `vitest.config.js` - Vitest 配置
- `src/test/setup.js` - 测试全局设置

---

## 🎯 三大优化目标

### 1️⃣ 测试覆盖率 > 90%

```bash
/loop 25 /autoresearch
Goal: 提高测试覆盖率到 90% 以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 测试覆盖率百分比 (更高更好)
Verify: bun run test:coverage --silent 2>&1 | grep "All files" | awk '{print $3}' | sed 's/%//'
Guard: bun test
Direction: higher
```

### 2️⃣ API 响应时间 < 100ms

```bash
/loop 20 /autoresearch
Goal: 优化 API 响应时间到 100ms 以下
Scope: src/api/**/*.js
Metric: P95 响应时间 (更低更好)
Verify: bun run benchmark 2>&1 | grep "p95" | awk '{print $2}'
Guard: bun test
Direction: lower
```

### 3️⃣ 代码质量评分 > 8/10

```bash
/loop 20 /autoresearch
Goal: 提高代码质量评分到 8 分以上
Scope: src/**/*.jsx, src/**/*.js
Metric: 代码质量评分 (更高更好)
Verify: bun run quality
Guard: bun test
Direction: higher
```

---

## 🔧 快速开始

### 步骤 1: 验证配置

```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor

# 运行测试
bun test

# 运行覆盖率报告
bun run test:coverage

# 运行基准测试
bun run benchmark

# 运行质量评分
bun run quality
```

### 步骤 2: 记录基线

```bash
# 创建基线记录
echo "# 基线指标 - $(date)" > baseline-metrics.md
echo "" >> baseline-metrics.md
echo "## 测试覆盖率" >> baseline-metrics.md
bun run test:coverage 2>&1 | tail -20 >> baseline-metrics.md
```

### 步骤 3: 启动 Autoresearch

**推荐方式 - 使用交互式配置:**

```bash
/autoresearch:plan
Goal: 提高测试覆盖率到 90% 以上
```

**快速方式 - 直接启动:**

复制上面的配置命令，粘贴到 Claude Code 中。

---

## 📊 监控进度

### 查看结果日志

```bash
# 查看所有迭代
cat autoresearch-results.tsv

# 查看最近 5 次
tail -5 autoresearch-results.tsv

# 统计成功/失败
echo "成功保持：$(grep -c 'keep' autoresearch-results.tsv)"
echo "被丢弃：$(grep -c 'discard' autoresearch-results.tsv)"
echo "崩溃：$(grep -c 'crash' autoresearch-results.tsv)"
```

### 进度报告模板

每 10 次迭代后运行：

```bash
echo "=== 进度报告 (iteration $(tail -1 autoresearch-results.tsv | cut -f1)) ==="
echo "基线：$(head -2 autoresearch-results.tsv | tail -1 | cut -f3)"
echo "当前：$(tail -1 autoresearch-results.tsv | cut -f3)"
echo "提升：$(echo "$(tail -1 autoresearch-results.tsv | cut -f3) - $(head -2 autoresearch-results.tsv | tail -1 | cut -f3)" | bc)"
```

---

## ⚙️ 自定义配置

### 修改 Scope

如果只想优化特定模块：

```bash
Scope: src/api/**/*.js           # 仅 API 模块
Scope: src/components/**/*.jsx   # 仅组件
Scope: src/hooks/**/*.js         # 仅 Hooks
```

### 修改 Guard

如果有额外的验证要求：

```bash
Guard: bun test && bun run lint        # 测试 + Lint
Guard: bun test && bun run build       # 测试 + 构建
Guard: bun test && bun run typecheck   # 测试 + 类型检查
```

### 修改迭代次数

```bash
/loop 10 /autoresearch   # 快速测试 (10 次)
/loop 50 /autoresearch   # 深度优化 (50 次)
/autoresearch            # 无限循环 (手动中断)
```

---

## 🛑 常见问题

### Q: 测试失败怎么办？

A: Autoresearch 会自动回滚导致测试失败的更改。如果连续失败：
1. 检查测试文件是否正确
2. 手动运行 `bun test` 查看错误
3. 修复基础问题后重新启动

### Q: 如何中途停止？

A: 按 `Ctrl+C` 安全中断。进度会自动保存到 `autoresearch-results.tsv`。

### Q: 如何恢复中断的进度？

A: 使用相同的配置重新启动，auturesearch 会读取 git 历史和结果日志继续。

### Q: 达到目标后怎么办？

A: 庆祝一下！然后切换到下一个优化目标，或手动审查优化结果。

---

## 📚 详细文档

- **完整配置**: 查看 `AUTORESEARCH_CONFIG.md`
- **快速启动**: 查看 `AUTORESEARCH_QUICKSTART.md`
- **配置总结**: 查看 `AUTORESEARCH_SUMMARY.md`
- **Autoresearch 原理**: `~/.agents/skills/autoresearch/SKILL.md`

---

## 💡 最佳实践

1. **小步快跑** - 每次优化一个目标，不要同时进行
2. **定期检查** - 每 10 次迭代检查一次进度
3. **合理中断** - 达到目标或发现异常时及时停止
4. **记录经验** - 在 `memory/` 目录记录学到的优化技巧

---

**最后更新:** 2026-03-17  
**维护者:** DOCX AI Editor Team
