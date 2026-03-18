# DOCX AI Editor

A modern document editing tool that combines SuperDoc's native DOCX capabilities with LLM-powered analysis and optimization.

## Features
- 🦋 Native DOCX editing with SuperDoc
- 🤖 AI-powered document analysis and suggestions
- 💬 Chat-based interaction for document optimization
- 📤 Export and save optimized documents
- ☁️ Deployed on Vercel with serverless functions
- 📋 Procurement document review workflow with automated compliance checking

## Tech Stack
- React + SuperDoc (Frontend)
- Node.js + Vercel Serverless (Backend)  
- Multi-model LLM support (Qwen, Claude, GLM)
- GitHub + Vercel CI/CD

## Getting Started
```bash
npm install
npm run dev
```

## Example Procurement Documents

This project includes a comprehensive set of test procurement documents to demonstrate the AI-powered review workflow. These documents cover various real-world scenarios with different complexity levels and compliance requirements.

### Document Inventory

#### Basic Documents

| Document | Description | Expected Findings |
|----------|-------------|-------------------|
| `valid-procurement.docx` | 标准政府采购招标文件，包含完整信息 | 0 个问题 |
| `missing-budget.docx` | 缺少预算信息 | 1 个高风险问题 |
| `invalid-contact.docx` | 联系人信息格式错误 | 2 个中风险问题 |
| `incomplete-timeline.docx` | 项目时间表不完整 | 1 个高风险问题 |

#### Advanced Documents

| Document | Description | Expected Findings | Tags |
|----------|-------------|-------------------|------|
| `emergency-procurement.docx` | 紧急采购项目（防汛物资），24小时快速响应 | 2 个高风险问题 | emergency, compliance, risk |
| `multi-vendor-bid.docx` | 多供应商联合投标（智慧城市项目，分3个标段） | 1 个中风险问题 | multi-vendor, consortium, coordination |
| `international-supplier.docx` | 国际供应商采购（医疗设备进口），USD结算 | 3 个高风险问题 | international, currency, compliance |
| `high-value-contract.docx` | 高价值合同（轨道交通信号系统，2.8亿元） | 2 个高风险问题 | high-value, budget, approval |

### Document Details

#### 1. Emergency Procurement (`emergency-procurement.docx`)
**场景**: 台风预警下的防汛物资紧急采购
- **预算**: 200万元
- **特殊要求**: 24小时投标截止，5日内交付
- **预期发现**:
  - 紧急事由认定依据不足
  - 程序简化理由不充分
  - 信息公开不充分

#### 2. Multi-Vendor Bid (`multi-vendor-bid.docx`)
**场景**: 智慧城市建设项目，允许多家联合投标
- **预算**: 5,000万元（分3个标段）
- **特殊要求**: 联合体投标、统一接口标准
- **预期发现**:
  - 联合体协议要求不够详细
  - 标段间协调机制不明确

#### 3. International Supplier (`international-supplier.docx`)
**场景**: 高端医疗设备进口采购
- **预算**: USD 300万元
- **特殊要求**: 外汇支付、国际物流、双语合同
- **预期发现**:
  - 外汇支付审批流程不明确
  - 进口产品必要性论证缺失
  - 汇率风险承担方不明确

#### 4. High-Value Contract (`high-value-contract.docx`)
**场景**: 城市轨道交通信号系统采购
- **预算**: 28,000万元
- **特殊要求**: 多级审批、资金多元化、技术复杂
- **预期发现**:
  - 资金到位证明文件缺失
  - 超限额标准审批程序需确认

## Demo Scenarios

### Running End-to-End Demos

#### 1. 预算分析演示
```bash
# 运行预算分析测试
npm test -- --grep "budget-analysis"

# 或使用特定文档
node scripts/demo-budget-analysis.js tests/fixtures/procurement-docs/high-value-contract.docx
```

**预期输出**:
- 识别资金来源风险
- 检测超限额采购问题
- 分析汇率风险（国际采购）
- 生成预算合规检查报告

#### 2. 合规性检查演示
```bash
# 运行合规性检查测试
npm test -- --grep "compliance-check"

# 或使用特定文档
node scripts/demo-compliance-check.js tests/fixtures/procurement-docs/emergency-procurement.docx
```

**预期输出**:
- 检测紧急采购程序合规性
- 验证国际采购外汇审批
- 检查联合体投标协议完整性
- 生成法规依据引用清单

#### 3. 风险评估演示
```bash
# 运行风险评估测试
npm test -- --grep "risk-assessment"

# 或使用特定文档
node scripts/demo-risk-assessment.js tests/fixtures/procurement-docs/high-value-contract.docx
```

**预期输出**:
- 技术风险分析
- 资金风险评估
- 进度风险预测
- 生成风险应对建议

### Demo Scripts

项目包含以下演示脚本（位于 `scripts/` 目录）：

| 脚本 | 用途 | 示例 |
|------|------|------|
| `demo-budget-analysis.js` | 预算分析演示 | `node scripts/demo-budget-analysis.js <docx-file>` |
| `demo-compliance-check.js` | 合规性检查演示 | `node scripts/demo-compliance-check.js <docx-file>` |
| `demo-risk-assessment.js` | 风险评估演示 | `node scripts/demo-risk-assessment.js <docx-file>` |
| `demo-full-review.js` | 完整审查流程演示 | `node scripts/demo-full-review.js <docx-file>` |

### Example Scenarios Documentation

详细的示例场景文档位于 `docs/examples/` 目录：

- [`budget-analysis-scenario.md`](docs/examples/budget-analysis-scenario.md) - 预算分析审查场景
- [`compliance-check-scenario.md`](docs/examples/compliance-check-scenario.md) - 合规性检查场景
- [`risk-assessment-scenario.md`](docs/examples/risk-assessment-scenario.md) - 风险评估场景

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# 基础文档测试
npm test -- --grep "basic-fixtures"

# 高级文档测试
npm test -- --grep "advanced-fixtures"

# 预算分析测试
npm test -- --grep "budget-analysis"

# 合规性检查测试
npm test -- --grep "compliance-check"

# 风险评估测试
npm test -- --grep "risk-assessment"
```

### Test Coverage

项目测试覆盖以下方面：

- ✅ 文档解析和格式验证
- ✅ 基础字段提取（预算、联系人、时间表）
- ✅ 合规性规则检查
- ✅ 风险识别和评估
- ✅ AI 对话交互
- ✅ 文档导出和保存