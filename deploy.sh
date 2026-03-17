#!/bin/bash
# 部署脚本 - 手动执行

echo "🚀 部署 DOCX AI Editor 到 Vercel"

# 1. 确保在项目目录
cd "$(dirname "$0")"

# 2. 检查 Vercel CLI 是否已认证
if ! vercel whoami >/dev/null 2>&1; then
    echo "⚠️  Vercel 未认证，请先运行: vercel login"
    exit 1
fi

# 3. 部署到生产环境
echo "📤 部署到 Vercel 生产环境..."
vercel --prod --yes

echo "✅ 部署完成！"
echo "🌐 访问地址将在部署完成后显示"