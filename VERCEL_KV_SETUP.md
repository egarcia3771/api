# Vercel KV 配置指南 - 实现完全永久的短链接存储

## 🎯 配置步骤

### 1. 部署项目到 Vercel
1. 打开 https://vercel.com/new
2. 拖拽项目文件夹到浏览器
3. 点击 **Deploy** 等待部署完成

### 2. 创建 Vercel KV 数据库
1. 部署完成后,进入项目的 Dashboard
2. 点击顶部的 **Storage** 标签
3. 点击 **Create Database**
4. 选择 **KV** (Key-Value Store)
5. 输入数据库名称,例如: `o2api-links`
6. 选择区域(建议选择离你最近的区域)
7. 点击 **Create** 创建数据库

### 3. 连接 KV 到项目
1. 创建完成后,点击 **Connect to Project**
2. 选择你的项目
3. Vercel 会自动将以下环境变量注入到你的项目:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 4. 重新部署
1. 返回项目的 **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 等待重新部署完成

## ✅ 完成!

现在你的短链接将**完全永久保存**,不会因为服务器重启或重新部署而丢失!

## 📊 KV 存储优势

- ✅ **永久保存**: 数据持久化存储,不会丢失
- ✅ **高性能**: 基于 Redis,读写速度极快
- ✅ **自动扩展**: Vercel 自动管理容量
- ✅ **免费额度**: 每月 30,000 次读取 + 1,000 次写入(免费版)

## 🔍 查看存储的数据

1. 进入 Vercel Dashboard
2. 点击 **Storage** 标签
3. 选择你的 KV 数据库
4. 点击 **Data Browser** 查看所有存储的短链接

## 💡 提示

- 短链接格式: `link:短ID` (例如: `link:5dcb5f116443168c`)
- 每个短链接包含: 邮箱参数、创建时间、访问次数等信息
- 数据永久保存,除非手动删除
