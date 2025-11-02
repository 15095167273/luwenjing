#!/bin/bash

# 个人网站服务器启动脚本

echo "============================================"
echo "  个人网站服务器启动脚本"
echo "============================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[信息] 检测到 Node.js 版本:"
node --version
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
    echo "[成功] 依赖安装完成"
    echo ""
fi

# 启动服务器
echo "[信息] 正在启动服务器..."
echo "[提示] 按 Ctrl+C 可停止服务器"
echo ""

npm start

