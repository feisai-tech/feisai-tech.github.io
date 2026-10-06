---
sidebar_label: "Cloudflare"
sidebar_position: 7
slug: cloudflare
---

# Cloudflare 完全指南

Cloudflare 是全球领先的网络安全和性能优化平台，提供免费的 CDN、DNS、DDoS 防护等服务，是开发者和站长的必备工具。

## Cloudflare 简介

### 核心服务

- 🌐 **免费 CDN**: 全球 300+ 节点加速
- 🔒 **免费 SSL**: 一键启用 HTTPS
- 🛡️ **DDoS 防护**: 免费的 L3/L4/L7 防护
- 📧 **邮件路由**: 免费的邮件转发服务
- 📄 **Pages**: 免费的静态网站托管
- ⚡ **Workers**: 边缘计算平台
- 🗄️ **R2**: S3 兼容的对象存储
- 🔑 **Zero Trust**: 零信任安全服务

### 为什么选择 Cloudflare

| 特性         | 免费版   | 付费版 |
| ------------ | -------- | ------ |
| CDN 加速     | ✅       | ✅     |
| SSL 证书     | ✅       | ✅     |
| DDoS 防护    | ✅       | ✅     |
| 页面规则     | 3 条     | 更多   |
| Workers 请求 | 10 万/天 | 更多   |
| Pages 项目   | 无限     | 无限   |
| 邮件路由     | ✅       | ✅     |

## 账号注册与域名托管

### 注册账号

1. 访问 [Cloudflare 官网](https://www.cloudflare.com/)
2. 点击 "Sign Up" 注册
3. 使用邮箱注册并验证

### 添加域名

1. 登录 Cloudflare Dashboard
2. 点击 "Add a Site"
3. 输入你的域名（如 `example.com`）
4. 选择计划（Free 免费版即可）

### 更换 DNS 服务器

Cloudflare 会分配两个 DNS 服务器，需要在域名注册商处更换：

```
# Cloudflare 分配的 DNS 服务器示例
arya.ns.cloudflare.com
tim.ns.cloudflare.com
```

#### 常见域名注册商操作

**阿里云/万网**:

1. 登录阿里云控制台
2. 进入域名管理
3. 选择域名 → DNS 修改
4. 替换为 Cloudflare 的 NS 服务器

**Namesilo**:

1. 登录 Namesilo
2. Domain Manager → 选择域名
3. NameServers → Change
4. 填入 Cloudflare NS 服务器

**GoDaddy**:

1. 登录 GoDaddy
2. 我的产品 → 域名 → DNS
3. 更改名称服务器
4. 输入自定义名称服务器

:::tip
DNS 更换可能需要 24-48 小时生效，通常几分钟到几小时内即可完成。
:::

## DNS 解析配置

### 添加 DNS 记录

进入 DNS → Records → Add Record

#### 常用记录类型

| 类型  | 用途           | 示例                   |
| ----- | -------------- | ---------------------- |
| A     | 指向 IPv4 地址 | `@ → 1.2.3.4`          |
| AAAA  | 指向 IPv6 地址 | `@ → 2001:db8::1`      |
| CNAME | 别名记录       | `www → example.com`    |
| MX    | 邮件服务器     | `@ → mail.example.com` |
| TXT   | 文本记录       | SPF、DKIM、验证等      |

#### 配置示例

```yaml
# 根域名指向服务器
类型: A
名称: @
内容: 192.168.1.100
代理状态: 已代理（橙色云朵）

# www 子域名
类型: CNAME
名称: www
内容: example.com
代理状态: 已代理

# API 服务（不走 CDN）
类型: A
名称: api
内容: 192.168.1.101
代理状态: 仅 DNS（灰色云朵）

# 邮件服务器
类型: MX
名称: @
内容: mail.example.com
优先级: 10
```

### 代理模式说明

- **🟠 已代理 (Proxied)**: 流量经过 Cloudflare，享受 CDN、SSL、防护
- **⚫ 仅 DNS (DNS Only)**: 仅解析，不经过 Cloudflare

```yaml
# 推荐使用代理模式
网站: 代理
静态资源: 代理
API: 根据需求选择

# 必须使用仅 DNS
邮件服务器: 仅 DNS
FTP: 仅 DNS
SSH: 仅 DNS（或使用 Cloudflare Tunnel）
```

## SSL/TLS 配置

### 加密模式

进入 SSL/TLS → Overview

```yaml
# 加密模式选项
Off: 不加密（不推荐）
Flexible: 用户 → Cloudflare 加密（源站可以是 HTTP）
Full: 全程加密（源站需要 SSL 证书，可自签名）
Full (Strict): 全程严格加密（源站需要有效 SSL 证书）
```

:::warning
推荐使用 **Full (Strict)** 模式，配合源站 SSL 证书使用。
:::

### 获取源站证书

Cloudflare 提供免费的源站证书：

1. 进入 SSL/TLS → Origin Server
2. 点击 "Create Certificate"
3. 选择证书有效期（最长 15 年）
4. 下载证书和私钥

```bash
# 证书安装位置示例 (Nginx)
/etc/nginx/ssl/cloudflare-origin.pem    # 证书
/etc/nginx/ssl/cloudflare-origin.key    # 私钥
```

#### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cloudflare-origin.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare-origin.key;

    # 仅允许 Cloudflare IP 访问
    # 参考: https://www.cloudflare.com/ips/

    location / {
        root /var/www/html;
        index index.html;
    }
}
```

### Edge Certificates

进入 SSL/TLS → Edge Certificates

```yaml
# 推荐设置
Always Use HTTPS: 开启
Automatic HTTPS Rewrites: 开启
Minimum TLS Version: TLS 1.2
TLS 1.3: 开启
```

## 免费 CDN 配置

### 缓存配置

进入 Caching → Configuration

```yaml
# 缓存级别
Caching Level: Standard

# 浏览器缓存 TTL
Browser Cache TTL: 4 hours（或根据需求调整）

# 开发模式（调试时使用）
Development Mode: 关闭
```

### 缓存规则

进入 Caching → Cache Rules

#### 创建缓存规则示例

```yaml
# 规则 1: 静态资源长期缓存
规则名称: Cache Static Assets
匹配条件: URI 路径包含 /static/ 或 /assets/
操作:
  - 缓存适用性: 合格
  - Edge TTL: 1 个月
  - Browser TTL: 1 周

# 规则 2: 不缓存 API
规则名称: Bypass API
匹配条件: URI 路径以 /api/ 开头
操作:
  - 缓存适用性: 绕过
```

### 清除缓存

进入 Caching → Configuration → Purge Cache

```yaml
# 清除选项
Purge Everything: 清除所有缓存
Custom Purge: 清除指定 URL

# 自定义清除示例
URLs:
  - https://example.com/css/style.css
  - https://example.com/js/app.js
```

### 页面规则（Page Rules）

免费版有 3 条页面规则，可实现更精细的控制：

```yaml
# 规则 1: 强制 HTTPS
URL 匹配: http://*example.com/*
操作: Always Use HTTPS

# 规则 2: 缓存所有内容
URL 匹配: *example.com/static/*
操作:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

# 规则 3: 禁用安全功能（特殊需求）
URL 匹配: *example.com/webhook/*
操作:
  - Security Level: Essentially Off
  - Browser Integrity Check: Off
```

## Cloudflare Pages

Pages 是 Cloudflare 提供的免费静态网站托管服务，类似于 Vercel 和 Netlify。

### 特性

- ✅ 无限站点和请求
- ✅ 无限带宽
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ Git 集成（GitHub/GitLab）
- ✅ 预览部署
- ✅ 自定义域名

### 创建 Pages 项目

#### 方式 1: 连接 Git 仓库

1. 进入 Workers & Pages → Create
2. 选择 Pages → Connect to Git
3. 授权 GitHub/GitLab
4. 选择仓库和分支

```yaml
# 构建配置示例
项目名称: my-website
生产分支: main
构建命令: npm run build
构建输出目录: dist

# 框架预设
- React: npm run build → build
- Vue: npm run build → dist
- Next.js: npm run build → .next
- Docusaurus: npm run build → build
- Hugo: hugo → public
- Jekyll: jekyll build → _site
```

#### 方式 2: 直接上传

1. 进入 Workers & Pages → Create
2. 选择 Pages → Upload assets
3. 拖拽文件夹或 ZIP 文件上传

### 环境变量

进入项目 Settings → Environment variables

```yaml
# 生产环境变量
NODE_VERSION: 18
API_URL: https://api.example.com

# 预览环境变量（可单独设置）
API_URL: https://api-staging.example.com
```

### 自定义域名

1. 进入项目 → Custom domains
2. 点击 "Set up a custom domain"
3. 输入域名（如 `www.example.com`）
4. Cloudflare 会自动添加 DNS 记录

```yaml
# 域名配置示例
主域名: example.com
www 子域: www.example.com
```

### 重定向和 Headers

在项目根目录创建配置文件：

#### `_redirects` 文件

```
# 重定向规则
/old-page /new-page 301
/blog/* /posts/:splat 301
/docs /docs/intro 302

# 代理（隐藏真实 URL）
/api/* https://api.example.com/:splat 200
```

#### `_headers` 文件

```
# 全局 Headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# 静态资源缓存
/static/*
  Cache-Control: public, max-age=31536000, immutable

# API 禁用缓存
/api/*
  Cache-Control: no-store
```

### Functions（边缘函数）

在 `functions` 目录创建函数：

```
my-project/
├── functions/
│   ├── api/
│   │   └── hello.js    → /api/hello
│   └── contact.js      → /contact
├── public/
└── package.json
```

```javascript
// functions/api/hello.js
export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      message: "Hello from Cloudflare Pages Functions!",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

## Cloudflare Workers

Workers 是 Cloudflare 的边缘计算平台，可在全球边缘节点运行 JavaScript/TypeScript。

### 免费额度

```yaml
每日请求: 100,000 次
CPU 时间: 10ms/请求
Workers 数量: 100 个
```

### 创建 Worker

#### 方式 1: Dashboard 创建

1. 进入 Workers & Pages → Create
2. 选择 Workers → Create Worker
3. 编辑代码并部署

#### 方式 2: Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 创建项目
wrangler init my-worker

# 本地开发
wrangler dev

# 部署
wrangler deploy
```

### Worker 示例

#### 基础 Hello World

```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response("Hello World!");
  },
};
```

#### 请求路由

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/":
        return new Response("Home Page");
      case "/api/hello":
        return Response.json({ message: "Hello API" });
      case "/api/time":
        return Response.json({ time: new Date().toISOString() });
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
```

#### 反向代理

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 修改目标地址
    url.hostname = "api.example.com";

    // 转发请求
    return fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  },
};
```

#### CORS 代理

```javascript
export default {
  async fetch(request, env, ctx) {
    // 处理预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing url parameter", { status: 400 });
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", "*");

    return newResponse;
  },
};
```

#### 访问统计

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 记录访问（使用 KV 存储）
    const key = `visits:${url.pathname}`;
    const visits = parseInt((await env.STATS.get(key)) || "0") + 1;
    ctx.waitUntil(env.STATS.put(key, visits.toString()));

    // 返回原始响应
    return fetch(request);
  },
};
```

### Workers KV

KV 是 Cloudflare 的键值存储服务。

```bash
# 创建 KV 命名空间
wrangler kv namespace create "MY_KV"

# 绑定到 Worker（wrangler.toml）
[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"
```

```javascript
// 使用 KV
export default {
  async fetch(request, env, ctx) {
    // 写入
    await env.MY_KV.put("key", "value");

    // 读取
    const value = await env.MY_KV.get("key");

    // 删除
    await env.MY_KV.delete("key");

    // 列出所有键
    const keys = await env.MY_KV.list();

    return Response.json({ value, keys });
  },
};
```

### 自定义域名

1. 进入 Worker → Settings → Triggers
2. 添加 Custom Domain
3. 输入域名（如 `api.example.com`）

## 邮件路由 (Email Routing)

Cloudflare Email Routing 允许你免费创建和转发域名邮箱。

### 开启邮件路由

1. 进入 Email → Email Routing
2. 点击 "Get started"
3. 添加 DNS 记录（Cloudflare 会自动添加）

### 配置转发规则

```yaml
# 转发到个人邮箱
源地址: contact@example.com
目标地址: your-personal@gmail.com

# 通配符转发
源地址: *@example.com
目标地址: catch-all@gmail.com

# 多个地址
源地址: support@example.com
目标地址:
  - support1@gmail.com
  - support2@gmail.com
```

### 目标邮箱验证

首次添加目标邮箱需要验证：

1. 添加目标邮箱
2. 查收验证邮件
3. 点击验证链接

### 自定义 MX 记录

Cloudflare 会自动添加所需的 DNS 记录：

```yaml
# MX 记录
类型: MX
名称: @
内容: route1.mx.cloudflare.net
优先级: 29

类型: MX
名称: @
内容: route2.mx.cloudflare.net
优先级: 73

类型: MX
名称: @
内容: route3.mx.cloudflare.net
优先级: 4

# TXT 记录（SPF）
类型: TXT
名称: @
内容: v=spf1 include:_spf.mx.cloudflare.net ~all
```

### Email Workers

使用 Workers 处理邮件：

```javascript
export default {
  async email(message, env, ctx) {
    // 获取邮件信息
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get("subject");

    // 根据条件转发
    if (to === "support@example.com") {
      await message.forward("support-team@company.com");
    } else if (subject.includes("urgent")) {
      await message.forward("urgent@company.com");
    } else {
      await message.forward("default@gmail.com");
    }
  },
};
```

## 安全配置

### WAF 规则

进入 Security → WAF

```yaml
# 托管规则（免费版有限）
Cloudflare 托管规则: 开启

# 速率限制
规则: 限制单 IP 请求频率
阈值: 100 请求/分钟
操作: Challenge
```

### Bot 管理

进入 Security → Bots

```yaml
# 机器人攻击模式（免费）
Bot Fight Mode: 开启

# 超级机器人攻击模式（付费）
Super Bot Fight Mode: 根据需求
```

### IP 访问规则

进入 Security → WAF → Tools

```yaml
# 封禁 IP
IP 地址: 1.2.3.4
操作: Block

# 封禁国家
国家: XX
操作: Block

# 允许特定 IP
IP 地址: 公司 IP
操作: Allow
```

### 验证码 (Challenge)

```yaml
# 安全级别
Security Level:
  - Essentially Off: 仅挑战最恶意的请求
  - Low: 挑战较威胁的请求
  - Medium: 挑战中等威胁的请求
  - High: 挑战所有可疑请求
  - I'm Under Attack: 全部挑战（受攻击时使用）
```

## Cloudflare Tunnel

Cloudflare Tunnel 可以安全地将本地服务暴露到公网，无需开放端口。

### 安装 cloudflared

```bash
# macOS
brew install cloudflared

# Windows (使用 winget)
winget install Cloudflare.cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 创建 Tunnel

```bash
# 登录
cloudflared tunnel login

# 创建 Tunnel
cloudflared tunnel create my-tunnel

# 配置路由
cloudflared tunnel route dns my-tunnel app.example.com
```

### 配置文件

创建 `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  # 网站
  - hostname: app.example.com
    service: http://localhost:3000

  # API
  - hostname: api.example.com
    service: http://localhost:8080

  # SSH
  - hostname: ssh.example.com
    service: ssh://localhost:22

  # 默认规则（必须）
  - service: http_status:404
```

### 运行 Tunnel

```bash
# 前台运行
cloudflared tunnel run my-tunnel

# 作为服务安装（Linux）
sudo cloudflared service install
sudo systemctl start cloudflared
```

## R2 对象存储

R2 是 Cloudflare 的 S3 兼容对象存储，免费额度：

- 10 GB 存储
- 100 万次 A 类操作/月
- 1000 万次 B 类操作/月
- 无出站流量费用

### 创建存储桶

1. 进入 R2 → Create bucket
2. 输入存储桶名称
3. 选择位置（自动或指定）

### 使用 S3 API

```bash
# 使用 AWS CLI
aws configure --profile cloudflare
# Access Key ID: 在 R2 → Manage R2 API Tokens 创建
# Secret Access Key: 创建时获取
# Region: auto

# 配置端点
aws s3 ls --endpoint-url https://<account-id>.r2.cloudflarestorage.com --profile cloudflare
```

### 在 Worker 中使用 R2

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    switch (request.method) {
      case "PUT":
        await env.MY_BUCKET.put(key, request.body);
        return new Response(`Put ${key} successfully!`);

      case "GET":
        const object = await env.MY_BUCKET.get(key);
        if (object === null) {
          return new Response("Object Not Found", { status: 404 });
        }
        return new Response(object.body);

      case "DELETE":
        await env.MY_BUCKET.delete(key);
        return new Response("Deleted!");

      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  },
};
```

## 常用技巧

### 1. 开发模式

调试时临时关闭缓存：

```yaml
位置: Caching → Configuration → Development Mode
持续时间: 3 小时
效果: 暂停边缘缓存
```

### 2. 暂停 Cloudflare

紧急情况下暂停 Cloudflare 代理：

```yaml
位置: Overview → Advanced Actions → Pause Cloudflare on Site
效果: 所有流量直连源站
```

### 3. IP 地理位置

获取访客位置信息：

```javascript
// Worker 中
export default {
  async fetch(request, env, ctx) {
    const cf = request.cf;
    return Response.json({
      country: cf.country,
      city: cf.city,
      region: cf.region,
      timezone: cf.timezone,
      postalCode: cf.postalCode,
      latitude: cf.latitude,
      longitude: cf.longitude,
    });
  },
};
```

### 4. 真实 IP 获取

源站获取真实访客 IP：

```yaml
# 请求头
CF-Connecting-IP: 真实客户端 IP
X-Forwarded-For: 代理链 IP 列表
```

```nginx
# Nginx 配置
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
# ... 更多 Cloudflare IP
real_ip_header CF-Connecting-IP;
```

### 5. 仅允许 Cloudflare IP

```bash
# 获取 Cloudflare IP 列表
curl https://www.cloudflare.com/ips-v4
curl https://www.cloudflare.com/ips-v6
```

```nginx
# Nginx 配置
allow 103.21.244.0/22;
allow 103.22.200.0/22;
# ... 更多 Cloudflare IP
deny all;
```

## 常见问题

### 1. 无限重定向

**原因**: SSL 模式设置为 Flexible，但源站强制 HTTPS

**解决**:

```yaml
SSL 模式改为: Full 或 Full (Strict)
```

### 2. 源站 IP 泄露

**预防措施**:

1. 更换源站 IP
2. 仅允许 Cloudflare IP 访问
3. 使用 Cloudflare Tunnel
4. 历史 DNS 记录清理

### 3. 缓存不更新

**解决**:

1. 清除 Cloudflare 缓存
2. 检查 Browser Cache TTL
3. 开启开发模式调试
4. 检查源站 Cache-Control 头

### 4. Workers 超时

**免费版限制**:

- CPU 时间: 10ms
- 执行时间: 30s

**解决**:

- 优化代码逻辑
- 升级到付费版
- 使用 Durable Objects

### 5. 邮件无法接收

**检查项**:

1. MX 记录是否正确
2. 目标邮箱是否已验证
3. 是否被垃圾邮件过滤

## 参考资源

- [Cloudflare 官方文档](https://developers.cloudflare.com/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Workers 示例](https://developers.cloudflare.com/workers/examples/)
- [Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Blog](https://blog.cloudflare.com/)
- [Cloudflare 社区](https://community.cloudflare.com/)


---

> 整理：**FEISAI** · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans)。原作者、原文链接与修改说明见 [Sources](/sources)。
