# 微软邮箱 OAuth2 API 管理系统 - 免费开源版

> 🎉 完全免费,无需卡密,开箱即用!

## ✨ 特性

- ✅ **完全免费** - 移除所有卡密验证和购买限制
- ✅ **Graph API 优先** - 更快更稳定的邮件获取
- ✅ **批量管理** - 支持批量导入和管理邮箱
- ✅ **验证码提取** - 自动识别6位数字验证码
- ✅ **多种工具** - 数据处理、格式转换、去重等

## 🚀 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

访问: http://localhost:3000

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/o2api)

1. 点击上方按钮
2. 使用 GitHub 登录 Vercel
3. 导入仓库
4. 自动部署完成!

## 📖 功能页面

- **批量API生成**: `/qj.html` - 批量生成邮箱API调用链接
- **邮箱管理**: `/mail.html` - 查看和管理邮箱邮件
- **API文档**: `/api.html` - 完整的API接口文档

## 🔌 API 接口

### 获取最新邮件
```
GET/POST /api/mail-new
```

### 获取全部邮件
```
GET/POST /api/mail-all
```

### 清空收件箱
```
GET/POST /api/process-inbox
```

### 清空垃圾箱
```
GET/POST /api/process-junk
```

## 📋 必需参数

- `refresh_token` - OAuth2 刷新令牌
- `client_id` - 应用客户端 ID
- `email` - 邮箱地址
- `mailbox` - 邮箱文件夹 (INBOX/Junk)

## 🛠️ 技术栈

- Node.js + Express
- Microsoft Graph API
- IMAP (备用)
- TailwindCSS

## 📝 更新日志

### v2.0.0 - 免费开源版

- ✅ 移除所有卡密验证系统
- ✅ 移除所有API密码验证
- ✅ 降低 Graph API 权限要求
- ✅ 优化 API 链接生成
- ✅ 修复 IMAP 错误处理
- ✅ 清理所有商业链接

## 📄 许可证

MIT License - 完全免费使用

## 🙏 致谢

基于原项目修改,移除商业限制,完全开源免费。
