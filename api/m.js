// 短链接API - 使用 Vercel KV (Redis) 高性能存储
const crypto = require('crypto');
const { kv } = require('@vercel/kv');

// 生成短ID (16位)
function generateShortId() {
    return crypto.randomBytes(8).toString('hex');
}

// 创建短链接 - 使用 Vercel KV 高性能存储
async function createShortLink(params) {
    const shortId = generateShortId();
    const linkData = {
        params,
        createdAt: Date.now(),
        accessCount: 0
    };
    
    // 存储到 Vercel KV (Redis) - 速度快10倍+
    await kv.set(`link:${shortId}`, linkData, {
        ex: 60 * 60 * 24 * 30 // 30天过期
    });
    
    console.log('短链接已创建:', shortId);
    
    return shortId;
}

// 获取短链接信息 - 从 Vercel KV 读取 (异步更新计数)
async function getShortLink(shortId) {
    try {
        // 从 KV 读取数据 - 速度极快
        const link = await kv.get(`link:${shortId}`);
        
        if (!link) {
            return null;
        }
        
        // 异步更新访问计数 (不阻塞返回)
        kv.hincrby(`link:${shortId}`, 'accessCount', 1).catch(err => {
            console.error('更新计数失败:', err);
        });
        kv.hset(`link:${shortId}`, 'lastAccessAt', Date.now()).catch(err => {
            console.error('更新访问时间失败:', err);
        });
        
        return link;
    } catch (error) {
        console.error('读取短链接失败:', error);
        return null;
    }
}

module.exports = async (req, res) => {
    const method = req.method;
    const path = req.path || req.url;

    // POST - 创建短链接
    if (method === 'POST') {
        try {
            // 确保 body 被正确解析
            let body = req.body;
            if (!body || Object.keys(body).length === 0) {
                // 尝试手动解析 body
                if (typeof req.body === 'string') {
                    body = JSON.parse(req.body);
                }
            }

            const { refresh_token, client_id, email } = body || {};

            if (!refresh_token || !client_id || !email) {
                return res.status(400).json({
                    error: '缺少必要参数',
                    received: { refresh_token: !!refresh_token, client_id: !!client_id, email: !!email }
                });
            }

            const shortId = await createShortLink({
                refresh_token,
                client_id,
                email,
                mailbox: 'INBOX',
                response_type: 'html'
            });

            const shortUrl = `/m/${shortId}/${email}`;
            
            // 构建完整 URL - 兼容 Vercel 环境
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
            const fullUrl = `${protocol}://${host}${shortUrl}`;

            return res.status(200).json({
                success: true,
                shortId,
                shortUrl,
                fullUrl,
                message: '短链接创建成功'
            });
        } catch (error) {
            console.error('创建短链接失败:', error);
            return res.status(500).json({
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET - 处理短链接访问
    if (method === 'GET') {
        try {
            // 移除查询参数,只保留路径
            const pathOnly = path.split('?')[0];
            
            // 解析路径: /m/shortId/email 或 /api/m/shortId/email
            const pathParts = pathOnly.split('/').filter(p => p);
            
            // 移除 'api' 如果存在
            const startIndex = pathParts[0] === 'api' ? 1 : 0;
            
            if (pathParts.length < startIndex + 3 || pathParts[startIndex] !== 'm') {
                return res.status(400).json({
                    error: '无效的短链接格式',
                    path: pathOnly,
                    pathParts: pathParts
                });
            }

            const shortId = pathParts[startIndex + 1];
            const email = decodeURIComponent(pathParts.slice(startIndex + 2).join('/'));

            console.log('短链接访问:', { shortId, email, path: pathOnly });

            const link = await getShortLink(shortId);

            if (!link) {
                return res.status(404).json({
                    error: '短链接不存在或已过期',
                    shortId: shortId
                });
            }

            console.log('找到短链接:', { stored: link.params.email, requested: email });

            // 验证邮箱是否匹配 - 忽略大小写
            if (link.params.email.toLowerCase() !== email.toLowerCase()) {
                return res.status(403).json({
                    error: '邮箱不匹配',
                    stored: link.params.email,
                    requested: email
                });
            }

            // 直接调用 mail-new 处理逻辑,不重定向
            const mailNewHandler = require('./mail-new.js');
            
            // 将参数设置到 req.query 中
            req.query = {
                ...link.params,
                ...req.query
            };

            // 直接调用 mail-new 处理器
            return await mailNewHandler(req, res);
        } catch (error) {
            console.error('访问短链接失败:', error);
            return res.status(500).json({
                error: error.message
            });
        }
    }

    return res.status(405).json({
        error: '不支持的请求方法'
    });
};

