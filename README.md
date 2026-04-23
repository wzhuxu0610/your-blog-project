#  完整部署步骤 - Cloudflare Pages 博客系统
一、准备工作
确保你有：

Cloudflare 账号

GitHub 账号（用于连接仓库，或使用直接上传方式）

二、创建 KV 命名空间
登录 Cloudflare 控制台 → https://dash.cloudflare.com

进入 KV 管理页面

左侧菜单点击 Workers 和 Pages

点击 KV 标签

点击 创建命名空间

创建 KV

text
名称：blog_kv（可自定义，建议用英文）
点击“创建”
记录 KV 名称（后面绑定需要用到），例如：blog_kv

三、准备项目文件
在你的本地创建以下文件结构：

text
your-blog-project/

├── functions/

│   └── [[route]].js

└── _routes.json

文件1：functions/[[route]].js

（完整代码见下方）

文件2：_routes.json

json

{
  "version": 1,
  
  "include": ["/*"],
  
  "exclude": []
  
}
