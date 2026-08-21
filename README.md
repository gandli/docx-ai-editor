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

## Testing

```bash
npm test            # watch mode
npm run test:run    # single run
npm run test:unit   # unit tests only
npm run test:e2e    # Playwright E2E
```

Unit tests cover document parsing, LLM API integration, and the review rule engine (see `__tests__/`).
