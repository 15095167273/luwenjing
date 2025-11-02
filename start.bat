@echo off
chcp 65001 >nul
echo ============================================
echo   个人网站服务器启动脚本
echo ============================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] 检测到 Node.js 版本:
node --version
echo.

REM 检查是否已安装依赖
if not exist "node_modules\" (
    echo [信息] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
    echo.
)

REM 启动服务器
echo [信息] 正在启动服务器...
echo [提示] 按 Ctrl+C 可停止服务器
echo.
call npm start

