// 批量生成短链接API - 高性能并发处理
const crypto = require('crypto');
const { kv } = require('@vercel/kv');

// 生成短ID (16位)
function generateShortId() {
    return crypto.randomBytes(8).toString('hex');
}

// 批量创建短链接（同一邮箱已有短链则复用，不重复创建）
async function createShortLinksBatch(items) {
    const results = await Promise.all(items.map(async (params) => {
        try {
            // 先查该邮箱是否已有短链接
            const existingShortId = await kv.get(`email_link:${params.email}`);
            if (existingShortId) {
                return {
                    success: true,
                    shortId: existingShortId,
                    email: params.email,
                    reused: true
                };
            }

            // 没有则新建
            const shortId = generateShortId();
            const linkData = {
                params,
                createdAt: Date.now(),
                accessCount: 0
            };

            // 同时存储链接数据和 email→shortId 映射
            await Promise.all([
                kv.set(`link:${shortId}`, linkData),
                kv.set(`email_link:${params.email}`, shortId)
            ]);

            return {
                success: true,
                shortId,
                email: params.email,
                reused: false
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                email: params.email
            };
        }
    }));

    return results;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: '仅支持POST请求'
        });
    }

    try {
        const { items } = req.body; // items: [{ refresh_token, client_id, email }, ...]

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: '请提供items数组'
            });
        }

        // 验证每个item的必要参数
        const invalidItems = items.filter(item => 
            !item.refresh_token || !item.client_id || !item.email
        );

        if (invalidItems.length > 0) {
            return res.status(400).json({
                error: '部分item缺少必要参数',
                invalidCount: invalidItems.length
            });
        }

        console.log(`开始批量生成 ${items.length} 个短链接...`);
        
        // 批量并发生成
        const results = await createShortLinksBatch(items);
        
        const successResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);

        console.log(`批量生成完成: 成功 ${successResults.length}, 失败 ${failedResults.length}`);

        return res.status(200).json({
            success: true,
            total: items.length,
            successCount: successResults.length,
            failedCount: failedResults.length,
            results: results.map(r => ({
                email: r.email,
                success: r.success,
                shortUrl: r.success ? `/m/${r.shortId}` : null,
                error: r.error || null
            }))
        });

    } catch (error) {
        console.error('批量生成短链接失败:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};
