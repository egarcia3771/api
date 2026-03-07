// authorize-api.js（修复端点错误，Vercel 兼容）
const { URLSearchParams } = require('url');
const fetch = globalThis.fetch || require('node-fetch');

// 关键修复：改用个人账号专属端点 + 雷鸟官方ClientID（支持密码模式）
const CONFIG = {
  // 个人账号（hotmail/outlook）专用端点（替换原来的 /common）
  TOKEN_ENDPOINT: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
  // 雷鸟官方 ClientID（经测试支持密码模式+IMAP/POP，适配个人账号）
  CLIENT_ID: '08162f7c-0fd2-4200-a84a-f25a4db0b58d',
  // 保留原Scope（同时支持雷鸟/心蓝）
  SCOPE: [
    'openid',
    'profile',
    'email',
    'Mail.ReadWrite',
    'Mail.Send',
    'IMAP.AccessAsUser.All',
    'POP.AccessAsUser.All',
    'offline_access'
  ].join(' '),
  REQUEST_TIMEOUT: 15000,
  SUPPORTED_METHODS: ['GET', 'POST']
};

const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    requestId: res.req.headers['x-request-id'] || Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...data
  });
};

module.exports = async (req, res) => {
  try {
    if (!CONFIG.SUPPORTED_METHODS.includes(req.method)) {
      return sendResponse(res, 405, {
        code: 405,
        error: `不支持的请求方法，请使用 ${CONFIG.SUPPORTED_METHODS.join(' 或 ')}`
      });
    }

    const params = req.method === 'GET' ? req.query : req.body;
    const { email, password } = params;

    if (!email || !password) {
      return sendResponse(res, 400, {
        code: 4001,
        error: '缺少必填参数：email（邮箱）和 password（密码）'
      });
    }

    // 密码模式参数（适配微软consumers端点要求）
    const formData = new URLSearchParams({
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPE,
      username: email,
      password: password,
      grant_type: 'password',
      client_secret: '' // 雷鸟官方ClientID无需密钥
    });

    const response = await fetch(CONFIG.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      timeout: CONFIG.REQUEST_TIMEOUT
    });

    const tokenData = await response.json();

    // 细化错误提示（帮助用户排查）
    if (!response.ok) {
      let errorMsg = tokenData.error_description || '授权失败';
      // 常见错误说明
      if (errorMsg.includes('MFA')) {
        errorMsg = '账号已启用多重验证（MFA），不支持密码模式，请关闭MFA或使用其他授权方式';
      } else if (errorMsg.includes('invalid_grant')) {
        errorMsg = '账号或密码错误，或账号为企业账号（不支持个人端点）';
      } else if (errorMsg.includes('unsupported_grant_type')) {
        errorMsg = '端点不支持该授权方式，请确认邮箱是个人账号（hotmail/outlook）';
      }

      return sendResponse(res, 401, {
        code: 4011,
        error: `授权失败：${errorMsg}`
      });
    }

    return sendResponse(res, 200, {
      code: 200,
      message: '授权成功，获取初始 refresh_token',
      data: {
        email: email,
        client_id: CONFIG.CLIENT_ID,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        access_token有效期: `${tokenData.expires_in} 秒（约 1 小时）`,
        refresh_token有效期: '约 90 天'
      },
      tips: [
        "⚠️  高危提醒：refresh_token 切勿泄露",
        "✅ 雷鸟直接使用 refresh_token 登录（IMAP/POP 已授权）",
        "✅ 心蓝等工具可使用 refresh_token 调用 Graph API",
        "❌ 多重验证（MFA）账号不支持，请关闭后重试"
      ]
    });

  } catch (error) {
    console.error(`【授权API错误】：${error.message}`, error.stack);
    return sendResponse(res, 500, {
      code: 5000,
      error: '服务器内部错误，请稍后重试'
    });
  }
};
