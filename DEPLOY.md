# 部署指南

本文档提供详细的部署说明，帮助你将网站部署到生产环境。

## 📋 目录

- [快速开始](#快速开始)
- [本地部署](#本地部署)
- [服务器部署](#服务器部署)
- [使用 PM2 部署（推荐）](#使用-pm2-部署推荐)
- [使用 Docker 部署](#使用-docker-部署)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 快速开始

### 方式一：一键启动（Windows）

双击运行 `start.bat` 文件，脚本会自动：
- 检测 Node.js 环境
- 安装依赖（如果未安装）
- 启动服务器

### 方式二：一键启动（Linux/Mac）

```bash
chmod +x start.sh
./start.sh
```

### 方式三：手动启动

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

启动后访问：`http://localhost:3000`

## 本地部署

### Windows 系统

1. **安装 Node.js**
   - 下载地址：https://nodejs.org/
   - 推荐版本：LTS 版本（长期支持版）

2. **下载项目文件**
   - 将所有文件解压到一个文件夹

3. **启动服务器**
   - 双击 `start.bat` 文件
   - 或者在命令行中运行：
     ```cmd
     cd aidaima4
     npm install
     npm start
     ```

4. **访问网站**
   - 本机访问：`http://localhost:3000`
   - 局域网访问：脚本会显示局域网 IP 地址

### Linux/Mac 系统

1. **安装 Node.js**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # macOS (使用 Homebrew)
   brew install node
   ```

2. **启动服务器**
   ```bash
   cd aidaima4
   chmod +x start.sh
   ./start.sh
   ```

## 服务器部署

### 使用 PM2 部署（推荐）

PM2 是一个 Node.js 进程管理器，可以保证应用持续运行，自动重启，非常适合生产环境。

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 启动应用

```bash
cd aidaima4
npm install
pm2 start ecosystem.config.js
```

或者使用 npm 脚本：

```bash
npm run pm2:start
```

#### 3. 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs personal-website
# 或使用
npm run pm2:logs

# 重启应用
pm2 restart personal-website
# 或使用
npm run pm2:restart

# 停止应用
pm2 stop personal-website
# 或使用
npm run pm2:stop

# 删除应用
pm2 delete personal-website
# 或使用
npm run pm2:delete

# 查看详细信息
pm2 show personal-website
```

#### 4. 设置开机自启

```bash
# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup

# 根据提示执行生成的命令（通常是 sudo 命令）
```

#### 5. 监控应用

```bash
# 监控面板
pm2 monit

# 查看详细信息
pm2 show personal-website
```

### 使用 Docker 部署

如果需要使用 Docker，可以创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

然后构建和运行：

```bash
docker build -t personal-website .
docker run -d -p 3000:3000 --name personal-website personal-website
```

## 配置说明

### 环境变量配置

1. **复制环境变量示例文件**

```bash
cp .env.example .env
```

2. **编辑 `.env` 文件**

```env
# 服务器端口（默认 3000）
PORT=3000

# 运行环境 (development | production)
NODE_ENV=production

# 数据文件路径（可选）
# DATA_FILE=./data.json
```

3. **使用环境变量**

```bash
# Windows
set PORT=8080 && npm start

# Linux/Mac
PORT=8080 npm start
```

### 修改端口

如果 3000 端口被占用，可以通过以下方式修改：

1. **使用环境变量**（推荐）
   ```bash
   PORT=8080 npm start
   ```

2. **修改 `ecosystem.config.js`**
   ```javascript
   env: {
     PORT: 8080
   }
   ```

3. **修改 `.env` 文件**
   ```
   PORT=8080
   ```

### 防火墙配置

如果服务器无法访问，请检查防火墙设置：

```bash
# Ubuntu/Debian (使用 ufw)
sudo ufw allow 3000/tcp
sudo ufw reload

# CentOS/RHEL (使用 firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 反向代理配置（Nginx）

如果需要使用域名访问，可以配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 常见问题

### 1. 端口被占用

**问题**：启动时提示端口被占用

**解决**：
- 修改端口：`PORT=8080 npm start`
- 或者停止占用 3000 端口的程序

### 2. 无法访问

**问题**：服务器启动后无法访问

**解决**：
- 检查防火墙设置
- 确认服务器监听在 `0.0.0.0` 而不是 `127.0.0.1`
- 检查服务器 IP 地址是否正确

### 3. PM2 进程自动重启

**问题**：PM2 进程频繁重启

**解决**：
- 查看日志：`pm2 logs personal-website`
- 检查内存使用：`pm2 monit`
- 查看错误信息

### 4. 数据丢失

**问题**：重启后数据丢失

**解决**：
- 确认 `data.json` 文件存在
- 检查文件权限
- 确认数据文件路径配置正确

### 5. 手机无法访问

**问题**：电脑可以访问，手机无法访问

**解决**：
- 确保手机和电脑在同一局域网
- 使用服务器的局域网 IP 地址访问（启动脚本会显示）
- 检查手机防火墙设置
- 确保服务器监听在 `0.0.0.0`

## 性能优化建议

1. **使用 PM2 集群模式**（多核 CPU）
   ```javascript
   // ecosystem.config.js
   instances: 'max',
   exec_mode: 'cluster'
   ```

2. **启用 Gzip 压缩**
   - 在 Nginx 配置中启用 gzip

3. **定期备份数据**
   - 定期备份 `data.json` 文件
   - 可以使用 cron 任务自动备份

4. **监控应用**
   - 使用 PM2 监控功能
   - 设置告警

## 安全建议

1. **修改默认登录密码**
   - 编辑 `script.js` 中的 `CONFIG.LOGIN_USERNAME` 和 `CONFIG.LOGIN_PASSWORD`

2. **使用 HTTPS**
   - 配置 SSL 证书
   - 使用 Let's Encrypt 免费证书

3. **限制上传大小**
   - 已在代码中限制为 100MB
   - 可根据需要调整

4. **定期更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

## 备份和恢复

### 备份数据

```bash
# 备份 data.json
cp data.json data.json.backup.$(date +%Y%m%d_%H%M%S)
```

### 恢复数据

```bash
# 恢复备份
cp data.json.backup.20231102_120000 data.json

# 重启应用
pm2 restart personal-website
```

## 支持

如有问题，请查看：
- README.md - 基本使用说明
- 日志文件 - `logs/pm2-error.log` 和 `logs/pm2-out.log`
- PM2 日志 - `pm2 logs personal-website`

