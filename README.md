# 个人网站 - 动态网站版本

这是一个基于 Node.js + Express + EJS 的动态网站系统，支持多用户共享内容。一个人修改的内容，其他用户也能看到。

## 功能特点

- ✅ **动态网站**：使用 EJS 模板引擎，服务器端渲染
- ✅ 多用户数据共享：所有用户看到相同的内容
- ✅ 实时同步：每30秒自动从服务器获取最新数据
- ✅ 轮播图管理：支持上传和管理轮播图片
- ✅ 说说功能：发布和查看说说（支持图片）
- ✅ 留言板：用户留言功能
- ✅ 主题切换：多种主题风格
- ✅ 响应式设计：支持手机和电脑访问

## 技术栈

- **后端**：Node.js + Express
- **模板引擎**：EJS
- **数据存储**：JSON 文件（`data.json`）
- **前端**：原生 JavaScript + CSS

## 项目结构

```
.
├── server.js              # 后端服务器
├── package.json           # 项目配置和依赖
├── data.json              # 数据存储文件（自动生成）
├── views/                 # EJS 模板目录
│   ├── index.ejs          # 首页模板
│   ├── all-posts.ejs      # 所有说说页面模板
│   └── all-messages.ejs   # 所有留言页面模板
├── script.js              # 前端 JavaScript
├── style.css              # 样式文件
└── README.md              # 说明文档
```

## 快速开始

### 方式一：一键启动（推荐）

**Windows 系统：**
- 双击运行 `start.bat` 文件即可自动启动

**Linux/Mac 系统：**
```bash
chmod +x start.sh
./start.sh
```

脚本会自动：
- 检测 Node.js 环境
- 安装依赖（如果未安装）
- 启动服务器
- 显示访问地址（包括局域网 IP）

### 方式二：手动启动

#### 1. 安装依赖

```bash
npm install
```

这将安装以下依赖：
- `express` - Web 框架
- `ejs` - 模板引擎
- `cors` - 跨域支持

#### 2. 启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

#### 3. 访问网站

在浏览器中打开 `http://localhost:3000` 即可访问网站。

**局域网访问：** 启动脚本会显示局域网 IP 地址，手机和同局域网设备可通过该 IP 访问。

**注意**：不再需要单独打开 HTML 文件，所有页面都通过服务器路由访问：
- 首页：`http://localhost:3000/`
- 所有说说：`http://localhost:3000/all-posts`
- 所有留言：`http://localhost:3000/all-messages`

## 部署说明

详细的部署指南请参考 [DEPLOY.md](DEPLOY.md)

### 快速部署（使用 PM2）

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动应用（使用配置文件）
npm run pm2:start

# 或使用命令
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 设置开机自启
pm2 save
pm2 startup
```

### 常用 PM2 命令

```bash
npm run pm2:start    # 启动应用
npm run pm2:stop     # 停止应用
npm run pm2:restart  # 重启应用
npm run pm2:logs     # 查看日志
npm run pm2:delete   # 删除应用
```

### 环境变量

可以通过环境变量配置端口：

```bash
PORT=3000 npm start
```

## 数据结构

数据存储在服务器端的 `data.json` 文件中，包含：

```json
{
  "carouselData": [],      // 轮播图数据
  "posts": [],             // 说说数据
  "messages": [],          // 留言数据
  "siteTitle": "",         // 网站标题
  "editableContent": {},   // 可编辑内容
  "theme": "cute",        // 当前主题
  "lastUpdated": 0        // 最后更新时间
}
```

## 登录信息

默认登录账号：
- 用户名：`luwenjing`
- 密码：`@wslwjdwz`

可以在 `script.js` 中修改 `CONFIG.LOGIN_USERNAME` 和 `CONFIG.LOGIN_PASSWORD`。

## API接口

所有 API 接口都以 `/api` 开头：

- `GET /api/data` - 获取所有数据
- `POST /api/carousel` - 更新轮播图数据
- `POST /api/posts` - 更新说说数据
- `POST /api/messages` - 更新留言数据
- `POST /api/site-title` - 更新网站标题
- `POST /api/editable-content` - 更新可编辑内容
- `POST /api/theme` - 更新主题

## 路由说明

- `GET /` - 首页（渲染 `views/index.ejs`）
- `GET /all-posts` - 所有说说页面（渲染 `views/all-posts.ejs`）
- `GET /all-messages` - 所有留言页面（渲染 `views/all-messages.ejs`）

## 静态资源

以下文件作为静态资源提供服务（通过 `/路径` 访问）：
- `/style.css` - 样式文件
- `/script.js` - JavaScript 文件

## 注意事项

1. **数据同步**：前端每30秒自动从服务器获取最新数据
2. **数据持久化**：数据保存在服务器的 `data.json` 文件中
3. **备份建议**：定期备份 `data.json` 文件
4. **文件大小限制**：支持最大 100MB 的请求体（用于大图片上传）
5. **登录状态**：每次刷新页面都会重置登录状态，需要重新登录

## 故障排除

### 无法访问网站

1. 检查服务器是否运行：`npm start`
2. 检查端口是否被占用（默认 3000）
3. 检查防火墙设置

### 数据不同步

1. 检查服务器是否正常运行
2. 检查网络连接
3. 查看浏览器控制台的错误信息
4. 尝试手动刷新页面

### 模板渲染错误

1. 确保 `views` 目录存在
2. 检查模板文件（.ejs）是否存在
3. 查看服务器日志中的错误信息

## 从静态网站迁移

如果您之前使用的是静态 HTML 文件版本：

1. **旧的 HTML 文件**：原来的 `index.html`、`all-posts.html`、`all-messages.html` 可以删除或保留作为备份
2. **EJS 模板**：新的模板文件在 `views/` 目录下
3. **路由变更**：原来的 `all-posts.html` 现在通过 `/all-posts` 路由访问

