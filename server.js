/**
 * 个人网站 - 后端API服务器
 * 提供数据存储和同步功能，实现多用户共享
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_FILE = path.join(__dirname, process.env.DATA_FILE || 'data.json');

// 配置 EJS 模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态文件服务（CSS、JS等）
app.use(express.static(path.join(__dirname)));

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb' })); // 支持大图片数据

// 请求日志中间件（生产环境简化日志）
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// 确保数据文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        // 文件不存在，创建初始数据结构
        const initialData = {
            carouselData: [],
            posts: [],
            messages: [],
            siteTitle: '我的个人网站',
            editableContent: {},
            theme: 'cute',
            lastUpdated: Date.now()
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 读取数据文件
async function readData() {
    try {
        const content = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return {
            carouselData: [],
            posts: [],
            messages: [],
            siteTitle: '我的个人网站',
            editableContent: {},
            theme: 'cute',
            lastUpdated: Date.now()
        };
    }
}

// 写入数据文件
async function writeData(data) {
    try {
        data.lastUpdated = Date.now();
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入数据文件失败:', error);
        return false;
    }
}

// 页面路由

// 首页
app.get('/', async (req, res) => {
    try {
        const data = await readData();
        res.render('index', {
            siteTitle: data.siteTitle || '我的个人网站'
        });
    } catch (error) {
        console.error('渲染首页失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 所有说说页面
app.get('/all-posts', async (req, res) => {
    try {
        const data = await readData();
        res.render('all-posts', {
            siteTitle: data.siteTitle || '我的个人网站'
        });
    } catch (error) {
        console.error('渲染所有说说页面失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 所有留言页面
app.get('/all-messages', async (req, res) => {
    try {
        const data = await readData();
        res.render('all-messages', {
            siteTitle: data.siteTitle || '我的个人网站'
        });
    } catch (error) {
        console.error('渲染所有留言页面失败:', error);
        res.status(500).send('服务器错误');
    }
});

// API路由

// 获取所有数据
app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取数据失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新轮播图数据
app.post('/api/carousel', async (req, res) => {
    try {
        const { carouselData } = req.body;
        if (!Array.isArray(carouselData)) {
            return res.status(400).json({ success: false, error: '轮播图数据必须是数组' });
        }
        
        const data = await readData();
        data.carouselData = carouselData;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '轮播图更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新轮播图失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新说说数据
app.post('/api/posts', async (req, res) => {
    try {
        const { posts } = req.body;
        if (!Array.isArray(posts)) {
            return res.status(400).json({ success: false, error: '说说数据必须是数组' });
        }
        
        const data = await readData();
        data.posts = posts;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '说说更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新说说失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新留言数据
app.post('/api/messages', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: '留言数据必须是数组' });
        }
        
        const data = await readData();
        data.messages = messages;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '留言更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新留言失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新网站标题
app.post('/api/site-title', async (req, res) => {
    try {
        const { siteTitle } = req.body;
        if (typeof siteTitle !== 'string') {
            return res.status(400).json({ success: false, error: '网站标题必须是字符串' });
        }
        
        const data = await readData();
        data.siteTitle = siteTitle;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '网站标题更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新网站标题失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新可编辑内容
app.post('/api/editable-content', async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || typeof value !== 'string') {
            return res.status(400).json({ success: false, error: '键值对格式不正确' });
        }
        
        const data = await readData();
        if (!data.editableContent) {
            data.editableContent = {};
        }
        data.editableContent[key] = value;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '内容更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新可编辑内容失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新主题
app.post('/api/theme', async (req, res) => {
    try {
        const { theme } = req.body;
        if (typeof theme !== 'string') {
            return res.status(400).json({ success: false, error: '主题必须是字符串' });
        }
        
        const data = await readData();
        data.theme = theme;
        const success = await writeData(data);
        
        if (success) {
            res.json({ success: true, message: '主题更新成功' });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('更新主题失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 错误处理
app.use((req, res) => {
    res.status(404).send('页面未找到');
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ 
        success: false, 
        error: NODE_ENV === 'production' ? '服务器内部错误' : err.message 
    });
});

// 启动服务器
async function startServer() {
    try {
        await ensureDataFile();
        
        // 确保 logs 目录存在（用于 PM2）
        const logsDir = path.join(__dirname, 'logs');
        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log(`🚀 服务器启动成功！`);
            console.log(`📡 访问地址: http://localhost:${PORT}`);
            console.log(`📡 局域网访问: http://${getLocalIP()}:${PORT}`);
            console.log(`📁 数据文件: ${DATA_FILE}`);
            console.log(`🌍 运行环境: ${NODE_ENV}`);
            console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
            console.log('='.repeat(50));
        });
        
        // 优雅关闭
        process.on('SIGTERM', () => {
            console.log('收到 SIGTERM 信号，正在关闭服务器...');
            server.close(() => {
                console.log('服务器已关闭');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('收到 SIGINT 信号，正在关闭服务器...');
            server.close(() => {
                console.log('服务器已关闭');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

// 获取本机 IP 地址
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

startServer().catch(console.error);

