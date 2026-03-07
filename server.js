const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const mailNewHandler = require('./api/mail-new.js');
const mailAllHandler = require('./api/mail-all.js');
const mailYzmHandler = require('./api/mail-yzm.js');
const mailHandler = require('./api/mail.js');
const processInboxHandler = require('./api/process-inbox.js');
const processJunkHandler = require('./api/process-junk.js');
const sqHandler = require('./api/sq.js');
const sxHandler = require('./api/sx.js');
const shortLinkHandler = require('./api/short-link.js');
const mHandler = require('./api/m.js');

function wrapVercelHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal Server Error', 
          message: error.message 
        });
      }
    }
  };
}

app.get('/api/mail-new', wrapVercelHandler(mailNewHandler));
app.post('/api/mail-new', wrapVercelHandler(mailNewHandler));

app.get('/api/mail-all', wrapVercelHandler(mailAllHandler));
app.post('/api/mail-all', wrapVercelHandler(mailAllHandler));

app.get('/api/mail-yzm', wrapVercelHandler(mailYzmHandler));
app.post('/api/mail-yzm', wrapVercelHandler(mailYzmHandler));

app.get('/api/mail', wrapVercelHandler(mailHandler));
app.post('/api/mail', wrapVercelHandler(mailHandler));

app.get('/api/process-inbox', wrapVercelHandler(processInboxHandler));
app.post('/api/process-inbox', wrapVercelHandler(processInboxHandler));

app.get('/api/process-junk', wrapVercelHandler(processJunkHandler));
app.post('/api/process-junk', wrapVercelHandler(processJunkHandler));

app.get('/api/sq', wrapVercelHandler(sqHandler));
app.post('/api/sq', wrapVercelHandler(sqHandler));

app.get('/api/sx', wrapVercelHandler(sxHandler));
app.post('/api/sx', wrapVercelHandler(sxHandler));

app.post('/api/short-link', wrapVercelHandler(shortLinkHandler));
app.get('/s/:id', wrapVercelHandler(shortLinkHandler));

app.post('/api/m', wrapVercelHandler(mHandler));
app.get('/m/:id/*', wrapVercelHandler(mHandler));

app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
  maxAge: '1y',
  immutable: true
}));

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('mail.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('/qj.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'qj.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.txt'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 服务器已启动!`);
  console.log(`📡 本地访问: http://localhost:${PORT}`);
  console.log(`🌐 网络访问: http://0.0.0.0:${PORT}`);
  console.log(`\n可用页面:`);
  console.log(`  - 批量取件工具: http://localhost:${PORT}/qj.html`);
  console.log(`  - 邮件管理: http://localhost:${PORT}/mail.html`);
  console.log(`  - API 文档: http://localhost:${PORT}/api.html`);
  console.log(`\nAPI 端点:`);
  console.log(`  - GET/POST /api/mail-new - 获取最新邮件`);
  console.log(`  - GET/POST /api/mail-all - 获取全部邮件`);
  console.log(`  - GET/POST /api/process-inbox - 清空收件箱`);
  console.log(`  - GET/POST /api/process-junk - 清空垃圾箱`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
