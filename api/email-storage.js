// 邮箱数据服务端存储API - 使用Vercel KV解决localStorage配额限制
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

// 生成用户存储key
function getUserStorageKey(userId) {
    return `email_data:${userId}`;
}

// 生成用户ID (基于设备信息)
function generateUserId(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    return crypto.createHash('md5').update(`${userAgent}${ip}`).digest('hex').substring(0, 16);
}

module.exports = async (req, res) => {
    const method = req.method;
    const userId = req.query.userId || generateUserId(req);

    // GET - 获取邮箱数据
    if (method === 'GET') {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 100;
            const group = req.query.group || 'all';

            const storageKey = getUserStorageKey(userId);
            const data = await kv.get(storageKey) || [];

            // 过滤分组
            let filteredData = data;
            if (group !== 'all') {
                filteredData = data.filter(item => item.group === group);
            }

            // 分页
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageData = filteredData.slice(start, end);

            return res.status(200).json({
                success: true,
                data: pageData,
                total: filteredData.length,
                page,
                pageSize,
                totalPages: Math.ceil(filteredData.length / pageSize)
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // POST - 保存邮箱数据(批量)
    if (method === 'POST') {
        try {
            const { emails, mode = 'append' } = req.body; // mode: append(追加) / replace(替换)

            if (!Array.isArray(emails)) {
                return res.status(400).json({
                    error: '数据格式错误,需要数组'
                });
            }

            const storageKey = getUserStorageKey(userId);
            let existingData = await kv.get(storageKey) || [];

            if (mode === 'replace') {
                existingData = emails;
            } else {
                // 追加模式 - 去重
                const existingEmails = new Set(existingData.map(item => item.email.toLowerCase()));
                const newEmails = emails.filter(item => !existingEmails.has(item.email.toLowerCase()));
                existingData = [...existingData, ...newEmails];
            }

            // 保存到KV (30天过期)
            await kv.set(storageKey, existingData, {
                ex: 60 * 60 * 24 * 30
            });

            return res.status(200).json({
                success: true,
                total: existingData.length,
                message: mode === 'replace' ? '数据已替换' : `已追加 ${emails.length} 条数据`
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // DELETE - 删除邮箱数据
    if (method === 'DELETE') {
        try {
            const { emails } = req.body; // 要删除的邮箱列表

            const storageKey = getUserStorageKey(userId);
            let data = await kv.get(storageKey) || [];

            if (emails && Array.isArray(emails)) {
                // 删除指定邮箱
                const emailSet = new Set(emails.map(e => e.toLowerCase()));
                data = data.filter(item => !emailSet.has(item.email.toLowerCase()));
            } else {
                // 删除全部
                data = [];
            }

            await kv.set(storageKey, data, {
                ex: 60 * 60 * 24 * 30
            });

            return res.status(200).json({
                success: true,
                total: data.length,
                message: '删除成功'
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // PUT - 更新单个邮箱数据
    if (method === 'PUT') {
        try {
            const { email, updates } = req.body;

            if (!email || !updates) {
                return res.status(400).json({
                    error: '缺少email或updates参数'
                });
            }

            const storageKey = getUserStorageKey(userId);
            let data = await kv.get(storageKey) || [];

            const index = data.findIndex(item => item.email.toLowerCase() === email.toLowerCase());
            if (index !== -1) {
                data[index] = { ...data[index], ...updates };
                
                await kv.set(storageKey, data, {
                    ex: 60 * 60 * 24 * 30
                });

                return res.status(200).json({
                    success: true,
                    message: '更新成功'
                });
            } else {
                return res.status(404).json({
                    error: '邮箱不存在'
                });
            }

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    return res.status(405).json({
        error: '不支持的请求方法'
    });
};
