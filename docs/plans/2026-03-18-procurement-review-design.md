# docx-ai-editor 重设计方案：采购档案规范性评查工作台

- 日期：2026-03-18
- 阶段：Superpowers Phase 1 / Design
- 适用范围：docx-ai-editor MVP 重设计
- 目标场景：采购档案规范性评查

## 1. 设计结论

### 1.1 产品定位
一个**面向采购档案规范性评查的 AI 审阅工作台**，基于**内置基础规则 + 用户补充规则**进行检查，并输出**可定位、可解释、可整改、可导出的评查结果**。

### 1.2 核心策略
- 产品方向：**采购档案规范性评查**
- 产品范式：**AI 审阅副驾**，不是聊天驱动编辑器
- 判定方式：**双引擎混合审阅台（方案 C）**
  - 规则引擎负责显式、稳定、可验证的判断
  - AI 审阅引擎负责语义理解、解释、建议生成
- 评查依据：**混合模式**
  - 系统内置基础规则库
  - 用户上传补充规则
- 自定义规则输入：**文档上传为主，兼容结构化输入**
- 结果呈现：**问题清单 + 文档定位 + 建议修订文本 + 报告导出**

### 1.3 产品原则
1. **先审阅，后修改**
2. **每条结论都要可解释**
3. **规则来源必须清晰**
4. **定位与整改优先于聊天**
5. **能规则化的就规则化，复杂语义交给 AI**

---

## 2. 目标用户与 MVP 场景

### 2.1 MVP 主场景
从最简单且最可验证的场景切入：

> **采购档案规范性评查**

### 2.2 真实业务延展方向（后续）
- 根据资料背景自动填充结构化招标文件
- 从甲方视角审阅合同

MVP 不直接覆盖这两个方向，但架构必须为后续扩展留出空间。

---

## 3. 信息架构

## 3.1 页面结构
第一版采用**审阅工作台**布局：

### 顶部操作栏
- 上传采购档案
- 上传补充规则
- 选择评查任务
- 开始评查 / 重新评查
- 导出审查报告
- 模型状态（云端 / 本地）

### 左侧文档区
- SuperDoc 文档查看与编辑
- 问题定位与高亮
- 人工修改与建议应用

### 右侧审阅区
- 评查摘要
- 风险统计
- 问题列表
- 问题详情
- 建议修订文本
- 快速处理动作

### 抽屉/辅助区
- 聊天副驾
- 规则集预览
- 报告预览
- 评查日志

## 3.2 用户主流程
1. 上传采购档案
2. 加载系统基础规则
3. 可选上传补充规则
4. 系统解析文档结构
5. 规则引擎 + AI 引擎并行评查
6. 生成统一 Findings 列表
7. 用户逐条查看、定位、处理建议
8. 导出审查报告

---

## 4. 核心对象模型

## 4.1 Document
表示被评查文档。

建议字段：
- `id`
- `name`
- `sourceType`
- `fileType`
- `content`
- `segments`
- `metadata`
- `version`
- `reviewStatus`

## 4.2 RuleSet
表示一组规则集合。

建议字段：
- `id`
- `name`
- `source`（system / user）
- `sourceFile`
- `status`（draft / parsed / active / failed）
- `rules`
- `summary`

## 4.3 Rule
表示单条规则。

建议字段：
- `id`
- `title`
- `description`
- `category`
- `scope`
- `checkType`
- `severityDefault`
- `condition`
- `suggestionTemplate`
- `evidenceHint`
- `source`

建议的 `checkType`：
- `required_presence`
- `structure_check`
- `field_consistency`
- `semantic_review`
- `risk_check`

## 4.4 Finding
表示系统发现的一条问题或建议。

建议字段：
- `id`
- `documentId`
- `ruleId`
- `title`
- `description`
- `severity`
- `category`
- `sourceType`（system_rule / user_rule / ai_inference / hybrid）
- `evidence`
- `location`
- `suggestion`
- `status`
- `confidence`

## 4.5 Suggestion
建议单独建模。

建议字段：
- `id`
- `findingId`
- `type`（rewrite / add / clarify / warning）
- `targetLocation`
- `proposedText`
- `reason`
- `applyMode`（manual / one_click）
- `applied`

## 4.6 ReviewReport
用于导出和归档。

建议字段：
- `id`
- `documentId`
- `summary`
- `stats`
- `findings`
- `generatedAt`
- `ruleSetsUsed`
- `exportFormat`

---

## 5. 双引擎工作流设计

## 5.1 总体流程
1. 文档预处理
2. 规则集准备
3. 任务分流
4. 规则引擎执行
5. AI 审阅引擎执行
6. 结果融合
7. Findings 展示与处理
8. 报告生成与导出

## 5.2 规则引擎职责
负责：
- 缺项检查
- 结构检查
- 显式字段检查
- 关键词与模式检查

特点：
- 稳定
- 可解释
- 可重复

## 5.3 AI 审阅引擎职责
负责：
- 语义评查
- 问题解释
- 修订建议生成
- 规则文档提炼
- 证据组织

## 5.4 三种判定模式
### Rule-only
适用于显式缺项、格式错误、结构问题。

### AI-only
适用于复杂语义审阅、规范性评估、建议文本生成。

### Rule-triggered AI
规则先发现可疑点，AI 再解释、补充证据并给出建议。MVP 推荐重点采用此模式。

## 5.5 融合层规则
融合层职责：
- 去重
- 归并
- 字段统一
- 冲突处理

冲突优先级建议：
1. 显式规则事实 > AI 推断
2. 用户规则 > 系统通用规则
3. 高风险等级优先展示
4. 冲突结果允许保留“待人工确认”标签

---

## 6. 页面交互设计

## 6.1 空状态
展示：
- 产品定位
- 上传采购档案
- 上传补充规则
- 评查结果说明
- 演示入口（可选）

## 6.2 评查准备态
文档上传后，右侧先显示：
- 文档识别结果
- 已加载规则
- 规则解析状态
- 开始评查按钮

## 6.3 审阅工作台
右侧分三层：
1. 评查摘要
2. 筛选与分组
3. 问题列表

## 6.4 问题详情
每条问题展示：
- 问题描述
- 规则依据
- 证据片段
- 风险说明
- 建议修订文本
- 处理动作

## 6.5 文档定位
点击问题后：
- 左侧文档跳转到对应段落
- 高亮相关内容
- 缺项问题定位到建议插入位置或相邻章节

## 6.6 建议应用
MVP 优先级：
1. 复制建议
2. 插入建议文本
3. 有确认弹窗的替换建议

## 6.7 聊天副驾定位
聊天不作为主流程，作为辅助能力存在，用于：
- 解释问题
- 重写建议文本
- 展开规则依据
- 辅助追问

---

## 7. 技术架构与模块拆分

## 7.1 重构原则
- UI 只消费领域状态和领域动作
- 规则引擎 / AI 引擎 / 融合层不进入 React 组件
- 聊天能力从主流程降级为辅助层

## 7.2 建议目录结构
```bash
src/
  app/
  domains/
    document/
    rules/
    review/
    report/
  integrations/
    superdoc/
    llm/
    ollama/
    storage/
  shared/
    components/
    hooks/
    utils/
    constants/
    types/
```

## 7.3 领域职责
### document
文档上传、解析、定位、修改应用。

### rules
系统规则加载、用户规则上传、规则解析、规则标准化。

### review
调度规则引擎与 AI 引擎，生成 Findings，管理评查会话。

### report
报告构建、预览、导出。

## 7.4 集成层职责
### integrations/llm
封装 OpenRouter 等云端模型调用。

### integrations/ollama
封装本地模型调用与状态检测。

### integrations/superdoc
封装 SuperDoc 实例、定位、导出、修改写回。

## 7.5 状态管理建议
采用：
- React Context + reducer 管任务级状态
- 域内 hooks 管局部行为
- service 层承载异步业务逻辑

建议核心状态块：
- `workspaceState`
- `documentState`
- `rulesState`
- `reviewState`
- `reportState`

## 7.6 评查核心服务
- `ReviewOrchestrator`
- `RuleEngine`
- `AIReviewer`
- `FindingMerger`
- `SuggestionApplier`
- `ReportBuilder`

## 7.7 LLM 统一接口
定义统一模型客户端接口，屏蔽 OpenRouter / Ollama 差异，上层评查逻辑不感知具体 provider。

---

## 8. MVP 范围

## 8.1 MVP 必做
- 上传 1 份采购档案（DOCX 为主）
- 加载系统规则
- 上传 1 份补充规则文档
- 文档解析并分段
- 规则引擎执行显式检查
- AI 引擎执行语义检查
- 生成统一 Findings 列表
- 文档定位
- 建议修订文本展示
- 报告导出

## 8.2 MVP 不做
- 多文档批量评查
- 多人协作
- 权限系统
- 历史版本 diff
- 复杂规则 DSL
- 规则图形化编排
- 批量自动应用全部建议
- 聊天驱动主工作流
- 复杂模型配置中心

## 8.3 优先级
### P0
- 文档上传
- 规则输入
- 评查执行
- Findings 列表
- 定位
- 建议
- 报告导出

### P1
- Findings 筛选/分组
- 应用建议到文档
- 用户规则解析预览
- 聊天副驾
- 风险统计摘要

### P2
- 多模型高级切换
- Ollama 深度 UI
- 批量整改
- 规则编辑器
- 模板化报告
- 多场景模式切换

---

## 9. 风险与控制

## 9.1 最高风险点
1. 文档定位不准
2. AI 输出不稳定
3. 用户规则解析质量不稳
4. SuperDoc 写回复杂
5. 当前项目历史结构包袱较重

## 9.2 控制策略
- location 设计先做保守粒度（段落/标题级）
- AI 输出必须 schema 化与校验
- 规则解析允许“解析后确认”
- 建议应用优先做复制 / 插入，复杂替换后置
- 先做架构骨架重整，再做新功能接入

---

## 10. 测试策略

## 10.1 必须先 TDD 的核心模块
- `RuleNormalizer`
- `RuleEngine`
- `FindingMerger`
- `AI 输出结构校验器`
- `location` 映射逻辑
- `ReportBuilder`
- `SuggestionApplier`

## 10.2 测试层次
### 单元测试
核心领域逻辑。

### 组件测试
FindingsPanel、FindingDetail、RuleDrawer、ReportPreview。

### 集成测试
上传 → 评查 → Findings → 定位 → 应用建议 → 导出报告。

### E2E
仅覆盖主闭环，不追求泛滥。

---

## 11. 实施阶段建议

### Phase 0：架构校正
建立 `domains/` / `integrations/` / `shared/` 骨架，重组现有代码。

### Phase 1：评查闭环打通
实现解析、规则引擎、AI 审阅、融合、Findings 列表、定位。

### Phase 2：整改与报告
实现建议展示、建议应用、报告构建与导出。

### Phase 3：规则与体验增强
实现筛选分组、规则确认、聊天副驾、状态完善。

---

## 12. MVP 验收标准

1. 能上传并显示一份采购档案
2. 能加载系统规则并支持上传一份补充规则
3. 能完成一次评查并生成结构化 Findings
4. 每条 Finding 至少包含：问题、风险等级、来源、依据/证据、定位、建议文本
5. 点击问题能定位到文档相关位置
6. 能导出一份可读的审查报告

---

## 13. 最终结论

本次重设计的目标不是做一个更花的 AI 编辑器，而是做一个真正可落地的：

> **采购档案规范性评查审阅工作台**

MVP 闭环应严格聚焦：
- 输入档案
- 输入规则
- 执行评查
- 输出 Findings
- 定位问题
- 提供建议
- 导出报告

后续招标文件填充、合同审阅、更多本地模型支持，都应建立在这条闭环稳定之后。