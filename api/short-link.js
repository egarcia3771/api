// 短链接管理系统 - 使用 Vercel KV 高性能存储
const crypto = require('crypto');
const { kv } = require('@vercel/kv');

// 生成短 ID
function generateShortId() {
    return crypto.randomBytes(4).toString('hex'); // 8位短ID
}

// 创建短链接
async function createShortLink(apiPath, params) {
    const shortId = generateShortId();
    await kv.set(`shortlink:${shortId}`, {
        apiPath,
        params,
        createdAt: Date.now(),
        accessCount: 0
    }, {
        ex: 60 * 60 * 24 * 7 // 7天过期
    });
    return shortId;
}

// 获取短链接信息
async function getShortLink(shortId) {
    const link = await kv.get(`shortlink:${shortId}`);
    if (link) {
        // 异步更新访问计数
        kv.hincrby(`shortlink:${shortId}`, 'accessCount', 1).catch(() => {});
        kv.hset(`shortlink:${shortId}`, 'lastAccessAt', Date.now()).catch(() => {});
    }
    return link;
}

// KV 自动过期,无需手动清理

module.exports = async (req, res) => {
    const method = req.method;

    // POST - 创建短链接
    if (method === 'POST') {
        try {
            const { apiPath, params } = req.body;

            if (!apiPath) {
                return res.status(400).json({
                    error: '缺少 apiPath 参数'
                });
            }

            const shortId = await createShortLink(apiPath, params || {});
            const shortUrl = `/s/${shortId}`;

            return res.status(200).json({
                success: true,
                shortId,
                shortUrl,
                fullUrl: `${req.protocol}://${req.get('host')}${shortUrl}`,
                message: '短链接创建成功'
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // GET - 重定向到完整 API
    if (method === 'GET') {
        const shortId = req.query.id || req.path.split('/').pop();

        if (!shortId) {
            return res.status(400).json({
                error: '缺少短链接 ID'
            });
        }

        const link = await getShortLink(shortId);

        if (!link) {
            return res.status(404).json({
                error: '短链接不存在或已过期'
            });
        }

        // 构建完整 URL
        const queryString = new URLSearchParams(link.params).toString();
        const redirectUrl = `${link.apiPath}?${queryString}`;

        // 重定向到完整 API
        return res.redirect(302, redirectUrl);
    }

    return res.status(405).json({
        error: '不支持的请求方法'
    });
};
