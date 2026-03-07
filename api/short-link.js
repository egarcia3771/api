// 短链接管理系统
const crypto = require('crypto');

// 内存存储 (生产环境建议使用 Redis)
const linkStore = new Map();

// 生成短 ID
function generateShortId() {
    return crypto.randomBytes(4).toString('hex'); // 8位短ID
}

// 创建短链接
function createShortLink(apiPath, params) {
    const shortId = generateShortId();
    linkStore.set(shortId, {
        apiPath,
        params,
        createdAt: Date.now(),
        accessCount: 0
    });
    return shortId;
}

// 获取短链接信息
function getShortLink(shortId) {
    const link = linkStore.get(shortId);
    if (link) {
        link.accessCount++;
        link.lastAccessAt = Date.now();
    }
    return link;
}

// 清理过期链接 (7天未访问)
function cleanExpiredLinks() {
    const now = Date.now();
    const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
    
    for (const [id, link] of linkStore.entries()) {
        const lastAccess = link.lastAccessAt || link.createdAt;
        if (now - lastAccess > expireTime) {
            linkStore.delete(id);
        }
    }
}

// 定期清理 (每小时)
setInterval(cleanExpiredLinks, 60 * 60 * 1000);

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

            const shortId = createShortLink(apiPath, params || {});
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

        const link = getShortLink(shortId);

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
