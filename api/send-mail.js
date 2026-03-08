<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微软邮箱获取工具（黑色主题+库存优化）</title>
    <!-- 引入 Bootstrap 美化界面（GitHub CDN） -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- 引入图标库（增加视觉区分） -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        /* 全局黑色背景基础样式 */
        body { 
            padding: 20px; 
            background-color: #000 !important; 
            color: #e0e0e0 !important; /* 全局浅色文字 */
        }
        .form-group { margin-bottom: 15px; }
        
        /* 日志区域样式 */
        .log-area { 
            height: 300px; 
            border: 1px solid #333; 
            border-radius: 4px; 
            padding: 10px; 
            overflow-y: auto; 
            background: #111 !important; /* 日志区域深色背景 */
            font-family: monospace;
            color: #e0e0e0;
        }
        
        /* 优化后的库存卡片样式 */
        .stock-card { 
            margin-bottom: 15px; 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #1a1a1a !important; 
            border: 1px solid #333 !important;
            transition: all 0.3s ease; /* hover动画 */
        }
        .stock-card:hover {
            border-color: #666 !important;
            transform: translateY(-2px); /* 轻微上浮 */
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }
        
        /* 库存卡片标签（区分API类型） */
        .stock-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 12px;
            margin-bottom: 8px;
        }
        .tag-outlook007 { background-color: #0d6efd33; color: #0d6efd; border: 1px solid #0d6efd55; }
        .tag-shankeyun { background-color: #19875433; color: #198754; border: 1px solid #19875455; }
        
        /* 库存数字样式（放大突出） */
        .stock-value {
            font-size: 28px;
            font-weight: bold;
            color: #fff;
            margin: 10px 0;
        }
        
        /* 功能说明文字（清晰对应下拉框） */
        .stock-desc {
            font-size: 13px;
            color: #ccc;
            line-height: 1.4;
        }
        
        /* 状态提示（查询中/失败） */
        .stock-status {
            font-size: 12px;
            margin-top: 8px;
        }
        .status-loading { color: #ffc107; }
        .status-error { color: #dc3545; }
        .status-success { color: #28a745; }
        
        /* 按钮组间距 */
        .btn-group { margin-bottom: 20px; }
        
        /* 日志类型颜色（保持辨识度） */
        .timestamp { color: #6c757d; }
        .success { color: #28a745; } /* 绿色 - 成功 */
        .error { color: #dc3545; } /* 红色 - 错误 */
        .warning { color: #ffc107; } /* 黄色 - 警告 */
        .info { color: #17a2b8; } /* 蓝色 - 信息 */
        
        /* 卡片样式修改 */
        .card { 
            background-color: #1a1a1a !important; 
            border: 1px solid #333 !important; 
            color: #e0e0e0 !important;
        }
        .card-title { color: #fff !important; }
        .card-text { color: #ccc !important; }
        
        /* 输入框、下拉框样式 */
        .form-control {
            background-color: #2d2d2d !important;
            border: 1px solid #444 !important;
            color: #e0e0e0 !important;
        }
        .form-control:focus {
            border-color: #666 !important;
            box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25) !important;
        }
        
        /* 按钮样式（保持原有颜色，提升对比度） */
        .btn-primary { background-color: #007bff !important; border-color: #007bff !important; }
        .btn-info { background-color: #17a2b8 !important; border-color: #17a2b8 !important; }
        .btn-success { background-color: #28a745 !important; border-color: #28a745 !important; }
        .btn-warning { background-color: #ffc107 !important; border-color: #ffc107 !important; color: #000 !important; }
        .btn-secondary { background-color: #6c757d !important; border-color: #6c757d !important; }
        
        /* 标题样式 */
        .section-title {
            color: #fff;
            margin: 20px 0 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-title i { color: #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="mb-4 text-white">微软邮箱获取工具</h1>

        <!-- 配置区域 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">配置参数</h5>
                <div class="row">
                    <!-- 一号注册机配置 -->
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="merchantId">商户ID（一号注册机：outlook007.cc）</label>
                            <input type="text" id="merchantId" class="form-control" placeholder="输入outlook007商户ID">
                        </div>
                        <div class="form-group">
                            <label for="merchantKey">商户秘钥（一号注册机）</label>
                            <input type="text" id="merchantKey" class="form-control" placeholder="输入outlook007商户秘钥">
                        </div>
                    </div>
                    <!-- 二号注册机配置 -->
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="cardNumber">卡号（二号注册机：shankeyun.com）</label>
                            <input type="text" id="cardNumber" class="form-control" placeholder="输入shankeyun卡号">
                        </div>
                        <div class="form-group">
                            <label for="loopCount">循环次数</label>
                            <input type="number" id="loopCount" class="form-control" value="1" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label for="delayMs">延时（毫秒）</label>
                            <input type="number" id="delayMs" class="form-control" value="1000" min="0">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="functionType">功能选择（与库存项一一对应）</label>
                    <select id="functionType" class="form-control">
                        <option value="0">一号注册机 - commodity_id=3（outlook007）</option>
                        <option value="1">一号注册机 - commodity_id=4（outlook007）</option>
                        <option value="2">一号注册机 - commodity_id=1（outlook007）</option>
                        <option value="3">一号注册机 - commodity_id=2（outlook007）</option>
                        <option value="5">二号注册机 - hotmail（shankeyun）</option>
                        <option value="6">二号注册机 - outlook（shankeyun）</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 功能按钮区域 -->
        <div class="btn-group">
            <button id="startBtn" class="btn btn-primary"><i class="bi bi-play-fill"></i> 开始获取邮箱</button>
            <button id="stockBtn" class="btn btn-info"><i class="bi bi-bar-chart-fill"></i> 刷新实时库存</button>
            <button id="balanceBtn" class="btn btn-success"><i class="bi bi-wallet-fill"></i> 查询余额</button>
            <button id="clearLogBtn" class="btn btn-warning"><i class="bi bi-trash-fill"></i> 清空日志</button>
        </div>

        <!-- 库存显示区域（优化后） -->
        <h3 class="section-title"><i class="bi bi-archive-fill"></i> 实时库存（点击"刷新"更新）</h3>
        <div class="row mb-4">
            <!-- 一号注册机库存（outlook007.cc）- 蓝色标签 -->
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-outlook007">一号注册机</span>
                    <div class="stock-desc">功能：commodity_id=3<br>对应下拉框第1项</div>
                    <div class="stock-value" id="stock0">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-outlook007">一号注册机</span>
                    <div class="stock-desc">功能：commodity_id=4<br>对应下拉框第2项</div>
                    <div class="stock-value" id="stock1">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-outlook007">一号注册机</span>
                    <div class="stock-desc">功能：commodity_id=1<br>对应下拉框第3项</div>
                    <div class="stock-value" id="stock2">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-outlook007">一号注册机</span>
                    <div class="stock-desc">功能：commodity_id=2<br>对应下拉框第4项</div>
                    <div class="stock-value" id="stock3">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
            <!-- 二号注册机库存（shankeyun.com）- 绿色标签 -->
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-shankeyun">二号注册机</span>
                    <div class="stock-desc">功能：hotmail<br>对应下拉框第5项</div>
                    <div class="stock-value" id="stock4">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-4">
                <div class="card stock-card">
                    <span class="stock-tag tag-shankeyun">二号注册机</span>
                    <div class="stock-desc">功能：outlook<br>对应下拉框第6项</div>
                    <div class="stock-value" id="stock5">-</div>
                    <div class="stock-status status-success"><i class="bi bi-check-circle"></i> 未查询</div>
                </div>
            </div>
        </div>

        <!-- 统计和下载区域 -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card bg-dark p-3">
                    <i class="bi bi-check-circle success"></i> 成功数量: <span id="successCount">0</span> 
                    <span style="margin-left: 20px;"></span>
                    <i class="bi bi-x-circle error"></i> 失败数量: <span id="failureCount">0</span>
                </div>
            </div>
            <div class="col-md-6 text-right">
                <button id="downloadMainBtn" class="btn btn-secondary" disabled><i class="bi bi-download"></i> 下载主文件</button>
                <button id="downloadBackupBtn" class="btn btn-secondary" disabled><i class="bi bi-download"></i> 下载备用文件</button>
            </div>
        </div>

        <!-- 日志区域 -->
        <div class="card">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-file-text-fill"></i> 操作日志</h5>
                <div class="log-area" id="logArea"></div>
            </div>
        </div>
    </div>

    <script>
        // ===================== 配置常量（与原易语言对应）=====================
        const CONFIG = {
            API_OUTLOOK007_V1: 'http://outlook007.cc/api1',
            API_OUTLOOK007_V2: 'http://outlook007.cc/api',
            API_SHANKEYUN: 'http://api.shankeyun.com/api',
            TOKEN_LIST: [
                '9e5f94bc-e8a4-4e73-b8be-63364c29d753',
                '8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2',
                'dbc8e03a-b00c-46bd-ae65-b683e7707cb0'
            ],
            RETRY_MAX: 3,          // 最大重试次数
            RETRY_DELAY: 2000,     // 重试延时（毫秒）
            FILE_MAIN_1: '提取的微软账号一号注册机.txt',
            FILE_BACKUP_1: '提取的微软账号一号注册机备用保存.txt',
            FILE_MAIN_2: '提取的微软账号2号注册机.txt',
            FILE_BACKUP_2: '提取的微软账号2号注册机备用保存.txt'
        };

        // ===================== 全局状态 =====================
        let state = {
            successCount: 0,
            failureCount: 0,
            isRunning: false,
            mainData: [],          // 主文件数据
            backupData: [],        // 备用文件数据
            abortController: null  // 用于中断请求
        };

        // ===================== DOM 元素 =====================
        const els = {
            merchantId: document.getElementById('merchantId'),
            merchantKey: document.getElementById('merchantKey'),
            cardNumber: document.getElementById('cardNumber'),
            loopCount: document.getElementById('loopCount'),
            delayMs: document.getElementById('delayMs'),
            functionType: document.getElementById('functionType'),
            startBtn: document.getElementById('startBtn'),
            stockBtn: document.getElementById('stockBtn'),
            balanceBtn: document.getElementById('balanceBtn'),
            clearLogBtn: document.getElementById('clearLogBtn'),
            downloadMainBtn: document.getElementById('downloadMainBtn'),
            downloadBackupBtn: document.getElementById('downloadBackupBtn'),
            logArea: document.getElementById('logArea'),
            successCount: document.getElementById('successCount'),
            failureCount: document.getElementById('failureCount'),
            // 库存元素（包含状态元素）
            stock0: document.getElementById('stock0'),
            stock1: document.getElementById('stock1'),
            stock2: document.getElementById('stock2'),
            stock3: document.getElementById('stock3'),
            stock4: document.getElementById('stock4'),
            stock5: document.getElementById('stock5'),
            // 库存状态元素
            stockStatus0: document.querySelector('#stock0 + .stock-status'),
            stockStatus1: document.querySelector('#stock1 + .stock-status'),
            stockStatus2: document.querySelector('#stock2 + .stock-status'),
            stockStatus3: document.querySelector('#stock3 + .stock-status'),
            stockStatus4: document.querySelector('#stock4 + .stock-status'),
            stockStatus5: document.querySelector('#stock5 + .stock-status')
        };

        // ===================== 工具函数 =====================
        /**
         * 日志输出（带时间戳）
         * @param {string} content 日志内容
         * @param {string} type 类型：info/success/error/warning
         */
        function log(content, type = 'info') {
            const timestamp = new Date().toLocaleString() + '.' + new Date().getMilliseconds().toString().padStart(3, '0');
            const logItem = document.createElement('div');
            logItem.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="${type}">${escapeHtml(content)}</span>`;
            els.logArea.appendChild(logItem);
            els.logArea.scrollTop = els.logArea.scrollHeight; // 自动滚动到底部
        }

        /**
         * HTML 转义（防止XSS）
         * @param {string} html 原始HTML
         * @returns {string} 转义后的文本
         */
        function escapeHtml(html) {
            return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        /**
         * 下载文本文件
         * @param {string[]} data 数据数组
         * @param {string} filename 文件名
         */
        function downloadFile(data, filename) {
            if (data.length === 0) {
                log('无数据可下载', 'warning');
                return;
            }
            const blob = new Blob([data.join('\n')], { type: 'text/plain; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            log(`已下载文件：${filename}`, 'success');
        }

        /**
         * 延时函数
         * @param {number} ms 延时毫秒数
         * @returns {Promise}
         */
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * 编码转换（模拟原易语言UTF8转GB2312，浏览器端自动处理）
         * @param {Response} response fetch响应对象
         * @returns {Promise<string>} 转换后的文本
         */
        async function convertEncoding(response) {
            try {
                // 先尝试UTF-8
                const utf8Text = await response.text();
                // 检测是否有乱码（简单判断）
                if (!/�/.test(utf8Text)) {
                    return utf8Text;
                }
                // 尝试GB2312（需要TextDecoder支持，浏览器需支持）
                const buffer = await response.arrayBuffer();
                const decoder = new TextDecoder('gbk');
                return decoder.decode(buffer);
            } catch (e) {
                log(`编码转换失败：${e.message}`, 'error');
                return response.text();
            }
        }

        /**
         * 设置库存状态
         * @param {number} index 库存索引（0-5）
         * @param {string} status 状态：loading/success/error
         * @param {string} value 库存值（可选）
         * @param {string} msg 提示信息（可选）
         */
        function setStockStatus(index, status, value = '-', msg = '') {
            const stockEl = els[`stock${index}`];
            const statusEl = els[`stockStatus${index}`];
            
            if (!stockEl || !statusEl) return;

            // 更新库存值
            stockEl.textContent = value;

            // 更新状态样式和文本
            switch (status) {
                case 'loading':
                    statusEl.className = 'stock-status status-loading';
                    statusEl.innerHTML = `<i class="bi bi-arrow-clockwise"></i> ${msg || '查询中...'}`;
                    break;
                case 'success':
                    statusEl.className = 'stock-status status-success';
                    statusEl.innerHTML = `<i class="bi bi-check-circle"></i> ${msg || '查询成功'}`;
                    // 库存为0时高亮提示
                    if (value === '0' || value === 0) {
                        stockEl.style.color = '#dc3545';
                    } else {
                        stockEl.style.color = '#fff';
                    }
                    break;
                case 'error':
                    statusEl.className = 'stock-status status-error';
                    statusEl.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${msg || '查询失败'}`;
                    break;
            }
        }

        /**
         * 构建API请求配置
         * @returns {object} 配置对象
         */
        function getRequestConfig() {
            const functionType = els.functionType.value;
            const config = {
                type: functionType,
                isShankeyun: functionType === '5' || functionType === '6',
                mainFileName: '',
                backupFileName: ''
            };

            // 配置文件名称
            if (config.isShankeyun) {
                config.mainFileName = CONFIG.FILE_MAIN_2;
                config.backupFileName = CONFIG.FILE_BACKUP_2;
                config.cardNumber = els.cardNumber.value.trim();
                config.emailType = functionType === '5' ? 'hotmail' : 'outlook';
            } else {
                config.mainFileName = CONFIG.FILE_MAIN_1;
                config.backupFileName = CONFIG.FILE_BACKUP_1;
                config.merchantId = els.merchantId.value.trim();
                config.merchantKey = els.merchantKey.value.trim();
                config.commodityId = {
                    '0': '3', '1': '4', '2': '1', '3': '2'
                }[functionType];
            }

            // 验证参数
            if (!config.isShankeyun && (!config.merchantId || !config.merchantKey)) {
                throw new Error('一号注册机：商户ID和商户秘钥不能为空');
            }
            if (config.isShankeyun && !config.cardNumber) {
                throw new Error('二号注册机：卡号不能为空');
            }

            // 构建API地址
            if (config.isShankeyun) {
                config.apiUrl = `${CONFIG.API_SHANKEYUN}/buy?type=${config.emailType}&num=1&card=${config.cardNumber}`;
            } else {
                const apiPrefix = functionType === '0' || functionType === '1' ? CONFIG.API_OUTLOOK007_V1 : CONFIG.API_OUTLOOK007_V2;
                config.apiUrl = `${apiPrefix}/getEmail.php?app_id=${config.merchantId}&app_key=${config.merchantKey}&commodity_id=${config.commodityId}&num=1`;
            }

            return config;
        }

        // ===================== 核心功能函数 =====================
        /**
         * 调用邮箱API（带重试机制）
         * @param {object} config 请求配置
         * @returns {Promise<{success: boolean, data: string, error: string}>} 响应结果
         */
        async function callEmailApi(config) {
            let retryCount = 0;
            state.abortController = new AbortController();
            const { signal } = state.abortController;

            while (retryCount < CONFIG.RETRY_MAX) {
                try {
                    retryCount++;
                    log(`第${retryCount}次调用API：${config.apiUrl}`, 'info');
                    
                    const response = await fetch(config.apiUrl, {
                        method: 'GET',
                        signal,
                        timeout: 10000, // 10秒超时
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP错误：${response.status} ${response.statusText}`);
                    }

                    const responseText = await convertEncoding(response);
                    log(`API返回：${responseText}`, 'info');

                    // 处理响应
                    if (config.isShankeyun) {
                        // 二号注册机：包含@则成功
                        if (responseText.includes('@')) {
                            const parsedData = parseShankeyunData(responseText);
                            return { success: true, data: parsedData, error: '' };
                        } else {
                            // 解析错误信息
                            let errorMsg = '获取失败';
                            try {
                                const json = JSON.parse(responseText);
                                errorMsg = json.msg || errorMsg;
                            } catch (e) {
                                errorMsg = responseText;
                            }
                            // 严重错误判断
                            if (['余额不足', '无此卡号', '库存不足'].some(err => errorMsg.includes(err))) {
                                return { success: false, data: '', error: errorMsg, fatal: true };
                            }
                            return { success: false, data: responseText, error: errorMsg };
                        }
                    } else {
                        // 一号注册机：JSON响应
                        const json = JSON.parse(responseText);
                        const msg = json.msg || '';
                        const data = json.data?.cards || '';

                        if (msg === 'success' && data) {
                            return { success: true, data, error: '' };
                        } else {
                            // 严重错误判断
                            if (['余额不足', '验证失败'].some(err => msg.includes(err))) {
                                return { success: false, data, error: msg, fatal: true };
                            }
                            return { success: false, data, error: msg };
                        }
                    }
                } catch (e) {
                    if (signal.aborted) {
                        throw new Error('请求已取消');
                    }
                    const errorMsg = `API调用失败：${e.message}`;
                    if (retryCount >= CONFIG.RETRY_MAX) {
                        log(`${errorMsg}（已重试${CONFIG.RETRY_MAX}次）`, 'error');
                        return { success: false, data: '', error: errorMsg };
                    }
                    log(`${errorMsg}，${CONFIG.RETRY_DELAY}ms后重试...`, 'warning');
                    await delay(CONFIG.RETRY_DELAY);
                }
            }
        }

        /**
         * 解析二号注册机数据（处理令牌）
         * @param {string} rawData 原始数据
         * @returns {string} 解析后的数据
         */
        function parseShankeyunData(rawData) {
            const parts = rawData.split('----');
            if (parts.length !== 4) {
                log(`数据格式错误：${rawData}`, 'warning');
                return rawData;
            }

            // 匹配令牌
            let token = parts[3];
            for (const t of CONFIG.TOKEN_LIST) {
                if (parts[3].includes(t)) {
                    token = t;
                    log(`识别令牌：${t}`, 'success');
                    break;
                }
            }

            // 重组数据
            return `${parts[0]}----${parts[1]}----${token}----${parts[2]}`;
        }

        /**
         * 开始获取邮箱
         */
        async function startGetEmails() {
            if (state.isRunning) {
                log('正在运行中，请勿重复点击', 'warning');
                return;
            }

            // 初始化状态
            state.isRunning = true;
            state.mainData = [];
            state.backupData = [];
            state.successCount = 0;
            state.failureCount = 0;
            els.successCount.textContent = '0';
            els.failureCount.textContent = '0';
            els.startBtn.disabled = true;
            els.startBtn.innerHTML = '<i class="bi bi-spinner bi-spin"></i> 运行中...';
            els.downloadMainBtn.disabled = true;
            els.downloadBackupBtn.disabled = true;

            try {
                const config = getRequestConfig();
                const loopCount = parseInt(els.loopCount.value) || 1;
                const delayMs = parseInt(els.delayMs.value) || 0;

                log(`===== 开始执行（共${loopCount}次，延时${delayMs}ms）=====`, 'success');

                for (let i = 1; i <= loopCount; i++) {
                    log(`===== 第${i}次循环 =====`, 'info');

                    // 延时
                    if (delayMs > 0) {
                        await delay(delayMs);
                        log(`完成延时：${delayMs}ms`, 'info');
                    }

                    // 调用API
                    const result = await callEmailApi(config);

                    // 处理结果
                    if (result.success) {
                        state.mainData.push(result.data);
                        state.successCount++;
                        els.successCount.textContent = state.successCount;
                        log(`获取邮箱成功：${result.data}`, 'success');
                    } else {
                        state.failureCount++;
                        els.failureCount.textContent = state.failureCount;
                        log(`获取邮箱失败：${result.error}`, 'error');

                        // 备用保存（有数据时）
                        if (result.data) {
                            state.backupData.push(result.data);
                            log(`备用保存数据：${result.data}`, 'warning');
                        }

                        // 严重错误，停止循环
                        if (result.fatal) {
                            log(`严重错误，停止执行：${result.error}`, 'error');
                            break;
                        }
                    }
                }

                log(`===== 执行完成（成功：${state.successCount}次，失败：${state.failureCount}次）=====`, 'success');
                els.downloadMainBtn.disabled = state.mainData.length === 0;
                els.downloadBackupBtn.disabled = state.backupData.length === 0;
            } catch (e) {
                log(`执行异常：${e.message}`, 'error');
            } finally {
                state.isRunning = false;
                els.startBtn.disabled = false;
                els.startBtn.innerHTML = '<i class="bi bi-play-fill"></i> 开始获取邮箱';
                state.abortController = null;
            }
        }

        /**
         * 查询实时库存（优化后：带状态提示）
         */
        async function queryStock() {
            log('开始刷新实时库存...', 'info');
            
            // 初始化所有库存状态为"查询中"
            for (let i = 0; i < 6; i++) {
                setStockStatus(i, 'loading');
            }

            // 库存API配置（与库存项一一对应）
            const stockApis = [
                // 0: commodity_id=3（一号注册机）
                { url: `${CONFIG.API_OUTLOOK007_V1}/getStock.php?commodity_id=3`, index: 0 },
                // 1: commodity_id=4（一号注册机）
                { url: `${CONFIG.API_OUTLOOK007_V1}/getStock.php?commodity_id=4`, index: 1 },
                // 2: commodity_id=1（一号注册机）
                { url: `${CONFIG.API_OUTLOOK007_V2}/getStock.php?commodity_id=1`, index: 2 },
                // 3: commodity_id=2（一号注册机）
                { url: `${CONFIG.API_OUTLOOK007_V2}/getStock.php?commodity_id=2`, index: 3 },
                // 4: hotmail（二号注册机）, 5: outlook（二号注册机）
                { url: `${CONFIG.API_SHANKEYUN}/stock`, index: 4, type: 'shankeyun' }
            ];

            try {
                // 并行查询所有库存接口
                const promises = stockApis.map(async (item) => {
                    try {
                        const response = await fetch(item.url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                            }
                        });
                        const text = await convertEncoding(response);
                        const json = JSON.parse(text);

                        if (item.type === 'shankeyun') {
                            // 二号注册机库存（对应索引4和5）
                            const hotmailStock = json.hotmail || '0';
                            const outlookStock = json.outlook || '0';
                            
                            setStockStatus(4, 'success', hotmailStock);
                            setStockStatus(5, 'success', outlookStock);
                            
                            log(`二号注册机库存 - hotmail: ${hotmailStock}, outlook: ${outlookStock}`, 'success');
                        } else {
                            // 一号注册机库存（对应索引0-3）
                            const stock = json.data?.stock || '0';
                            setStockStatus(item.index, 'success', stock);
                            log(`一号注册机库存（commodity_id=${item.url.split('=')[1]}）：${stock}`, 'success');
                        }
                    } catch (e) {
                        const errorMsg = e.message || '未知错误';
                        setStockStatus(item.index, 'error', '?', errorMsg);
                        
                        // 如果是shankeyun，同时更新两个库存项的状态
                        if (item.type === 'shankeyun') {
                            setStockStatus(5, 'error', '?', errorMsg);
                        }
                        
                        log(`库存查询失败（${item.url}）：${errorMsg}`, 'error');
                    }
                });

                await Promise.all(promises);
                log('库存刷新完成', 'success');
            } catch (e) {
                log(`库存刷新异常：${e.message}`, 'error');
            }
        }

        /**
         * 查询余额
         */
        async function queryBalance() {
            log('开始查询余额...', 'info');
            const merchantId = els.merchantId.value.trim();
            const merchantKey = els.merchantKey.value.trim();
            const cardNumber = els.cardNumber.value.trim();

            // 一号注册机余额
            if (merchantId && merchantKey) {
                try {
                    const url = `${CONFIG.API_OUTLOOK007_V1}/login.php?app_id=${merchantId}&app_key=${merchantKey}`;
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                        }
                    });
                    const text = await convertEncoding(response);
                    const json = JSON.parse(text);
                    const balance = json.data?.balance || '0';
                    const message = json.message || '未知状态';
                    log(`一号注册机（outlook007）- 余额：${balance}积分，状态：${message}`, 'success');
                } catch (e) {
                    log(`一号注册机余额查询失败：${e.message}`, 'error');
                }
            } else {
                log('一号注册机：商户ID或秘钥为空，跳过查询', 'warning');
            }

            // 二号注册机余额
            if (cardNumber) {
                try {
                    const url = `${CONFIG.API_SHANKEYUN}/balance?card=${cardNumber}`;
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                        }
                    });
                    const text = await convertEncoding(response);
                    const json = JSON.parse(text);
                    const count = json.getScore || '0';
                    log(`二号注册机（shankeyun）- 可注册数量：${count}个`, 'success');
                } catch (e) {
                    log(`二号注册机余额查询失败：${e.message}`, 'error');
                }
            } else {
                log('二号注册机：卡号为空，跳过查询', 'warning');
            }

            log('余额查询完成', 'success');
        }

        // ===================== 事件监听 =====================
        // 开始获取按钮
        els.startBtn.addEventListener('click', startGetEmails);

        // 查询库存按钮
        els.stockBtn.addEventListener('click', queryStock);

        // 查询余额按钮
        els.balanceBtn.addEventListener('click', queryBalance);

        // 清空日志按钮
        els.clearLogBtn.addEventListener('click', () => {
            els.logArea.innerHTML = '';
            log('日志已清空', 'info');
        });

        // 下载主文件按钮
        els.downloadMainBtn.addEventListener('click', () => {
            const config = getRequestConfig();
            downloadFile(state.mainData, config.mainFileName);
        });

        // 下载备用文件按钮
        els.downloadBackupBtn.addEventListener('click', () => {
            const config = getRequestConfig();
            downloadFile(state.backupData, config.backupFileName);
        });

        // 页面加载完成日志
        window.addEventListener('load', () => {
            log('页面加载完成，可开始操作', 'success');
            log('注意：如果出现跨域错误，请使用CORS代理或本地运行', 'warning');
            // 初始化库存状态
            for (let i = 0; i < 6; i++) {
                setStockStatus(i, 'success', '-', '未查询');
            }
        });
    </script>
</body>
</html>
