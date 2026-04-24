// /functions/[[route]].js - 最简化稳定版

const USERNAME = "admin";
const PASSWORD = "ww123456";
const LOGO_KV_KEY = "site_logo_info";
const BUTTONS_KV_KEY = "quick_buttons";

const DEFAULT_BUTTONS = [
  { name: "百度", url: "https://www.baidu.com", enabled: true },
  { name: "谷歌", url: "https://www.google.com", enabled: true },
  { name: "GitHub", url: "https://github.com", enabled: true },
  { name: "淘宝", url: "https://www.taobao.com", enabled: true },
  { name: "京东", url: "https://www.jd.com", enabled: true },
  { name: "哔哩哔哩", url: "https://www.bilibili.com", enabled: true },
  { name: "知乎", url: "https://www.zhihu.com", enabled: true },
  { name: "微博", url: "https://weibo.com", enabled: true },
  { name: "抖音", url: "https://www.douyin.com", enabled: true },
  { name: "网易云音乐", url: "https://music.163.com", enabled: true }
];

function verifyToken(token) {
  if (!token) return false;
  try {
    const data = JSON.parse(atob(token));
    return data.user === USERNAME && data.exp > Date.now();
  } catch {
    return false;
  }
}

function getFullUrl(request) {
  const url = new URL(request.url);
  return url;
}

async function handleGetLogo(env) {
  try {
    const logoData = await env.BLOG_KV.get(LOGO_KV_KEY);
    if (logoData) {
      const logo = JSON.parse(logoData);
      return new Response(JSON.stringify({ success: true, url: logo.url, version: logo.version || 0 }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ success: false, url: "" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, url: "", error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleUploadLogo(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get("logo");
    if (!file) {
      return new Response(JSON.stringify({ success: false, message: "请选择图片" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, message: "Logo图片不能超过2MB" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ success: false, message: "请上传图片文件" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const buf = await file.arrayBuffer();
    const ext = file.type.split("/")[1] || "png";
    const key = "logo_" + Date.now() + "." + ext;
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const url = getFullUrl(request);
    const logoUrl = `${url.protocol}//${url.host}/api/i/${key}`;
    
    const logoInfo = {
      url: logoUrl,
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };
    await env.BLOG_KV.put(LOGO_KV_KEY, JSON.stringify(logoInfo));
    
    return new Response(JSON.stringify({ success: true, url: logoUrl, version: logoInfo.version }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "上传失败: " + e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleDeleteLogo(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  
  try {
    const logoData = await env.BLOG_KV.get(LOGO_KV_KEY);
    if (logoData) {
      const logo = JSON.parse(logoData);
      const urlParts = logo.url.split("/api/i/");
      if (urlParts.length > 1) {
        const logoKey = urlParts[1].split("?")[0];
        await env.BLOG_KV.delete(logoKey);
      }
    }
    await env.BLOG_KV.delete(LOGO_KV_KEY);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "删除失败: " + e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleLogin(request) {
  try {
    const { username, password } = await request.json();
    if (username === USERNAME && password === PASSWORD) {
      const token = btoa(JSON.stringify({
        user: USERNAME,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));
      return new Response(JSON.stringify({ success: true, token }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleUploadImage(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ success: false, message: "请选择文件" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, message: "图片不能超过5MB" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const buf = await file.arrayBuffer();
    const key = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await env.BLOG_KV.put(key, buf, { metadata: { type: file.type } });
    
    const url = getFullUrl(request);
    const imageUrl = `${url.protocol}//${url.host}/api/i/${key}`;
    return new Response(JSON.stringify({ success: true, url: imageUrl }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleGetButtons(env) {
  try {
    const buttonsData = await env.BLOG_KV.get(BUTTONS_KV_KEY);
    if (buttonsData) {
      return new Response(buttonsData, {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify(DEFAULT_BUTTONS), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify(DEFAULT_BUTTONS), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleSaveButtons(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请先登录" }), { 
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  
  try {
    const buttons = await request.json();
    await env.BLOG_KV.put(BUTTONS_KV_KEY, JSON.stringify(buttons));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleGetBlogs(env) {
  try {
    if (!env || !env.BLOG_KV) {
      return new Response(JSON.stringify({ list: [], error: "KV绑定不存在" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const list = [];
    const { keys } = await env.BLOG_KV.list();
    
    for (const key of keys) {
      if (!key.name.startsWith("img_") && !key.name.startsWith("logo_") && key.name !== LOGO_KV_KEY && key.name !== BUTTONS_KV_KEY && /^\d+$/.test(key.name)) {
        const value = await env.BLOG_KV.get(key.name);
        if (value) {
          try {
            const post = JSON.parse(value);
            list.push({
              id: key.name,
              title: post.title || "无标题",
              time: post.time || 0,
              img: post.img || ""
            });
          } catch (e) {}
        }
      }
    }
    list.sort((a, b) => b.time - a.time);
    
    return new Response(JSON.stringify({ list: list }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ list: [], error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleGetFeaturedPost(env) {
  try {
    const { keys } = await env.BLOG_KV.list();
    let featuredPost = null;
    let latestTime = 0;
    
    for (const key of keys) {
      if (!key.name.startsWith("img_") && !key.name.startsWith("logo_") && key.name !== LOGO_KV_KEY && key.name !== BUTTONS_KV_KEY && /^\d+$/.test(key.name)) {
        const value = await env.BLOG_KV.get(key.name);
        if (value) {
          try {
            const post = JSON.parse(value);
            if (post.time > latestTime) {
              latestTime = post.time;
              featuredPost = {
                id: key.name,
                title: post.title,
                content: post.content || "",
                img: post.img || "",
                time: post.time
              };
            }
          } catch (e) {}
        }
      }
    }
    
    return new Response(JSON.stringify(featuredPost || { isEmpty: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleGetBlog(id, env) {
  if (!id) return new Response(JSON.stringify({ error: "不存在" }), { status: 404 });
  try {
    const value = await env.BLOG_KV.get(id);
    if (!value) return new Response(JSON.stringify({ error: "文章不存在" }), { status: 404 });
    const post = JSON.parse(value);
    return new Response(JSON.stringify({
      id: id,
      title: post.title,
      content: post.content || "",
      img: post.img || "",
      time: post.time || 0
    }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

async function handleCreateBlog(request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请登录" }), { status: 401 });
  }
  
  try {
    const data = await request.json();
    if (!data.title || data.title.trim() === "") {
      return new Response(JSON.stringify({ success: false, message: "标题不能为空" }), { status: 400 });
    }
    
    const id = Date.now().toString();
    const post = {
      title: data.title.trim(),
      content: data.content || "",
      img: data.img || "",
      time: Date.now()
    };
    
    await env.BLOG_KV.put(id, JSON.stringify(post));
    
    return new Response(JSON.stringify({ success: true, id: id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleUpdateBlog(id, request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "请登录" }), { status: 401 });
  }
  if (!id) {
    return new Response(JSON.stringify({ error: "文章ID不存在" }), { status: 400 });
  }
  
  try {
    const existing = await env.BLOG_KV.get(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: "文章不存在" }), { status: 404 });
    }
    
    const data = await request.json();
    if (!data.title || data.title.trim() === "") {
      return new Response(JSON.stringify({ success: false, message: "标题不能为空" }), { status: 400 });
    }
    
    const oldPost = JSON.parse(existing);
    const post = {
      title: data.title.trim(),
      content: data.content || "",
      img: data.img || oldPost.img,
      time: oldPost.time
    };
    await env.BLOG_KV.put(id, JSON.stringify(post));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleDeleteBlog(id, request, env) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ success: false, message: "未授权" }), { status: 401 });
  }
  try {
    await env.BLOG_KV.delete(id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleGetImage(key, env) {
  if (!key) return new Response("Not Found", { status: 404 });
  
  try {
    const img = await env.BLOG_KV.get(key, { type: "arrayBuffer" });
    if (!img) return new Response("Not Found", { status: 404 });
    
    const meta = await env.BLOG_KV.get(key, { metadata: true });
    return new Response(img, {
      headers: {
        "Content-Type": meta?.type || "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}

function handleOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === "GET" && path === "/") {
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
  
  if (method === "OPTIONS") {
    return handleOptions();
  }
  
  if (method === "GET" && path === "/api/buttons") {
    return handleGetButtons(env);
  }
  
  if (method === "POST" && path === "/api/buttons") {
    return handleSaveButtons(request, env);
  }
  
  if (method === "GET" && path === "/api/featured") {
    return handleGetFeaturedPost(env);
  }
  
  if (method === "GET" && path === "/api/logo") {
    return handleGetLogo(env);
  }
  
  if (method === "POST" && path === "/api/logo/upload") {
    return handleUploadLogo(request, env);
  }
  
  if (method === "DELETE" && path === "/api/logo") {
    return handleDeleteLogo(request, env);
  }
  
  if (method === "POST" && path === "/api/login") {
    return handleLogin(request);
  }
  
  if (method === "POST" && path === "/api/upload") {
    return handleUploadImage(request, env);
  }
  
  if (method === "GET" && path.startsWith("/api/i/")) {
    const key = path.replace("/api/i/", "");
    return handleGetImage(key, env);
  }
  
  if (method === "GET" && path === "/api/blog") {
    return handleGetBlogs(env);
  }
  
  if (method === "GET" && path.startsWith("/api/blog/") && path !== "/api/blog") {
    const id = path.split("/")[3];
    return handleGetBlog(id, env);
  }
  
  if (method === "POST" && path === "/api/blog") {
    return handleCreateBlog(request, env);
  }
  
  if (method === "PUT" && path.startsWith("/api/blog/")) {
    const id = path.split("/")[3];
    return handleUpdateBlog(id, request, env);
  }
  
  if (method === "DELETE" && path.startsWith("/api/blog/")) {
    const id = path.split("/")[3];
    return handleDeleteBlog(id, request, env);
  }
  
  if (method === "GET" && !path.startsWith("/api/")) {
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
  
  return new Response("Not Found", { status: 404 });
}

// HTML - 最简化稳定版
function getHTML() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>博客系统</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f5f7fa;padding:20px}
.container{max-width:1200px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:white;border-radius:12px;margin-bottom:20px}
.logo-area{display:flex;align-items:center;gap:12px}
.logo-img{width:40px;height:40px;border-radius:50%;object-fit:cover}
.nav{display:flex;gap:16px}
.nav a,.nav button{background:none;border:none;color:#495057;cursor:pointer;font-size:14px}
.nav a:hover,.nav button:hover{color:#228be6}
.main{display:flex;gap:20px}
.sidebar{width:280px;background:white;border-radius:12px;padding:16px}
.quick-buttons-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:20px}
.quick-btn{display:block;padding:8px;background:#f8f9fa;border-radius:6px;text-decoration:none;font-size:12px;color:#228be6;text-align:center;border:1px solid #e9ecef}
.article-list{background:white;border-radius:12px;padding:16px;margin-top:16px}
.article-item{padding:12px;border-bottom:1px solid #e9ecef;cursor:pointer}
.article-item:hover{background:#f8f9fa}
.article-title{font-size:16px;font-weight:500;color:#212529}
.article-time{font-size:12px;color:#adb5bd;margin-top:4px}
.content{flex:1;background:white;border-radius:12px;padding:24px}
.post-title{font-size:24px;font-weight:600;margin-bottom:16px}
.post-meta{color:#868e96;font-size:14px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #e9ecef}
.post-content{line-height:1.7;color:#495057}
.hidden{display:none}
button{padding:8px 16px;background:#228be6;color:white;border:none;border-radius:6px;cursor:pointer}
.btn-danger{background:#fa5252}
input,textarea{width:100%;padding:10px;margin:8px 0;border:1px solid #dee2e6;border-radius:6px}
.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal.hidden{display:none}
.modal-content{background:white;border-radius:12px;width:90%;max-width:500px;padding:20px}
</style>
</head>
<body>
<div class="container">
<div class="header">
<div class="logo-area"><img class="logo-img hidden" id="logoImg"><span id="logoPlaceholder" style="font-size:30px">📷</span><span>我的博客</span></div>
<div class="nav"><a onclick="showHome()">首页</a><a id="publishBtn" class="hidden" onclick="showPublish()">写文章</a><a id="manageBtn" class="hidden" onclick="showManage()">管理</a><a id="loginBtn" onclick="showLogin()">登录</a><button id="logoutBtn" class="hidden" onclick="logout()">退出</button></div>
</div>
<div class="main">
<div class="sidebar">
<div class="quick-buttons-title">快捷链接<span id="editButtonsBtn" class="hidden" style="cursor:pointer;font-size:12px">⚙️</span></div>
<div id="quickButtonsGrid" class="quick-buttons-grid"></div>
<div class="article-list"><div class="articles-title">所有文章</div><div id="articlesList"></div></div>
</div>
<div class="content" id="mainContent"><div>加载中...</div></div>
</div>
</div>
<div id="buttonsModal" class="modal hidden"><div class="modal-content"><h3>管理快捷按钮</h3><div id="buttonsList"></div><button onclick="saveButtons()" style="margin-top:16px">保存</button><button onclick="closeButtonsModal()" style="margin-top:16px;margin-left:8px">关闭</button></div></div>
<script>
var currentImage="",editId=null,currentLogoUrl="",quickButtons=[],allPosts=[];
function escapeHtml(s){if(!s)return "";return s.replace(/[&<>]/g,function(m){if(m==="&")return"&amp;";if(m==="<")return"&lt;";if(m===">")return"&gt;";return m;})}
async function loadLogo(){try{var r=await fetch("/api/logo");if(r.ok){var d=await r.json();if(d.url&&d.url!==""){currentLogoUrl=d.url;var img=document.getElementById("logoImg"),ph=document.getElementById("logoPlaceholder");img.src=d.url;img.classList.remove("hidden");ph.classList.add("hidden");return}}var img=document.getElementById("logoImg"),ph=document.getElementById("logoPlaceholder");img.classList.add("hidden");ph.classList.remove("hidden");}catch(e){}}
async function loadQuickButtons(){try{var r=await fetch("/api/buttons");quickButtons=await r.json();var c=document.getElementById("quickButtonsGrid");if(c){var h="";for(var i=0;i<quickButtons.length;i++){var b=quickButtons[i];if(b.enabled!==false)h+='<a href="'+escapeHtml(b.url)+'" class="quick-btn" target="_blank">'+escapeHtml(b.name)+"</a>"}c.innerHTML=h}}}catch(e){}}
async function loadArticlesList(){try{var r=await fetch("/api/blog");var d=await r.json();allPosts=d.list||[];var c=document.getElementById("articlesList");if(c){if(allPosts.length===0)c.innerHTML="<div>暂无文章</div>";else{var h="";for(var i=0;i<allPosts.length;i++){h+='<div class="article-item" onclick="loadPost(\''+allPosts[i].id+'\')"><div class="article-title">'+escapeHtml(allPosts[i].title)+'</div><div class="article-time">'+new Date(allPosts[i].time).toLocaleDateString()+'</div></div>'}c.innerHTML=h}}}}catch(e){}}
async function loadPost(id){try{var r=await fetch("/api/blog/"+id);var p=await r.json();var c=document.getElementById("mainContent");var token=localStorage.getItem("token");var editHtml=token?'<div style="margin-top:20px"><button onclick="editPost(\''+id+'\')">编辑</button><button class="btn-danger" onclick="deletePost(\''+id+'\')" style="margin-left:10px">删除</button></div>':"";c.innerHTML='<h1 class="post-title">'+escapeHtml(p.title)+'</h1><div class="post-meta">'+new Date(p.time).toLocaleString()+'</div>'+(p.img?'<img src="'+escapeHtml(p.img)+'" style="max-width:100%">':'')+'<div class="post-content">'+(p.content?p.content.replace(/\\n/g,"<br>"):"")+'</div>'+editHtml}catch(e){alert("加载失败")}}
function showHome(){loadArticlesList();var c=document.getElementById("mainContent");c.innerHTML="<div>加载中...</div>";loadPost(allPosts.length>0?allPosts[0].id:null)}
function updateNav(){var t=localStorage.getItem("token"),l=!!t;var pb=document.getElementById("publishBtn"),mb=document.getElementById("manageBtn"),lb=document.getElementById("loginBtn"),lob=document.getElementById("logoutBtn"),eb=document.getElementById("editButtonsBtn");if(pb)l?pb.classList.remove("hidden"):pb.classList.add("hidden");if(mb)l?mb.classList.remove("hidden"):mb.classList.add("hidden");if(lb)l?lb.classList.add("hidden"):lb.classList.remove("hidden");if(lob)l?lob.classList.remove("hidden"):lob.classList.add("hidden");if(eb)l?eb.classList.remove("hidden"):eb.classList.add("hidden");}
function logout(){localStorage.removeItem("token");updateNav();loadArticlesList()}
function showLogin(){document.getElementById("mainContent").innerHTML='<h2>登录</h2><input id=loginUser type=text placeholder=用户名><br><input id=loginPass type=password placeholder=密码><br><button onclick="doLogin()" style="margin-top:10px">登录</button>'}
async function doLogin(){var u=document.getElementById("loginUser").value,p=document.getElementById("loginPass").value;if(!u||!p){alert("请输入用户名和密码");return}try{var r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});var d=await r.json();if(d.success){localStorage.setItem("token",d.token);updateNav();loadArticlesList()}else alert("登录失败")}catch(e){alert("登录失败")}}
function showPublish(){if(!localStorage.getItem("token")){showLogin();return}editId=null;currentImage="";document.getElementById("mainContent").innerHTML='<h2>发布文章</h2><input id=title type=text placeholder=标题><textarea id=contentText rows=10 placeholder=内容></textarea><div><input type=file id=imgFile accept="image/*"><button onclick="uploadImg()" style="margin-left:10px">上传封面</button></div><div id=preview></div><div style="margin-top:16px"><button onclick="doPublish()">发布</button><button onclick="showHome()" style="margin-left:10px">取消</button></div>'}
async function uploadImg(){var f=document.getElementById("imgFile").files[0];if(!f){alert("请选择图片");return}var fd=new FormData();fd.append("file",f);try{var r=await fetch("/api/upload",{method:"POST",headers:{"Authorization":"Bearer "+localStorage.getItem("token")},body:fd});var d=await r.json();if(d.success){currentImage=d.url;document.getElementById("preview").innerHTML='<img src="'+d.url+'" style="max-width:150px;margin:10px 0"><br><button onclick="removeImg()">移除</button>';alert("上传成功")}else alert("上传失败")}catch(e){alert("上传失败")}}
function removeImg(){currentImage="";document.getElementById("preview").innerHTML=""}
async function doPublish(){var t=document.getElementById("title").value.trim(),c=document.getElementById("contentText").value;if(!t){alert("请输入标题");return}try{var r=await fetch("/api/blog",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:t,content:c,img:currentImage})});var d=await r.json();if(d.success){alert("发布成功");loadArticlesList();showHome()}else alert("发布失败")}catch(e){alert("发布失败")}}
async function editPost(id){var t=localStorage.getItem("token");if(!t){alert("请先登录");showLogin();return}try{var r=await fetch("/api/blog/"+id);var p=await r.json();editId=id;currentImage=p.img||"";document.getElementById("mainContent").innerHTML='<h2>编辑文章</h2><input id=title type=text placeholder=标题 value="'+escapeHtml(p.title)+'"><textarea id=contentText rows=10 placeholder=内容>'+escapeHtml(p.content)+'</textarea><div><input type=file id=imgFile accept="image/*"><button onclick="uploadImg()" style="margin-left:10px">上传封面</button></div><div id=preview></div><div style="margin-top:16px"><button onclick="doUpdate()">更新</button><button onclick="showHome()" style="margin-left:10px">取消</button></div>';if(currentImage)document.getElementById("preview").innerHTML='<img src="'+currentImage+'" style="max-width:150px;margin:10px 0"><br><button onclick="removeImg()">移除</button>'}catch(e){alert("加载失败")}}
async function doUpdate(){var t=document.getElementById("title").value.trim(),c=document.getElementById("contentText").value;if(!t){alert("请输入标题");return}try{var r=await fetch("/api/blog/"+editId,{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify({title:t,content:c,img:currentImage})});var d=await r.json();if(d.success){alert("更新成功");loadArticlesList();showHome()}else alert("更新失败")}catch(e){alert("更新失败")}}
async function deletePost(id){if(!confirm("确定删除？"))return;try{var r=await fetch("/api/blog/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}});if(r.ok){alert("删除成功");loadArticlesList();showHome()}else alert("删除失败")}catch(e){alert("删除失败")}}
function showManage(){var t=localStorage.getItem("token");if(!t){showLogin();return}var c=document.getElementById("mainContent");c.innerHTML="<h2>管理后台</h2><div><h3>快捷按钮管理</h3><button onclick='openButtonsModal()'>管理10个快捷按钮</button></div><div><h3>文章列表</h3><div id=managePosts></div></div>";var h="";for(var i=0;i<allPosts.length;i++){var p=allPosts[i];h+='<div style="border:1px solid #ddd;padding:10px;margin:8px 0"><strong>'+escapeHtml(p.title)+'</strong><br><button onclick="editPost(\''+p.id+'\')">编辑</button><button class="btn-danger" style="margin-left:10px" onclick="deletePost(\''+p.id+'\')">删除</button></div>'}document.getElementById("managePosts").innerHTML=h}
function openButtonsModal(){var m=document.getElementById("buttonsModal");if(!m)return;var c=document.getElementById("buttonsList");var h="";for(var i=0;i<quickButtons.length;i++){var b=quickButtons[i];h+='<div><input type="text" value="'+escapeHtml(b.name)+'" id="btn_name_'+i+'" placeholder="名称" style="width:30%"><input type="text" value="'+escapeHtml(b.url)+'" id="btn_url_'+i+'" placeholder="链接" style="width:60%"><label><input type="checkbox" id="btn_enabled_'+i+'"'+(b.enabled!==false?" checked":"")+'> 启用</label></div>'}c.innerHTML=h;m.classList.remove("hidden")}
function closeButtonsModal(){var m=document.getElementById("buttonsModal");if(m)m.classList.add("hidden")}
async function saveButtons(){var nb=[];for(var i=0;i<quickButtons.length;i++){var ni=document.getElementById("btn_name_"+i),ui=document.getElementById("btn_url_"+i),ei=document.getElementById("btn_enabled_"+i);nb.push({name:ni?ni.value:"按钮"+(i+1),url:ui?ui.value:"https://example.com",enabled:ei?ei.checked:true})}try{var r=await fetch("/api/buttons",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+localStorage.getItem("token")},body:JSON.stringify(nb)});if(r.ok){alert("保存成功");await loadQuickButtons();closeButtonsModal()}else alert("保存失败")}catch(e){alert("保存失败")}}
async function init(){await loadLogo();await loadQuickButtons();await loadArticlesList();updateNav()}
init();
</script>
</body>
</html>`;
}
