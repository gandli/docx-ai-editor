# 部署 DOCX AI Editor

## 手动部署步骤

### 1. 安装 Vercel CLI (如果未安装)
```bash
npm install -g vercel
# 或
bun add -g vercel
```

### 2. 登录 Vercel
```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor
vercel login
```
按照提示在浏览器中完成登录。

### 3. 部署到生产环境
```bash
vercel --prod --yes
```

### 4. 配置环境变量 (可选)
在 Vercel Dashboard 中添加以下环境变量：
- `QWEN_API_KEY` - Qwen 模型 API 密钥
- `CLAUDE_API_KEY` - Claude 模型 API 密钥  
- `GLM_API_KEY` - GLM 模型 API 密钥

## 自动部署 (推荐)

也可以直接通过 GitHub 集成：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project" 
3. 选择 `gandli/docx-ai-editor` 仓库
4. 选择框架为 "Other" (因为使用 Vite)
5. 构建命令: `bun run build`
6. 输出目录: `dist`
7. 点击 "Deploy"

## 本地测试

在部署前，可以先在本地测试：

```bash
cd /Users/user/.openclaw/workspace/docx-ai-editor
bun install
bun run dev
```

访问 `http://localhost:3000` 查看效果。