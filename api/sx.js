// token-refresh-api.js（最终修复版，与Python工具1:1对齐）
const { URLSearchParams } = require('url');
const fetch = globalThis.fetch || require('node-fetch');

// ===================== 全局配置（完全对齐Python工具）=====================
const CONFIG = {
  // 对齐Python工具的tenant_id=common（而非consumers）
  OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL || 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  REQUEST_TIMEOUT: Number(process.env.REQUEST_TIMEOUT) || 15000, // 与Python工具一致：15秒超时
  SUPPORTED_METHODS: ['GET', 'POST'],
  REQUIRED_PARAMS: ['email', 'send_password', 'client_id', 'refresh_token', 'password'],
  TOKEN_SCOPE: '', // 关键：Python工具没传scope，微软会沿用初始授权的scope（包含offline_access）
  EMAIL_REG: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  REFRESH_TOKEN_TIP_EXPIRES: Number(process.env.REFRESH_TOKEN_EXPIRES) || 90,
  ACCESS_CONTACT: process.env.ACCESS_CONTACT || '小黑-QQ:113575320',
};

// ===================== 类型定义 =====================
/** @typedef {Object} RequestParams
 * @property {string} email - 用户邮箱（与Python工具email字段对齐）
 * @property {string} send_password - 用户密码（与Python工具password字段对齐）
 * @property {string} client_id - 客户端ID（与Python工具一致）
 * @property {string} refresh_token - 待刷新令牌（与Python工具一致）
 * @property {string} password - 接口访问密码（自定义校验字段）
 */

/** @typedef {Object} TokenResponse
 * @property {string} refresh_token - 新刷新令牌
 * @property {string} [access_token] - 访问令牌（可选）
 * @property {number} [expires_in] - 访问令牌有效期（秒）
 */

// ===================== 工具函数 =====================
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时（超过${timeout / 1000}秒）`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`网络错误：无法连接到 ${url}`);
    }
    throw new Error(`请求失败：${error.message}`);
  }
}

function escapeJson(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f');
}

function calculateRefreshTokenExpireTip() {
  const now = new Date();
  now.setDate(now.getDate() + CONFIG.REFRESH_TOKEN_TIP_EXPIRES);
  return now.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour12: false
  });
}

function validateParams(params) {
  const { email, send_password, client_id, refresh_token, password } = params;

  if (!CONFIG.EMAIL_REG.test(email)) {
    return new Error("邮箱格式无效，请输入正确的邮箱地址（例：xxx@hotmail.com）");
  }

  if (!send_password || send_password.trim() === '' || send_password.length < 6) {
    return new Error("密码无效，长度需≥6字符");
  }

  if (!client_id || client_id.trim() === '' || client_id.length < 10) {
    return new Error("id格式无效（对应原client_id），长度需≥10字符");
  }

  if (!refresh_token || refresh_token.trim() === '' || refresh_token.length < 50) {
    return new Error("refresh_token格式无效，长度需≥50字符");
  }

  if (process.env.PASSWORD && (!password || password.trim() === '' || password.length < 6)) {
    return new Error("接口密码无效，请联系小黑QQ113575320");
  }

  return null;
}

// ===================== 核心令牌刷新函数（关键修复：对齐Python工具请求）=====================
async function refreshOAuthToken(refresh_token, client_id) {
  try {
    const formData = new URLSearchParams({
      client_id: client_id.trim(),
      grant_type: 'refresh_token',
      refresh_token: refresh_token.trim(),
      // 关键修复1：移除scope参数（Python工具没传，微软会沿用初始授权的scope）
      // 关键修复2：不添加client_secret（Python工具没传，说明是公开客户端）
    });

    const response = await fetchWithTimeout(CONFIG.OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Python/3.9 requests/2.31.0' // 关键：模拟Python工具的User-Agent
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMsg = `微软令牌服务返回错误：HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMsg += `，错误码：${errorJson.error}，描述：${errorJson.error_description || '无详细描述'}`;
        if (errorJson.error === 'invalid_grant') {
          errorMsg += '（可能是refresh_token已失效、client_id不匹配或权限不足）';
        }
      } catch (e) {
        errorMsg += `，原始响应：${responseText.slice(0, 500)}`;
      }
      throw new Error(errorMsg);
    }

    /** @type {TokenResponse} */
    const tokenData = JSON.parse(responseText);
    if (!tokenData.refresh_token) {
      throw new Error(`微软返回数据中无refresh_token，响应内容：${JSON.stringify(tokenData)}`);
    }

    return escapeJson(tokenData.refresh_token);
  } catch (error) {
    throw new Error(`令牌刷新失败：${error.message}`);
  }
}

// ===================== 主入口函数 =====================
module.exports = async (req, res) => {
  const sendResponse = (statusCode, data) => {
    res.status(statusCode).json({
      requestId: req.headers['x-request-id'] || Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...data
    });
  };

  try {
    if (!CONFIG.SUPPORTED_METHODS.includes(req.method)) {
      return sendResponse(405, {
        code: 405,
        error: `不支持的请求方法，请使用${CONFIG.SUPPORTED_METHODS.join('或')}`
      });
    }

    const params = req.method === 'GET' ? req.query : req.body;
    const cleanedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );

    const missingParams = CONFIG.REQUIRED_PARAMS.filter(key => !cleanedParams[key]);
    if (missingParams.length > 0) {
      return sendResponse(400, {
        code: 4001,
        error: `缺少必要参数认证失败 请联系小黑QQ113575320 购买权限再使用：${missingParams.join('、')}`
      });
    }

    const paramError = validateParams(cleanedParams);
    if (paramError) {
      return sendResponse(400, {
        code: 4002,
        error: paramError.message
      });
    }

    // 密码认证已移除

    const { email, client_id, refresh_token } = cleanedParams;
    const maskedToken = refresh_token.slice(0, 10) + '****' + refresh_token.slice(-10);
    console.log(`【刷新开始】邮箱：${email}，client_id：${client_id.slice(0, 10)}****，refresh_token：${maskedToken}`);
    
    const newRefreshToken = await refreshOAuthToken(refresh_token, client_id);
    const maskedNewToken = newRefreshToken.slice(0, 10) + '****' + newRefreshToken.slice(-10);
    console.log(`【刷新成功】邮箱：${email}，新refresh_token：${maskedNewToken}`);

    const expireTipDate = calculateRefreshTokenExpireTip();

    return sendResponse(200, {
      code: 200,
      message: "欢迎使用小黑接口令牌刷新成功",
      data: {
        "邮箱": cleanedParams.email,
        "密码": cleanedParams.send_password,
        "id": cleanedParams.client_id,
        "refresh_token": newRefreshToken,
        "refresh_token有效期": `${CONFIG.REFRESH_TOKEN_TIP_EXPIRES}天（微软默认）`,
        "refresh_token建议刷新截止日期": expireTipDate
      },
      tips: [
        "⚠️  安全提示：密码和refresh_token为敏感信息，仅支持HTTPS传输，切勿泄露",
        `⏳ refresh_token（核心刷新令牌）：有效期90天，建议${expireTipDate}前重新刷新`,
        "🔄 下次调用本接口时，请使用本次返回的新refresh_token替换旧令牌传入"
      ]
    });

  } catch (error) {
    let statusCode = 500;
    let errorCode = 5000;
    let errorMsg = error.message;

    if (errorMsg.includes('invalid_grant') || errorMsg.includes('HTTP 401')) {
      statusCode = 401;
      errorCode = 4011;
      errorMsg = '原始refresh_token已失效（超过90天或已被撤销），请重新获取授权码';
    } else if (errorMsg.includes('HTTP 400')) {
      statusCode = 400;
      errorCode = 4003;
      errorMsg = '参数错误，可能是id（原client_id）与refresh_token不匹配';
    } else if (errorMsg.includes('请求超时')) {
      statusCode = 504;
      errorCode = 5041;
      errorMsg = '请求超时（超过15秒），微软令牌服务响应缓慢，请稍后重试';
    } else if (errorMsg.includes('网络错误')) {
      statusCode = 503;
      errorCode = 5031;
      errorMsg = '网络异常：无法连接到微软令牌服务，请检查网络配置';
    }

    console.error(`【刷新失败】IP：${req.ip}，错误码：${errorCode}，原因：${errorMsg}`, error.stack);
    return sendResponse(statusCode, {
      code: errorCode,
      error: `令牌刷新失败：${errorMsg}`
    });
  }
};
