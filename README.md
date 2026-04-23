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

上传到 GitHub
创建 GitHub 仓库

登录 GitHub → 点击 New repository

仓库名：your-blog-project

选择 Public 或 Private

点击 Create repository

推送代码

bash
cd your-blog-project
git init
git add .
git commit -m "Initial commit: blog system"
git remote add origin https://github.com/你的用户名/your-blog-project.git
git push -u origin main
六、部署到 Cloudflare Pages
方式一：连接 Git 仓库（推荐）
进入 Pages

登录 Cloudflare 控制台

左侧菜单点击 Workers 和 Pages

点击 Pages 标签

点击 创建项目 → 连接到 Git

连接 GitHub

选择 GitHub

授权 Cloudflare 访问你的 GitHub

选择仓库 your-blog-project

配置构建设置

text
项目名称：your-blog（可自定义）
生产分支：main
构建命令：（留空）
构建输出目录：（留空）
点击保存并部署

方式二：直接上传（不推荐用于正式项目）
点击 创建项目 → 直接上传

拖拽 ZIP 文件（注意：ZIP 内直接包含 functions 文件夹和 _routes.json，不要多一层父目录）

输入项目名称

点击部署

七、绑定 KV 命名空间（重要！）
部署完成后，需要绑定 KV：

进入你的 Pages 项目页面

点击顶部 设置 标签

左侧菜单点击 函数

找到 KV 命名空间绑定 区域

点击 添加绑定

text
变量名：BLOG_KV
KV 命名空间：选择你之前创建的 blog_kv
点击 保存

八、重新部署（使 KV 绑定生效）
绑定 KV 后，需要重新部署：

点击 部署 标签

找到最新的部署记录

点击右侧的 ··· → 重试部署

或者推送一次空的 commit 到 GitHub 触发自动部署

九、访问你的博客
部署成功后，你会获得一个地址：

text
https://your-blog.pages.dev
访问即可使用博客系统。

默认登录账号：

text
用户名：admin
密码：ww123456
十、配置自定义域名（可选）
进入 Pages 项目 → 自定义域 标签

点击 设置自定义域

输入你的域名（如 blog.example.com）

按照提示添加 DNS 记录

十一、修改密码
如果你需要修改管理员密码，直接修改代码中的这两行：

javascript
const USERNAME = "admin";      // 修改成你想要的用户名
const PASSWORD = "ww123456";   // 修改成你想要的密码
然后重新推送到 GitHub，Pages 会自动重新部署。

十二、常见问题排查
问题	解决方法
部署后访问 404	检查 _routes.json 是否存在
API 请求失败	检查 KV 绑定是否完成（变量名必须为 BLOG_KV）
图片上传失败	检查 KV 命名空间是否正确绑定
登录后没反应	清除浏览器缓存，重新登录
项目结构总结
text
your-blog-project/
├── functions/
│   └── [[route]].js     ← 所有后端逻辑
└── _routes.json         ← 路由配置
不需要其他文件！ 这就是全部。
