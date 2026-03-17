#!/bin/bash
# 使用 Vercel Token 自动部署

echo "🚀 部署 DOCX AI Editor 到 Vercel"

# 检查是否提供了 VERCEL_TOKEN
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ 错误: 请设置 VERCEL_TOKEN 环境变量"
    echo "用法: VERCEL_TOKEN=your_token_here ./deploy-with-token.sh"
    exit 1
fi

# 设置 Vercel 配置目录
export VERCEL_DIR="$HOME/.cache/vercel"

# 创建配置目录
mkdir -p "$VERCEL_DIR"

# 验证 token
echo "🔍 验证 Vercel Token..."
if ! vercel whoami --token "$VERCEL_TOKEN" >/dev/null 2>&1; then
    echo "❌ Token 无效，请检查你的 Vercel Token"
    exit 1
fi

echo "✅ Token 验证成功"

# 部署到生产环境
echo "📤 部署到 Vercel 生产环境..."
cd "$(dirname "$0")"

# 使用 token 部署
vercel --prod --token "$VERCEL_TOKEN" --yes --confirm

echo "✅ 部署完成！"
echo "🌐 应用已部署，访问 URL 将在输出中显示"