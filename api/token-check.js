// 轻量级令牌验证API - 只验证token有效性，不获取邮件数据
// 用于快速批量检测令牌状态

async function get_access_token(refresh_token, client_id) {
    const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'client_id': client_id,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        }).toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();

    try {
        const data = JSON.parse(responseText);
        return {
            valid: true,
            access_token: data.access_token,
            scope: data.scope
        };
    } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}, response: ${responseText}`);
    }
}

async function check_graph_api_permission(refresh_token, client_id) {
    try {
        const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'client_id': client_id,
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'scope': 'https://graph.microsoft.com/.default'
            }).toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                valid: false,
                error: `HTTP ${response.status}`,
                detail: errorText
            };
        }

        const data = await response.json();
        
        // 检查是否包含 Graph API 权限
        const hasGraphPermission = data.scope && (
            data.scope.indexOf('https://graph.microsoft.com/Mail.ReadWrite') != -1 ||
            data.scope.indexOf('https://graph.microsoft.com/Mail.Read') != -1 ||
            data.scope.indexOf('https://graph.microsoft.com/.default') != -1 ||
            data.scope.indexOf('Mail.ReadWrite') != -1 ||
            data.scope.indexOf('Mail.Read') != -1
        );

        return {
            valid: true,
            hasGraphPermission,
            scope: data.scope
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Network Error',
            detail: error.message
        };
    }
}

module.exports = async (req, res) => {
    const params = req.method === 'GET' ? req.query : req.body;
    const { refresh_token, client_id, email } = params;

    // 检查必要参数
    if (!refresh_token || !client_id || !email) {
        return res.status(400).json({ 
            error: 'Missing required parameters',
            status: 'error'
        });
    }

    try {
        // 先尝试 Graph API 权限检查（更快）
        const graphResult = await check_graph_api_permission(refresh_token, client_id);
        
        if (graphResult.valid) {
            return res.status(200).json({
                status: 'success',
                tokenStatus: '正常',
                detail: '令牌有效，可以正常使用',
                hasGraphPermission: graphResult.hasGraphPermission,
                email: email
            });
        }

        // Graph API 失败，尝试基础 token 验证
        const tokenResult = await get_access_token(refresh_token, client_id);
        
        if (tokenResult.valid) {
            return res.status(200).json({
                status: 'success',
                tokenStatus: '正常',
                detail: '令牌有效（IMAP模式）',
                hasGraphPermission: false,
                email: email
            });
        }

        return res.status(200).json({
            status: 'error',
            tokenStatus: '令牌过期',
            detail: '令牌已过期或被撤销',
            email: email
        });

    } catch (error) {
        console.error('Token check error:', error);
        
        // 解析错误信息
        const errorMsg = error.message || '未知错误';
        
        if (errorMsg.includes('invalid_grant')) {
            return res.status(200).json({
                status: 'error',
                tokenStatus: '令牌过期',
                detail: '令牌已过期或被撤销',
                email: email
            });
        } else if (errorMsg.includes('service abuse') || errorMsg.includes('AADSTS70000')) {
            return res.status(200).json({
                status: 'error',
                tokenStatus: '账户异常',
                detail: '账户被标记为滥用模式',
                email: email
            });
        } else if (errorMsg.includes('AADSTS50076') || errorMsg.includes('MFA')) {
            return res.status(200).json({
                status: 'error',
                tokenStatus: '需要MFA',
                detail: '账户需要多因素认证',
                email: email
            });
        } else {
            return res.status(200).json({
                status: 'error',
                tokenStatus: '错误',
                detail: errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg,
                email: email
            });
        }
    }
};
