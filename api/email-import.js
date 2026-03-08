// 邮箱批量导入后台处理API
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

// 生成导入任务ID
function generateImportId() {
    return crypto.randomBytes(16).toString('hex');
}

// 验证令牌
async function verifyToken(refreshToken, clientId) {
    try {
        const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                scope: 'https://outlook.office.com/IMAP.AccessAsUser.All offline_access'
            })
        });
        return response.ok;
    } catch {
        return false;
    }
}

// 后台处理导入任务
async function processImportTask(importId, emails, userId, verifyTokens = false) {
    try {
        const storageKey = `email_data:${userId}`;
        let existingData = await kv.get(storageKey) || [];
        const existingEmails = new Set(existingData.map(item => item.email.toLowerCase()));

        let successCount = 0;
        let duplicateCount = 0;
        let invalidCount = 0;
        const batchSize = 100;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            for (const emailData of batch) {
                // 检查重复
                if (existingEmails.has(emailData.email.toLowerCase())) {
                    duplicateCount++;
                    continue;
                }

                // 可选:验证令牌
                let isValid = true;
                if (verifyTokens) {
                    isValid = await verifyToken(emailData.refreshToken, emailData.clientId);
                }

                if (isValid) {
                    existingData.push(emailData);
                    existingEmails.add(emailData.email.toLowerCase());
                    successCount++;
                } else {
                    invalidCount++;
                }
            }

            // 更新进度
            const progress = Math.min(100, Math.floor(((i + batchSize) / emails.length) * 100));
            await kv.set(`import_task:${importId}`, {
                status: 'processing',
                progress,
                successCount,
                duplicateCount,
                invalidCount,
                total: emails.length,
                updatedAt: Date.now()
            }, { ex: 600 });
        }

        // 保存数据
        await kv.set(storageKey, existingData, { ex: 60 * 60 * 24 * 30 });

        // 标记完成
        await kv.set(`import_task:${importId}`, {
            status: 'completed',
            progress: 100,
            successCount,
            duplicateCount,
            invalidCount,
            total: emails.length,
            completedAt: Date.now()
        }, { ex: 600 });

    } catch (error) {
        await kv.set(`import_task:${importId}`, {
            status: 'failed',
            error: error.message,
            completedAt: Date.now()
        }, { ex: 600 });
    }
}

module.exports = async (req, res) => {
    const method = req.method;

    // POST - 提交导入任务(立即返回)
    if (method === 'POST') {
        try {
            const { emails, userId, verifyTokens = false } = req.body;

            if (!Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({
                    error: '邮箱数据格式错误或为空'
                });
            }

            if (!userId) {
                return res.status(400).json({
                    error: '缺少userId参数'
                });
            }

            // 生成任务ID
            const importId = generateImportId();

            // 初始化任务状态
            await kv.set(`import_task:${importId}`, {
                status: 'pending',
                progress: 0,
                successCount: 0,
                duplicateCount: 0,
                invalidCount: 0,
                total: emails.length,
                createdAt: Date.now()
            }, { ex: 600 });

            // 立即返回任务ID
            res.status(200).json({
                success: true,
                importId,
                total: emails.length,
                message: '导入任务已创建,正在后台处理'
            });

            // 后台异步处理
            setImmediate(() => {
                processImportTask(importId, emails, userId, verifyTokens);
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // GET - 查询导入任务进度
    if (method === 'GET') {
        try {
            const importId = req.query.importId;

            if (!importId) {
                return res.status(400).json({
                    error: '缺少importId参数'
                });
            }

            const task = await kv.get(`import_task:${importId}`);

            if (!task) {
                return res.status(404).json({
                    error: '任务不存在或已过期'
                });
            }

            return res.status(200).json({
                success: true,
                task
            });

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
