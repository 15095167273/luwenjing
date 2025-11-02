/**
 * 个人网站 - 主要功能脚本
 * 优化版本：添加错误处理、工具函数、代码优化
 */

// ==================== 常量定义 ====================
const CONFIG = {
    LOGIN_USERNAME: 'luwenjing',
    LOGIN_PASSWORD: '@wslwjdwz',
    MAX_MESSAGE_LENGTH: 500,
    // API服务器地址（使用相对路径，因为前端和API在同一服务器）
    API_BASE_URL: '',
    // 数据同步间隔（毫秒）- 每30秒检查一次是否有新数据
    SYNC_INTERVAL: 30000,
    STORAGE_KEYS: {
        IS_LOGGED_IN: 'isLoggedIn',
        CURRENT_THEME: 'currentTheme',
        TIMELINE_POSTS: 'timelinePosts',
        MESSAGES: 'messages',
        FEATURE_IMAGE: 'featureImage',
        CAROUSEL_DATA: 'carouselData',
        SITE_TITLE: 'siteTitle',
        ENVELOPE_DESTROYED: 'envelopeDestroyed'
    },
    THEME_MAP: {
        'cute': 'cute-theme',
        'depressed': 'depress-theme',
        'sunny': 'sunny-theme',
        'starry': 'starry-theme'
    },
    DEFAULT_THEME: 'cute'
};

// ==================== 应用状态管理 ====================
const AppState = {
    isLoggedIn: false,
    currentTheme: CONFIG.DEFAULT_THEME,
    posts: [],
    messages: []
};

// ==================== 轮播图功能 ====================

/**
 * 轮播图配置
 */
const CAROUSEL_CONFIG = {
    AUTO_PLAY_INTERVAL: 10000, // 自动播放间隔（毫秒）
    TRANSITION_DURATION: 500, // 过渡动画时长（毫秒）
    MANUAL_RESUME_DELAY: 60000 // 手动切换后恢复自动播放的延迟（毫秒）
};

/**
 * 轮播图默认数据源（10张占位图片）
 * 如果 localStorage 中没有数据，则使用此默认数据
 */
const DEFAULT_CAROUSEL_DATA = [
    {
        imageUrl: 'https://via.placeholder.com/600x400/FF6B9D/FFFFFF?text=图片1',
        description: '这里是第一张图片的介绍文字，你可以在这里描述图片的内容和特色。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/4ECDC4/FFFFFF?text=图片2',
        description: '这里是第二张图片的介绍文字，展示了网站的不同功能和亮点。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/45B7D1/FFFFFF?text=图片3',
        description: '第三张图片展示了更多的内容特色，让访问者了解更多信息。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/FFA07A/FFFFFF?text=图片4',
        description: '第四张图片包含了重要的展示内容，能够吸引用户的注意力。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/98D8C8/FFFFFF?text=图片5',
        description: '第五张图片提供了更多精彩的内容展示，增强用户体验。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/F7DC6F/FFFFFF?text=图片6',
        description: '第六张图片展现了网站的独特魅力，让用户印象深刻。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/BB8FCE/FFFFFF?text=图片7',
        description: '第七张图片展示了更多的细节和特色，内容丰富多样。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/85C1E2/FFFFFF?text=图片8',
        description: '第八张图片提供了更多有价值的信息，增强网站的吸引力。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/F8B500/FFFFFF?text=图片9',
        description: '第九张图片展现了网站的多样性和创新性，内容丰富精彩。'
    },
    {
        imageUrl: 'https://via.placeholder.com/600x400/E74C3C/FFFFFF?text=图片10',
        description: '第十张图片作为轮播的收尾，给用户留下深刻的印象和良好体验。'
    }
];

/**
 * 轮播图数据源（从 localStorage 动态加载或使用默认数据）
 */
let carouselData = [];

/**
 * 当前轮播图索引
 */
let currentCarouselIndex = 0;

/**
 * 自动播放定时器
 */
let carouselAutoPlayTimer = null;

/**
 * 延迟恢复自动播放的定时器
 */
let carouselResumeTimer = null;

// ==================== 工具函数 ====================

/**
 * DOM 查询工具 - 单个元素
 */
function $(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`元素未找到: ${selector}`);
    }
    return element;
}

/**
 * DOM 查询工具 - 多个元素
 */
function $$(selector) {
    return document.querySelectorAll(selector);
}

// ==================== IndexedDB 存储系统（支持大容量存储）====================

/**
 * IndexedDB 数据库管理
 */
const DB_NAME = 'PersonalWebsiteDB';
const DB_VERSION = 1;
const STORE_NAME = 'dataStore';

let dbInstance = null;

/**
 * 打开 IndexedDB 数据库
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB 打开失败:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * 从 IndexedDB 读取数据
 */
async function getIndexedDB(key) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result !== undefined ? request.result : null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error(`读取 IndexedDB 失败 (${key}):`, error);
        return null;
    }
}

/**
 * 写入 IndexedDB 数据
 */
async function setIndexedDB(key, value) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => {
                console.log(`IndexedDB 写入成功 (${key})`);
                resolve(true);
            };

            request.onerror = () => {
                const error = request.error;
                console.error(`写入 IndexedDB 失败 (${key}):`, error);
                
                // 如果是因为配额限制，尝试请求持久化存储
                if (error && error.name === 'QuotaExceededError') {
                    console.warn('存储空间不足，尝试请求持久化存储');
                    requestPersistentStorage();
                }
                
                reject(error);
            };
        });
    } catch (error) {
        console.error(`写入 IndexedDB 失败 (${key}):`, error);
        // 如果是数据库未打开或不存在，尝试使用 localStorage 作为后备
        if (error.name === 'InvalidStateError' || error.message?.includes('not found')) {
            console.warn('IndexedDB 不可用，尝试使用 localStorage');
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('localStorage 也失败:', e);
            }
        }
        return false;
    }
}

/**
 * 请求持久化存储配额（最大支持到约 60% 的可用磁盘空间）
 */
async function requestPersistentStorage() {
    try {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const isPersisted = await navigator.storage.persist();
            if (isPersisted) {
                console.log('已获得持久化存储权限');
            }
            
            // 请求配额信息
            if ('estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
                const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
                console.log(`存储配额: ${quotaMB}MB, 已使用: ${usageMB}MB`);
            }
        }
    } catch (error) {
        console.warn('请求持久化存储失败:', error);
    }
}

/**
 * 检查数据大小，决定使用哪种存储方式
 */
function shouldUseIndexedDB(data) {
    if (typeof data === 'string') {
        return data.length > 1 * 1024 * 1024; // 超过 1MB 使用 IndexedDB
    }
    if (typeof data === 'object') {
        const jsonString = JSON.stringify(data);
        // 检查是否包含大图片（Base64 图片数据通常很大）
        const hasLargeImage = jsonString.length > 1 * 1024 * 1024 || 
                             jsonString.includes('data:image/');
        return hasLargeImage;
    }
    return false;
}

// ==================== API 存储系统（服务器端存储，多用户共享）====================

// 全局数据缓存
let serverDataCache = null;
let lastSyncTime = 0;

/**
 * 从服务器获取所有数据
 */
async function fetchServerData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/data`);
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
            serverDataCache = result.data;
            lastSyncTime = Date.now();
            return result.data;
        } else {
            throw new Error(result.error || '获取数据失败');
        }
    } catch (error) {
        console.error('从服务器获取数据失败:', error);
        // 如果服务器不可用，尝试使用本地缓存
        if (serverDataCache) {
            console.warn('使用本地缓存数据');
            return serverDataCache;
        }
        // 回退到localStorage（向后兼容）
        return null;
    }
}

/**
 * 同步服务器数据到本地状态
 */
async function syncServerData() {
    try {
        const data = await fetchServerData();
        if (!data) return false;
        
        // 更新轮播图数据
        if (data.carouselData && Array.isArray(data.carouselData) && data.carouselData.length > 0) {
            carouselData = data.carouselData;
        }
        
        // 更新说说数据
        if (data.posts && Array.isArray(data.posts)) {
            AppState.posts = data.posts;
            renderPosts();
        }
        
        // 更新留言数据
        if (data.messages && Array.isArray(data.messages)) {
            AppState.messages = data.messages;
            renderMessages();
        }
        
        // 更新网站标题
        if (data.siteTitle) {
            const siteTitleEl = $('#site-title');
            if (siteTitleEl && siteTitleEl.textContent !== data.siteTitle) {
                siteTitleEl.textContent = data.siteTitle;
            }
        }
        
        // 更新可编辑内容
        if (data.editableContent) {
            Object.keys(data.editableContent).forEach(key => {
                const element = $(`#${key}`);
                if (element) {
                    if (element.tagName === 'IMG') {
                        element.src = data.editableContent[key];
                    } else {
                        element.textContent = data.editableContent[key];
                    }
                }
            });
        }
        
        // 更新主题
        if (data.theme && data.theme !== AppState.currentTheme) {
            applyTheme(data.theme);
        }
        
        return true;
    } catch (error) {
        console.error('同步服务器数据失败:', error);
        return false;
    }
}

/**
 * 启动自动同步（定期从服务器获取最新数据）
 */
let syncIntervalId = null;
function startAutoSync() {
    if (syncIntervalId) return; // 已经启动
    
    // 立即同步一次
    syncServerData();
    
    // 定期同步
    syncIntervalId = setInterval(() => {
        syncServerData();
    }, CONFIG.SYNC_INTERVAL);
    
    console.log('已启动自动数据同步，间隔:', CONFIG.SYNC_INTERVAL / 1000, '秒');
}

/**
 * 停止自动同步
 */
function stopAutoSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

// ==================== 混合存储系统（兼容模式：API + 本地存储）====================

/**
 * 混合存储：优先从服务器读取，回退到本地存储
 */
async function getStorage(key, defaultValue = null) {
    try {
        // 如果是共享数据，从服务器获取
        if (CONFIG.STORAGE_KEYS.CAROUSEL_DATA === key || 
            CONFIG.STORAGE_KEYS.TIMELINE_POSTS === key || 
            CONFIG.STORAGE_KEYS.MESSAGES === key ||
            CONFIG.STORAGE_KEYS.SITE_TITLE === key) {
            
            // 从服务器缓存获取
            if (!serverDataCache) {
                await fetchServerData();
            }
            
            if (serverDataCache) {
                if (key === CONFIG.STORAGE_KEYS.CAROUSEL_DATA) {
                    return JSON.stringify(serverDataCache.carouselData || []);
                }
                if (key === CONFIG.STORAGE_KEYS.TIMELINE_POSTS) {
                    return JSON.stringify(serverDataCache.posts || []);
                }
                if (key === CONFIG.STORAGE_KEYS.MESSAGES) {
                    return JSON.stringify(serverDataCache.messages || []);
                }
                if (key === CONFIG.STORAGE_KEYS.SITE_TITLE) {
                    return serverDataCache.siteTitle || defaultValue;
                }
            }
        }
        
        // 非共享数据或服务器不可用时，使用本地存储
        try {
            // 先尝试从 IndexedDB 读取
            const indexedValue = await getIndexedDB(key);
            if (indexedValue !== null) {
                return indexedValue;
            }
            
            // 回退到 localStorage
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            // 如果 IndexedDB 失败，回退到 localStorage
            try {
                const value = localStorage.getItem(key);
                return value !== null ? value : defaultValue;
            } catch (e) {
                console.error(`读取存储失败 (${key}):`, error);
                return defaultValue;
            }
        }
    } catch (error) {
        console.error(`读取存储失败 (${key}):`, error);
        return defaultValue;
    }
}

/**
 * 混合存储：优先保存到服务器，回退到本地存储
 */
async function setStorage(key, value) {
    try {
        // 如果是共享数据，保存到服务器
        if (key === CONFIG.STORAGE_KEYS.CAROUSEL_DATA) {
            try {
                const carouselData = JSON.parse(value);
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/carousel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ carouselData })
                });
                const result = await response.json();
                if (result.success) {
                    serverDataCache = null; // 清除缓存，下次重新获取
                    return true;
                }
            } catch (error) {
                console.warn('保存到服务器失败，使用本地存储:', error);
            }
        }
        
        if (key === CONFIG.STORAGE_KEYS.SITE_TITLE) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/site-title`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteTitle: value })
                });
                const result = await response.json();
                if (result.success) {
                    serverDataCache = null;
                    return true;
                }
            } catch (error) {
                console.warn('保存到服务器失败，使用本地存储:', error);
            }
        }
        
        // 非共享数据或服务器不可用时，使用本地存储
        const useIndexedDB = shouldUseIndexedDB(value);
        
        if (useIndexedDB) {
            const success = await setIndexedDB(key, value);
            if (success) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {}
                return true;
            }
        }
        
        localStorage.setItem(key, value);
        try {
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(key);
        } catch (e) {}
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.error(`存储空间不足 (${key}):`, error);
            await requestPersistentStorage();
        } else {
            console.error(`写入存储失败 (${key}):`, error);
        }
        return false;
    }
}

/**
 * 混合存储：JSON 安全读取
 */
async function getStorageJSON(key, defaultValue = null) {
    try {
        const value = await getStorage(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error(`解析 JSON 失败 (${key}):`, error);
        return defaultValue;
    }
}

/**
 * 混合存储：JSON 安全写入（优先保存到服务器）
 */
async function setStorageJSON(key, value) {
    try {
        // 如果是共享数据，直接保存到服务器
        if (key === CONFIG.STORAGE_KEYS.TIMELINE_POSTS) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ posts: value })
                });
                const result = await response.json();
                if (result.success) {
                    serverDataCache = null; // 清除缓存
                    return true;
                } else {
                    throw new Error(result.error || '保存失败');
                }
            } catch (error) {
                console.warn('保存到服务器失败，使用本地存储:', error);
            }
        }
        
        if (key === CONFIG.STORAGE_KEYS.MESSAGES) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: value })
                });
                const result = await response.json();
                if (result.success) {
                    serverDataCache = null;
                    return true;
                } else {
                    throw new Error(result.error || '保存失败');
                }
            } catch (error) {
                console.warn('保存到服务器失败，使用本地存储:', error);
            }
        }
        
        // 非共享数据，使用本地存储
        const jsonString = JSON.stringify(value);
        const sizeInMB = new Blob([jsonString]).size / 1024 / 1024;
        
        const useIndexedDB = sizeInMB > 1 || jsonString.includes('data:image/');
        
        if (useIndexedDB && sizeInMB > 1) {
            console.log(`数据大小 ${sizeInMB.toFixed(2)}MB，使用 IndexedDB 存储`);
        }
        
        const success = await setStorage(key, jsonString);
        if (!success) {
            return false;
        }
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.error(`存储空间不足 (${key}):`, error);
            await requestPersistentStorage();
        } else {
            console.error(`保存 JSON 失败 (${key}):`, error);
        }
        return false;
    }
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 显示提示消息（统一的提示方法）
 */
function showToast(message, type = 'success', duration = 3000) {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 读取图片文件为 Base64
 */
function readImageFile(file, callback) {
    if (!file) {
        const error = new Error('文件不存在');
        console.error('readImageFile: 文件不存在');
        callback(null, error);
        return;
    }
    
    // 检查文件类型
    if (file.type && !file.type.startsWith('image/')) {
        const error = new Error('请选择图片文件');
        console.error(`readImageFile: 文件类型错误 - ${file.type}`);
        callback(null, error);
        return;
    }
    
    // 检查文件大小
    const sizeInMB = file.size / 1024 / 1024;
    if (sizeInMB > 10) {
        const error = new Error(`文件太大 (${sizeInMB.toFixed(2)}MB)，请选择小于 10MB 的图片`);
        console.error(`readImageFile: 文件太大 - ${sizeInMB.toFixed(2)}MB`);
        callback(null, error);
        return;
    }

    console.log(`readImageFile: 开始读取文件 - ${file.name}, 大小: ${sizeInMB.toFixed(2)}MB, 类型: ${file.type || '未知'}`);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target.result;
            // 验证结果是否是有效的 base64 图片数据
            if (result && typeof result === 'string' && result.startsWith('data:image/')) {
                const dataSize = new Blob([result]).size / 1024 / 1024;
                console.log(`readImageFile: 文件读取成功 - ${file.name}, Base64大小: ${dataSize.toFixed(2)}MB`);
                callback(result, null);
            } else {
                const error = new Error('图片数据格式无效');
                console.error(`readImageFile: 数据格式无效 - ${file.name}, 结果类型: ${typeof result}, 前缀: ${result ? result.substring(0, 20) : 'null'}`);
                callback(null, error);
            }
        } catch (error) {
            console.error(`readImageFile: 处理文件数据失败 - ${file.name}:`, error);
            callback(null, new Error(`处理文件数据失败: ${error.message}`));
        }
    };
    reader.onerror = (e) => {
        const error = new Error(`读取文件失败: ${reader.error?.message || '未知错误'}`);
        console.error(`readImageFile: 读取文件失败 - ${file.name}:`, reader.error);
        callback(null, error);
    };
    reader.onabort = (e) => {
        const error = new Error('文件读取被中断');
        console.warn(`readImageFile: 文件读取被中断 - ${file.name}`);
        callback(null, error);
    };
    
    try {
        reader.readAsDataURL(file);
    } catch (error) {
        console.error(`readImageFile: 启动读取失败 - ${file.name}:`, error);
        callback(null, new Error(`启动文件读取失败: ${error.message}`));
    }
}

// ==================== 数据加载和保存 ====================

/**
 * 从存储加载所有数据
 */
async function loadSavedData() {
    try {
        // 请求持久化存储权限
        await requestPersistentStorage();
        
        // 默认未登录状态（每次打开页面都是未登录，需要重新输入账号密码）
        // 不加载保存的登录状态，确保每次打开都是未登录状态
        AppState.isLoggedIn = false;

        // 加载主题（无论登录状态都应用已保存的主题）
        const savedTheme = await getStorage(CONFIG.STORAGE_KEYS.CURRENT_THEME);
        applyTheme(savedTheme || CONFIG.DEFAULT_THEME);

        // 加载说说数据
        AppState.posts = await getStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, []);
        
        // 兼容旧数据：为没有 isPinned 字段的说说添加默认值
        let hasOldPostData = false;
        AppState.posts.forEach(post => {
            if (post.isPinned === undefined) {
                post.isPinned = false;
                hasOldPostData = true;
            }
        });
        
        // 如果有旧数据被修改，保存回去
        if (hasOldPostData) {
            await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts);
        }

        // 加载留言
        AppState.messages = await getStorageJSON(CONFIG.STORAGE_KEYS.MESSAGES, []);
        
        // 兼容旧数据：为没有 isPinned 字段的留言添加默认值
        let hasOldData = false;
        AppState.messages.forEach(message => {
            if (message.isPinned === undefined) {
                message.isPinned = false;
                hasOldData = true;
            }
        });
        
        // 如果有旧数据被修改，保存回去
        if (hasOldData) {
            await setStorageJSON(CONFIG.STORAGE_KEYS.MESSAGES, AppState.messages);
        }

        // 加载置顶图片
        const savedImage = await getStorage(CONFIG.STORAGE_KEYS.FEATURE_IMAGE);
        if (savedImage) {
            const img = $('#featureImage');
            if (img) img.src = savedImage;
        }

        // 优先从服务器加载数据（实现多用户共享）
        const serverDataLoaded = await syncServerData();
        
        if (!serverDataLoaded) {
            // 如果服务器不可用，使用本地存储
            // 加载轮播图数据
            const savedCarouselData = await getStorageJSON(CONFIG.STORAGE_KEYS.CAROUSEL_DATA);
            if (savedCarouselData && Array.isArray(savedCarouselData) && savedCarouselData.length > 0) {
                carouselData = savedCarouselData;
            } else {
                carouselData = [...DEFAULT_CAROUSEL_DATA];
            }
        } else {
            // 服务器数据加载成功
            if (!carouselData || carouselData.length === 0) {
                carouselData = [...DEFAULT_CAROUSEL_DATA];
            }
        }

        // 加载网站标题
        await loadSiteTitle();

        // 加载可编辑内容
        await loadEditableContent();
        
        // 恢复信封（自动恢复误操作）
        // 如果信封被销毁了，自动恢复
        const envelopeDestroyed = await getStorage(CONFIG.STORAGE_KEYS.ENVELOPE_DESTROYED);
        if (envelopeDestroyed === 'true') {
            // 自动恢复信封
            await setStorage(CONFIG.STORAGE_KEYS.ENVELOPE_DESTROYED, 'false');
            console.log('信封已自动恢复');
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

/**
 * 加载可编辑内容
 */
async function loadEditableContent() {
    const promises = Array.from($$('.editable')).map(async (el) => {
        const key = el.dataset.key || el.id;
        if (!key) return;

        const saved = await getStorage(key);
        if (saved) {
            if (el.tagName === 'IMG') {
                el.src = saved;
            } else {
                el.textContent = saved;
            }
        }
    });
    await Promise.all(promises);
}

/**
 * 保存单个可编辑元素
 */
async function saveEditableElement(element) {
    if (!element) return;
    
    const key = element.dataset.key || element.id;
    if (!key) return;

    const value = element.tagName === 'IMG' 
        ? element.src 
        : element.textContent.trim();
    
    if (value) {
        // 保存到服务器（共享数据）
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/editable-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            const result = await response.json();
            if (result.success) {
                serverDataCache = null; // 清除缓存
                return;
            }
        } catch (error) {
            console.warn('保存到服务器失败，使用本地存储:', error);
        }
        
        // 回退到本地存储
        await setStorage(key, value);
    }
}

/**
 * 检查登录状态并启用编辑模式
 */
function checkLoginStatusOnLoad() {
    if (AppState.isLoggedIn) {
        enableEditableElements();
    }
}

// ==================== 登录和权限管理 ====================

/**
 * 处理登录
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = $('#username')?.value || '';
    const password = $('#password')?.value || '';
    const errorMsg = $('#loginError');

    if (username === CONFIG.LOGIN_USERNAME && password === CONFIG.LOGIN_PASSWORD) {
        AppState.isLoggedIn = true;
        // 登录成功后，只在当前会话中保持登录状态，不保存到存储
        // 这样刷新页面后会自动退出登录，确保安全性
        // 不调用 setStorage，确保登录状态不会被持久化保存
        
        enableEditableElements();
        updateUI();
        
        const loginModal = $('#loginModal');
        const loginForm = $('#loginForm');
        
        if (loginModal) loginModal.classList.remove('show');
        if (loginForm) loginForm.reset();
        if (errorMsg) errorMsg.textContent = '';
        
        showToast('登录成功！现在可以编辑内容了。', 'success');
    } else {
        if (errorMsg) {
            errorMsg.textContent = '账号或密码错误！';
        }
        showToast('登录失败，请检查账号密码', 'error');
    }
}

/**
 * 退出登录
 */
async function logout() {
    AppState.isLoggedIn = false;
    // 清除登录状态，不保存到存储，确保下次打开是未登录状态
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.IS_LOGGED_IN);
        // 同时从 IndexedDB 中删除（如果有）
        try {
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(CONFIG.STORAGE_KEYS.IS_LOGGED_IN);
        } catch (e) {
            // 忽略错误
        }
    } catch (e) {
        // 忽略错误
    }
    
    disableEditableElements();
    updateUI();
    
    showToast('已退出登录', 'info');
}

/**
 * 启用所有可编辑元素
 */
function enableEditableElements() {
    $$('.editable').forEach(element => {
        element.setAttribute('contenteditable', 'true');
        element.classList.add('editable-hint');
    });
    
    // 启用网站标题的可编辑性
    updateSiteTitleEditability();
}

/**
 * 禁用所有可编辑元素
 */
function disableEditableElements() {
    $$('.editable').forEach(element => {
        element.setAttribute('contenteditable', 'false');
        element.classList.remove('editable-hint');
    });
    
    // 禁用网站标题的可编辑性
    updateSiteTitleEditability();
}

/**
 * 更新网站标题的可编辑状态
 */
function updateSiteTitleEditability() {
    const siteTitle = $('#site-title');
    if (!siteTitle) return;
    
    if (AppState.isLoggedIn) {
        siteTitle.setAttribute('contenteditable', 'true');
        siteTitle.classList.add('editable-hint');
    } else {
        siteTitle.setAttribute('contenteditable', 'false');
        siteTitle.classList.remove('editable-hint');
    }
}

/**
 * 加载网站标题
 */
async function loadSiteTitle() {
    const siteTitle = $('#site-title');
    if (!siteTitle) return;
    
    const savedTitle = await getStorage(CONFIG.STORAGE_KEYS.SITE_TITLE);
    if (savedTitle) {
        siteTitle.textContent = savedTitle;
    } else {
        // 使用默认标题
        siteTitle.textContent = '我的个人网站';
    }
}

/**
 * 保存网站标题
 */
async function saveSiteTitle() {
    const siteTitle = $('#site-title');
    if (!siteTitle) return;
    
    const titleText = siteTitle.textContent.trim();
    
    // 如果标题为空，恢复默认标题
    if (!titleText) {
        siteTitle.textContent = '我的个人网站';
        await setStorage(CONFIG.STORAGE_KEYS.SITE_TITLE, '我的个人网站');
        return;
    }
    
    // 保存标题
    await setStorage(CONFIG.STORAGE_KEYS.SITE_TITLE, titleText);
}

/**
 * 更新 UI 状态
 */
async function updateUI() {
    const isLoggedIn = AppState.isLoggedIn;
    const display = (el, show) => {
        if (el) el.style.display = show ? 'block' : 'none';
    };

    display($('#loginBtn'), !isLoggedIn);
    display($('#logoutBtn'), isLoggedIn);
    display($('#uploadImageBtn'), isLoggedIn);
    display($('#addPostBtn'), isLoggedIn);
    // 发布说说区域只有登录用户可见
    display($('#publishSection'), isLoggedIn);

    // 信封图标：只有登录且未销毁时显示
    if (isLoggedIn) {
        const envelopeDestroyed = await getStorage(CONFIG.STORAGE_KEYS.ENVELOPE_DESTROYED);
        const envelopeIcon = $('#envelopeIcon');
        if (envelopeIcon) {
            envelopeIcon.style.display = envelopeDestroyed === 'true' ? 'none' : 'flex';
        }
    } else {
        display($('#envelopeIcon'), false);
    }

    // 控制主题切换器的显示/隐藏
    const themeSwitcher = $('#theme-switcher');
    
    if (isLoggedIn) {
        // 已登录：显示主题切换器
        if (themeSwitcher) {
            themeSwitcher.style.display = 'flex';
        }
        // 启用所有主题按钮
        $$('.theme-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        });
    } else {
        // 未登录：隐藏主题切换器
        if (themeSwitcher) {
            themeSwitcher.style.display = 'none';
        }
        // 禁用所有主题按钮（防止通过控制台调用）
        $$('.theme-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.5';
        });
    }

    if (isLoggedIn) {
        enableEditableElements();
    } else {
        disableEditableElements();
    }
    
    // 更新说说列表（刷新按钮显示状态）
    renderPosts();
    
    // 更新留言列表（刷新按钮显示状态）
    renderMessages();
}

// ==================== 主题切换 ====================

/**
 * 内部函数：应用主题样式（不涉及权限检查和保存）
 * @param {string} theme 主题名称
 */
function applyThemeInternal(theme) {
    if (!theme) return;
    
    AppState.currentTheme = theme;
    
    const themeClass = CONFIG.THEME_MAP[theme] || CONFIG.THEME_MAP[CONFIG.DEFAULT_THEME];
    const oldThemeClasses = Object.values(CONFIG.THEME_MAP);
    
    document.body.classList.remove(...oldThemeClasses);
    document.body.classList.add(themeClass);
    
    updateThemeButtons();
}

/**
 * 应用主题（用于加载时，无论登录状态都应用）
 * @param {string} theme 主题名称
 */
function applyTheme(theme) {
    applyThemeInternal(theme);
}

/**
 * 切换主题（仅登录用户可调用，会保存到存储）
 * @param {string} theme 主题名称
 */
async function switchTheme(theme) {
    // 权限检查：如果未登录，静默返回（不弹提示，控件已隐藏）
    if (!AppState.isLoggedIn) {
        return;
    }
    
    // 应用主题
    applyThemeInternal(theme);
    
    // 保存到存储（仅登录用户）
    await setStorage(CONFIG.STORAGE_KEYS.CURRENT_THEME, theme);
}

/**
 * 更新主题按钮状态
 */
function updateThemeButtons() {
    $$('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === AppState.currentTheme);
    });
}

// ==================== 模态框管理 ====================

/**
 * 显示登录模态框
 */
function showLoginModal() {
    const modal = $('#loginModal');
    const username = $('#username');
    
    if (modal) modal.classList.add('show');
    if (username) username.focus();
}

/**
 * 显示发布动态模态框
 */
function showPostModal() {
    const modal = $('#postModal');
    const postText = $('#postText');
    
    if (modal) modal.classList.add('show');
    if (postText) postText.focus();
}

/**
 * 关闭模态框
 */
function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('show');
    }
}

/**
 * 显示信封模态框
 */
function showEnvelopeModal() {
    const modal = $('#envelopeModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * 销毁信封
 */
async function destroyEnvelope() {
    if (!confirm('确定要销毁这封信吗？销毁后将无法再查看。')) {
        return;
    }
    
    await setStorage(CONFIG.STORAGE_KEYS.ENVELOPE_DESTROYED, 'true');
    
    // 关闭模态框
    const modal = $('#envelopeModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    // 隐藏信封图标
    const envelopeIcon = $('#envelopeIcon');
    if (envelopeIcon) {
        envelopeIcon.style.display = 'none';
    }
    
    showToast('信封已销毁', 'info');
}

/**
 * 恢复信封（用于误操作恢复）
 */
async function restoreEnvelope() {
    await setStorage(CONFIG.STORAGE_KEYS.ENVELOPE_DESTROYED, 'false');
    
    // 显示信封图标
    const envelopeIcon = $('#envelopeIcon');
    if (envelopeIcon && AppState.isLoggedIn) {
        envelopeIcon.style.display = 'flex';
    }
    
    showToast('信封已恢复', 'success');
}

// ==================== 图片上传 ====================

/**
 * 处理图片上传（通用函数）
 */
function handleImageUpload(file, callback) {
    readImageFile(file, (result, error) => {
        if (error) {
            showToast(error.message || '图片上传失败', 'error');
            return;
        }
        callback(result);
    });
}

// ==================== 说说功能 ====================

/**
 * 处理说说发布（仅登录用户可以使用）
 */
async function handleTimelinePostSubmit(e) {
    e.preventDefault();
    
    // 检查登录状态
    if (!AppState.isLoggedIn) {
        showToast('请先登录后再发布说说', 'warning');
        return;
    }
    
    const textInput = $('#timelinePostText');
    const imagePreview = $('#timelinePostImagePreview');
    const imageInput = $('#timelinePostImage');
    
    if (!textInput) return;
    
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('请输入说说内容！', 'warning');
        textInput.focus();
        return;
    }

    // 获取图片数据（如果有）
    let imageData = null;
    if (imagePreview && imagePreview.style.display !== 'none' && imagePreview.src) {
        // 确保 src 是完整的 base64 数据
        const src = imagePreview.src;
        if (src.startsWith('data:image/')) {
            imageData = src;
        } else {
            console.warn('图片数据格式不正确:', src.substring(0, 50));
        }
    }

    const post = {
        id: Date.now(),
        text: text,
        image: imageData,  // 添加图片字段
        date: new Date().toLocaleString('zh-CN'),
        isPinned: false  // 新说说默认不置顶
    };

    AppState.posts.unshift(post);
    
    // 保存到存储，检查是否成功
    const saveSuccess = await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts);
    if (!saveSuccess) {
        // 如果保存失败，可能是因为数据太大，尝试移除图片数据重试
        console.warn('保存失败，可能是数据太大。尝试保存不包含图片的版本...');
        const postWithoutImage = { ...post, image: null };
        AppState.posts[0] = postWithoutImage;
        if (await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts)) {
            showToast('文字保存成功，但图片过大无法保存', 'warning');
        } else {
            showToast('保存失败，请检查浏览器存储空间', 'error');
            // 移除刚才添加的数据
            AppState.posts.shift();
            return;
        }
    }
    
    renderPosts();
    
    // 清空表单
    textInput.value = '';
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
    }
    
    showToast('发布成功！', 'success');
}

/**
 * 处理模态框发布动态（已废弃，保留用于向后兼容）
 */
async function handlePostSubmit(e) {
    e.preventDefault();
    
    const textInput = $('#postText');
    const imagePreview = $('#postImagePreview');
    
    if (!textInput) return;
    
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('请输入说说内容！', 'warning');
        textInput.focus();
        return;
    }

    // 获取图片数据（如果有）
    let imageData = null;
    if (imagePreview && imagePreview.style.display !== 'none' && imagePreview.src) {
        const src = imagePreview.src;
        if (src.startsWith('data:image/')) {
            imageData = src;
        } else {
            console.warn('图片数据格式不正确:', src.substring(0, 50));
        }
    }

    const post = {
        id: Date.now(),
        text: text,
        image: imageData,
        date: new Date().toLocaleString('zh-CN'),
        isPinned: false
    };

    AppState.posts.unshift(post);
    
    // 保存到存储，检查是否成功
    const saveSuccess = await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts);
    if (!saveSuccess) {
        console.warn('保存失败，可能是数据太大。尝试保存不包含图片的版本...');
        const postWithoutImage = { ...post, image: null };
        AppState.posts[0] = postWithoutImage;
        if (await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts)) {
            showToast('文字保存成功，但图片过大无法保存', 'warning');
        } else {
            showToast('保存失败，请检查浏览器存储空间', 'error');
            AppState.posts.shift();
            return;
        }
    }
    
    renderPosts();
    
    const postModal = $('#postModal');
    const postForm = $('#postForm');
    
    if (postModal) postModal.classList.remove('show');
    if (postForm) postForm.reset();
    if (imagePreview) imagePreview.style.display = 'none';
    
    showToast('发布成功！', 'success');
}

/**
 * 渲染说说列表
 * @param {boolean} showAll - 是否显示所有说说（用于 all-posts.html 页面）
 */
function renderPosts(showAll = false) {
    const container = $('#timelinePosts');
    if (!container) return;

    // 自动检测当前页面是否是所有说说页面
    const isAllPostsPage = window.location.pathname.includes('/all-posts') || window.location.pathname.includes('all-posts.html');
    const shouldShowAll = showAll || isAllPostsPage;

    if (AppState.posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">还没有说说，发布第一条吧~</p>';
        return;
    }

    // 排序：先显示置顶说说，然后按时间倒序（最新的在前）
    const sortedPosts = [...AppState.posts].sort((a, b) => {
        // 如果一条置顶，一条不置顶，置顶的在前面
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 如果都置顶或都不置顶，按ID（时间戳）倒序
        return b.id - a.id;
    });

    // 如果是 all-posts.html 页面，显示所有说说；否则只显示最近5条
    const displayPosts = shouldShowAll ? sortedPosts : sortedPosts.slice(0, 5);
    // 在 all-posts.html 页面不显示"查看更多"链接
    const hasMorePosts = !shouldShowAll && AppState.posts.length > 5;

    const isLoggedIn = AppState.isLoggedIn;

    container.innerHTML = displayPosts.map(post => `
        <div class="timeline-post ${post.isPinned ? 'post-pinned' : ''}" data-id="${post.id}">
            <div class="post-header">
                <div class="post-header-left">
                    ${post.isPinned ? '<span class="pinned-badge-post">📌 置顶</span>' : ''}
                    <span class="post-date">${escapeHtml(post.date)}</span>
                </div>
                ${isLoggedIn ? `
                    <div class="post-actions">
                        <button class="btn-pin-post" onclick="pinPost(${post.id})" aria-label="${post.isPinned ? '取消置顶' : '置顶'}">
                            ${post.isPinned ? '取消置顶' : '置顶'}
                        </button>
                        <button class="delete-post" onclick="deletePost(${post.id})" aria-label="删除说说">删除</button>
                    </div>
                ` : ''}
            </div>
            <div class="post-content">${escapeHtml(post.text)}</div>
            ${post.image ? `<img src="${escapeHtml(post.image)}" alt="说说图片" class="post-image">` : ''}
        </div>
    `).join('') + (hasMorePosts ? `
        <div class="view-more-container">
            <a href="/all-posts" class="view-more-link">查看更多说说...</a>
        </div>
    ` : '');
}

/**
 * 置顶/取消置顶说说（仅管理员可用）
 */
async function pinPost(postId) {
    // 权限检查：只有登录用户才能置顶
    if (!AppState.isLoggedIn) {
        showToast('请先登录', 'warning');
        return;
    }

    // 找到目标说说
    const post = AppState.posts.find(p => p.id === postId);
    if (!post) {
        showToast('说说不存在', 'error');
        return;
    }

    // 如果当前说说要置顶，先取消所有其他说说的置顶
    if (!post.isPinned) {
        AppState.posts.forEach(p => {
            if (p.isPinned) {
                p.isPinned = false;
            }
        });
        post.isPinned = true;
        showToast('已置顶', 'success');
    } else {
        // 取消置顶
        post.isPinned = false;
        showToast('已取消置顶', 'info');
    }

    // 保存到存储
    await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts);
    
    // 重新渲染说说列表
    renderPosts();
}

/**
 * 删除说说（仅管理员可用）
 */
async function deletePost(id) {
    // 权限检查：只有登录用户才能删除
    if (!AppState.isLoggedIn) {
        showToast('请先登录', 'warning');
        return;
    }

    // 确认删除
    if (!confirm('确定要删除这条说说吗？')) {
        return;
    }
    
    // 从数组中移除
    const index = AppState.posts.findIndex(post => post.id === id);
    if (index === -1) {
        showToast('说说不存在', 'error');
        return;
    }

    AppState.posts.splice(index, 1);
    
    // 保存到存储
    await setStorageJSON(CONFIG.STORAGE_KEYS.TIMELINE_POSTS, AppState.posts);
    
    // 重新渲染说说列表
    renderPosts();
    
    showToast('删除成功', 'success');
}

// ==================== 轮播图功能 ====================

/**
 * 初始化轮播图（渲染图片和指示器）
 * 完全根据 carouselData 数组的实际数量动态渲染，支持任意数量的图片
 */
function initCarousel() {
    const slidesContainer = $('#carouselSlides');
    const indicatorsContainer = $('#carouselIndicators');
    
    if (!slidesContainer || !indicatorsContainer) return;
    
    // 检查数据是否为空
    if (!carouselData || carouselData.length === 0) {
        console.warn('轮播数据为空，无法初始化轮播');
        slidesContainer.innerHTML = '';
        indicatorsContainer.innerHTML = '';
        return;
    }
    
    // 清空容器
    slidesContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // 根据实际数据数量动态渲染图片和指示器
    carouselData.forEach((item, index) => {
        // 验证数据项是否有效
        if (!item || !item.imageUrl) {
            console.warn(`轮播数据项 ${index} 无效，已跳过`);
            return;
        }
        
        const slide = document.createElement('div');
        slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slide.setAttribute('data-index', index);
        
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = `轮播图 ${index + 1}`;
        img.className = 'carousel-image';
        img.loading = index === 0 ? 'eager' : 'lazy';
        
        // 图片加载错误处理
        img.onerror = function() {
            console.error(`轮播图 ${index + 1} 加载失败: ${item.imageUrl}`);
            this.style.display = 'none';
        };
        
        slide.appendChild(img);
        slidesContainer.appendChild(slide);
        
        // 创建指示器
        const indicator = document.createElement('button');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.setAttribute('type', 'button');
        indicator.setAttribute('role', 'tab');
        indicator.setAttribute('aria-label', `跳转到第 ${index + 1} 张图片`);
        indicator.setAttribute('data-index', index);
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });
    
    // 重置索引，确保在有效范围内
    currentCarouselIndex = 0;
    
    // 初始化显示第一张
    updateCarousel();
}

/**
 * 更新轮播图显示（图片、文字、指示器）
 * 支持动态数量的图片
 */
function updateCarousel() {
    if (!carouselData || carouselData.length === 0) return;
    
    // 确保索引在有效范围内
    if (currentCarouselIndex < 0 || currentCarouselIndex >= carouselData.length) {
        currentCarouselIndex = 0;
    }
    
    const currentData = carouselData[currentCarouselIndex];
    const slides = $$('.carousel-slide');
    const indicators = $$('.carousel-indicator');
    const titleElement = $('#featureTitle');
    const textElement = $('#featureText');
    
    // 更新图片显示
    slides.forEach((slide, index) => {
        if (index === currentCarouselIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    // 更新指示器
    indicators.forEach((indicator, index) => {
        if (index === currentCarouselIndex) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-selected', 'true');
        } else {
            indicator.classList.remove('active');
            indicator.setAttribute('aria-selected', 'false');
        }
    });
    
    // 更新文字内容（智能更新：仅在未保存自定义内容时更新）
    if (textElement && currentData.description) {
        (async () => {
            const savedText = await getStorage('featureText');
            const currentText = textElement.textContent.trim();
            
            // 检查是否为默认文字或是否匹配轮播数据中的某个描述
            const isDefaultText = currentText.includes('这里是功能1的介绍文字');
            const isCarouselText = carouselData.some(item => item.description === currentText);
            
            // 如果用户没有保存自定义内容，或者是默认/轮播文字，则更新
            if (!savedText || isDefaultText || isCarouselText) {
                // 使用requestAnimationFrame确保DOM更新在下一帧，避免影响editable状态
                requestAnimationFrame(() => {
                    if (textElement) {
                        textElement.textContent = currentData.description;
                    }
                });
            }
        })();
    }
}

/**
 * 切换到下一张
 * 支持动态数量的图片
 */
function nextSlide() {
    if (!carouselData || carouselData.length === 0) return;
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselData.length;
    updateCarousel();
    resetAutoPlay();
}

/**
 * 切换到上一张
 * 支持动态数量的图片
 */
function prevSlide() {
    if (!carouselData || carouselData.length === 0) return;
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselData.length) % carouselData.length;
    updateCarousel();
    resetAutoPlay();
}

/**
 * 跳转到指定索引的图片
 * @param {number} index 目标索引
 * 支持动态数量的图片
 */
function goToSlide(index) {
    if (!carouselData || carouselData.length === 0) return;
    if (index < 0 || index >= carouselData.length) return;
    currentCarouselIndex = index;
    updateCarousel();
    resetAutoPlay();
}

/**
 * 开始自动播放
 * 支持动态数量的图片，只有在有图片时才自动播放
 */
function startAutoPlay() {
    // 如果没有数据或只有一张图片，不启动自动播放
    if (!carouselData || carouselData.length <= 1) return;
    
    stopAutoPlay(); // 先清除可能存在的定时器
    carouselAutoPlayTimer = setInterval(() => {
        nextSlide();
    }, CAROUSEL_CONFIG.AUTO_PLAY_INTERVAL);
}

/**
 * 停止自动播放
 */
function stopAutoPlay() {
    if (carouselAutoPlayTimer) {
        clearInterval(carouselAutoPlayTimer);
        carouselAutoPlayTimer = null;
    }
    // 同时清除延迟恢复定时器
    if (carouselResumeTimer) {
        clearTimeout(carouselResumeTimer);
        carouselResumeTimer = null;
    }
}

/**
 * 重置自动播放（用于手动切换后重新开始计时）
 * 手动切换后暂停自动播放，并在指定延迟后恢复
 */
function resetAutoPlay() {
    stopAutoPlay();
    
    // 清除之前可能存在的延迟恢复定时器
    if (carouselResumeTimer) {
        clearTimeout(carouselResumeTimer);
        carouselResumeTimer = null;
    }
    
    // 设置延迟恢复自动播放
    carouselResumeTimer = setTimeout(() => {
        startAutoPlay();
        carouselResumeTimer = null;
    }, CAROUSEL_CONFIG.MANUAL_RESUME_DELAY);
}

/**
 * 保存轮播图数据到 localStorage
 * @param {Array} data 轮播图数据数组，如果为空则使用当前 carouselData
 * @returns {boolean} 是否保存成功
 */
async function saveCarouselData(data = null) {
    const dataToSave = data || carouselData;
    
    // 验证数据有效性
    if (!Array.isArray(dataToSave)) {
        console.error('轮播数据必须是数组格式');
        showToast('数据格式错误，无法保存', 'error');
        return false;
    }
    
    // 验证每个数据项
    const validData = dataToSave.filter(item => {
        return item && typeof item === 'object' && item.imageUrl;
    });
    
    if (validData.length === 0) {
        console.warn('没有有效的轮播数据可保存');
        showToast('至少需要保留一张图片', 'warning');
        return false;
    }
    
    // 检查数据大小
    const jsonString = JSON.stringify(validData);
    const sizeInMB = new Blob([jsonString]).size / 1024 / 1024;
    
    if (sizeInMB > 50) {
        showToast(`图片数据太大 (${sizeInMB.toFixed(2)}MB)，请减少图片数量或压缩图片`, 'error');
        console.error(`轮播图数据过大: ${sizeInMB.toFixed(2)}MB`);
        return false;
    }
    
    // 保存到存储
    try {
        const success = await setStorageJSON(CONFIG.STORAGE_KEYS.CAROUSEL_DATA, validData);
        
        if (success) {
            // 更新当前数据
            carouselData = validData;
            // 重新初始化轮播（确保立即更新显示）
            initCarousel();
            console.log(`轮播图保存成功，共 ${validData.length} 张图片，大小 ${sizeInMB.toFixed(2)}MB`);
            return true;
        } else {
            showToast('保存失败，可能是浏览器存储空间不足，请尝试减少图片数量', 'error');
            console.error('轮播图保存失败');
            return false;
        }
    } catch (error) {
        console.error('保存轮播图时发生错误:', error);
        showToast(`保存失败: ${error.message || '未知错误'}`, 'error');
        return false;
    }
}

/**
 * 更新轮播图数据并重新渲染
 * @param {Array} newData 新的轮播图数据数组
 * @returns {boolean} 是否更新成功
 */
async function updateCarouselData(newData) {
    if (!Array.isArray(newData)) {
        console.error('轮播数据必须是数组格式');
        return false;
    }
    
    // 保存数据
    const success = await saveCarouselData(newData);
    
    if (success) {
        // 重置索引
        currentCarouselIndex = 0;
        // 停止自动播放
        stopAutoPlay();
        // 重新初始化
        initCarousel();
        // 如果有足够的数据，重新开始自动播放
        if (carouselData.length > 1) {
            startAutoPlay();
        }
    }
    
    return success;
}

// ==================== 轮播图管理功能 ====================

/**
 * 显示轮播图管理模态框
 */
function showCarouselManageModal() {
    console.log('showCarouselManageModal 被调用');
    
    // 检查登录状态
    if (!AppState.isLoggedIn) {
        showToast('请先登录后再管理轮播图', 'warning');
        showLoginModal();
        return;
    }
    
    const modal = $('#carouselManageModal');
    if (!modal) {
        console.error('未找到模态框: #carouselManageModal');
        showToast('无法打开图片管理窗口', 'error');
        return;
    }
    
    // 渲染轮播图片列表
    renderCarouselImageList();
    
    // 显示模态框
    modal.classList.add('show');
    console.log('模态框已显示');
}

/**
 * 渲染轮播图片列表
 */
function renderCarouselImageList() {
    const container = $('#carouselImageList');
    if (!container) return;
    
    if (!carouselData || carouselData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">暂无轮播图片，请添加图片</p>';
        return;
    }
    
    container.innerHTML = carouselData.map((item, index) => `
        <div class="carousel-manage-item" data-index="${index}">
            <div class="carousel-item-preview">
                <img src="${escapeHtml(item.imageUrl)}" alt="轮播图 ${index + 1}" class="carousel-item-image">
                <div class="carousel-item-overlay">
                    <button type="button" class="btn-remove-image" onclick="removeCarouselImage(${index})" aria-label="删除图片">🗑️ 删除</button>
                </div>
            </div>
            <div class="carousel-item-info">
                <label>描述（可选）：</label>
                <textarea class="carousel-item-description" data-index="${index}" placeholder="输入图片描述...">${escapeHtml(item.description || '')}</textarea>
            </div>
        </div>
    `).join('');
}

/**
 * 删除轮播图片
 * @param {number} index 图片索引
 */
function removeCarouselImage(index) {
    if (!carouselData || index < 0 || index >= carouselData.length) return;
    
    if (confirm('确定要删除这张图片吗？')) {
        // 创建新数组，移除指定索引的项
        const newData = [...carouselData];
        newData.splice(index, 1);
        
        // 重新渲染列表（不保存，等待用户点击保存按钮）
        carouselData = newData;
        renderCarouselImageList();
    }
}

/**
 * 添加轮播图片
 * @param {FileList} files 图片文件列表
 */
function addCarouselImages(files) {
    if (!files || files.length === 0) {
        showToast('请选择图片文件', 'warning');
        return;
    }
    
    // 先过滤出有效的图片文件
    const validFiles = Array.from(files).filter(file => {
        if (!file.type || !file.type.startsWith('image/')) {
            showToast(`${file.name} 不是有效的图片文件`, 'warning');
            return false;
        }
        
        // 检查文件大小（单个文件不超过 10MB）
        const sizeInMB = file.size / 1024 / 1024;
        if (sizeInMB > 10) {
            showToast(`${file.name} 太大 (${sizeInMB.toFixed(2)}MB)，请选择小于 10MB 的图片`, 'warning');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length === 0) {
        showToast('没有有效的图片文件', 'warning');
        return;
    }
    
    // 显示处理中提示
    showToast(`正在处理 ${validFiles.length} 张图片...`, 'info');
    
    let processedCount = 0;
    let errorCount = 0;
    const newImages = [];
    const baseIndex = carouselData.length; // 保存基础索引，用于计算描述
    
    validFiles.forEach((file, index) => {
        readImageFile(file, (imageData, error) => {
            processedCount++;
            
            if (error) {
                errorCount++;
                console.error(`读取图片失败 (${file.name}):`, error);
                showToast(`读取图片失败: ${file.name} - ${error.message || '未知错误'}`, 'error');
            } else {
                // 验证图片数据
                if (!imageData || !imageData.startsWith('data:image/')) {
                    errorCount++;
                    showToast(`${file.name} 数据格式无效`, 'error');
                } else {
                    // 使用成功添加的图片数量来计算索引
                    const imageIndex = baseIndex + newImages.length + 1;
                    newImages.push({
                        imageUrl: imageData,
                        description: `新添加的图片 ${imageIndex}`
                    });
                }
            }
            
            // 所有有效文件处理完成后，更新列表
            if (processedCount === validFiles.length) {
                if (newImages.length > 0) {
                    carouselData = [...carouselData, ...newImages];
                    renderCarouselImageList();
                    const successMsg = `成功添加 ${newImages.length} 张图片${errorCount > 0 ? `，${errorCount} 张失败` : ''}。请点击"保存更改"按钮保存。`;
                    showToast(successMsg, 'success');
                    console.log(`成功添加 ${newImages.length} 张图片到轮播图`);
                } else if (errorCount > 0) {
                    showToast(`所有图片读取失败，请检查文件格式和大小`, 'error');
                }
            }
        });
    });
}

/**
 * 保存轮播图更改
 */
async function saveCarouselChanges() {
    const container = $('#carouselImageList');
    if (!container) {
        showToast('无法找到图片列表容器', 'error');
        return;
    }
    
    if (!carouselData || carouselData.length === 0) {
        showToast('至少需要保留一张图片', 'warning');
        return;
    }
    
    // 显示保存中提示
    showToast('正在保存...', 'info');
    
    // 收集所有图片的描述
    const descriptions = container.querySelectorAll('.carousel-item-description');
    const updatedData = carouselData.map((item, index) => {
        const descElement = container.querySelector(`.carousel-item-description[data-index="${index}"]`);
        return {
            imageUrl: item.imageUrl,
            description: descElement ? descElement.value.trim() || item.description || '' : item.description || ''
        };
    });
    
    // 验证数据
    if (updatedData.length === 0) {
        showToast('至少需要保留一张图片', 'warning');
        return;
    }
    
    // 更新数据并保存
    try {
        const success = await updateCarouselData(updatedData);
        
        if (success) {
            // 确保轮播图立即更新显示
            setTimeout(() => {
                initCarousel();
                if (carouselData.length > 1) {
                    startAutoPlay();
                }
            }, 100);
            
            // 关闭模态框
            const modal = $('#carouselManageModal');
            if (modal) modal.classList.remove('show');
            
            showToast('轮播图更新成功！', 'success');
        } else {
            showToast('保存失败，可能是浏览器存储空间不足或网络问题，请重试', 'error');
        }
    } catch (error) {
        console.error('保存轮播图时发生错误:', error);
        showToast(`保存失败: ${error.message || '未知错误'}`, 'error');
    }
}

/**
 * 取消轮播图编辑
 */
async function cancelCarouselEdit() {
    // 重新加载原始数据
    const savedCarouselData = await getStorageJSON(CONFIG.STORAGE_KEYS.CAROUSEL_DATA);
    if (savedCarouselData && Array.isArray(savedCarouselData) && savedCarouselData.length > 0) {
        carouselData = savedCarouselData;
    } else {
        carouselData = [...DEFAULT_CAROUSEL_DATA];
    }
    
    // 关闭模态框
    const modal = $('#carouselManageModal');
    if (modal) modal.classList.remove('show');
}

/**
 * 初始化轮播图管理相关事件
 */
function initCarouselManageEvents() {
    // 保存按钮
    const saveBtn = $('#saveCarouselBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCarouselChanges);
    }
    
    // 取消按钮
    const cancelBtn = $('#cancelCarouselBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelCarouselEdit);
    }
    
    // 添加图片按钮
    const uploadInput = $('#carouselImageUpload');
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                console.log('选择文件:', files.length, '个');
                addCarouselImages(files);
                // 清空input，允许重复选择同一文件
                e.target.value = '';
            } else {
                console.warn('未选择文件');
            }
        });
        
        // 确保点击 label 时能触发文件选择
        const uploadLabel = document.querySelector('label[for="carouselImageUpload"]');
        if (uploadLabel) {
            uploadLabel.addEventListener('click', (e) => {
                // 如果点击的是 label 本身，确保触发 input
                if (e.target === uploadLabel || uploadLabel.contains(e.target)) {
                    // label 的默认行为会触发 input，这里不需要额外操作
                    console.log('点击了上传按钮');
                }
            });
        }
    } else {
        console.error('未找到文件上传输入框: #carouselImageUpload');
    }
}

// 挂载全局函数供HTML调用
window.removeCarouselImage = removeCarouselImage;

// ==================== 留言板功能 ====================

/**
 * 置顶/取消置顶留言
 */
async function pinMessage(messageId) {
    // 找到目标留言
    const message = AppState.messages.find(m => m.id === messageId);
    if (!message) {
        showToast('留言不存在', 'error');
        return;
    }

    // 如果当前留言要置顶，先取消所有其他留言的置顶
    if (!message.isPinned) {
        AppState.messages.forEach(m => {
            if (m.isPinned) {
                m.isPinned = false;
            }
        });
        message.isPinned = true;
        showToast('已置顶', 'success');
    } else {
        // 取消置顶
        message.isPinned = false;
        showToast('已取消置顶', 'info');
    }

    // 保存到存储
    await setStorageJSON(CONFIG.STORAGE_KEYS.MESSAGES, AppState.messages);
    
    // 重新渲染留言列表
    renderMessages();
}

/**
 * 删除留言
 */
async function deleteMessage(messageId) {
    // 确认删除
    if (!confirm('确定要删除这条留言吗？')) {
        return;
    }

    // 从数组中移除
    const index = AppState.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
        showToast('留言不存在', 'error');
        return;
    }

    AppState.messages.splice(index, 1);
    
    // 保存到存储
    await setStorageJSON(CONFIG.STORAGE_KEYS.MESSAGES, AppState.messages);
    
    // 重新渲染留言列表
    renderMessages();
    
    showToast('删除成功', 'success');
}

/**
 * 处理留言提交
 */
async function handleMessageSubmit() {
    const input = $('#messageInput');
    if (!input) return;
    
    const text = input.value.trim();
    
    if (!text) {
        showToast('请输入留言内容！', 'warning');
        input.focus();
        return;
    }

    if (text.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showToast(`留言内容过长，请控制在${CONFIG.MAX_MESSAGE_LENGTH}字以内！`, 'warning');
        input.focus();
        return;
    }

    const message = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('zh-CN'),
        isPinned: false  // 新留言默认不置顶
    };

    AppState.messages.unshift(message);
    await setStorageJSON(CONFIG.STORAGE_KEYS.MESSAGES, AppState.messages);
    
    input.value = '';
    renderMessages();
    showToast('留言成功！', 'success');
    
    // 滚动到最新留言
    const messagesList = $('#messagesList');
    if (messagesList?.firstElementChild) {
        messagesList.firstElementChild.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }
}

/**
 * 渲染留言列表
 * @param {boolean} showAll - 是否显示所有留言（用于 all-messages.html 页面）
 */
function renderMessages(showAll = false) {
    const container = $('#messagesList');
    if (!container) return;
    
    // 自动检测当前页面是否是所有留言页面
    const isAllMessagesPage = window.location.pathname.includes('/all-messages') || window.location.pathname.includes('all-messages.html');
    const shouldShowAll = showAll || isAllMessagesPage;

    if (AppState.messages.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 1rem;">还没有留言，来留下第一条吧~</p>';
        return;
    }

    // 排序：先显示置顶留言，然后按时间倒序（最新的在前）
    const sortedMessages = [...AppState.messages].sort((a, b) => {
        // 如果一条置顶，一条不置顶，置顶的在前面
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 如果都置顶或都不置顶，按ID（时间戳）倒序
        return b.id - a.id;
    });

    // 如果是 all-messages.html 页面，显示所有留言；否则只显示最近5条
    const displayMessages = shouldShowAll ? sortedMessages : sortedMessages.slice(0, 5);
    // 在 all-messages.html 页面不显示"查看更多"链接
    const hasMoreMessages = !shouldShowAll && AppState.messages.length > 5;

    const isLoggedIn = AppState.isLoggedIn;

    container.innerHTML = displayMessages.map(message => `
        <div class="message-item ${message.isPinned ? 'message-pinned' : ''}" data-message-id="${message.id}">
            <div class="message-header">
                ${message.isPinned ? '<span class="pinned-badge">📌 置顶</span>' : ''}
                ${isLoggedIn ? `
                    <div class="message-actions">
                        <button class="btn-pin" onclick="pinMessage(${message.id})" aria-label="${message.isPinned ? '取消置顶' : '置顶'}">
                            ${message.isPinned ? '取消置顶' : '置顶'}
                        </button>
                        <button class="btn-delete-message" onclick="deleteMessage(${message.id})" aria-label="删除留言">删除</button>
                    </div>
                ` : ''}
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-time">${escapeHtml(message.date)}</div>
        </div>
    `).join('') + (hasMoreMessages ? `
        <div class="view-more-container" style="margin-top: 1rem;">
            <a href="/all-messages" class="view-more-link" style="background-color: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.3); color: rgba(255, 255, 255, 0.9);">查看更多留言...</a>
        </div>
    ` : '');
}

// ==================== 导航栏平滑滚动功能 ====================

/**
 * 导航栏相关配置常量
 */
const NAV_CONFIG = {
    SCROLL_OFFSET: 20, // 滚动偏移量（px）
    TRIGGER_OFFSET: 150, // 触发点偏移量（px）
    SCROLL_COMPLETE_DELAY: 600, // 滚动完成延迟（ms）
    TOP_THRESHOLD: 100, // 页面顶部阈值（px）
    MIN_VISIBLE_RATIO: 0.3, // 最小可见比例
    DEBOUNCE_DELAY: 100 // 防抖延迟（ms）
};

/**
 * 导航栏DOM元素缓存
 */
let navCache = {
    navbar: null,
    sections: null,
    navLinks: null,
    
    /**
     * 初始化缓存
     */
    init() {
        if (!this.navbar) {
            this.navbar = document.querySelector('.navbar');
        }
        if (!this.sections) {
            this.sections = {
                home: document.getElementById('home'),
                posts: document.getElementById('posts')
            };
        }
        if (!this.navLinks) {
            this.navLinks = Array.from($$('.nav-link[data-nav]'));
        }
    },
    
    /**
     * 获取导航栏高度
     */
    getNavbarHeight() {
        this.init();
        return this.navbar ? this.navbar.offsetHeight : 0;
    },
    
    /**
     * 清除缓存（用于页面动态更新后刷新）
     */
    clear() {
        this.navbar = null;
        this.sections = null;
        this.navLinks = null;
    }
};

/**
 * 平滑滚动到指定锚点
 * @param {string} targetId 目标元素的ID
 */
function smoothScrollTo(targetId) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
        console.warn(`目标元素未找到: #${targetId}`);
        return;
    }
    
    navCache.init();
    
    // 计算偏移量（导航栏高度 + 额外间距）
    const navbarHeight = navCache.getNavbarHeight();
    const offset = navbarHeight + NAV_CONFIG.SCROLL_OFFSET;
    
    // 获取目标元素的位置（兼容性处理）
    const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
    const targetPosition = targetElement.getBoundingClientRect().top + scrollY;
    
    // 平滑滚动
    window.scrollTo({
        top: targetPosition - offset,
        behavior: 'smooth'
    });
    
    // 滚动完成后更新active状态
    setTimeout(() => {
        updateNavActiveState();
    }, NAV_CONFIG.SCROLL_COMPLETE_DELAY);
}

/**
 * 计算section的可见比例
 * @param {DOMRect} rect Section的getBoundingClientRect结果
 * @param {number} scrollY 当前滚动位置
 * @param {number} triggerOffset 触发点偏移量
 * @returns {number} 可见比例（0-1）
 */
function calculateVisibleRatio(rect, scrollY, triggerOffset) {
    const sectionTop = rect.top + scrollY;
    const sectionBottom = sectionTop + rect.height;
    const sectionHeight = rect.height;
    
    if (sectionHeight === 0) return 0;
    
    // 计算视口范围
    const viewportTop = scrollY + triggerOffset;
    const viewportBottom = scrollY + window.innerHeight;
    
    // 计算可见部分
    const visibleTop = Math.max(sectionTop, viewportTop);
    const visibleBottom = Math.min(sectionBottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    
    return visibleHeight / sectionHeight;
}

/**
 * 更新导航按钮的active状态
 */
function updateNavActiveState() {
    navCache.init();
    const { navLinks, sections } = navCache;
    
    if (!navLinks || navLinks.length === 0) return;
    
    // 获取当前滚动位置和偏移量（兼容性处理）
    const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
    const navbarHeight = navCache.getNavbarHeight();
    const triggerOffset = navbarHeight + NAV_CONFIG.TRIGGER_OFFSET;
    
    // 如果在页面顶部，激活首页
    if (scrollY < NAV_CONFIG.TOP_THRESHOLD) {
        setActiveNav('home', navLinks);
        return;
    }
    
    // 查找当前可视区域的主要section
    let activeNav = 'home';
    let maxVisibleRatio = 0;
    
    Object.entries(sections).forEach(([nav, section]) => {
        if (!section) return;
        
        const rect = section.getBoundingClientRect();
        const visibleRatio = calculateVisibleRatio(rect, scrollY, triggerOffset);
        const sectionTop = rect.top + scrollY;
        const viewportTop = scrollY + triggerOffset;
        
        // 如果section在触发点上方且有足够的可见比例
        if (sectionTop <= viewportTop && visibleRatio > NAV_CONFIG.MIN_VISIBLE_RATIO) {
            if (visibleRatio > maxVisibleRatio) {
                maxVisibleRatio = visibleRatio;
                activeNav = nav;
            }
        }
    });
    
    // 更新active状态
    setActiveNav(activeNav, navLinks);
}

/**
 * 设置激活的导航按钮
 * @param {string} activeNavName 要激活的导航名称
 * @param {Array} navLinks 导航链接元素数组
 */
function setActiveNav(activeNavName, navLinks) {
    navLinks.forEach(link => {
        const navName = link.getAttribute('data-nav');
        const isActive = navName === activeNavName;
        
        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// ==================== 事件监听器初始化 ====================

/**
 * 初始化所有事件监听器
 */
function initEventListeners() {
    // 移动端菜单切换
    const mobileMenuBtn = $('#mobileMenuBtn');
    const navLinks = $('#navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            // 防止背景滚动
            document.body.style.overflow = !isExpanded ? 'hidden' : '';
        });
        
        // 点击菜单链接后关闭菜单
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // 点击登录/退出按钮后关闭菜单
        $('#loginBtn')?.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        $('#logoutBtn')?.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // 点击菜单外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                if (navLinks.classList.contains('active')) {
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    // 导航栏平滑滚动
    navCache.init();
    navCache.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            // 检查是否是跨页面链接（包含 .html）
            if (href.includes('.html')) {
                // 跨页面链接，允许默认跳转行为
                return; // 不阻止默认行为，让浏览器处理跳转
            }
            
            // 当前页面的锚点链接，使用平滑滚动
            e.preventDefault();
            const targetId = href.startsWith('#') ? href.substring(1) : href;
            if (targetId) {
                smoothScrollTo(targetId);
            }
        });
    });
    
    // 监听滚动事件，更新导航按钮active状态（使用requestAnimationFrame优化）
    let scrollTimeout = null;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(() => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    updateNavActiveState();
                    isScrolling = false;
                }, NAV_CONFIG.DEBOUNCE_DELAY);
            });
        }
    }, { passive: true });
    
    // 登录相关
    $('#loginBtn')?.addEventListener('click', showLoginModal);
    $('#logoutBtn')?.addEventListener('click', logout);
    $('#loginForm')?.addEventListener('submit', handleLogin);

    // 模态框关闭
    $$('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // 信封相关事件
    $('#envelopeIcon')?.addEventListener('click', showEnvelopeModal);
    $('#destroyEnvelopeBtn')?.addEventListener('click', destroyEnvelope);
    
    // 恢复信封（在控制台可以调用 restoreEnvelope() 来恢复）
    window.restoreEnvelope = restoreEnvelope;

    // 主题切换
    $$('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme) switchTheme(theme);
        });
    });

    // 可编辑内容保存
    $$('.editable').forEach(el => {
        el.addEventListener('blur', function() {
            if (this.contentEditable === 'true') {
                saveEditableElement(this);
            }
        });
        
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.blur();
            }
        });
    });
    
    // 网站标题编辑和保存
    const siteTitle = $('#site-title');
    if (siteTitle) {
        // 失去焦点时保存
        siteTitle.addEventListener('blur', function() {
            if (this.contentEditable === 'true') {
                saveSiteTitle();
            }
        });
        
        // 按 Enter 键保存并失去焦点
        siteTitle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
                // 防止编辑时按Esc导致的问题
            if (e.key === 'Escape') {
                // 取消编辑，恢复原始内容
                (async () => {
                    const savedTitle = await getStorage(CONFIG.STORAGE_KEYS.SITE_TITLE) || '我的个人网站';
                    this.textContent = savedTitle;
                    this.blur();
                })();
            }
        });
    }

    // 轮播图导航按钮
    $('#carouselPrevBtn')?.addEventListener('click', prevSlide);
    $('#carouselNextBtn')?.addEventListener('click', nextSlide);
    
    // 轮播图鼠标悬停暂停/恢复自动播放
    const carouselContainer = $('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);
    }
    
    // 轮播图管理
    const uploadBtn = $('#uploadImageBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了更改照片按钮');
            showCarouselManageModal();
        });
    } else {
        console.warn('未找到上传图片按钮: #uploadImageBtn');
    }
    
    // 轮播图管理相关事件
    initCarouselManageEvents();

    // 发布动态
    $('#addPostBtn')?.addEventListener('click', showPostModal);
    $('#postForm')?.addEventListener('submit', handlePostSubmit);

    // 图片预览
    $('#postImage')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        const preview = $('#postImagePreview');
        if (file && preview) {
            handleImageUpload(file, (imageData) => {
                preview.src = imageData;
                preview.style.display = 'block';
            });
        }
    });

    // 留言提交
    $('#submitMessage')?.addEventListener('click', handleMessageSubmit);

    // 说说发布
    $('#timelinePostForm')?.addEventListener('submit', handleTimelinePostSubmit);
    
    // 说说图片上传预览
    $('#timelinePostImage')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        const preview = $('#timelinePostImagePreview');
        if (file && preview) {
            handleImageUpload(file, (imageData) => {
                preview.src = imageData;
                preview.style.display = 'block';
            });
        } else if (preview) {
            preview.style.display = 'none';
        }
    });
    
    // 窗口大小改变时清除导航栏缓存（防抖优化）
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            navCache.clear(); // 清除导航栏缓存，重新计算尺寸
        }, 300);
    }, { passive: true });
}

// ==================== 应用初始化 ====================

/**
 * 应用初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 挂载全局函数供 HTML 中的 onclick 调用
        window.pinMessage = pinMessage;
        window.deleteMessage = deleteMessage;
        window.pinPost = pinPost;  // 说说置顶函数
        window.deletePost = deletePost;  // 说说删除函数
        
        (async () => {
            await loadSavedData();
            checkLoginStatusOnLoad();
            
            // 启动自动同步（定期从服务器获取最新数据）
            startAutoSync();
            
            initEventListeners();
            renderPosts();
            renderMessages();
            updateUI();
            
            // 初始化网站标题可编辑状态
            updateSiteTitleEditability();
            
            // 初始化轮播图
            initCarousel();
            startAutoPlay();
            
            // 初始化导航按钮active状态
            updateNavActiveState();
        })();
    } catch (error) {
        console.error('应用初始化失败:', error);
        showToast('应用加载失败，请刷新页面重试', 'error');
    }
});
