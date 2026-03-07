# 服务器部署指南

本文档说明如何将项目部署到普通服务器(VPS/云服务器)上运行。

## 📋 系统要求

- **Node.js**: >= 14.0.0 (推荐 16.x 或 18.x)
- **操作系统**: Linux (Ubuntu/CentOS/Debian) 或 Windows Server
- **内存**: 至少 512MB
- **端口**: 默认 3000 (可修改)

## 🚀 快速部署

### 1. 上传项目到服务器

```bash
# 使用 git 克隆
git clone <your-repo-url>
cd o2api-main

# 或使用 FTP/SFTP 上传整个项目文件夹
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

#### 方式 A: 直接启动 (开发/测试)
```bash
npm start
```

#### 方式 B: 使用 PM2 (生产环境推荐)
```bash
# 全局安装 PM2
npm install -g pm2

# 启动服务
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
npm run pm2:logs

# 重启服务
npm run pm2:restart

# 停止服务
npm run pm2:stop
```

### 4. 访问服务

服务启动后,可以通过以下地址访问:

- **本地**: http://localhost:3000
- **外网**: http://your-server-ip:3000

#### 可用页面:
- 批量取件工具: http://your-server-ip:3000/qj.html
- 邮件管理: http://your-server-ip:3000/mail.html
- API 文档: http://your-server-ip:3000/api.html

#### API 端点:
- `GET/POST /api/mail-new` - 获取最新邮件
- `GET/POST /api/mail-all` - 获取全部邮件
- `GET/POST /api/process-inbox` - 清空收件箱
- `GET/POST /api/process-junk` - 清空垃圾箱

## ⚙️ 配置说明

### 修改端口

编辑 `server.js` 或设置环境变量:

```bash
# 方式 1: 环境变量
export PORT=8080
npm start

# 方式 2: 修改 ecosystem.config.js
# 找到 env.PORT 修改为你想要的端口
```

### PM2 配置

编辑 `ecosystem.config.js` 可以修改:
- `instances`: 进程数量 (默认 1)
- `max_memory_restart`: 内存限制
- `env.PORT`: 端口号

## 🔒 安全建议

### 1. 使用反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. 配置 HTTPS (Let's Encrypt)

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 3. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 🔧 常见问题

### 端口被占用
```bash
# 查看端口占用
netstat -tuln | grep 3000

# 或使用 lsof
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### PM2 开机自启动
```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成开机启动脚本
pm2 startup

# 按照提示执行命令
```

### 查看日志
```bash
# PM2 日志
pm2 logs o2api

# 或查看日志文件
tail -f logs/out.log
tail -f logs/err.log
```

### 更新代码后重启
```bash
# 拉取最新代码
git pull

# 安装新依赖(如果有)
npm install

# 重启服务
npm run pm2:restart
```

## 📊 性能优化

### 1. 启用集群模式

编辑 `ecosystem.config.js`:
```javascript
instances: 'max',  // 使用所有 CPU 核心
exec_mode: 'cluster'
```

### 2. 配置 Nginx 缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 启用 Gzip 压缩

在 `server.js` 中添加:
```javascript
const compression = require('compression');
app.use(compression());
```

## 🐳 Docker 部署 (可选)

创建 `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

运行:
```bash
docker build -t o2api .
docker run -d -p 3000:3000 --name o2api o2api
```

## 📞 技术支持

如有问题,请联系: QQ 113575320
