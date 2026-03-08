// 令牌后台异步验证API
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

// 生成任务ID
function generateTaskId() {
    return crypto.randomBytes(16).toString('hex');
}

// 验证令牌有效性
async function verifyToken(refreshToken, clientId) {
    try {
        const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                scope: 'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access'
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                valid: true,
                accessToken: data.access_token,
                expiresIn: data.expires_in,
                scope: data.scope
            };
        } else {
            const errorData = await response.json();
            return {
                valid: false,
                error: errorData.error_description || '令牌验证失败'
            };
        }
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

module.exports = async (req, res) => {
    const method = req.method;

    // POST - 提交令牌验证任务(立即返回任务ID)
    if (method === 'POST') {
        try {
            const { refresh_token, client_id, email } = req.body;

            if (!refresh_token || !client_id || !email) {
                return res.status(400).json({
                    error: '缺少必要参数',
                    required: ['refresh_token', 'client_id', 'email']
                });
            }

            // 生成任务ID
            const taskId = generateTaskId();

            // 存储任务状态为pending
            await kv.set(`token_verify:${taskId}`, {
                status: 'pending',
                email,
                createdAt: Date.now()
            }, {
                ex: 300 // 5分钟过期
            });

            // 立即返回任务ID
            res.status(200).json({
                success: true,
                taskId,
                message: '令牌验证任务已创建,请使用taskId查询结果'
            });

            // 后台异步验证令牌
            setImmediate(async () => {
                try {
                    // 更新状态为processing
                    await kv.set(`token_verify:${taskId}`, {
                        status: 'processing',
                        email,
                        createdAt: Date.now()
                    }, { ex: 300 });

                    // 验证令牌
                    const result = await verifyToken(refresh_token, client_id);

                    // 保存验证结果
                    await kv.set(`token_verify:${taskId}`, {
                        status: 'completed',
                        email,
                        valid: result.valid,
                        error: result.error,
                        scope: result.scope,
                        completedAt: Date.now()
                    }, { ex: 300 });

                    console.log(`令牌验证完成: ${email} - ${result.valid ? '有效' : '无效'}`);
                } catch (error) {
                    // 保存错误结果
                    await kv.set(`token_verify:${taskId}`, {
                        status: 'failed',
                        email,
                        error: error.message,
                        completedAt: Date.now()
                    }, { ex: 300 });

                    console.error(`令牌验证失败: ${email}`, error);
                }
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    // GET - 查询验证任务状态
    if (method === 'GET') {
        try {
            const taskId = req.query.taskId;

            if (!taskId) {
                return res.status(400).json({
                    error: '缺少taskId参数'
                });
            }

            const task = await kv.get(`token_verify:${taskId}`);

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
